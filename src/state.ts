/* ═══ Global state ═══ */

import type { State, ComponentNode } from "./types";
import { setNodeNameCounts } from "./utils";

export function createDefaultState(): State {
	return {
		tree: { id: "root", type: "root", props: {}, children: [] },
		selectedIds: new Set<string>(),
		nextId: 1,
		theme: {
			primary: "#0d99ff",
			secondary: "#7c3aed",
			bg: "#1e1e1e",
			text: "#ffffff",
			spacing: "normal",
			radius: "md",
			font: "Inter, sans-serif",
			dark: true,
		},
		format: "html",
		styleMode: "inline",
		zoom: 1,
		panX: 0,
		panY: 0,
		tool: "select",
		masters: {},
		comments: [],
		snapshots: [],
		clipboard: null,
		assets: [],
		nodeNames: {},
		nodeNameCounts: {},
	};
}

export const S: State = createDefaultState();

let _history: { tree: ComponentNode; selectedIds: string[]; nodeNames: Record<string, string> }[] = [];
let _historyPtr = -1;
const MAX_HISTORY = 50;

export function getHistory() {
	return _history;
}

export function getHistoryPtr() {
	return _historyPtr;
}

export function pushHistory(): void {
	_history.length = _historyPtr + 1;
	_history.push({
		tree: JSON.parse(JSON.stringify(S.tree)),
		selectedIds: [...S.selectedIds],
		nodeNames: { ...S.nodeNames },
	});
	_historyPtr = _history.length - 1;
	if (_history.length > MAX_HISTORY) {
		_history.shift();
		_historyPtr--;
	}
	updateUndoBtns();
}

function applyHistory(): void {
	const h = _history[_historyPtr];
	S.tree = JSON.parse(JSON.stringify(h.tree));
	S.selectedIds = new Set(h.selectedIds);
	S.nodeNames = h.nodeNames ? { ...h.nodeNames } : {};
	setNodeNameCounts({ ...S.nodeNameCounts });
	renderAll();
	scheduleSave();
}

export function initHistory(): void {
	_history = [];
	_historyPtr = -1;
	pushHistory();
}

export function undo(): void {
	if (_historyPtr > 0) {
		_historyPtr--;
		applyHistory();
	}
}

export function redo(): void {
	if (_historyPtr < _history.length - 1) {
		_historyPtr++;
		applyHistory();
	}
}

function updateUndoBtns(): void {
	const u = document.getElementById("btn-undo"),
		r = document.getElementById("btn-redo");
	if (u) (u as HTMLButtonElement).disabled = _historyPtr <= 0;
	if (r) (r as HTMLButtonElement).disabled = _historyPtr >= _history.length - 1;
}

// Imported from other modules (set externally to avoid circular deps)
let _renderFn: (() => void) | null = null;
let _saveFn: (() => void) | null = null;

export function setRenderFn(fn: () => void) {
	_renderFn = fn;
}

export function setSaveFn(fn: () => void) {
	_saveFn = fn;
}

function renderAll() {
	if (_renderFn) _renderFn();
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
	if (_saveTimer) clearTimeout(_saveTimer);
	_saveTimer = setTimeout(() => {
		if (_saveFn) _saveFn();
	}, 500);
}

export function restoreHistoryOnLoad(
	tree: ComponentNode,
	selectedIds: string[],
	nodeNames: Record<string, string>,
): void {
	_history = [{ tree: JSON.parse(JSON.stringify(tree)), selectedIds, nodeNames: { ...nodeNames } }];
	_historyPtr = 0;
	updateUndoBtns();
}
