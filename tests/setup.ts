import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

enableAutoUnmount(afterEach)

vi.mock('@nextcloud/l10n', () => ({
  translate: (_app: string, text: string, values: Record<string, string> = {}) =>
    text.replace(/\{([^}]+)\}/g, (match, key: string) => values[key] ?? match),
}))
