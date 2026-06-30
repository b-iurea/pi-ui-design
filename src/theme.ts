/* ═══ Theme management ═══ */

import { S } from "./state";
import { hexToRgb } from "./utils";
import { render } from "./render";
import { scheduleSave } from "./state";

export function applyThemeCSS(): void {
	const root = document.documentElement;
	root.style.setProperty("--accent", S.theme.primary);
	root.style.setProperty("--accent2", S.theme.secondary);
	root.style.setProperty("--accent-rgb", hexToRgb(S.theme.primary));
	const RADIUS: Record<string, string> = { none: "0", sm: "4px", md: "6px", lg: "10px", xl: "16px" };
	root.style.setProperty("--radius", RADIUS[S.theme.radius] || "6px");
	root.setAttribute("data-theme", S.theme.dark ? "dark" : "light");
}

export function updateThemeFromUI(): void {
	const g = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
	S.theme.primary = (g("theme-primary") as HTMLInputElement)?.value || S.theme.primary;
	S.theme.bg = (g("theme-bg") as HTMLInputElement)?.value || S.theme.bg;
	S.theme.text = (g("theme-text") as HTMLInputElement)?.value || S.theme.text;
	S.theme.spacing = (g("theme-spacing") as HTMLSelectElement)?.value || S.theme.spacing;
	S.theme.radius = (g("theme-radius") as HTMLSelectElement)?.value || S.theme.radius;
	S.theme.font = (g("theme-font") as HTMLSelectElement)?.value || S.theme.font;
	S.theme.dark = (g("theme-dark") as HTMLInputElement)?.checked ?? S.theme.dark;
	applyThemeCSS();
	render();
	scheduleSave();
}

export function syncThemeUI(): void {
	const g = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
	const set = (id: string, val: string | boolean) => {
		const el = g(id);
		if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = val as boolean;
		else if (el) (el as HTMLInputElement).value = String(val);
	};
	set("theme-primary", S.theme.primary);
	set("theme-bg", S.theme.bg);
	set("theme-text", S.theme.text);
	set("theme-spacing", S.theme.spacing);
	set("theme-radius", S.theme.radius);
	set("theme-font", S.theme.font);
	set("theme-dark", S.theme.dark);
	applyThemeCSS();
}
