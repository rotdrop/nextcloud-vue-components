// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

describe('source-only package', () => {
  it('ships its entry point and sources, but not development files', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      encoding: 'utf8',
      cwd: fileURLToPath(new URL('../', import.meta.url)),
    }))
    const paths = pack.files.map((file: { path: string }) => file.path)
    expect(paths).toContain(manifest.main.replace(/^\.\//, ''))
    expect(paths).toContain(manifest.types.replace(/^\.\//, ''))
    expect(paths).toContain('lib/components/FilePrefixPicker.vue')
    expect(paths).toContain('lib/components/TextFieldWithTrailingButton.vue')
    expect(paths).toContain('lib/components/TextFieldWithSubmitButton.vue')
    expect(paths).toContain('lib/directives/Tooltip/index.scss')
    expect(paths).toContain('lib/util/color.ts')
    expect(manifest.bin['nextcloud-vue-components']).toBe('./bin/nextcloud-vue-components.mjs')
    expect(paths).toContain('bin/nextcloud-vue-components.mjs')
    expect(paths.every((path: string) => path.startsWith('lib/')
      || path === 'bin/nextcloud-vue-components.mjs'
      || ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md'].includes(path))).toBe(true)
    expect(paths.some((path: string) => path.startsWith('lib/') && /\.(js|mjs|cjs)$/.test(path))).toBe(false)
  })

  it('can compile the public entry point with a consumer Vue/TypeScript/Sass toolchain', async () => {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [vue()],
      build: {
        write: false,
        lib: {
          entry: fileURLToPath(new URL('../lib/index.ts', import.meta.url)),
          formats: ['es'],
          fileName: 'components',
        },
        rollupOptions: {
          external: [/^@nextcloud\//, 'vue', 'uuid', 'floating-vue'],
        },
      },
    })
    const outputs = Array.isArray(result) ? result : [result]
    const chunks = outputs.flatMap((output) => 'output' in output ? output.output : [])
    const entry = chunks.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
    expect(entry?.type).toBe('chunk')
    if (entry?.type === 'chunk') {
      expect(entry.exports).toEqual(expect.arrayContaining([
        'ColorPickerExtension', 'DynamicSvgIcon', 'FilePrefixPicker',
        'SelectWithSubmitButton', 'TextFieldWithSubmitButton', 'TextFieldWithTrailingButton', 'Color', 'Tooltip',
      ]))
      expect(entry.code).toContain('APP_NAME')
    }
    expect(chunks.some((chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'))).toBe(true)
  }, 20_000)
})
