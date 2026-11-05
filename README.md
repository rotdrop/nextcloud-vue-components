# nextcloud-vue-components
A loose collection of Vue components that I use in several of my projects.

The purpose of this repository is to factor out common code that I use in several other Nextcloud apps.

**This is public, so you are invited to use these things, but I do not plan to make this a well-maintained Vue library.**

This repository is used by my Nextcloud apps
- [PDF Downloader](https://github.com/rotdrop/nextcloud-app-pdf-downloader)
- [Archive Explorer](https://github.com/rotdrop/nextcloud-app-files-archive)
- [DokuWiki Wrapper](https://github.com/rotdrop/nextcloud-app-dokuwiki)
- [Roundcube Wrapper](https://github.com/rotdrop/nextcloud-roundcube)
- [Redaxo Wrapper](https://github.com/rotdrop/nextcloud-app-redaxo)
- [Orchestra Management](https://github.com/rotdrop/cafevdb)
- [Orchestra Management Member's App](https://github.com/rotdrop/cafevdb-members)

## Installation and imports

```sh
npm install @rotdrop/nextcloud-vue-components
```

The package targets Vue 3.5 and Nextcloud applications. Vue and the directly
imported Nextcloud libraries are peer dependencies, so the consuming application
can share its own compatible versions. `floating-vue` and `uuid` are direct runtime
dependencies.

Import from the package root or keep using the existing source paths:

```ts
import { TextFieldWithTrailingButton, Color } from '@rotdrop/nextcloud-vue-components'
import FilePrefixPicker from '@rotdrop/nextcloud-vue-components/lib/components/FilePrefixPicker.vue'
```

## Source-only distribution

Publishing source code is valid npm practice. This package intentionally ships
Vue single-file components, TypeScript, and SCSS, without generated JavaScript,
CSS, or declaration bundles. There is no build, `prepare`, or `prepack` step.
The `files` allowlist includes `lib/` and the `bin/` translation extractor; npm also includes the package manifest,
README, and license. The changelog is included explicitly in the package manifest.
Tests, CI configuration, and the development lockfile are not published.

The consuming application's bundler must compile these sources, including sources
inside `node_modules`. For Vite, use `@vitejs/plugin-vue` and install `sass` as a
development dependency. With webpack, configure Vue, TypeScript, and Sass loaders
and ensure this package is not excluded by a blanket `node_modules` rule.
TypeScript consumers should use `moduleResolution: "Bundler"`, `noEmit: true`,
and `allowImportingTsExtensions: true`, and use `vue-tsc` for Vue type checking.
This is not a prebuilt library for plain Node.js, direct browser imports, or
server-side rendering.

Components using translations require the consuming application's `APP_NAME`
compile-time constant. For example, in a Vite configuration:

```ts
define: {
  APP_NAME: JSON.stringify('my-nextcloud-app'),
}
```

The Nextcloud browser environment, theme variables, and icon styles must also be
provided by the host application. Styles imported by the components/directive
are handled by the host bundler.

## Extracting translation strings

When this library is installed as a node module, the application's translation
service may not scan its sources. Generate a dummy JavaScript file inside the
application's translation-scanned source tree:

```sh
npx @rotdrop/nextcloud-vue-components extract-l10n-strings src/library-l10n.js
# Or, from an npm script:
nextcloud-vue-components extract-l10n-strings src/library-l10n.js
```

The package installs `nextcloud-vue-components` in `node_modules/.bin/`.
The command takes a destination file, relative to the working
directory, and overwrites it. Its parent directory must already exist.
It reads the installed package's sources, regardless of the working directory.

Optionally pass an exclude file as the second argument, for example the
consuming application's `.l10nignore`:

```sh
nextcloud-vue-components extract-l10n-strings src/library-l10n.js .l10nignore
```

Both arguments are resolved relative to the working directory. The exclude file
contains one path per line; blank lines and lines starting with `#` are ignored,
and surrounding whitespace is trimmed. Entries must identify exact files using
`@rotdrop/nextcloud-vue-components/lib/` followed by their package-local path.
Any leading directory path is ignored, so
`node_modules/@rotdrop/nextcloud-vue-components/lib/components/FilePrefixPicker.vue`
excludes that component. Unrelated entries are ignored; globbing, directory
exclusions, and negation are not supported. Excluded files are not parsed, and
strings shared with included files are still emitted. An unreadable exclude
file causes a nonzero exit status without overwriting the destination.

The generated file contains `t(appName, "...")` calls (and `n(appName, "...",
"...", 1)` for plurals) for the consuming application's translation extractor.
Only calls using `appName` are included; Nextcloud `core` translations are
excluded. Duplicate strings are emitted once, with `// TRANSLATORS:` comments
identifying their package source files and the generating command. Vue templates
and scripts, JavaScript, and TypeScript sources are scanned. Dynamic translation
strings and parse or write errors cause a nonzero exit status.

**Do not import or execute the generated file.** It is extraction input, not
runtime code; `appName` deliberately remains a placeholder, as in the library
sources. Include it in the application's normal translation extraction so the
strings enter that application's catalog. Regenerate it when updating this
package. The application's build-system integration is left to the consumer.

## Development

Use Node.js 24 and npm 11:

```sh
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

`npm run test:watch` runs Vitest interactively. Tests cover the utilities and all
five components, using small Nextcloud component doubles to isolate wrapper
behavior. They also check the npm file list and compile the public entry point
with Vue, TypeScript, and Sass. No compiled output is written to the repository.
CI runs the tests, type checking, and package inspection on Node.js 24 and 26.
Node.js 26 is a compatibility check: several upstream Nextcloud dependencies
currently declare support only through Node.js 24.

The committed lockfile makes development and CI installs reproducible; it does
not pin dependencies for applications installing the published library.
`npm run lint` and `npm run lint:fix` use Nextcloud's Vue 3 library ESLint preset.
Existing code has formatting and documentation-rule debt under that preset;
lint is not yet a CI gate. The obsolete PHP and unconfigured stylelint scripts
have been removed.

## TextFieldWithTrailingButton

`TextFieldWithSubmitButton` remains an alias of `TextFieldWithTrailingButton`,
both in package-root exports and at the existing
`lib/components/TextFieldWithSubmitButton.vue` import path. Existing props,
events, slots, and default submit behavior are unchanged.

The `trailingButton` prop selects one of three modes:

| Value | Behavior |
| --- | --- |
| `'submit'` (default) | Shows the existing submit button and emits `submit` with the current model value when clicked. |
| `'clear'` | Shows a clear button that sets the model to `''` through `update:modelValue`, without emitting `submit`. |
| `'none'` | Hides the trailing button. |

```vue
<TextFieldWithTrailingButton v-model="text" trailing-button="clear" />
```

Editing continues to update the model in every mode. Other `NcTextField`
attributes, such as `disabled` and `trailingButtonLabel`, are forwarded as before.
The trailing button also shows a tooltip on hover or focus using this package's
`v-tooltip` directive. Its text matches the button's accessible label (Nextcloud's
translated "Save changes" or "Clear text" by default). Set `trailingButtonLabel`
to customize both the accessible label and tooltip.
The boolean `trailingButtonTooltip` prop defaults to `true`. Set
`:trailing-button-tooltip="false"` to disable the tooltip without changing the
button's accessible label or action.

## FilePrefixPicker model

`FilePrefixPicker` synchronizes with `modelValue`, including replacement objects
and in-place changes to `dirName` or `baseName`. It never mutates the input object.
User edits emit fresh `{ dirName, baseName }` snapshots through
`update:modelValue`, `update:value`, and `input`; `submit` also receives a snapshot.
Initialization and parent-driven updates do not emit model-update events.

On initialization, empty model fields fall back to the separate `baseName` and
`dirName` props, with `/` as the default directory. These separate props are
initialization-only fallbacks. Subsequent model updates are copied exactly,
including empty strings. Selecting the root directory still emits `dirName: ''`.
Consumers that previously relied on shared-object mutation must handle
`update:modelValue` (normally with `v-model`) or the legacy update events.

## Known limitations

`sanitizeInlineSvg` only namespaces SVG IDs and `url(#...)` references. Despite
its historical name, it is **not** an HTML/SVG security sanitizer.
`DynamicSvgIcon` must receive trusted SVG markup. Other reference formats such
as `href="#..."` are not currently rewritten.
