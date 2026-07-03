// Widget de saldos para el iPhone, usando la app Scriptable (gratis).
//
// Instalación:
//   1. Instalá "Scriptable" desde el App Store.
//   2. Abrí Scriptable → "+" → pegá este archivo completo → nombralo
//      "Control Financiero".
//   3. Completá BASE_URL (URL de la app desplegada) y WIDGET_SECRET
//      (el valor de WIDGET_SECRET del .env / Vercel).
//   4. En la pantalla de inicio: mantener apretado → "+" → Scriptable →
//      widget mediano → elegí el script "Control Financiero".
//
// iOS refresca el widget automáticamente cada cierto tiempo.

const BASE_URL = "https://TU-APP.vercel.app";
const WIDGET_SECRET = "PEGAR_WIDGET_SECRET_ACA";

const BRAND = new Color("#3c0061");
const WHITE = Color.white();
const MUTED = new Color("#ffffff", 0.65);

function formatCLP(value) {
  if (value === null || value === undefined) return "—";
  return "$" + Math.round(value).toLocaleString("es-CL");
}

async function fetchSummary() {
  const request = new Request(`${BASE_URL}/api/widget/summary`);
  request.headers = { Authorization: `Bearer ${WIDGET_SECRET}` };
  return request.loadJSON();
}

function addRow(stack, label, value, bold) {
  const row = stack.addStack();
  row.layoutHorizontally();
  const left = row.addText(label);
  left.font = bold ? Font.semiboldSystemFont(12) : Font.systemFont(12);
  left.textColor = bold ? WHITE : MUTED;
  left.lineLimit = 1;
  row.addSpacer();
  const right = row.addText(value);
  right.font = bold ? Font.semiboldMonospacedSystemFont(12) : Font.mediumMonospacedSystemFont(12);
  right.textColor = WHITE;
}

async function buildWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = BRAND;
  widget.setPadding(14, 14, 12, 14);

  try {
    const data = await fetchSummary();

    const title = widget.addText("Control Financiero");
    title.font = Font.semiboldSystemFont(13);
    title.textColor = WHITE;
    widget.addSpacer(8);

    const accounts = (data.accounts || []).filter((a) => a.balance !== null);
    if (accounts.length === 0) {
      const empty = widget.addText("Sin saldos sincronizados todavía");
      empty.font = Font.systemFont(12);
      empty.textColor = MUTED;
    }
    for (const account of accounts.slice(0, 4)) {
      addRow(widget, account.alias, formatCLP(account.balance));
      widget.addSpacer(3);
    }

    widget.addSpacer(6);
    addRow(widget, "Gasto del mes", formatCLP(data.monthExpenses), true);
    addRow(widget, "Ahorro", formatCLP(data.savingsTotal), true);

    widget.addSpacer();
    const df = new DateFormatter();
    df.useShortTimeStyle();
    const footer = widget.addText(`actualizado ${df.string(new Date())}`);
    footer.font = Font.systemFont(9);
    footer.textColor = MUTED;
  } catch (error) {
    const message = widget.addText("No se pudo cargar el resumen");
    message.font = Font.systemFont(12);
    message.textColor = WHITE;
    widget.addSpacer(4);
    const detail = widget.addText(String(error));
    detail.font = Font.systemFont(9);
    detail.textColor = MUTED;
  }

  return widget;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
