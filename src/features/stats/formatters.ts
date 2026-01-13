export function formatPercent01(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type TrendUI = {
  title: string; // "Better than last week"
  changeText: string; // "Down 100%"
  fromToText: string | null; // "71% → 0%"
  tone: "up" | "down" | "flat" | "na";
};

/**
 * Uses current adherence (0..1) and deltaAdherencePP (percentage points),
 * but returns user-friendly "better/worse" + relative % change + from→to.
 */
export function formatAdherenceTrend(params: {
  current: number | null;
  deltaPP: number | null;
  compareText: string; // "vs last week", "vs last month" (we'll derive title from this)
  planned: number; // if planned=0, hide trend completely
  trendLabel?: "new" | "na" | null;
}): TrendUI | null {
  const { current, deltaPP, compareText, planned, trendLabel } = params;

  // If nothing scheduled, don't show a trend at all.
  if (planned === 0) return null;

  // New this period (no meaningful previous baseline)
  if (trendLabel === "new") {
    return {
      title: "New this period",
      changeText: "",
      fromToText: null,
      tone: "na",
    };
  }

  // Need both values
  if (current == null || deltaPP == null) return null;

  const prev = current - deltaPP / 100;

  // If prev is null-ish or negative due to rounding quirks, guard it
  if (!Number.isFinite(prev) || prev < 0) return null;

  // Title from delta direction
  const isUp = deltaPP > 0.0001;
  const isDown = deltaPP < -0.0001;
  const tone: TrendUI["tone"] = isUp ? "up" : isDown ? "down" : "flat";

  const base = compareText.replace(/^vs\s+/i, ""); // "last week"
  const title = isUp
    ? `Better than ${base}`
    : isDown
    ? `Worse than ${base}`
    : `Same as ${base}`;

  // Relative change in adherence (what users expect as "percent increase/decrease")
  // (curr-prev)/prev, but avoid divide-by-zero.
  let changeText = "";
  if (prev === 0) {
    // If prev was 0 and current > 0, it's effectively "new improvement"
    // If both 0, it's "no change"
    if (current === 0) changeText = "No change";
    else changeText = "Up (from 0%)";
  } else {
    const rel = (current - prev) / prev; // e.g. -1 = down 100%
    const relPct = round1(Math.abs(rel) * 100);
    changeText = isUp
      ? `Up ${relPct}%`
      : isDown
      ? `Down ${relPct}%`
      : "No change";
  }

  const fromToText = `${formatPercent01(prev)} → ${formatPercent01(current)}`;

  return { title, changeText, fromToText, tone };
}

export function formatDeltaPP(value: number | null | undefined): {
  text: string;
  tone: "up" | "down" | "flat" | "na";
} {
  if (value == null) return { text: "—", tone: "na" };
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  const tone = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  return { text: `${sign}${rounded}pp`, tone };
}

export function formatRatio(completed: number, planned: number): string {
  return ` ${completed} completed • ${planned} planned`;
}
