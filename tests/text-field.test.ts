import { flushPromises, mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import TextFieldWithSubmitButton from '../lib/components/TextFieldWithSubmitButton.vue'
import TextFieldWithTrailingButton from '../lib/components/TextFieldWithTrailingButton.vue'
import vTooltip from '../lib/directives/Tooltip/index.ts'

vi.mock('@nextcloud/vue', () => import('./mocks/nextcloud-vue.ts'))

it('keeps the old component import as an alias', () => {
  expect(TextFieldWithSubmitButton).toBe(TextFieldWithTrailingButton)
})
describe.each([
  ['TextFieldWithTrailingButton', TextFieldWithTrailingButton],
  ['TextFieldWithSubmitButton', TextFieldWithSubmitButton],
] as const)('%s', (_name, TextField) => {
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
    expect(wrapper.getComponent({ name: 'NcTextField' }).props()).toMatchObject({
      showTrailingButton: true,
      trailingButtonIcon: 'arrowEnd',
    })
    expect(wrapper.getComponent({ name: 'NcTextField' }).classes()).toContain('submit-button')
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

  it.each(['text', 0, 42])('clears %s without submitting', async (modelValue) => {
    const wrapper = mount(TextField, { props: { modelValue, trailingButton: 'clear' } })
    const field = wrapper.getComponent({ name: 'NcTextField' })
    expect(field.props()).toMatchObject({ showTrailingButton: true, trailingButtonIcon: 'close' })
    expect(field.classes()).not.toContain('submit-button')
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('can clear an uncontrolled model and continue editing', async () => {
    const wrapper = mount(TextField, { props: { trailingButton: 'clear' } })
    await wrapper.get('input').setValue('edited')
    await wrapper.get('button').trigger('click')
    await wrapper.get('input').setValue('new text')
    expect(wrapper.get('input').element.value).toBe('new text')
    expect(wrapper.emitted('update:modelValue')).toEqual([['edited'], [''], ['new text']])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('hides the trailing button without affecting model updates', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'initial', trailingButton: 'none' } })
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.get('input').setValue('edited')
    expect(wrapper.emitted('update:modelValue')).toEqual([['edited']])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('switches between trailing button modes', async () => {
    const wrapper = mount(TextField, { props: { modelValue: 'initial', trailingButton: 'none' } })
    await wrapper.setProps({ trailingButton: 'clear' })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    await wrapper.setProps({ trailingButton: 'submit', modelValue: 'replacement' })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['replacement']])
    await wrapper.setProps({ trailingButton: 'none' })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('does not clear a disabled field', async () => {
    const wrapper = mount(TextField, {
      props: { modelValue: 'initial', trailingButton: 'clear' },
      attrs: { disabled: true },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('input').element.value).toBe('initial')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('attaches the package tooltip only to the trailing button using its label', async () => {
    const updateTooltip = vi.spyOn(vTooltip, 'updated')
    const wrapper = mount(TextField)
    expect(updateTooltip).toHaveBeenLastCalledWith(wrapper.get('button').element, {
      value: 'Save changes',
      modifiers: {},
    })
    expect(wrapper.get('button').classes()).toContain('v-popper--has-tooltip')
    expect(wrapper.get('input').classes()).not.toContain('v-popper--has-tooltip')
    expect(wrapper.classes()).not.toContain('v-popper--has-tooltip')

    await wrapper.setProps({ trailingButton: 'clear' })
    expect(updateTooltip).toHaveBeenLastCalledWith(wrapper.get('button').element, {
      value: 'Clear text',
      modifiers: {},
    })

    const customWrapper = mount(TextField, { attrs: { trailingButtonLabel: 'Custom label' } })
    expect(updateTooltip).toHaveBeenLastCalledWith(customWrapper.get('button').element, {
      value: 'Custom label',
      modifiers: {},
    })

  })

  it('shows the button label on focus', async () => {
    const wrapper = mount(TextField, {
      props: { trailingButton: 'clear' },
      attrs: { trailingButtonLabel: 'Clear this text field' },
      attachTo: document.body,
    })
    await flushPromises()
    await wrapper.get('button').trigger('focus')
    await vi.waitFor(() => {
      const tooltipId = wrapper.get('button').attributes('aria-describedby')
      assert.isDefined(tooltipId)
      expect(document.getElementById(tooltipId)?.textContent).toContain('Clear this text field')
    }, { timeout: 2000 })
    wrapper.unmount()
  })

  it('cleans up tooltips when the button is hidden or the component is unmounted', async () => {
    const destroyTooltip = vi.spyOn(vTooltip, 'beforeUnmount')
    const wrapper = mount(TextField)
    const button = wrapper.get('button').element
    await wrapper.setProps({ trailingButton: 'none' })
    expect(destroyTooltip).toHaveBeenCalledWith(button)
    expect(button.classList.contains('v-popper--has-tooltip')).toBe(false)

    await wrapper.setProps({ trailingButton: 'clear' })
    const newButton = wrapper.get('button').element
    expect(newButton.classList.contains('v-popper--has-tooltip')).toBe(true)
    wrapper.unmount()
    expect(destroyTooltip).toHaveBeenCalledWith(newButton)
    expect(newButton.classList.contains('v-popper--has-tooltip')).toBe(false)
  })
})
