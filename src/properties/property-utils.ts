import { hasVendorPrefix } from '../vendor-prefix.js'
import { endsWith } from '../string-utils.js'
import { KeywordSet } from '../keyword-set.js'

/**
 * @see https://github.com/csstree/csstree/blob/master/lib/utils/names.js#L69
 */
export function is_browserhack(property: string): boolean {
  if (is_custom(property) || hasVendorPrefix(property)) return false

  let code = property.charCodeAt(0)

  return code === 47 // /
    || code === 42 // *
    || code === 95 // _
    || code === 43 // +
    || code === 38 // &
    || code === 36 // $
    || code === 35 // #
}

export function is_custom(property: string): boolean {
  if (property.length < 3) return false
  // 45 === '-'.charCodeAt(0)
  return property.charCodeAt(0) === 45 && property.charCodeAt(1) === 45
}

/**
 * A check to verify that a propery is `basename` or a prefixed
 * version of that, but never a custom property that accidentally
 * ends with the same substring.
 *
 * @example
 * is_property('animation', 'animation') // true
 * is_property('animation', '-webkit-animation') // true
 * is_property('animation', '--my-animation') // false
 *
 * @returns True if `property` equals `basename` without prefix
 */
export function is_property(basename: string, property: string): boolean {
  if (is_custom(property)) return false
  return endsWith(basename, property)
}

/**
 * Get the basename for a property with a vendor prefix
 * @returns The property name without vendor prefix
 */
export function basename(property: string): string {
  if (hasVendorPrefix(property)) {
    return property.slice(property.indexOf('-', 2) + 1)
  }
  return property
}

const SHORTHANDS = new KeywordSet([
  // Box Model
  "margin",
  "padding",
  "border",
  "border-width",
  "border-style",
  "border-color",
  "border-radius",
  "inset",              // shorthand for top/right/bottom/left
  "inset-block",      // shorthand for top/bottom
  "inset-inline",     // shorthand for left/right
  "border-block",
  "border-inline",

  // Font & Text
  "font",
  "font-variant",       // shorthand for several font-variant-* props
  "font-synthesis",
  "text-decoration",
  "text-emphasis",
  "place-items",
  "place-content",
  "place-self",

  // Background & Borders
  "background",
  "border-block",
  "border-inline",

  // List & Marker
  "list-style",
  "marker",

  // Flex & Grid
  "flex",
  "flex-flow",
  "grid",
  "grid-area",
  "grid-column",
  "grid-row",

  // Positioning & Layout
  "offset",             // shorthand for top/left/width/height
  "overflow",
  "overscroll-behavior",
  "scroll-margin",
  "scroll-padding",
  "scroll-snap-type",

  // Animation & Transition
  "animation",
  "transition",

  // Columns
  "columns",

  // Outline
  "outline",

  // Masking
  "mask",
  "mask-border",

  // Container Queries
  "container",

  // Other
  "border-image",       // shorthand for image + slice + width + outsets + repeat
  "grid-template",      // rows + columns + areas
  "scroll-timeline",    // new scroll-linked animation shorthand
])

export function is_shorthand(property: string): boolean {
  return SHORTHANDS.has(property)
}
