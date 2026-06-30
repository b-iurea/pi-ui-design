/* ═══ Drag and drop ── palette, canvas, asset drag ═══ */

import { S, pushHistory, scheduleSave } from "./state";
import { COMPONENTS } from "./components";
import { findNode, findParent, nextId, genName } from "./utils";
import { render } from "./render";
import { addAssetToCanvas, addIconToCanvas } from "./assets";

export let _dragInfo: any = null;

export function setupPaletteDrag(): void {
	document.addEventListener("dragstart", (e: DragEvent) => {
		const target = e.target as HTMLElement;
		const item = target.closest(".palette-item") as HTMLElement | null;
		const asset = target.closest(".asset-item") as HTMLElement | null;
		const comp = target.closest(".canvas-component") as HTMLElement | null;

		// Canvas component reorder drag
		if (comp) {
			const id = comp.dataset.id;
			_dragInfo = { source: "canvas", id, isDragging: true };
			comp.classList.add("dragging");
			e.dataTransfer!.effectAllowed = "move";
			e.dataTransfer!.setData("text/plain", id!);
			return;
		}
		// Palette component type drag
		if (item) {
			const type = item.dataset.type;
			_dragInfo = { source: "palette", type, isDragging: true };
			item.classList.add("dragging");
			e.dataTransfer!.effectAllowed = "copy";
			e.dataTransfer!.setData("text/plain", type!);
			return;
		}
		// Asset item drag (uploaded image)
		if (asset && asset.dataset.assetId !== undefined) {
			_dragInfo = { source: "asset", assetId: asset.dataset.assetId, isDragging: true };
			asset.classList.add("dragging");
			e.dataTransfer!.effectAllowed = "copy";
			return;
		}
		// Icon drag
		if (asset && asset.dataset.iconName !== undefined) {
			_dragInfo = { source: "icon", iconName: asset.dataset.iconName, isDragging: true };
			asset.classList.add("dragging");
			e.dataTransfer!.effectAllowed = "copy";
			return;
		}
	});

	document.addEventListener("dragend", () => {
		document.querySelectorAll(".dragging,.drag-over,.drag-over-canvas,.childzone-active")
			.forEach((el) => el.classList.remove("dragging", "drag-over", "drag-over-canvas", "childzone-active"));
		clearSnapGuides();
		_dragInfo = null;
	});
}

function clearSnapGuides(): void {
	const parent = document.getElementById("snap-guides");
	if (parent) parent.innerHTML = "";
}

export function setupCanvasDragDrop(): void {
	const canvas = document.getElementById("canvas-container");
	if (!canvas) return;

	canvas.addEventListener("dragover", (e: DragEvent) => {
		if (!_dragInfo) return;
		e.preventDefault();
		canvas.classList.add("drag-over-canvas");
		e.dataTransfer!.dropEffect = _dragInfo.source === "palette" ? "copy" : "move";

		const childZones = canvas.querySelectorAll(".canvas-childzone");
		childZones.forEach((zone) => {
			const zr = (zone as HTMLElement).getBoundingClientRect();
			if (e.clientX >= zr.left && e.clientX <= zr.right && e.clientY >= zr.top && e.clientY <= zr.bottom) {
				(zone as HTMLElement).classList.add("childzone-active");
				_dragInfo.dropParentId = (zone as HTMLElement).dataset.parent;
			} else (zone as HTMLElement).classList.remove("childzone-active");
		});
		if (!_dragInfo.dropParentId) _dragInfo.dropParentId = null;

		const dropZone = document.getElementById("canvas-drop-zone") as HTMLElement | null;
		if (dropZone) {
			const dzr = dropZone.getBoundingClientRect();
			dropZone.style.display = e.clientY >= dzr.top && e.clientY <= dzr.bottom ? "flex" : "none";
		}
	});

	canvas.addEventListener("drop", (e: DragEvent) => {
		e.preventDefault();
		canvas.classList.remove("drag-over-canvas");
		document.querySelectorAll(".drag-over,.childzone-active")
			.forEach((el) => el.classList.remove("drag-over", "childzone-active"));
		const dropZone = document.getElementById("canvas-drop-zone") as HTMLElement | null;
		if (dropZone) dropZone.style.display = "none";
		if (!_dragInfo) return;

		if (_dragInfo.source === "palette") {
			const type = _dragInfo.type;
			const def = COMPONENTS[type];
			if (!def) { _dragInfo = null; return; }
			const id = nextId();
			const node = { id, type, props: { ...def.props }, children: [] as any[] };
			S.nodeNames[id] = genName(type, COMPONENTS as any);
			if (_dragInfo.dropParentId) {
				const parent = findNode(S.tree, _dragInfo.dropParentId);
				if (parent) {
					parent.children = parent.children || [];
					parent.children.push(node);
				} else S.tree.children.push(node);
			} else S.tree.children.push(node);
			S.selectedIds = new Set([id]);
			render();
			scheduleSave();
			pushHistory();
		} else if (_dragInfo.source === "canvas") {
			const srcId = _dragInfo.id;
			if (!srcId || srcId === "root") { _dragInfo = null; return; }
			const srcParent = findParent(S.tree, srcId);
			if (!srcParent || !srcParent.children) { _dragInfo = null; return; }
			const idx = srcParent.children.findIndex((x) => x.id === srcId);
			if (idx === -1) { _dragInfo = null; return; }
			const [item] = srcParent.children.splice(idx, 1);
			if (_dragInfo.dropParentId) {
				const target = findNode(S.tree, _dragInfo.dropParentId);
				if (target) {
					target.children = target.children || [];
					target.children.push(item);
				} else S.tree.children.push(item);
			} else S.tree.children.push(item);
			render();
			scheduleSave();
			pushHistory();
		} else if (_dragInfo.source === "asset") {
			addAssetToCanvas(_dragInfo.assetId);
		} else if (_dragInfo.source === "icon") {
			addIconToCanvas(_dragInfo.iconName);
		}
		_dragInfo = null;
	});
}
