#!/usr/bin/env node
import { parse as parseJavaScript } from '@babel/parser'
import { compileTemplate, parse as parseVue } from '@vue/compiler-sfc'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const command = 'nextcloud-vue-components extract-l10n-strings'
const usage = `Usage: ${command} <destination.js>`
const functions = new Map([
  ['t', 1],
  ['translate', 1],
  ['n', 2],
  ['translatePlural', 2],
])

function identifier(node) {
  if (node?.type === 'Identifier') {
    return node.name.startsWith('_ctx.') ? node.name.slice(5) : node.name
  }
  if (node?.type === 'MemberExpression' && !node.computed
    && node.object.type === 'Identifier' && node.object.name === '_ctx'
    && node.property.type === 'Identifier') {
    return node.property.name
  }
}

function visit(node, callback) {
  if (!node || typeof node !== 'object') {
    return
  }
  if (Array.isArray(node)) {
    node.forEach((child) => visit(child, callback))
    return
  }
  callback(node)
  for (const [key, value] of Object.entries(node)) {
    if (key !== 'loc' && key !== 'tokens' && key !== 'comments') {
      visit(value, callback)
    }
  }
}

function literal(node) {
  if (node?.type === 'StringLiteral') {
    return node.value
  }
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked
  }
  throw new Error('appName translations must use static string literals')
}

function extractAst(ast, source, entries, lineOffset = 0) {
  visit(ast, (node) => {
    if (node.type !== 'CallExpression' || identifier(node.arguments[0]) !== 'appName') {
      return
    }
    const count = functions.get(identifier(node.callee))
    if (!count) {
      return
    }
    const strings = Array.from({ length: count }, (_, index) => literal(node.arguments[index + 1]))
    const key = JSON.stringify(strings)
    if (!entries.has(key)) {
      entries.set(key, { strings, sources: new Map() })
    }
    if (!entries.get(key).sources.has(source)) {
      entries.get(key).sources.set(source, new Set())
    }
    entries.get(key).sources.get(source).add(node.loc.start.line + lineOffset)
  })
}

function extract(code, source, entries, jsx = false, lineOffset = 0) {
  const ast = parseJavaScript(code, {
    sourceType: 'unambiguous',
    plugins: jsx ? ['typescript', 'jsx'] : ['typescript'],
  })
  extractAst(ast, source, entries, lineOffset)
}

async function collect(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collect(path))
    } else if (entry.isFile() && /\.(?:vue|[cm]?[jt]sx?)$/.test(entry.name) && !/\.d\.[cm]?ts$/.test(entry.name)) {
      files.push(path)
    }
  }
  return files.sort()
}

async function extractStrings(destination) {
  const entries = new Map()
  for (const file of await collect(join(packageRoot, 'lib'))) {
    if (resolve(file) === resolve(destination)) {
      throw new Error('The destination must not overwrite a package source file')
    }
    const source = relative(packageRoot, file).split('\\').join('/')
    const code = await readFile(file, 'utf8')
    try {
      if (file.endsWith('.vue')) {
        const { descriptor, errors } = parseVue(code, { filename: file })
        if (errors.length) {
          throw new Error(errors.map(String).join('\n'))
        }
        if (descriptor.script?.src || descriptor.scriptSetup?.src || descriptor.template?.src) {
          throw new Error('External script and template blocks are not supported')
        }
        if (descriptor.template?.lang && descriptor.template.lang !== 'html') {
          throw new Error('Only HTML templates are supported')
        }
        for (const script of [descriptor.script, descriptor.scriptSetup]) {
          if (script) {
            extract(script.content, source, entries, ['jsx', 'tsx'].includes(script.lang), script.loc.start.line - 1)
          }
        }
        if (descriptor.template) {
          const template = compileTemplate({
            source: descriptor.template.content,
            filename: file,
            id: 'extract-l10n-strings',
            compilerOptions: {
              expressionPlugins: ['typescript'],
              nodeTransforms: [(node) => {
                const expressions = [node.content, ...(node.props ?? []).map((prop) => prop.exp)]
                for (const expression of expressions) {
                  if (expression?.ast) {
                    extractAst(
                      expression.ast,
                      source,
                      entries,
                      descriptor.template.loc.start.line + expression.loc.start.line - 2,
                    )
                  }
                }
              }],
            },
          })
          if (template.errors.length) {
            throw new Error(template.errors.map(String).join('\n'))
          }
        }
      } else {
        extract(code, source, entries, /\.[jt]sx$/.test(file))
      }
    } catch (error) {
      throw new Error(`${source}: ${error.message}`, { cause: error })
    }
  }
  const output = [
    `// Generated by @rotdrop/${command}.`,
    '// Translation extraction input only: do not import or execute this file.',
    '',
  ]
  for (const { strings, sources } of entries.values()) {
    const sourceLocations = [...sources].flatMap(([source, lines]) => [...lines]
      .sort((a, b) => a - b)
      .map((line) => `@rotdrop/nextcloud-vue-components/${source}:${line}`))
    output.push(
      `// TRANSLATORS: Source: ${sourceLocations.join(', ')}; generated by ${command}.`,
      strings.length === 1
        ? `t(appName, ${JSON.stringify(strings[0])});`
        : `n(appName, ${strings.map((string) => JSON.stringify(string)).join(', ')}, 1);`,
      '',
    )
  }
  await writeFile(destination, output.join('\n'), 'utf8')
}

try {
  const args = process.argv.slice(2)
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(usage)
  } else if (args.length === 2 && args[0] === 'extract-l10n-strings' && args[1] !== '') {
    await extractStrings(resolve(args[1]))
  } else {
    throw new Error(usage)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
