export type AppMode = "demo" | "auth";

export function appHref(mode: AppMode, path: `/${string}`) {
  return mode === "demo" ? (`/demo${path}` as const) : path; // /demo, /settings, /today
}
