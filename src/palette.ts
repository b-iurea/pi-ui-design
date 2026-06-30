/* ═══ Palette rendering — sidebar component list ═══ */

import { COMPONENTS } from "./components";
import { renderPreview } from "./render";

export function renderPalette(): void {
	const container = document.getElementById("palette-categories");
	if (!container) return;
	const q = (
		(document.getElementById("palette-search") as HTMLInputElement)?.value || ""
	).toLowerCase();
	const cats: Record<
		string,
		{ type: string; label: string; icon: string; props: any }[]
	> = {};
	for (const [type, def] of Object.entries(COMPONENTS)) {
		if (
			q &&
			!def.label.toLowerCase().includes(q) &&
			!def.cat.toLowerCase().includes(q)
		)
			continue;
		if (!cats[def.cat]) cats[def.cat] = [];
		cats[def.cat].push({ type, ...def });
	}
	container.innerHTML = Object.entries(cats)
		.map(
			([cat, items]) =>
				`<div class="palette-category"><h4>${cat}</h4><div class="palette-grid">${items
					.map((item) => {
						const preview = renderPreview(item.type, item.props, "");
						return `<div class="palette-item" draggable="true" data-type="${item.type}" onclick="window.UI.addComponent('${item.type}')">
				<div class="palette-preview">${preview}</div>
				<span class="label">${item.label}</span>
			</div>`;
					})
					.join("")}</div></div>`,
		)
		.join("");
}
