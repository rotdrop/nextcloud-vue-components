<script>
/**
 * @author Claus-Justus Heine <himself@claus-justus-heine.de>
 * @copyright 2022 Claus-Justus Heine
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
</script>
<template>
  <div class="color-picker-container flex-container flex-center">
    <Actions>
      <ActionButton icon="icon-play"
                    @click="pickerVisible = true"
      >
        {{ componentLabels.openColorPicker }}
      </ActionButton>
      <ActionButton icon="icon-confirm"
                    @click="submitColorChoice"
      >
        {{ componentLabels.submitColorChoice }}
      </ActionButton>
      <ActionButton icon="icon-history"
                    :disabled="rgbColor === oldRgbColor"
                    @click="rgbColor = oldRgbColor"
      >
        {{ componentLabels.revertColor }}
      </ActionButton>
      <ActionButton icon="icon-toggle-background"
                    :disabled="!colorPaletteHasChanged"
                    @click="revertColorPalette"
      >
        {{ componentLabels.revertColorPalette }}
      </ActionButton>
      <ActionButton icon="icon-toggle-background"
                    :disabled="colorPaletteIsDefault"
                    @click="resetColorPalette"
      >
        {{ componentLabels.resetColorPalette }}
      </ActionButton>
    </Actions>
    <ColorPicker ref="colorPicker"
                 v-model="rgbColor"
                 :open.sync="pickerVisible"
                 @submit="submitCustomColor"
                 @update:open="handleOpen"
                 @close="() => false"
    >
      <button :style="{'background-color': rgbColor, color: rgbToGrayScale(rgbColor) > 0.5 ? 'black' : 'white'}"
              class="trigger-button"
      >
        {{ label }}
      </button>
    </ColorPicker>
    <input type="submit"
           class="icon-confirm confirm-button"
           value=""
           @click="$emit('update', rgbColor)"
    >
  </div>
</template>
<script>
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ColorPicker from '@nextcloud/vue/dist/Components/ColorPicker'
import { nextTick } from 'vue'

export default {
  name: 'ColorPickerExtension',
  components: {
    ActionButton,
    Actions,
    ColorPicker,
  },
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: 'pick a color',
    },
    componentLabels: {
      type: Object,
      default: () => {
        return {
          openColorPicker: 'open',
          submitColorChoice: 'submit',
          revertColor: 'revert color',
          revertColorPalette: 'restore palette',
          resetColorPalette: 'factory reset palette',
        }
      },
    },
    colorPalette: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // rgbColor: this.value,
      pickerVisible: false,
      oldRgbColor: this.value,
      colorPickerPalette: this.colorPalette, // shadow of this.$refs.colorPicker.palette
      colorPaletteHasChanged: false,
      oldColorPalette: this.colorPalette,
      factoryColorPalette: [],
      loading: true,
    }
  },
  computed: {
    colorPaletteIsDefault() {
      return this.colorPickerPalette.toString() === this.factoryColorPalette.toString()
    },
    /**
     * Writable computable property which updates this.value through
     * sending an event to the parent.
     */
    rgbColor: {
      set(newValue) {
        if (!this.loading) {
          this.$emit('update:value', newValue)
          this.$emit('input', newValue)
        }
        return newValue
      },
      get() {
        return this.value
      }
    },
  },
  watch: {
    colorPickerPalette: {
      handler(newValue, oldValue) {
        if (this.loading) {
          return
        }
        if (this.colorPickerPalette !== this.$refs.colorPicker.palette) {
          this.$refs.colorPicker.palette = this.colorPickerPalette
        }
        if (!!newValue && !!oldValue && newValue.toString() === oldValue.toString()) {
          return
        }
        this.colorPaletteHasChanged = true
        this.$emit('update:color-palette', newValue)
      },
      deep: true,
    },
    colorPalette(newValue, oldValue) {
      if (this.loading) {
        return
      }
      if (!!newValue && !!oldValue && newValue.toString() === oldValue.toString()) {
        return
      }
      if (this.colorPalette.length > 0) {
        this.colorPickerPalette.splice(0, Infinity, ...this.colorPalette)
      }
    },
  },
  created() {
    // console.info('VALUE', this.value, this.rgbColor, this.oldRgbColor)
    // console.info('LOADING IN CREATED', this.loading)
  },
  mounted() {
    this.factoryColorPalette = [...this.$refs.colorPicker.palette]
    if (this.colorPalette.length > 0) {
      this.$refs.colorPicker.palette = this.colorPalette
    }
    this.colorPickerPalette = this.$refs.colorPicker.palette
    this.oldColorPalette = [...this.colorPickerPalette]
    if (this.rgbColor) {
      this.prependColorToPalette(this.rgbColor)
    }
    nextTick(() => {
      this.loading = false
    })
  },
  methods: {
    submitCustomColor(color) {
      this.prependColorToPalette(color)
    },
    submitColorChoice(color) {
      this.pickerVisible = false
      this.oldRgbColor = this.rgbColor
    },
    handleOpen() {
    },
    revertColorPalette() {
      this.colorPickerPalette.splice(0, Infinity, ...this.oldColorPalette)
    },
    resetColorPalette() {
      this.colorPickerPalette.splice(0, Infinity, ...this.factoryColorPalette)
    },
    prependColorToPalette(color) {
      if (!this.colorPickerPalette.includes(color)) {
        const palette = [...this.colorPickerPalette]
        palette.pop()
        palette.splice(0, 0, this.rgbColor)
        this.colorPickerPalette = palette
      }
    },
    /**
     * Convert an RGH color to a grey-scale value. This is used to
     * switch the trigger-button color between black and white,
     * depending on the grey-value of the color.
     *
     * @param {array} rgb RGB color array.
     *
     * @return {number} Grey-value corresponding to rgb.
     */
    rgbToGrayScale(rgb) {
      const r = Number('0x' + rgb.substring(1, 3))
      const g = Number('0x' + rgb.substring(3, 5))
      const b = Number('0x' + rgb.substring(5, 7))
      return (0.3 * r + 0.59 * g + 0.11 * b) / 255.0
    },
  },
}
</script>
<style scoped lang="scss">
.color-picker-container {
  .trigger-button {
    margin-right:0;
    border-top-right-radius:0;
    border-bottom-right-radius:0;
    &:not(:focus,:hover) {
      border-right:0;
    }
  }
  .confirm-button {
    border-top-left-radius:0;
    border-bottom-left-radius:0;
    &:not(:focus,:hover) {
      border-left:0;
    }
  }
}
</style>
