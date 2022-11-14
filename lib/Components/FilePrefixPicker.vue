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
  <div class="input-wrapper">
    <div v-if="hint" class="hint">
      {{ hint }}
    </div>
    <div class="flex flex-center flex-wrap">
      <div class="dirname">
        <a href="#"
           class="file-picker button"
           @click="openFilePicker(...arguments)"
        >
          {{ fileInfo.dirName + (fileInfo.dirName !== '/' ? '/' : '') }}
        </a>
      </div>
      <SettingsInputText v-model="fileInfo.baseName"
                         label=""
                         class="flex-grow"
                         :placeholder="placeholder"
                         @update="$emit('update', fileInfo)"
      />
    </div>
  </div>
</template>
<script>

import { appName } from '../config.js'
import Vue from 'vue'
import { getFilePickerBuilder, showError, showInfo, TOAST_PERMANENT_TIMEOUT } from '@nextcloud/dialogs'
import SettingsInputText from '../components/SettingsInputText'

export default {
  name: 'FilePrefixPicker',
  components: {
    SettingsInputText,
  },
  emits: [
    'input',
    // 'update:modelValue', Vue 3
  ],
  props: {
    value: {
      type: Object,
      default: () => {
        return {
          baseName: this.pathInfo.baseName,
          dirName: this.pathInfo.dirName,
        }
      },
    },
    baseName: {
      type: String,
      default: undefined,
    },
    dirName: {
      type: String,
      default: undefined,
    },
    hint: {
      type: String,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    filePickerTitle: {
      type: String,
      // default: t(appName, 'Choose a prefix-folder'),
      default: 'Choose a prefix-folder',
    },
  },
  data() {
    return {
      pathInfo: null,
    }
  },
  created() {
    console.info('VALUE' , this.value)
    this.fileInfo = this.value
    if (!this.fileInfo.baseName && this.baseName) {
      Vue.set(this.fileInfo, 'baseName', this.baseName)
    }
    if (!this.fileInfo.dirName && this.dirName) {
      Vue.set(this.fileInfo, 'dirName', this.dirName)
    }
  },
  computed: {
    pathName() {
      return (this.pathInfo.dirName ? this.pathInfo.dirName + '/' : '') + this.pathInfo.baseName
    }
  },
  watch: {
    fileInfo(newValue) {
      this.$emit('input', newValue) // Vue 2
      // this.$emit('update:modelValue', newValue) // Vue 3
    },
  },
  methods: {
    async openFilePicker() {
      const picker = getFilePickerBuilder(this.filePickerTitle)
        .startAt(this.fileInfo.dirName)
        .setMultiSelect(false)
        .setModal(true)
        .setType(1)
        .setMimeTypeFilter(['httpd/unix-directory'])
        .allowDirectories()
        .build()

      const dir = await picker.pick() || '/'
      if (!dir.startsWith('/')) {
        $this.$emit('error:invalidDirName', dir)
        // showError(t(appName, 'Invalid path selected: "{dir}".', { dir }), { timeout: TOAST_PERMANENT_TIMEOUT })
      } else  {
        this.$emit('update:dirName', dir)
        // showInfo(t(appName, 'Selected path: "{dir}/{base}/".', { dir, base: this.fileInfo.baseName }))
        Vue.set(this.fileInfo, 'dirName', dir)
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.input-wrapper {
  .dirname {
    font-weight:bold;
    font-family:monospace;
    .button {
      display:block;
    }
  }
   .flex {
    display:flex;
    &.flex-center {
      align-items:center;
    }
    &.flex-wrap {
      flex-wrap:wrap;
    }
    .flex-grow {
      flex-grow:1;
    }
  }
}
</style>
