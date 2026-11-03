# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Source-only package entry point exporting components, utilities, and the tooltip directive.
- Vitest regression tests for all components, utilities, and the published package structure.
- CI for tests, Vue/TypeScript checks, and package inspection on Node.js 24 and 26.
- Reproducible development installs with a committed npm lockfile.
- Consumer setup documentation and known limitations.

### Fixed

- Package entry point no longer points to a missing `index.js`.
- Declare runtime dependencies and shared Vue/Nextcloud peer dependencies.
- Replace obsolete Vue 2 shims and Jest settings with Vue 3 type checking.
- Avoid duplicate text-field model updates.
- Validate the pending select value and accept numeric zero as a required selection.
- Convert Nextcloud color-picker string submissions into palette color objects.
- Synchronize FilePrefixPicker with parent model changes without mutating input
  objects; emit independent path snapshots for user edits and submissions.

### Removed

- Unused Babel configuration and unrelated PHP/unconfigured stylelint scripts.

## [1.0.2] - 2022-12-07

### Fixed

- FilePrefixPicker: use '' instead of '/' for root directory
- SettingsInputText: sync input value on input event

### Added

- ColorPickerExtension
- FilePrefixPicker: optional read-only basename input

## [1.0.1] - 2022-11-16

### Fixed

- double slash returned from core file-picker
- invalid appName reference

### Added

- allow type=number for SettingsInputText

## [1.0.0] - 2022-11-14

### Added

- Initial versions, copied components from [Archive Explorer](https://github.com/rotdrop/nextcloud-app-files-archive)
