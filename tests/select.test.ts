import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import Select from '../lib/components/SelectWithSubmitButton.vue'

vi.mock('@nextcloud/vue', () => import('./mocks/nextcloud-vue.ts'))

describe('SelectWithSubmitButton', () => {
  it('defers model updates until submission', async () => {
    const wrapper = mount(Select, { props: { modelValue: 'old', required: true } })
    wrapper.findComponent({ name: 'NcSelect' }).vm.$emit('update:modelValue', 'new')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.get('input[type="submit"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['new']])
    expect(wrapper.emitted('update')).toEqual([['new']])
  })

  it('validates the pending selection rather than the old parent value', async () => {
    const wrapper = mount(Select, { props: { required: true } })
    wrapper.findComponent({ name: 'NcSelect' }).vm.$emit('update:modelValue', 'chosen')
    await nextTick()
    await wrapper.get('input[type="submit"]').trigger('click')
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.emitted('update')).toEqual([['chosen']])
  })

  it.each([undefined, '', []])('rejects an empty required value: %j', async (value) => {
    const wrapper = mount(Select, { props: { modelValue: 'old', required: true } })
    wrapper.findComponent({ name: 'NcSelect' }).vm.$emit('update:modelValue', value)
    await nextTick()
    await wrapper.get('input[type="submit"]').trigger('click')
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.emitted('update')).toBeUndefined()
  })

  it('accepts zero as a valid required value', async () => {
    const wrapper = mount(Select, { props: { modelValue: 0, required: true } })
    await wrapper.get('input[type="submit"]').trigger('click')
    expect(wrapper.emitted('update')).toEqual([[0]])
  })

  it('forwards edits immediately without a submit button', async () => {
    const wrapper = mount(Select, { props: { submitButton: false } })
    wrapper.findComponent({ name: 'NcSelect' }).vm.$emit('update:modelValue', 'chosen')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['chosen']])
    expect(wrapper.find('input[type="submit"]').exists()).toBe(false)
  })

  it('receives parent updates and associates the label with a stable input ID', async () => {
    const wrapper = mount(Select, { props: { modelValue: 'old', inputLabel: 'Choose' } })
    const select = wrapper.findComponent({ name: 'NcSelect' })
    const id = select.props('inputId')
    expect(wrapper.get('label').attributes('for')).toBe(id)
    await wrapper.setProps({ modelValue: 'new' })
    expect(select.props('modelValue')).toBe('new')
    expect(select.props('inputId')).toBe(id)
  })

  it('emits reset and multi-select clear values', async () => {
    const wrapper = mount(Select, {
      props: { multiple: true, modelValue: ['chosen'], resetState: ['original'], resetAction: true, clearAction: true },
    })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['original']], [[]]])
  })
})
