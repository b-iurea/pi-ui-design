/* ═══ Type definitions for pi-ui-design ═══ */

export interface ComponentProps {
	[key: string]: any;
	padding?: boolean | string;
	gap?: string;
	justify?: string;
	align?: string;
	cols?: number;
	text?: string;
	label?: string;
	placeholder?: string;
	src?: string;
	href?: string;
	alt?: string;
	w?: number | string;
	h?: number | string;
	width?: string;
	height?: string;
	color?: string;
	bg?: string;
	fill?: string;
	display?: string;
	checked?: boolean;
	on?: boolean;
	value?: string | number;
	min?: number;
	max?: number;
	level?: string;
	variant?: string;
	active?: string;
	current?: string | number;
	total?: number;
	options?: string;
	items?: string;
	rows?: string;
	headers?: string;
	features?: string;
	plan?: string;
	price?: string;
	period?: string;
	cta?: string;
	featured?: boolean;
	brand?: string;
	trigger?: string;
	title?: string;
	subtitle?: string;
	body?: string;
	cancel?: string;
	confirm?: string;
	header?: string;
	footer?: string;
	author?: string;
	role?: string;
	quote?: string;
	symbol?: string;
	size?: string;
	initials?: string;
	name?: string;
	text2?: string;
	lines?: number;
	vertical?: boolean;
	selected?: string;
}

export interface ComponentNode {
	id: string;
	type: string;
	props: ComponentProps;
	children: ComponentNode[];
	_hidden?: boolean;
	_locked?: boolean;
	_masterId?: string;
	_masterName?: string;
}

export interface Theme {
	primary: string;
	secondary: string;
	bg: string;
	text: string;
	spacing: string;
	radius: string;
	font: string;
	dark: boolean;
}

export interface ComponentDef {
	cat: string;
	label: string;
	icon: string;
	props: ComponentProps;
}

export interface Master {
	id: string;
	type: string;
	props: ComponentProps;
	children: ComponentNode[];
}

export interface Comment {
	id: string;
	compId: string;
	text: string;
	author: string;
	resolved: boolean;
	createdAt: number;
}

export interface Snapshot {
	id: string;
	tree: ComponentNode;
	theme: Theme;
	timestamp: number;
}

export interface Asset {
	id: string;
	name: string;
	dataUrl: string;
	type: string;
}

export interface BuiltinIcon {
	name: string;
	svg: string;
}

export interface HistoryEntry {
	tree: ComponentNode;
	selectedIds: string[];
	nodeNames: Record<string, string>;
}

export interface DragInfo {
	source: "canvas" | "palette" | "asset" | "icon";
	id?: string;
	type?: string;
	assetId?: string;
	iconName?: string;
	isDragging: boolean;
	dropParentId?: string | null;
}

export interface ResizeInfo {
	id: string;
	dir: string;
	startX: number;
	startY: number;
	startW: number;
	startH: number;
}

export interface EditInfo {
	id: string;
	origText: string;
}

export interface State {
	tree: ComponentNode;
	selectedIds: Set<string>;
	nextId: number;
	theme: Theme;
	format: string;
	styleMode: string;
	zoom: number;
	panX: number;
	panY: number;
	tool: string;
	masters: Record<string, Master>;
	comments: Comment[];
	snapshots: Snapshot[];
	clipboard: null | any;
	assets: Asset[];
	nodeNames: Record<string, string>;
	nodeNameCounts: Record<string, number>;
}
