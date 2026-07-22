// RN style object -> React inline-style (CSS) conversion.
//
// The ported screens keep their `StyleSheet.create` objects verbatim, so this module is
// where every RN-vs-CSS divergence gets reconciled. Four of them actually matter:
//
//  1. shadow* / elevation  -> boxShadow (CSS has no separate shadow props)
//  2. lineHeight: 17       -> "17px"    (React treats lineHeight as unitless => 17x font!)
//  3. transform: [{...}]   -> "perspective(1200px) rotateY(180deg)"
//  4. fontFamily: "Fraunces_700Bold" -> family + weight (expo-font registers one family
//     name per weight; the web loads one family with numeric weights)

// expo-font registers each weight as its own family name. Map back to family + weight.
const FONT_MAP = {
  Fraunces_600SemiBold: ['"Fraunces"', 600],
  Fraunces_700Bold: ['"Fraunces"', 700],
  Inter_400Regular: ['"Inter"', 400],
  Inter_500Medium: ['"Inter"', 500],
  Inter_600SemiBold: ['"Inter"', 600],
  IBMPlexMono_400Regular: ['"IBM Plex Mono"', 400],
  IBMPlexMono_500Medium: ['"IBM Plex Mono"', 500],
};

const FALLBACK = {
  '"Fraunces"': 'Georgia, serif',
  '"Inter"': 'system-ui, -apple-system, sans-serif',
  '"IBM Plex Mono"': '"Courier New", monospace',
};

// Props React would emit unitless but RN measures in density-independent pixels.
const NEEDS_PX = new Set(['lineHeight']);

// RN's axis shorthands don't exist in CSS — React would emit `padding-horizontal: 20px`,
// which the browser silently drops. Expand them to the two physical edges each. Note the
// expansion writes *longhand* edges so an explicit paddingTop next to a paddingVertical
// still wins, exactly as it does in RN's style resolution.
const AXIS_SHORTHANDS = {
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
  paddingVertical: ['paddingTop', 'paddingBottom'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  marginVertical: ['marginTop', 'marginBottom'],
  paddingStart: ['paddingInlineStart'],
  paddingEnd: ['paddingInlineEnd'],
  marginStart: ['marginInlineStart'],
  marginEnd: ['marginInlineEnd'],
  borderStartWidth: ['borderInlineStartWidth'],
  borderEndWidth: ['borderInlineEndWidth'],
  borderStartColor: ['borderInlineStartColor'],
  borderEndColor: ['borderInlineEndColor'],
};

const SHADOW_KEYS = ['shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'];

// RN-only props with no CSS equivalent — dropping them beats emitting invalid CSS.
const DROP = new Set(['includeFontPadding', 'textAlignVertical', 'writingDirection', 'elevation']);

function transformToCss(list) {
  if (typeof list === 'string') return list;
  if (!Array.isArray(list)) return undefined;
  return list
    .map((t) => {
      const [fn, raw] = Object.entries(t)[0];
      let value = raw;
      if (typeof value === 'number') {
        // Angles are degrees in RN only when written as strings; numeric rotate/skew is
        // radians, but this codebase always uses "180deg" strings — numbers here are
        // lengths (perspective, translate) or unitless scales.
        value = fn.startsWith('scale') ? String(value) : `${value}px`;
      }
      return `${fn}(${value})`;
    })
    .join(' ');
}

function shadowToCss(s) {
  const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = s;
  if (!shadowColor && !shadowRadius) return undefined;
  const { width = 0, height = 0 } = shadowOffset || {};
  const blur = shadowRadius ?? 0;
  let color = shadowColor || 'rgba(0,0,0,0.2)';
  // RN multiplies the shadow colour by shadowOpacity. Most call sites here already bake
  // the alpha into an rgba() colour and pass shadowOpacity: 1, so only convert opaque hex.
  const opacity = shadowOpacity ?? 1;
  if (opacity < 1 && /^#[0-9a-f]{6}$/i.test(color)) {
    const n = parseInt(color.slice(1), 16);
    color = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
  }
  return `${width}px ${height}px ${blur}px ${color}`;
}

/** Flatten RN's nested/conditional style arrays ([a, cond && b, [c, d]]) into one object. */
export function flatten(style) {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => Object.assign(acc, flatten(s)), {});
  }
  if (typeof style !== 'object') return {};
  return style;
}

/** Flatten an RN style prop and convert it to a React inline-style object. */
export function css(style) {
  const flat = flatten(style);
  const out = {};
  let hasShadow = false;

  // Axis shorthands go down first so an explicit edge in the same style object still
  // wins, matching how RN resolves paddingTop against paddingVertical.
  for (const [key, edges] of Object.entries(AXIS_SHORTHANDS)) {
    const value = flat[key];
    if (value === undefined || value === null) continue;
    for (const edge of edges) {
      if (flat[edge] === undefined) out[edge] = value;
    }
  }

  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === null) continue;
    if (DROP.has(key)) continue;
    if (AXIS_SHORTHANDS[key]) continue;
    if (SHADOW_KEYS.includes(key)) {
      hasShadow = true;
      continue;
    }

    if (key === 'transform') {
      out.transform = transformToCss(value);
    } else if (key === 'fontFamily') {
      const mapped = FONT_MAP[value];
      if (mapped) {
        out.fontFamily = `${mapped[0]}, ${FALLBACK[mapped[0]]}`;
        if (out.fontWeight === undefined) out.fontWeight = mapped[1];
      } else {
        out.fontFamily = value;
      }
    } else if (key === 'backfaceVisibility') {
      out.backfaceVisibility = value;
      out.WebkitBackfaceVisibility = value;
    } else if (NEEDS_PX.has(key) && typeof value === 'number') {
      out[key] = `${value}px`;
    } else {
      out[key] = value;
    }
  }

  if (hasShadow) {
    const box = shadowToCss(flat);
    if (box) out.boxShadow = box;
  }
  return out;
}

/** RN splits text styling out of View styling; Pressable/View wrappers must not eat it. */
export const TEXT_STYLE_KEYS = new Set([
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecorationLine',
  'textTransform',
]);
