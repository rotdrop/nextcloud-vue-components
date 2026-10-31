import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilePrefixPicker from '../lib/components/FilePrefixPicker.vue'

vi.mock('@nextcloud/vue', () => import('./mocks/nextcloud-vue.ts'))

const dialogs = vi.hoisted(() => ({
  pick: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  getFilePickerBuilder: vi.fn(),
}))

vi.mock('@nextcloud/dialogs', () => ({
  getFilePickerBuilder: dialogs.getFilePickerBuilder,
  showError: dialogs.showError,
  showInfo: dialogs.showInfo,
  TOAST_PERMANENT_TIMEOUT: -1,
}))

beforeEach(() => {
  const builder = {
    startAt: vi.fn().mockReturnThis(),
    setMultiSelect: vi.fn().mockReturnThis(),
    setButtonFactory: vi.fn().mockReturnThis(),
    setMimeTypeFilter: vi.fn().mockReturnThis(),
    allowDirectories: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({ pick: dialogs.pick }),
  }
  dialogs.getFilePickerBuilder.mockReturnValue(builder)
})

describe('FilePrefixPicker', () => {
  it('initializes from separate path props', () => {
    const wrapper = mount(FilePrefixPicker, { props: { dirName: '/Documents', baseName: 'report' } })
    expect(wrapper.get('a').text()).toBe('/Documents/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('report')
  })

  it.each([
    ['/Documents', '/Documents'],
    ['//Documents', '/Documents'],
    [['/Documents'], '/Documents'],
    ['/', ''],
  ])('normalizes picker result %j to %j', async (picked, expected) => {
    dialogs.pick.mockResolvedValue(picked)
    const wrapper = mount(FilePrefixPicker, { props: { onlyDirName: true } })
    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:dirName')).toEqual([[expected, '']])
    expect(wrapper.emitted('submit')).toEqual([[{ dirName: expected, baseName: '' }]])
  })

  it('reports invalid paths without accepting them', async () => {
    dialogs.pick.mockResolvedValue('relative/path')
    const wrapper = mount(FilePrefixPicker)
    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(dialogs.showError).toHaveBeenCalledOnce()
    expect(wrapper.emitted('error:invalidDirName')).toEqual([['relative/path']])
    expect(wrapper.emitted('update:dirName')).toBeUndefined()
  })

  it('does not open a picker while disabled', async () => {
    const wrapper = mount(FilePrefixPicker, { props: { disabled: true } })
    await wrapper.get('a').trigger('click')
    expect(dialogs.getFilePickerBuilder).not.toHaveBeenCalled()
  })
})
