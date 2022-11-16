<!--
  - @copyright Copyright (c) 2019, 2022 Julius Härtl <jus@bitgrid.net>
  - @copyright Copyright (c) 2022 Claus-Justus Heine <himself@claus-justus-heine.de>
  -
  - @author Julius Härtl <jus@bitgrid.net>
  - @author Claus-Justus Heine <himself@claus-justus-heine.de>
  -
  - @license GNU AGPL version 3 or any later version
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
  -
  -->

<template>
  <form @submit.prevent="">
    <div class="input-wrapper">
      <label :for="id" :class="{ empty: !label || label === '' }">{{ label }}</label>
      <input v-bind="$attrs"
             :id="id"
             :type="type"
             :value="inputVal"
             :disabled="disabled"
             :placeholder="placeholder"
             @input="$emit('input', $event.target.value)"
      >
      <input type="submit"
             class="icon-confirm"
             value=""
             :disabled="disabled"
             @click="$emit('update', inputVal)"
      >
    </div>
    <p v-if="hint !== '' || !!$slots.hint" class="hint">
      {{ hint }}
      <slot name="hint" />
    </p>
  </form>
</template>

<script>
let uuid = 0
export default {
  name: 'SettingsInputText',
  props: {
    type: {
      type: String,
      default: 'text',
    },
    label: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      default: '',
    },
    value: {
      type: [String, Number],
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      inputVal: this.value,
    }
  },
  computed: {
    id() {
      return 'settings-input-text-' + this.uuid
    },
  },
  watch: {
    value(newVal) {
      this.inputVal = this.value
    },
  },
  beforeCreate() {
    this.uuid = uuid.toString()
    uuid += 1
  },
}
</script>
<style lang="scss" scoped>
.input-wrapper {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  max-width: 400px;

  label:not(.empty) {
    width: 100%;
  }

  // let the main input grow
  label + input {
    flex-grow: 1;
    &[type='number'] {
      direction:rtl;
    }
  }

  .hint {
    color: var(--color-text-lighter);
  }

  // Fixup for Nextcloud not styling confirm after number input
  input[type='number'] {
    + .icon-confirm {
      margin-left: -8px !important;
      border-left-color: transparent !important;
      border-radius: 0 var(--border-radius) var(--border-radius) 0 !important;
      background-clip: padding-box;
      /* Avoid background under border */
      background-color: var(--color-main-background) !important;
      opacity: 1;
      height: 34px;
      width: 34px;
      padding: 7px 6px;
      cursor: pointer;
      margin-right: 0;
      &:disabled {
        cursor: default;
        background-image: var(--icon-confirm-fade-000);
      }
    }
    &:not(:active):not(:hover):not(:focus):invalid + .icon-confirm {
      border-color: var(--color-error);
    }
    &:not(:active):not(:hover):not(:focus) + .icon-confirm {
      &:active, &:hover, &:focus {
        border-color: var(--color-primary-element) !important;
        border-radius: var(--border-radius) !important;
        &:disabled {
          border-color: var(--color-background-darker) !important;
        }
      }
    }
    &:active, &:hover, &:focus {
      + .icon-confirm {
        border-color: var(--color-primary-element) !important;
        border-left-color: transparent !important;
        /* above previous input */
        z-index: 2;
      }
    }
  }
}
</style>
