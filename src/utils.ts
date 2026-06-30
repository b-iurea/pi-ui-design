/* ═══ Utility functions ═══ */

export function esc(s: unknown): string {
	return String(s || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

let _nextIdCounter = 1;
let _nodeNameCounts: Record<string, number> = {};

export function setNodeNameCounts(counts: Record<string, number>) {
	_nodeNameCounts = counts;
}

export function getNodeNameCounts(): Record<string, number> {
	return _nodeNameCounts;
}

export function nextId(): string {
	return "c" + _nextIdCounter++;
}

export function setNextIdCounter(n: number) {
	_nextIdCounter = n;
}

export function getNextIdCounter(): number {
	return _nextIdCounter;
}

export function genName(
	type: string,
	labels: Record<string, { label: string }>,
): string {
	const label = labels[type]?.label || type;
	_nodeNameCounts[type] = (_nodeNameCounts[type] || 0) + 1;
	return `${label} ${_nodeNameCounts[type]}`;
}

export const CONTAINER_TYPES = new Set([
	"container",
	"flexRow",
	"flexCol",
	"grid",
	"sidebar",
	"root",
	"frame",
	"wrapper",
	"stack",
	"panel",
	"section",
	"article",
]);

export const RADIUS: Record<string, string> = {
	none: "0",
	sm: "4px",
	md: "6px",
	lg: "10px",
	xl: "16px",
};

export const SPACING: Record<string, string> = {
	compact: ".5rem",
	normal: "1rem",
	spacious: "2rem",
};

export function isContainer(type: string): boolean {
	return CONTAINER_TYPES.has(type);
}

import type { ComponentNode } from "./types";

export function findNode(
	node: ComponentNode,
	id: string,
): ComponentNode | null {
	if (node.id === id) return node;
	for (const c of node.children || []) {
		const f = findNode(c, id);
		if (f) return f;
	}
	return null;
}

export function findParent(
	node: ComponentNode,
	id: string,
): ComponentNode | null {
	for (const c of node.children || []) {
		if (c.id === id) return node;
		const f = findParent(c, id);
		if (f) return f;
	}
	return null;
}

export function removeNode(node: ComponentNode, id: string): void {
	node.children = (node.children || []).filter((c) => {
		if (c.id === id) return false;
		removeNode(c, id);
		return true;
	});
}

export function countNodes(node: ComponentNode): number {
	return 1 + (node.children || []).reduce((s, c) => s + countNodes(c), 0);
}

export function getSelectedNodes(
	tree: ComponentNode,
	selectedIds: Set<string>,
): ComponentNode[] {
	return [...selectedIds]
		.map((id) => findNode(tree, id))
		.filter(Boolean) as ComponentNode[];
}

export function totalComponents(tree: ComponentNode): number {
	return countNodes(tree) - 1;
}

export function hexToRgb(h: string): string {
	if (!h || h.length < 7) return "13,153,255";
	const r = parseInt(h.slice(1, 3), 16);
	const g = parseInt(h.slice(3, 5), 16);
	const b = parseInt(h.slice(5, 7), 16);
	return isNaN(r) ? "13,153,255" : `${r},${g},${b}`;
}
