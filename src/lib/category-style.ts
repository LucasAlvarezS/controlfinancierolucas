// Slugs de íconos y paleta de colores disponibles para categorías.
// Módulo sin dependencias de React para poder importarlo igual desde
// server actions (validación) y componentes (pickers).

export const CATEGORY_ICON_SLUGS = [
  // Los del seed (DEFAULT_CATEGORIES en default-rules.ts)
  "coffee",
  "shopping-cart",
  "shirt",
  "file-invoice",
  "car",
  "heart",
  "device-tv",
  "tools-kitchen-2",
  "piggy-bank",
  "dots",
  // Extra para categorías propias
  "home",
  "plane",
  "gift",
  "book",
  "barbell",
  "gas-station",
  "wifi",
  "phone",
  "music",
  "movie",
  "camera",
  "credit-card",
  "cash",
  "briefcase",
  "device-gamepad-2",
  "pizza",
  "beer",
  "bus",
  "bike",
  "paw",
  "first-aid-kit",
  "arrows-exchange",
] as const;

// Paleta para categorías propias: los 10 colores de DEFAULT_CATEGORIES
// (validados para light/dark) más cuatro extra del mismo estilo.
export const CATEGORY_COLORS = [
  "#7c3aed",
  "#2a78d6",
  "#e87ba4",
  "#eb6834",
  "#0d9488",
  "#e34948",
  "#eda100",
  "#6366f1",
  "#008300",
  "#64748b",
  "#b45309",
  "#0ea5e9",
  "#d946ef",
  "#84cc16",
];

export const DEFAULT_CATEGORY_ICON = "dots";
export const DEFAULT_CATEGORY_COLOR = "#b45309";
