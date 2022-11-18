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
    <input type="submit" class="icon-confirm confirm-button" value="">
  </div>
</template>
<script>
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ColorPicker from '@nextcloud/vue/dist/Components/ColorPicker'

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
      rgbColor: this.value,
      pickerVisible: false,
      oldRgbColor: this.value,
      colorPickerPalette: this.colorPalette,
      oldColorPalette: this.colorPalette,
      factoryColorPalette: [],
    }
  },
  computed: {
    colorPaletteHasChanged() {
      this.colorPickerPalette.toString() !== this.oldColorPalette.toString()
    },
    colorPaletteIsDefault() {
      this.colorPickerPalette.toString() === this.factoryColorPalette.toString()
    },
  },
  watch: {
    rgbColor(newValue, oldValue) {
      console.info('COLOR UPDATE', newValue, oldValue)
      this.$emit('update:value', newValue)
      this.$emit('input', newValue)
    },
  },
  created() {
    console.info('VALUE', this.value, this.rgbColor, this.oldRgbColor)
  },
  mounted() {
    console.info('COLOR PICKER', this)
    this.factoryColorPalette = [...this.$refs.colorPicker.palette]
    if (this.colorPalette.length > 0) {
      this.$refs.colorPicker.palette = this.colorPalette
    }
    this.colorPickerPalette = this.$refs.colorPicker.palette
    this.oldColorPalette = [...this.colorPickerPalette]
    if (this.rgbColor) {
      this.prependColorToPalette(this.rgbColor)
    }
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
    },
    resetColorPalette() {
    },
    prependColorToPalette(color) {
      const palette = this.colorPickerPalette
      console.info('CUSTOM COLOR SUBMIT', color, palette, this.$refs.colorPicker, this.$refs.colorPicker.palette)
      if (!palette.includes(color)) {
        palette.pop()
        palette.splice(0, 0, this.rgbColor)
      }
    },
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
