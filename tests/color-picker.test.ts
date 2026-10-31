import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ColorPicker from '../lib/components/ColorPickerExtension.vue'
import { Color } from '../lib/util/color.ts'

vi.mock('@nextcloud/vue', () => import('./mocks/nextcloud-vue.ts'))

describe('ColorPickerExtension', () => {
  it('initializes without mutating the supplied palette', async () => {
    const palette = [new Color(255, 0, 0), new Color(0, 255, 0)]
    const wrapper = mount(ColorPicker, { props: { modelValue: '#000000', colorPalette: palette } })
    await nextTick()
    const colors = wrapper.findComponent({ name: 'NcColorPicker' }).props('palette') as Color[]
    expect(colors.map((color) => color.color)).toEqual(['#000000', '#ff0000'])
    expect(palette.map((color) => color.color)).toEqual(['#ff0000', '#00ff00'])
  })

  it('emits model updates and submits the current color', async () => {
    const wrapper = mount(ColorPicker)
    await nextTick()
    wrapper.findComponent({ name: 'NcColorPicker' }).vm.$emit('update:modelValue', '#0082c9')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#0082c9']])
    await wrapper.get('input[type="submit"]').trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['#0082c9']])
  })

  it('converts the string emitted by NcColorPicker on custom color submission', async () => {
    const wrapper = mount(ColorPicker)
    await nextTick()
    const picker = wrapper.findComponent({ name: 'NcColorPicker' })
    picker.vm.$emit('submit', '#123456')
    await nextTick()
    expect(picker.props('palette')[0]).toBeInstanceOf(Color)
    expect(picker.props('palette')[0].color).toBe('#123456')
    expect(wrapper.emitted('update:colorPalette')).toHaveLength(1)
  })

  it('receives parent color updates', async () => {
    const wrapper = mount(ColorPicker, { props: { modelValue: '#000000' } })
    await nextTick()
    await wrapper.setProps({ modelValue: '#ffffff' })
    expect(wrapper.findComponent({ name: 'NcColorPicker' }).props('modelValue')).toBe('#ffffff')
  })
})
