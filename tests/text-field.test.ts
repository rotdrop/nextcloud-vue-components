import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TextField from '../lib/components/TextFieldWithSubmitButton.vue'

vi.mock('@nextcloud/vue', () => import('./mocks/nextcloud-vue.ts'))

describe('TextFieldWithSubmitButton', () => {
  it('forwards attributes and slots to the text field', () => {
    const wrapper = mount(TextField, {
      props: { modelValue: 'initial', hint: 'A hint' },
      attrs: { placeholder: 'Type here' },
      slots: { alignedBefore: 'Before', alignedAfter: 'After', hint: 'Extra hint', default: 'Content' },
    })
    expect(wrapper.findComponent({ name: 'NcTextField' }).attributes('placeholder')).toBe('Type here')
    expect(wrapper.text()).toContain('Before')
    expect(wrapper.text()).toContain('After')
    expect(wrapper.text()).toContain('A hint')
    expect(wrapper.text()).toContain('Extra hint')
    expect(wrapper.text()).toContain('Content')
  })

  it('emits one model update per edit and submits the edited value', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'initial' } })
    await wrapper.get('input').setValue('edited')
    expect(wrapper.emitted('update:modelValue')).toEqual([['edited']])
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['edited']])
  })

  it('receives parent model updates, including numeric zero', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'initial' } })
    await wrapper.setProps({ modelValue: 0 })
    expect(wrapper.get('input').element.value).toBe('0')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('submit')).toEqual([[0]])
  })

  it('starts empty when no model is supplied', () => {
    const wrapper = mount(TextField)
    expect(wrapper.get('input').element.value).toBe('')
  })
})
