/* ═══ Canvas event handlers — pan, zoom, marquee, resize, drag-over, undo/redo ═══ */

import { S, pushHistory } from "./state";
import { findNode } from "./utils";
import { render } from "./render";

let _isPanning = false, _panStart: { x: number; y: number } | null = null;
let _isMarquee = false, _marqueeStart: { x: number; y: number } | null = null;
let _resizeInfo: { id: string; dir: string; startX: number; startY: number; startW: number; startH: number } | null = null;

function updateCanvasTransform(): void {
	const layer = document.getElementById("canvas-layer") as HTMLElement | null;
	if (!layer) return;
	layer.style.transform = `translate(${S.panX}px, ${S.panY}px) scale(${S.zoom})`;
	const zoomLabel = document.getElementById("zoom-label");
	if (zoomLabel) zoomLabel.textContent = Math.round(S.zoom * 100) + "%";
}

export function zoomTo(v: number): void {
	if (v === 0) { S.zoom = 1; S.panX = 0; S.panY = 0; }
	else if (v === 1) S.zoom = 1;
	else if (v === 2) S.zoom = 2;
	else S.zoom = Math.max(0.1, Math.min(5, S.zoom + (v > 0 ? 0.1 : -0.1)));
	updateCanvasTransform();
}

export function setupCanvasEvents(): void {
	const container = document.getElementById("canvas-container") as HTMLElement | null;
	const layer = document.getElementById("canvas-layer") as HTMLElement | null;
	if (!container || !layer) return;

	container.addEventListener("mousedown", (e: MouseEvent) => {
		if (e.button === 1 || (e.button === 0 && S.tool === "hand")) {
			_isPanning = true;
			_panStart = { x: e.clientX - S.panX, y: e.clientY - S.panY };
			container.classList.add("hand-tool");
			e.preventDefault();
			return;
		}
		if (e.button === 0 && S.tool === "select") {
			const comp = (e.target as HTMLElement).closest(".canvas-component");
			const handle = (e.target as HTMLElement).closest(".resize-handle");
			if (handle) {
				const id = [...S.selectedIds][0];
				const node = findNode(S.tree, id);
				if (!node) return;
				const el = document.querySelector(`.canvas-component[data-id="${CSS.escape(id)}"]`) as HTMLElement | null;
				if (!el) return;
				const rect = el.getBoundingClientRect();
				_resizeInfo = {
					id, dir: (handle as HTMLElement).dataset.direction!,
					startX: e.clientX, startY: e.clientY,
					startW: rect.width, startH: rect.height,
				};
				e.preventDefault();
				return;
			}
			if (!comp && !handle) {
				_isMarquee = true;
				_marqueeStart = { x: e.clientX, y: e.clientY };
				const marquee = document.getElementById("marquee") as HTMLElement | null;
				if (marquee) {
					marquee.style.display = "block";
					marquee.style.left = e.clientX + "px";
					marquee.style.top = e.clientY + "px";
					marquee.style.width = "0";
					marquee.style.height = "0";
				}
			}
		}
	});

	document.addEventListener("mousemove", (e: MouseEvent) => {
		if (_isPanning && _panStart) {
			S.panX = e.clientX - _panStart.x;
			S.panY = e.clientY - _panStart.y;
			updateCanvasTransform();
			return;
		}
		if (_isMarquee && _marqueeStart) {
			const marquee = document.getElementById("marquee") as HTMLElement | null;
			if (!marquee) return;
			const x = Math.min(_marqueeStart.x, e.clientX);
			const y = Math.min(_marqueeStart.y, e.clientY);
			const w = Math.abs(e.clientX - _marqueeStart.x);
			const h = Math.abs(e.clientY - _marqueeStart.y);
			marquee.style.left = x + "px";
			marquee.style.top = y + "px";
			marquee.style.width = w + "px";
			marquee.style.height = h + "px";
			const comps = container.querySelectorAll(".canvas-component");
			const selected = new Set<string>();
			comps.forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.left >= x && r.top >= y && r.right <= x + w && r.bottom <= y + h) {
					selected.add((el as HTMLElement).dataset.id!);
				}
			});
			if (selected.size > 0) { S.selectedIds = selected; render(); }
			return;
		}
		if (_resizeInfo) {
			const ri = _resizeInfo;
			const node = findNode(S.tree, ri.id);
			if (!node) return;
			const dx = (e.clientX - ri.startX) / S.zoom;
			const dy = (e.clientY - ri.startY) / S.zoom;
			let w = ri.startW, h = ri.startH;
			if (ri.dir.includes("e")) w = ri.startW + dx;
			if (ri.dir.includes("w")) w = ri.startW - dx;
			if (ri.dir.includes("s")) h = ri.startH + dy;
			if (ri.dir.includes("n")) h = ri.startH - dy;
			w = Math.max(20, Math.round(w));
			h = Math.max(12, Math.round(h));
			node.props.w = w + "px";
			node.props.h = h + "px";
			render();
			return;
		}
		// Snap guides
		if (_dragInfo?.isDragging) updateSnapGuides(e);
	});

	document.addEventListener("mouseup", () => {
		if (_isPanning) { _isPanning = false; _panStart = null; container.classList.remove("hand-tool"); }
		if (_isMarquee) { _isMarquee = false; _marqueeStart = null; const m = document.getElementById("marquee"); if (m) m.style.display = "none"; }
		if (_resizeInfo) { pushHistory(); _resizeInfo = null; }
	});

	container.addEventListener("wheel", (e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			const delta = -e.deltaY * 0.001;
			const newZoom = Math.max(0.1, Math.min(5, S.zoom + delta));
			const rect = container.getBoundingClientRect();
			const mx = e.clientX - rect.left, my = e.clientY - rect.top;
			const scale = newZoom / S.zoom;
			S.panX = mx - (mx - S.panX) * scale;
			S.panY = my - (my - S.panY) * scale;
			S.zoom = newZoom;
			updateCanvasTransform();
		}
	}, { passive: false });

	container.addEventListener("click", (e: MouseEvent) => {
		if (!(e.target as HTMLElement).closest(".canvas-component") && !(e.target as HTMLElement).closest(".resize-handle")) {
			if (!_isMarquee) { S.selectedIds.clear(); render(); }
		}
	});
}

/* ── Snap guides ── */
function updateSnapGuides(e: MouseEvent): void {
	clearSnapGuides();
	const container = document.getElementById("canvas-container") as HTMLElement | null;
	if (!container) return;
	const comps = container.querySelectorAll(".canvas-component:not(.dragging)");
	if (comps.length === 0) return;
	const SNAP_THRESHOLD = 6;
	const guides = document.getElementById("snap-guides") as HTMLElement | null;
	if (!guides) return;
	const dragging = container.querySelector(".canvas-component.dragging") as HTMLElement | null;
	if (!dragging) return;
	const dr = dragging.getBoundingClientRect();

	comps.forEach((el) => {
		if (el === dragging) return;
		const r = el.getBoundingClientRect();
		if (Math.abs(dr.top - r.top) < SNAP_THRESHOLD) addGuide("h", r.top, r.left, r.right, guides);
		if (Math.abs(dr.bottom - r.bottom) < SNAP_THRESHOLD) addGuide("h", r.bottom, r.left, r.right, guides);
		if (Math.abs(dr.top - r.bottom) < SNAP_THRESHOLD) addGuide("h", r.bottom, r.left, r.right, guides);
		if (Math.abs(dr.bottom - r.top) < SNAP_THRESHOLD) addGuide("h", r.top, r.left, r.right, guides);
		if (Math.abs(dr.left - r.left) < SNAP_THRESHOLD) addGuide("v", r.left, r.top, r.bottom, guides);
		if (Math.abs(dr.right - r.right) < SNAP_THRESHOLD) addGuide("v", r.right, r.top, r.bottom, guides);
		if (Math.abs(dr.left - r.right) < SNAP_THRESHOLD) addGuide("v", r.right, r.top, r.bottom, guides);
		if (Math.abs(dr.right - r.left) < SNAP_THRESHOLD) addGuide("v", r.left, r.top, r.bottom, guides);
	});
}

function addGuide(dir: string, pos: number, _a: number, _b: number, parent: HTMLElement): void {
	const el = document.createElement("div");
	el.className = "snap-guide " + dir;
	const cr = document.getElementById("canvas-container")!.getBoundingClientRect();
	if (dir === "h") el.style.top = pos - cr.top + "px";
	else el.style.left = pos - cr.left + "px";
	el.style.opacity = "0.8";
	parent.appendChild(el);
}

function clearSnapGuides(): void {
	const parent = document.getElementById("snap-guides");
	if (parent) parent.innerHTML = "";
}

// Temp import for snap guide access from dnd
let _dragInfo: any = null;
export function setDragInfo(d: any) { _dragInfo = d; }
