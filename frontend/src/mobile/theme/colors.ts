// Extracted from frontend/tailwind.config.js (web app source of truth) — do not approximate.
export const colors = {
  ink: "#10192B",
  parchment: "#F5EDE0",
  parchmentShade: "#EBE0CC",
  verified: "#1F7A5C",
  pending: "#D9A441",
  alert: "#C4503A",
  slate: "#6B7785",
  line: "#DCD2BC",
  // Aliases used by CredoGlass (hex-alpha suffixes are appended to these, so they must
  // stay 6-digit hex): navy = ink, gold = the namecard's gold.
  navy: "#10192B",
  gold: "#C9A646",
  white: "#FFFFFF",
  // Muted variant of gold — for large solid fills (the tab bar's active pill) where the
  // full-saturation gold reads as a bright flat block rather than the soft accent it is
  // everywhere else it's used (icon tints, badges, borders at low opacity). Same hue,
  // pulled down in saturation/lightness; contrast vs ink text still 7.2:1 (well over the
  // ~3:1 large-text minimum), so the tab label stays fully legible.
  goldMuted: "#B9A472",
  // Third accent identity — warm terracotta, distinct from gold (more yellow) and alert
  // (more crimson/pink). Validated via the dataviz skill's CVD-separation check against
  // verified-green (ΔE 8.1 protan, passes) before adding — see scripts/validate_palette.js.
  // Reserved for AI-coaching/SimuHire surfaces so they read as their own identity rather
  // than reusing gold (jobs) or green (verified) for an unrelated concept.
  terracotta: "#C17A3D",
};

// Gradient ground + glass surface tokens — CREDO's cream/gold identity rendered with the
// soft-light, layered-depth treatment (frosted cards, soft shadows) instead of flat fills.
export const surface = {
  // Warm cream → slightly deeper cream, top-to-bottom page ground.
  groundFrom: "#FAF5EA",
  groundTo: "#EFE4D2",
  // Frosted card over the gradient ground: translucent warm white + hairline + soft shadow.
  glass: "rgba(255,252,246,0.72)",
  glassBorder: "rgba(16,25,43,0.08)",
  glassShadow: "rgba(76,58,20,0.14)",
  // Elevated (pressed/active) state — slightly more opaque.
  glassActive: "rgba(255,252,246,0.92)",
};

// Extracted from frontend/src/components/NamecardPremium.jsx — the real hero card,
// a dark/gold identity card, distinct from the cream/navy tokens above.
export const namecard = {
  gold: "#C9A646",
  goldRing: "rgba(201,166,70,0.5)",
  primary: "#E8E6DF",
  body: "#8A8F96",
  footer: "#5A5F66",
  divider: "#2A2F35",
  bgGradientFrom: "#161A1F",
  bgGradientTo: "#14181C",
};
