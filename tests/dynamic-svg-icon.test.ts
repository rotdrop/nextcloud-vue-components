import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DynamicSvgIcon from '../lib/components/DynamicSvgIcon.vue'

describe('DynamicSvgIcon', () => {
  const data = '<svg xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="clip"/></defs><path clip-path="url(#clip)"/></svg>'

  it('renders independent inline SVG instances with matching ID references', () => {
    const first = mount(DynamicSvgIcon, { props: { data } })
    const second = mount(DynamicSvgIcon, { props: { data } })
    const id = first.get('clipPath').attributes('id')
    expect(first.get('path').attributes('clip-path')).toBe(`url(#${id})`)
    expect(second.get('clipPath').attributes('id')).not.toBe(id)
  })

  it('sets a title as text and updates it without leaving old SVG nodes', async () => {
    const wrapper = mount(DynamicSvgIcon, { props: { data, title: '<b>Title</b>' } })
    expect(wrapper.get('title').text()).toBe('<b>Title</b>')
    expect(wrapper.find('b').exists()).toBe(false)
    await wrapper.setProps({ title: 'Updated', data: '<svg><title>Old</title><circle/></svg>' })
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.findAll('title')).toHaveLength(1)
    expect(wrapper.get('title').text()).toBe('Updated')
    expect(wrapper.find('path').exists()).toBe(false)
    expect(wrapper.find('circle').exists()).toBe(true)
  })

  it('forwards click events', async () => {
    const wrapper = mount(DynamicSvgIcon, { props: { data } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('rejects non-SVG data explicitly', () => {
    expect(() => mount(DynamicSvgIcon, {
      props: { data: '<div>Not an SVG</div>' },
      global: { config: { warnHandler: () => {} } },
    })).toThrow(TypeError)
  })
})
