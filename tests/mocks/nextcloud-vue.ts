import { defineComponent } from 'vue'

export const NcTextField = defineComponent({
  name: 'NcTextField',
  props: ['modelValue', 'showTrailingButton', 'trailingButtonIcon'],
  emits: ['update:modelValue', 'trailingButtonClick'],
  template: '<div><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"><button @click="$emit(\'trailingButtonClick\')">Submit</button><slot /></div>',
})

export const NcSelect = defineComponent({
  name: 'NcSelect',
  props: ['modelValue', 'multiple', 'clearable', 'disabled', 'required', 'inputId', 'labelOutside'],
  emits: ['update:modelValue', 'open', 'close'],
  template: '<div><slot /></div>',
})

export const NcActions = defineComponent({
  name: 'NcActions',
  template: '<div><slot /></div>',
})

export const NcActionButton = defineComponent({
  name: 'NcActionButton',
  template: '<button><slot /></button>',
})

export const NcButton = defineComponent({
  name: 'NcButton',
  template: '<button><slot /></button>',
})

export const NcColorPicker = defineComponent({
  name: 'NcColorPicker',
  props: ['modelValue', 'palette', 'shown'],
  emits: ['update:modelValue', 'update:shown', 'submit'],
  template: '<div><slot /></div>',
})
