import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive, ref } from 'vue'
import FilePrefixPicker from '../lib/components/FilePrefixPicker.vue'
import TextFieldWithSubmitButton from '../lib/components/TextFieldWithSubmitButton.vue'

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
  const modelEvents = ['update:modelValue', 'update:value', 'input']

  it('initializes from separate path props', () => {
    const wrapper = mount(FilePrefixPicker, { props: { dirName: '/Documents', baseName: 'report' } })
    expect(wrapper.get('a').text()).toBe('/Documents/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('report')
  })

  it('initializes without mutating its model or emitting model updates', async () => {
    const model = Object.freeze({ dirName: '', baseName: '' })
    const wrapper = mount(FilePrefixPicker, {
      props: { modelValue: model, dirName: '/Documents', baseName: 'report' },
    })
    await nextTick()
    expect(wrapper.get('a').text()).toBe('/Documents/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('report')
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toBeUndefined()
    }
    expect(model).toEqual({ dirName: '', baseName: '' })
  })

  it('prefers nonempty model fields over the initial fallback props', () => {
    const wrapper = mount(FilePrefixPicker, {
      props: {
        modelValue: { dirName: '/Model', baseName: 'model' },
        dirName: '/Fallback',
        baseName: 'fallback',
      },
    })
    expect(wrapper.get('a').text()).toBe('/Model/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('model')
  })

  it('synchronizes replacement and empty models without echoing updates', async () => {
    const wrapper = mount(FilePrefixPicker, {
      props: {
        modelValue: { dirName: '/Initial', baseName: 'initial' },
        dirName: '/Fallback',
        baseName: 'fallback',
      },
    })
    await wrapper.setProps({ modelValue: { dirName: '/Replacement', baseName: 'replacement' } })
    expect(wrapper.get('a').text()).toBe('/Replacement/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('replacement')
    await wrapper.setProps({ modelValue: { dirName: '', baseName: '' } })
    expect(wrapper.get('a').text()).toBe('./')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('')
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toBeUndefined()
    }
  })

  it('synchronizes in-place parent changes without emitting updates', async () => {
    const model = reactive({ dirName: '/Initial', baseName: 'initial' })
    const wrapper = mount(FilePrefixPicker, { props: { modelValue: model } })
    model.dirName = '/Changed'
    model.baseName = 'changed'
    await nextTick()
    expect(wrapper.get('a').text()).toBe('/Changed/')
    expect(wrapper.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('changed')
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toBeUndefined()
    }
  })

  it('emits independent snapshots for edits and submissions', async () => {
    const model = Object.freeze({ dirName: '/Documents', baseName: 'initial' })
    const wrapper = mount(FilePrefixPicker, { props: { modelValue: model } })
    const input = wrapper.get('input:not([type="submit"])')
    await input.setValue('first')
    const first = modelEvents.map(event => wrapper.emitted(event)![0]![0])
    for (const value of first) {
      expect(value).toEqual({ dirName: '/Documents', baseName: 'first' })
      expect(value).not.toBe(model)
    }
    expect(new Set(first).size).toBe(3)

    wrapper.getComponent(TextFieldWithSubmitButton).vm.$emit('submit', 'first')
    const submitted = wrapper.emitted('submit')![0]![0]
    expect(submitted).toEqual(first[0])
    expect(submitted).not.toBe(first[0])
    await input.setValue('second')
    dialogs.pick.mockResolvedValue('/Other')
    await wrapper.get('a').trigger('click')
    await flushPromises()
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toEqual([
        [{ dirName: '/Documents', baseName: 'first' }],
        [{ dirName: '/Documents', baseName: 'second' }],
        [{ dirName: '/Other', baseName: 'second' }],
      ])
    }
    expect(submitted).toEqual({ dirName: '/Documents', baseName: 'first' })
    expect(model).toEqual({ dirName: '/Documents', baseName: 'initial' })
  })

  it('round-trips parent v-model replacements without feedback loops', async () => {
    const model = ref({ dirName: '/Documents', baseName: 'initial' })
    const parent = mount(defineComponent({
      components: { FilePrefixPicker },
      setup: () => ({ model }),
      template: '<FilePrefixPicker v-model="model" />',
    }))
    const picker = parent.getComponent(FilePrefixPicker)
    await parent.get('input:not([type="submit"])').setValue('edited')
    expect(model.value).toEqual({ dirName: '/Documents', baseName: 'edited' })
    model.value = { dirName: '/Reset', baseName: 'reset' }
    await nextTick()
    expect(parent.get('a').text()).toBe('/Reset/')
    expect(parent.get<HTMLInputElement>('input:not([type="submit"])').element.value).toBe('reset')
    for (const event of modelEvents) {
      expect(picker.emitted(event)).toHaveLength(1)
    }
  })

  it('does not emit model updates for unchanged user values', async () => {
    const wrapper = mount(FilePrefixPicker, {
      props: { modelValue: { dirName: '/Documents', baseName: 'report' } },
    })
    wrapper.getComponent(TextFieldWithSubmitButton).vm.$emit('update:modelValue', 'report')
    dialogs.pick.mockResolvedValue('/Documents')
    await wrapper.get('a').trigger('click')
    await flushPromises()
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toBeUndefined()
    }
    expect(wrapper.emitted('update:dirName')).toEqual([['/Documents', 'report']])
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
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toEqual([[{ dirName: expected, baseName: '' }]])
    }
  })

  it('uses the synchronized directory as the picker starting location', async () => {
    const wrapper = mount(FilePrefixPicker)
    await wrapper.setProps({ modelValue: { dirName: '/Changed', baseName: 'report' } })
    dialogs.pick.mockResolvedValue('/Selected')
    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(dialogs.getFilePickerBuilder.mock.results[0]!.value.startAt).toHaveBeenCalledWith('/Changed')
    expect(wrapper.emitted('update:dirName')).toEqual([['/Selected', 'report']])
  })

  it('keeps directory-only submission snapshots stable across later selections', async () => {
    const model = Object.freeze({ dirName: '/Initial', baseName: 'report' })
    const wrapper = mount(FilePrefixPicker, { props: { modelValue: model, onlyDirName: true } })
    for (const dirName of ['/First', '/Second']) {
      dialogs.pick.mockResolvedValue(dirName)
      await wrapper.get('a').trigger('click')
      await flushPromises()
    }
    expect(wrapper.emitted('submit')).toEqual([
      [{ dirName: '/First', baseName: 'report' }],
      [{ dirName: '/Second', baseName: 'report' }],
    ])
    expect(wrapper.emitted('submit')![0]![0]).not.toBe(wrapper.emitted('update:modelValue')![0]![0])
    expect(model).toEqual({ dirName: '/Initial', baseName: 'report' })
  })

  it('reports invalid paths without accepting them', async () => {
    dialogs.pick.mockResolvedValue('relative/path')
    const wrapper = mount(FilePrefixPicker)
    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(dialogs.showError).toHaveBeenCalledOnce()
    expect(wrapper.emitted('error:invalidDirName')).toEqual([['relative/path']])
    expect(wrapper.emitted('update:dirName')).toBeUndefined()
    for (const event of modelEvents) {
      expect(wrapper.emitted(event)).toBeUndefined()
    }
  })

  it('does not open a picker while disabled', async () => {
    const wrapper = mount(FilePrefixPicker, { props: { disabled: true } })
    await wrapper.get('a').trigger('click')
    expect(dialogs.getFilePickerBuilder).not.toHaveBeenCalled()
  })
})
