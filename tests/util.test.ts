import { describe, expect, it } from 'vitest'
import { Color } from '../lib/util/color.ts'
import defaultPalette, { COLOR_BLACK, COLOR_WHITE } from '../lib/util/default-palette.ts'
import sanitize from '../lib/util/sanitize-inline-svg.ts'

describe('Color', () => {
  it.each([
    [0, 0, 0, '#000000'],
    [255, 255, 255, '#ffffff'],
    [0, 130, 201, '#0082c9'],
    [1, 2, 15, '#01020f'],
  ])('formats RGB (%i, %i, %i) as %s', (r, g, b, hex) => {
    expect(new Color(r, g, b).color).toBe(hex)
  })

  it('includes optional names in string and JSON representations', () => {
    const color = new Color(0, 130, 201, 'Nextcloud blue')
    expect(String(color)).toBe('#0082c9 (Nextcloud blue)')
    expect(JSON.parse(JSON.stringify(color))).toEqual({
      r: 0, g: 130, b: 201, name: 'Nextcloud blue', color: '#0082c9',
    })
    expect(String(new Color(0, 0, 0))).toBe('#000000')
  })
})

describe('default palette', () => {
  it('provides twelve distinct, named colors and separate black/white constants', () => {
    expect(defaultPalette).toHaveLength(12)
    expect(new Set(defaultPalette.map((color) => color.color)).size).toBe(12)
    expect(defaultPalette.every((color) => color instanceof Color && !!color.name)).toBe(true)
    expect(COLOR_BLACK.color).toBe('#000000')
    expect(COLOR_WHITE.color).toBe('#ffffff')
  })
})

describe('inline SVG ID namespacing', () => {
  const svg = '<svg><defs><clipPath id="clip"/><linearGradient id="fill"/></defs><path clip-path="url(#clip)" style="fill:url(#fill)"/></svg>'

  it('keeps references consistent with the rewritten IDs', () => {
    const result = sanitize(svg)
    const suffix = result.match(/id="clip-([^"]+)"/)?.[1]
    expect(suffix).toBeDefined()
    expect(result).toContain(`id="fill-${suffix}"`)
    expect(result).toContain(`url(#clip-${suffix})`)
    expect(result).toContain(`url(#fill-${suffix})`)
  })

  it('uses a fresh namespace each time the same SVG is inlined', () => {
    expect(sanitize(svg)).not.toBe(sanitize(svg))
  })

  it('preserves SVGs without IDs', () => {
    expect(sanitize('<svg><path d="M0 0"/></svg>')).toBe('<svg><path d="M0 0"/></svg>')
  })
})
