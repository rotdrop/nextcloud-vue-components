<!--
 - @copyright Copyright (c) 2019, 2022, 2023, 2024, 2025, 2026 Julius Härtl <jus@bitgrid.net>
 - @copyright Copyright (c) 2022 Claus-Justus Heine <himself@claus-justus-heine.de>
 -
 - @author Julius Härtl <jus@bitgrid.net>
 - @author Claus-Justus Heine <himself@claus-justus-heine.de>
 - @license AGPL-3.0-or-later
 -
 - This program is free software: you can redistribute it and/or modify
 - it under the terms of the GNU Affero General Public License as
 - published by the Free Software Foundation, either version 3 of the
 - License, or (at your option) any later version.
 -
 - This program is distributed in the hope that it will be useful,
 - but WITHOUT ANY WARRANTY; without even the implied warranty of
 - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 - GNU Affero General Public License for more details.
 -
 - You should have received a copy of the GNU Affero General Public License
 - along with this program. If not, see <http://www.gnu.org/licenses/>.
 -->
<template>
  <div class="component-wrapper">
    <div class="alignment-wrapper" :class="[...props.flexContainerClasses]">
      <div v-if="$slots.alignedBefore" class="aligned-before" :class="[...props.flexItemClasses]">
        <slot name="alignedBefore" />
      </div>
      <NcTextField v-model="model"
                   v-trailing-button-tooltip="props.trailingButtonTooltip"
                   v-bind="$attrs"
                   :class="{ 'submit-button': props.trailingButton === 'submit', 'search-clear-button': props.trailingButton === 'clear' && $attrs.type === 'search' }"
                   :showTrailingButton="props.trailingButton !== 'none'"
                   :trailingButtonIcon="props.trailingButton === 'submit' ? 'arrowEnd' : 'close'"
                   @trailingButtonClick="onTrailingButtonClick"
      >
        <!-- pass through slots -->
        <template v-for="(_, slotName) in $slots" #[slotName]="slotData">
          <slot :name="slotName" v-bind="slotData" />
        </template>
      </NcTextField>
      <div v-if="$slots.alignedAfter" class="aligned-after" :class="[...flexItemClasses]">
        <slot name="alignedAfter" />
      </div>
    </div>
    <p v-if="hint !== '' || !!$slots.hint" class="hint">
      {{ hint }}
      <slot name="hint" />
    </p>
  </div>
</template>

<script setup lang="ts">
import { NcTextField } from '@nextcloud/vue'
import type { DirectiveBinding, ObjectDirective } from 'vue'
import vTooltip from '../directives/Tooltip/index.ts'

const tooltipButtons = new WeakMap<HTMLElement, HTMLButtonElement>()

const updateTrailingButtonTooltip = (element: HTMLElement, { value: enabled }: DirectiveBinding<boolean>) => {
  const previous = tooltipButtons.get(element)
  const button = enabled ? element.querySelector<HTMLButtonElement>('.input-field__trailing-button') : null
  if (previous && previous !== button) {
    vTooltip.beforeUnmount(previous)
    tooltipButtons.delete(element)
  }
  if (button) {
    vTooltip.updated(button, {
      value: button.getAttribute('aria-label') || false,
      modifiers: {},
    })
    tooltipButtons.set(element, button)
  }
}

// NcTextField owns the button, so delegate tooltip lifecycle hooks to that element.
const vTrailingButtonTooltip: ObjectDirective<HTMLElement, boolean> = {
  mounted: updateTrailingButtonTooltip,
  updated: updateTrailingButtonTooltip,
  beforeUnmount(element) {
    const button = tooltipButtons.get(element)
    if (button) {
      vTooltip.beforeUnmount(button)
      tooltipButtons.delete(element)
    }
  },
}

defineOptions({
  name: 'TextFieldWithTrailingButton',
  inheritAttrs: false,
})

const model = defineModel<string|number>({ default: '' })

const props = withDefaults(defineProps<{
  trailingButton?: 'none'|'submit'|'clear'
  trailingButtonTooltip?: boolean
  hint?: string
  flexContainerClasses?: string[]
  flexItemClasses?: string[]
}>(), {
  trailingButton: 'submit',
  trailingButtonTooltip: true, // eslint-disable-line vue/no-boolean-default
  hint: undefined,
  flexContainerClasses: () => ['flex-justify-left', 'flex-align-start'],
  flexItemClasses: () => ['flex-justify-left', 'flex-align-start'],
})

const emit = defineEmits([
  'submit',
])

const onTrailingButtonClick = () => {
  if (props.trailingButton === 'clear') {
    model.value = ''
  } else if (props.trailingButton === 'submit') {
    emit('submit', model.value)
  }
}
</script>

<style scoped lang="scss">
.component-wrapper {
  .hint {
    color: var(--color-text-lighter);
    font-style:italic;
  }
  // Tweak the trailing button of the NcTextField
  :deep(.input-field) { // wrapper
    margin-block-start: 0;
    &.input-field--trailing-icon .input-field__input,
    .input-field__input.input-field__input--trailing-icon {
      &[dir="rtl"] {
        // still it is a trailing icon, so for rtl the margins have to be interchanged
        padding-inline-end: 12px;
        padding-inline-start: var(--default-clickable-area);
        // + .input-field__label {
        //   margin-inline-end: 9px;
        //   margin-inline-start: var(--default-clickable-area);
        // }
      }
    }
    .input-field__trailing-button.button-vue--vue-tertiary-no-background {
      max-height: var(--default-clickable-area);
      max-width: var(--default-clickable-area);
      background-position: center;
      background-repeat: no-repeat;
      &:hover, &:focus {
        &:not(:disabled) {
          top: 0;
          right: 0;
          height: var(--default-clickable-area);
          width: var(--default-clickable-area) !important;
          border: 2px solid var(--color-primary-element);
          border-radius: var(--border-radius-large);
          outline: 2px solid var(--color-main-background);
        }
      }
    }
    &.submit-button .input-field__trailing-button.button-vue--vue-tertiary-no-background {
      // FIXME: instead we probably should switch to material design icons for everything else ...
      background-image: var(--icon-confirm-dark);
      .button-vue__icon {
        opacity: 0;
      }
    }
    &.search-clear-button .input-field__trailing-button::after {
      content: '×';
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--color-main-text);
      font-size: 20px;
      line-height: 1;
      pointer-events: none;
    }
  }
  :deep(.alignment-wrapper) {
    margin-block-start: 10px;
    display: flex;
    flex-grow: 1;
    max-width: 100%;
    &.flex- {
      &align- {
        &center {
          align-items: center;
        }
        &baseline {
          align-items: baseline;
        }
        &stretch {
          align-items: stretch;
        }
        &start {
          align-items: start;
        }
        &end {
          align-items: end;
        }
      }
      &justify- {
        &center {
          justify-content: center;
        }
        &start {
          justify-content: flex-start;
        }
        &left {
          justify-content: left;
        }
      }
    }
  }
}
</style>
