/* ═══ Main entry — wires all modules, exposes window.UI API ═══ */

import { S, pushHistory, scheduleSave, initHistory, undo, redo, setRenderFn, setSaveFn } from "./state";
import { COMPONENTS } from "./components";
import { findNode, findParent, removeNode, nextId, genName, isContainer, totalComponents, getSelectedNodes } from "./utils";
import { render } from "./render";
import { renderPalette } from "./palette";
import { renderAssets, uploadAsset, addAssetToCanvas, addIconToCanvas } from "./assets";
import { setupPaletteDrag, setupCanvasDragDrop } from "./dnd";
import { setupCanvasEvents, zoomTo } from "./events";
import { applyThemeCSS, updateThemeFromUI, syncThemeUI } from "./theme";
import { generateCode, copyCode } from "./codegen";

/* ── Wire state render/save callbacks (avoids circular deps) ── */
setRenderFn(render);
setSaveFn(saveDesign);

/* ── Data that needs to be sent to the server for persistence ── */
function saveDesign() {
	const html = generateCode();
	const design = getDesignJSON();
	fetch("/api/save", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ design, html }),
	}).then((res) => {
		const status = document.getElementById("save-status");
		if (status) {
			if (res.ok) {
				status.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Saved';
				setTimeout(() => { status.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Auto'; }, 2000);
			} else status.innerHTML = "⚠ Failed";
		}
	}).catch(() => {
		const el = document.getElementById("save-status");
		if (el) el.innerHTML = "⚠ Failed";
	});
}

function getDesignJSON() {
	const clean = JSON.parse(JSON.stringify(S.tree));
	(function walk(n: any) { delete n._hidden; delete n._locked; for (const c of n.children || []) walk(c); })(clean);
	return { tree: clean, theme: S.theme, masters: S.masters, comments: S.comments, snapshots: S.snapshots, nodeNames: S.nodeNames, nodeNameCounts: S.nodeNameCounts, nextId: S.nextId, assets: S.assets };
}

function exportDesign() {
	saveDesign();
	toast("Exported to .ui-design/");
}

/* ── Action functions ── */
function addComponent(type: string) {
	const def = COMPONENTS[type];
	if (!def) return;
	const id = nextId();
	const node: any = { id, type, props: { ...def.props }, children: [] };
	S.nodeNames[id] = genName(type, COMPONENTS as any);
	const sel = S.selectedIds.size === 1 ? findNode(S.tree, [...S.selectedIds][0]) : null;
	if (sel && isContainer(sel.type)) { sel.children = sel.children || []; sel.children.push(node); }
	else S.tree.children.push(node);
	S.selectedIds = new Set([id]);
	render();
	scheduleSave();
	pushHistory();
}

function selectComponent(id: string) {
	if ((window as any)._shiftHeld) {
		if (S.selectedIds.has(id)) S.selectedIds.delete(id);
		else S.selectedIds.add(id);
	} else S.selectedIds = new Set([id]);
	render();
}

function deleteComponent(id: string) {
	if (id === "root") return;
	removeNode(S.tree, id);
	S.selectedIds.delete(id);
	if (S.selectedIds.size === 0 && S.tree.children.length > 0)
		S.selectedIds.add(S.tree.children[S.tree.children.length - 1].id);
	render();
	scheduleSave();
	pushHistory();
}

function duplicateComponent(id: string) {
	const node = findNode(S.tree, id);
	if (!node || node.type === "root") return;
	const parent = findParent(S.tree, id);
	if (!parent) return;
	const copy = JSON.parse(JSON.stringify(node));
	copy.id = nextId();
	(function walk(n: any) { S.nodeNames[n.id] = genName(n.type, COMPONENTS as any); for (const c of n.children || []) walk(c); })(copy);
	const idx = parent.children.findIndex((c) => c.id === id);
	parent.children.splice(idx + 1, 0, copy);
	S.selectedIds = new Set([copy.id]);
	render();
	scheduleSave();
	pushHistory();
	toast("Duplicated");
}

function toggleLayer(id: string) { selectComponent(id); }
function toggleVisibility(id: string) {
	const node = findNode(S.tree, id);
	if (node) { node._hidden = !node._hidden; render(); scheduleSave(); }
}
function toggleLock(id: string) {
	const node = findNode(S.tree, id);
	if (node) { node._locked = !node._locked; render(); scheduleSave(); }
}
function addChild(parentId: string) {
	const parent = findNode(S.tree, parentId);
	if (!parent) return;
	S.selectedIds = new Set([parentId]);
	render();
	const input = document.getElementById("palette-search") as HTMLInputElement | null;
	if (input) input.focus();
	toast("Click a palette item to add");
}
function updateProp(id: string, key: string, value: any) {
	const c = findNode(S.tree, id);
	if (!c) return;
	c.props[key] = value;
	render();
	scheduleSave();
}
function clearAll() {
	if (totalComponents(S.tree) === 0) return;
	S.tree.children = [];
	S.selectedIds.clear();
	render();
	scheduleSave();
}
function setTool(t: string) {
	S.tool = t;
	document.querySelectorAll(".tb-btn[data-tool]").forEach((b) => b.classList.toggle("active", (b as HTMLElement).dataset.tool === t));
	const container = document.getElementById("canvas-container");
	if (container) container.classList.toggle("hand-tool", t === "hand");
}

/* ── Inline text editing ── */
let _editInfo: { id: string; origText: string } | null = null;
function startEdit(id: string) {
	const node = findNode(S.tree, id);
	if (!node || !["heading", "paragraph", "link", "blockquote", "inlineCode"].includes(node.type)) return;
	const el = document.querySelector(`.canvas-component[data-id="${id}"] .canvas-component-body`) as HTMLElement | null;
	if (!el) return;
	const txtEl = el.querySelector(".cp-heading, .cp-paragraph, .cp-link, .cp-blockquote") as HTMLElement | null;
	if (!txtEl) return;
	_editInfo = { id, origText: String(node.props.text || "") };
	txtEl.contentEditable = "true";
	txtEl.focus();
	const range = document.createRange();
	range.selectNodeContents(txtEl);
	const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
	txtEl.addEventListener("blur", (e) => {
		const t = e.target as HTMLElement;
		t.contentEditable = "false";
		if (_editInfo) {
			const text = t.textContent?.trim();
			if (text && text !== _editInfo.origText) { updateProp(_editInfo.id, "text", text); pushHistory(); }
			_editInfo = null;
		}
	});
	txtEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); txtEl.blur(); } });
}

/* ── Master/Instance ── */
function createMaster(id: string) {
	const node = findNode(S.tree, id);
	if (!node) return;
	const masterId = "m" + Date.now();
	S.masters[masterId] = { id: masterId, type: node.type, props: JSON.parse(JSON.stringify(node.props)), children: JSON.parse(JSON.stringify(node.children || [])) };
	node._masterId = masterId;
	node._masterName = S.nodeNames[node.id];
	render(); scheduleSave(); pushHistory(); toast("Master created");
}
function createInstance(masterId: string) {
	const master = S.masters[masterId];
	if (!master) return;
	const id = nextId();
	const node: any = { id, type: master.type, props: JSON.parse(JSON.stringify(master.props)), children: JSON.parse(JSON.stringify(master.children || [])), _masterId: masterId, _masterName: master.type };
	S.nodeNames[id] = genName(master.type, COMPONENTS as any);
	S.tree.children.push(node);
	S.selectedIds = new Set([id]);
	render(); scheduleSave(); pushHistory(); toast("Instance created");
}
function detachInstance(id: string) {
	const node = findNode(S.tree, id);
	if (!node) return;
	delete node._masterId; delete node._masterName;
	render(); scheduleSave(); pushHistory();
}

/* ── Comments ── */
function addComment(text: string) {
	if (!text.trim()) return;
	const compId = S.selectedIds.size === 1 ? [...S.selectedIds][0] : "root";
	S.comments.push({ id: "cmt" + Date.now(), compId, text: text.trim(), author: "User", resolved: false, createdAt: Date.now() });
	render(); scheduleSave();
}
function resolveComment(id: string) {
	const c = S.comments.find((c) => c.id === id);
	if (c) c.resolved = !c.resolved;
	render(); scheduleSave();
}
function deleteComment(id: string) {
	S.comments = S.comments.filter((c) => c.id !== id);
	render(); scheduleSave();
}

/* ── Snapshots ── */
function saveSnapshot() {
	const id = "snap" + Date.now();
	S.snapshots.push({ id, tree: JSON.parse(JSON.stringify(S.tree)), theme: JSON.parse(JSON.stringify(S.theme)), timestamp: Date.now() });
	if (S.snapshots.length > 20) S.snapshots.shift();
	scheduleSave(); toast("Snapshot saved");
}
function restoreSnapshot(id: string) {
	const snap = S.snapshots.find((s) => s.id === id);
	if (!snap) return;
	S.tree = JSON.parse(JSON.stringify(snap.tree));
	S.theme = JSON.parse(JSON.stringify(snap.theme));
	S.selectedIds.clear();
	syncThemeUI();
	render(); scheduleSave(); pushHistory(); closeSnapshots(); toast("Snapshot restored");
}
function openSnapshots() {
	const modal = document.getElementById("snapshots-modal") as HTMLElement | null;
	if (!modal) return;
	modal.style.display = "flex";
	const list = document.getElementById("snapshots-list") as HTMLElement | null;
	if (!list) return;
	if (S.snapshots.length === 0) { list.innerHTML = '<p class="muted">No snapshots yet</p>'; return; }
	list.innerHTML = S.snapshots.slice().reverse().map((s) =>
		`<div class="snap-item"><div><div class="snap-name">Snapshot ${new Date(s.timestamp).toLocaleString()}</div><div class="snap-date">${totalComponents(s.tree) - 1} components</div></div><button class="btn-sm" onclick="window.UI.restoreSnapshot('${s.id}')">Restore</button></div>`
	).join("");
}
function closeSnapshots() {
	const modal = document.getElementById("snapshots-modal");
	if (modal) modal.style.display = "none";
}

/* ── Tab switching ── */
function switchTab(panelId: string) {
	document.querySelectorAll(".sb-panel").forEach((p) => p.classList.remove("active"));
	document.querySelectorAll(".sb-tab").forEach((t) => t.classList.remove("active"));
	const panel = document.getElementById("panel-" + panelId);
	const tab = document.querySelector(`.sb-tab[data-panel="${panelId}"]`);
	if (panel) panel.classList.add("active");
	if (tab) tab.classList.add("active");
	if (panelId === "code-output-panel") { render(); showPreview(); }
}

/* ── Toggle code panel ── */
let _codeVisible = false;
function toggleCode() {
	_codeVisible = !_codeVisible;
	const panel = document.getElementById("panel-code-output-panel");
	const tab = document.querySelector('.sb-tab[data-panel="code-output-panel"]');
	if (panel) { panel.classList.toggle("active", _codeVisible); if (_codeVisible) { render(); showPreview(); } }
	if (tab) tab.classList.toggle("active", _codeVisible);
}

function showPreview() {
	const container = document.getElementById("preview-frame-container");
	const frame = document.getElementById("preview-frame") as HTMLIFrameElement | null;
	if (!container || !frame) return;
	container.style.display = "block";
	const code = generateCode();
	const t = S.theme;
	frame.srcdoc = S.format === "html" ? code : `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${t.font};background:${t.dark ? "#1e1e1e" : t.bg};color:${t.dark ? "#e2e4f0" : t.text};padding:16px}</style></head><body>${code}</body></html>`;
}

function toast(msg: string) {
	const el = document.createElement("div");
	el.className = "toast";
	el.textContent = msg;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 2000);
}

function filterLayers() {
	const q = ((document.getElementById("layer-search") as HTMLInputElement)?.value || "").toLowerCase();
	document.querySelectorAll("#layers-list .layer-item").forEach((el) => {
		const name = (el.querySelector(".ll-name") as HTMLElement)?.textContent?.toLowerCase() || "";
		(el as HTMLElement).style.display = name.includes(q) ? "" : "none";
	});
}

/* ═══ Expose public API on window.UI ═══ */
(window as any).UI = {
	addComponent,
	selectComponent,
	deleteComponent,
	duplicateComponent,
	updateProp,
	addChild,
	toggleLayer,
	toggleVisibility,
	toggleLock,
	clearAll,
	undo,
	redo,
	zoomTo,
	tool: setTool,
	startEdit,
	createMaster,
	createInstance,
	detachInstance,
	addComment,
	resolveComment,
	deleteComment,
	saveSnapshot,
	openSnapshots,
	closeSnapshots,
	restoreSnapshot,
	toggleCode,
	switchTab,
	export: exportDesign,
	copyCode,
	toast,
	renderAssets,
	uploadAsset,
	addAssetToCanvas,
	addIconToCanvas,
	render: () => render(),
	state: S,
};

/* ═══ Initialize on DOM ready ═══ */
document.addEventListener("DOMContentLoaded", () => {
	applyThemeCSS();

	// Bind UI events
	document.getElementById("palette-search")?.addEventListener("input", renderPalette);
	document.getElementById("layer-search")?.addEventListener("input", filterLayers);
	document.getElementById("btn-clear")?.addEventListener("click", clearAll);
	document.getElementById("btn-export")?.addEventListener("click", exportDesign);
	document.getElementById("btn-undo")?.addEventListener("click", undo);
	document.getElementById("btn-redo")?.addEventListener("click", redo);
	document.getElementById("btn-duplicate")?.addEventListener("click", () => {
		if (S.selectedIds.size === 1) duplicateComponent([...S.selectedIds][0]);
		else toast("Select one component to duplicate");
	});
	document.getElementById("btn-copy")?.addEventListener("click", copyCode);
	document.getElementById("btn-snapshots")?.addEventListener("click", openSnapshots);

	// Sidebar tabs
	document.querySelectorAll(".sb-tab").forEach((tab) => {
		tab.addEventListener("click", () => {
			switchTab((tab as HTMLElement).dataset.panel!);
			if ((tab as HTMLElement).dataset.panel === "assets") renderAssets();
		});
	});

	// Comment input
	document.getElementById("comment-input")?.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			const input = e.target as HTMLInputElement;
			addComment(input.value);
			input.value = "";
		}
	});

	// Format & style mode
	document.getElementById("code-format")?.addEventListener("change", (e: Event) => {
		S.format = (e.target as HTMLSelectElement).value;
		render();
	});
	document.getElementById("code-style")?.addEventListener("change", (e: Event) => {
		S.styleMode = (e.target as HTMLSelectElement).value;
		render();
	});

	// Theme inputs
	["theme-primary", "theme-bg", "theme-text", "theme-spacing", "theme-radius", "theme-font", "theme-dark"].forEach((id) => {
		const el = document.getElementById(id);
		if (el) { el.addEventListener("input", updateThemeFromUI); el.addEventListener("change", updateThemeFromUI); }
	});

	// DnD
	setupPaletteDrag();
	setupCanvasEvents();
	setupCanvasDragDrop();

	// Render palette
	renderPalette();

	// Keyboard shortcuts
	document.addEventListener("keydown", (e: KeyboardEvent) => {
		(window as any)._shiftHeld = e.shiftKey;
		if ((e.ctrlKey || e.metaKey) && e.key === "z") { if (e.shiftKey) redo(); else undo(); e.preventDefault(); }
		if ((e.ctrlKey || e.metaKey) && e.key === "d") { if (S.selectedIds.size === 1) duplicateComponent([...S.selectedIds][0]); e.preventDefault(); }
		if ((e.ctrlKey || e.metaKey) && e.key === "g") {
			if (e.shiftKey) {
				const nodes = getSelectedNodes(S.tree, S.selectedIds);
				nodes.forEach((node: any) => {
					if (!isContainer(node.type) || !node.children?.length) return;
					const parent = findParent(S.tree, node.id);
					if (!parent) return;
					const idx = parent.children.indexOf(node);
					parent.children.splice(idx, 1, ...node.children);
				});
			} else if (S.selectedIds.size > 1) {
				const selIds = [...S.selectedIds];
				const parent = findParent(S.tree, selIds[0]);
				if (!parent) return;
				const groupId = nextId();
				const nodes = selIds.map((id) => { const idx = parent.children.findIndex((c) => c.id === id); return idx !== -1 ? parent.children.splice(idx, 1)[0] : null; }).filter(Boolean);
				const group: any = { id: groupId, type: "container", props: {}, children: nodes };
				S.nodeNames[groupId] = "Group";
				parent.children.push(group);
				S.selectedIds = new Set([groupId]);
			}
			render(); scheduleSave(); pushHistory();
			e.preventDefault();
		}
		if (e.key === "Delete" || e.key === "Backspace") {
			if (S.selectedIds.size > 0 && !(e.target as HTMLElement).closest("input,textarea,select")) {
				[...S.selectedIds].forEach((id) => deleteComponent(id));
				e.preventDefault();
			}
		}
		if (e.key === "Escape") { S.selectedIds.clear(); render(); }
		if (!(e.target as HTMLElement).closest("input,textarea,select")) {
			if (e.key === "v") setTool("select");
			if (e.key === "h") setTool("hand");
			if (e.key === "f") setTool("frame");
			if (e.key === "t") setTool("text");
			if (e.key === "r") setTool("rect");
			if (e.key === "o") setTool("ellipse");
			if (e.key === "l") setTool("line");
			if (e.key === "+" || e.key === "=") { zoomTo(1); e.preventDefault(); }
			if (e.key === "-") { zoomTo(-1); e.preventDefault(); }
			if (e.key === "0") { zoomTo(0); e.preventDefault(); }
			if (e.key === "1") { zoomTo(1); e.preventDefault(); }
		}
	});

	document.addEventListener("keyup", (e: KeyboardEvent) => { if (e.key === "Shift") (window as any)._shiftHeld = false; });

	// Load saved state
	fetch("/api/state").then((r) => r.json()).then((data: any) => {
		if (data.tree?.children?.length > 0) {
			S.tree = data.tree;
			let maxId = 0;
			S.nodeNames = {}; S.nodeNameCounts = {};
			(function walk(node: any) {
				if (node.id?.startsWith("c")) { maxId = Math.max(maxId, parseInt(node.id.slice(1)) || 0); if (!S.nodeNames[node.id]) S.nodeNames[node.id] = genName(node.type, COMPONENTS as any); }
				for (const c of node.children || []) walk(c);
			})(S.tree);
			S.nextId = maxId + 1;
		} else if (data.components?.length > 0) {
			S.tree.children = data.components.map((c: any) => ({ id: c.id, type: c.type, props: { ...c.props }, children: [] }));
			S.nextId = Math.max(...data.components.map((c: any) => parseInt(c.id.slice(1)) || 0), 0) + 1;
		}
		if (data.theme) Object.assign(S.theme, data.theme);
		if (data.masters) S.masters = data.masters;
		if (data.comments) S.comments = data.comments;
		if (data.snapshots) S.snapshots = data.snapshots;
		if (data.nodeNames) S.nodeNames = data.nodeNames;
		if (data.nodeNameCounts) S.nodeNameCounts = data.nodeNameCounts;
		if (data.assets) S.assets = data.assets;
		if (data.nextId) S.nextId = data.nextId;
		syncThemeUI();
		render();
		initHistory();
	}).catch(() => { render(); initHistory(); });
});
