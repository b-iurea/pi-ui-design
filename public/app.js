/* ════════════════════════════════════════════════════════
   pi-ui-design — Figma-like Design Tool
   IIFE namespace: UI.* for public API
   ════════════════════════════════════════════════════════ */
const UI = (() => {
	/* ═══ STATE ═══ */
	const S = {
		tree: { id: "root", type: "root", children: [] },
		selectedIds: new Set(),
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
		masters: {}, // masterId -> { id, type, props }
		comments: [], // { id, compId, text, author, resolved, createdAt }
		snapshots: [], // { id, tree, theme, timestamp }
		clipboard: null,
		assets: [], // { id, name, dataUrl, type }
		nodeNames: {},
		nodeNameCounts: {},
	};
	let _saveTimer = null,
		_history = [],
		_historyPtr = -1;
	const MAX_HISTORY = 50;
	const RADIUS = { none: "0", sm: "4px", md: "6px", lg: "10px", xl: "16px" };
	const SPACING = { compact: ".5rem", normal: "1rem", spacious: "2rem" };
	const CONTAINER_TYPES = new Set([
		"container",
		"flexRow",
		"flexCol",
		"grid",
		"sidebar",
		"root",
		"frame",
	]);
	let _isPanning = false,
		_panStart = null,
		_isMarquee = false,
		_marqueeStart = null;
	let _dragInfo = null,
		_resizeInfo = null,
		_editInfo = null;
	// ponytail: snap guides rendered inline, no persistent state needed
	// const _snapGuides = { h: [], v: [] };

	/* ═══ TREE HELPERS ═══ */
	function findNode(node, id) {
		if (node.id === id) return node;
		for (const c of node.children || []) {
			const f = findNode(c, id);
			if (f) return f;
		}
		return null;
	}
	function findParent(node, id) {
		for (const c of node.children || []) {
			if (c.id === id) return node;
			const f = findParent(c, id);
			if (f) return f;
		}
		return null;
	}
	function removeNode(node, id) {
		node.children = (node.children || []).filter((c) => {
			if (c.id === id) return false;
			removeNode(c, id);
			return true;
		});
	}
	function countNodes(node) {
		return 1 + (node.children || []).reduce((s, c) => s + countNodes(c), 0);
	}
	function totalComponents() {
		return countNodes(S.tree) - 1;
	}
	function genName(type) {
		const label = COMPONENTS[type]?.label || type;
		S.nodeNameCounts[type] = (S.nodeNameCounts[type] || 0) + 1;
		return `${label} ${S.nodeNameCounts[type]}`;
	}
	function getSelectedNodes() {
		return [...S.selectedIds].map((id) => findNode(S.tree, id)).filter(Boolean);
	}
	function isContainer(type) {
		return CONTAINER_TYPES.has(type);
	}
	function esc(s) {
		return String(s || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}
	function nextId() {
		return "c" + S.nextId++;
	}

	/* ═══ HISTORY ═══ */
	function pushHistory() {
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
	function applyHistory() {
		const h = _history[_historyPtr];
		S.tree = JSON.parse(JSON.stringify(h.tree));
		S.selectedIds = new Set(h.selectedIds);
		S.nodeNames = h.nodeNames ? { ...h.nodeNames } : {};
		render();
		scheduleSave();
	}
	function undo() {
		if (_historyPtr > 0) {
			_historyPtr--;
			applyHistory();
		}
	}
	function redo() {
		if (_historyPtr < _history.length - 1) {
			_historyPtr++;
			applyHistory();
		}
	}
	function updateUndoBtns() {
		const u = document.getElementById("btn-undo"),
			r = document.getElementById("btn-redo");
		if (u) u.disabled = _historyPtr <= 0;
		if (r) r.disabled = _historyPtr >= _history.length - 1;
	}

	/* ═══ COMPONENT DEFINITIONS ═══ (same 45+ types as before) */
	const COMPONENTS = {
		container: {
			cat: "Layout",
			label: "Container",
			icon: "<i class='fa-regular fa-square'></i>",
			props: { padding: true },
		},
		flexRow: {
			cat: "Layout",
			label: "Flex Row",
			icon: "<i class='fa-regular fa-arrows-left-right'></i>",
			props: { gap: "16px", justify: "start", align: "center" },
		},
		flexCol: {
			cat: "Layout",
			label: "Flex Col",
			icon: "<i class='fa-regular fa-arrows-up-down'></i>",
			props: { gap: "12px", align: "stretch" },
		},
		grid: {
			cat: "Layout",
			label: "Grid",
			icon: "<i class='fa-regular fa-table-cells'></i>",
			props: { cols: 3, gap: "16px" },
		},
		divider: {
			cat: "Layout",
			label: "Divider",
			icon: "<i class='fa-regular fa-minus'></i>",
			props: { text: "Section", vertical: false },
		},
		spacer: {
			cat: "Layout",
			label: "Spacer",
			icon: "<i class='fa-regular fa-up-down'></i>",
			props: { height: "24px" },
		},
		sidebar: {
			cat: "Layout",
			label: "Sidebar",
			icon: "<i class='fa-regular fa-tv'></i>",
			props: { items: "Dashboard,Analytics,Settings", active: "Dashboard" },
		},
		frame: {
			cat: "Layout",
			label: "Frame",
			icon: "<i class='fa-regular fa-crop'></i>",
			props: { w: 400, h: 300, fill: "transparent" },
		},
		heading: {
			cat: "Typography",
			label: "Heading",
			icon: "<i class='fa-regular fa-heading'></i>",
			props: { level: "h2", text: "Heading Text" },
		},
		paragraph: {
			cat: "Typography",
			label: "Paragraph",
			icon: "<i class='fa-regular fa-paragraph'></i>",
			props: { text: "Paragraph text. Double-click to edit." },
		},
		link: {
			cat: "Typography",
			label: "Link",
			icon: "<i class='fa-regular fa-link'></i>",
			props: { text: "Click here", href: "#" },
		},
		blockquote: {
			cat: "Typography",
			label: "Blockquote",
			icon: "<i class='fa-regular fa-quote-left'></i>",
			props: { text: "A notable quote." },
		},
		inlineCode: {
			cat: "Typography",
			label: "Inline Code",
			icon: "<i class='fa-regular fa-code'></i>",
			props: { text: "npm install" },
		},
		btnPrimary: {
			cat: "Buttons",
			label: "Primary Btn",
			icon: "<i class='fa-regular fa-rectangle-ad'></i>",
			props: { text: "Get Started" },
		},
		btnSecondary: {
			cat: "Buttons",
			label: "Secondary Btn",
			icon: "<i class='fa-regular fa-rectangle-ad'></i>",
			props: { text: "Learn More" },
		},
		btnOutline: {
			cat: "Buttons",
			label: "Outline Btn",
			icon: "<i class='fa-regular fa-rectangle-ad'></i>",
			props: { text: "Cancel" },
		},
		btnGhost: {
			cat: "Buttons",
			label: "Ghost Btn",
			icon: "<i class='fa-regular fa-rectangle-ad'></i>",
			props: { text: "Dismiss" },
		},
		btnGroup: {
			cat: "Buttons",
			label: "Button Group",
			icon: "<i class='fa-regular fa-union'></i>",
			props: { items: "Left,Center,Right", active: "Center" },
		},
		input: {
			cat: "Forms",
			label: "Input",
			icon: "<i class='fa-regular fa-keyboard'></i>",
			props: { placeholder: "Enter text...", label: "Name" },
		},
		textarea: {
			cat: "Forms",
			label: "Textarea",
			icon: "<i class='fa-regular fa-rectangle-history'></i>",
			props: { placeholder: "Enter details...", label: "Message" },
		},
		select: {
			cat: "Forms",
			label: "Select",
			icon: "<i class='fa-regular fa-caret-down'></i>",
			props: { label: "Choose", options: "Option 1,Option 2,Option 3" },
		},
		checkbox: {
			cat: "Forms",
			label: "Checkbox",
			icon: "<i class='fa-regular fa-square-check'></i>",
			props: { label: "Accept terms", checked: false },
		},
		radioGroup: {
			cat: "Forms",
			label: "Radio Group",
			icon: "<i class='fa-regular fa-circle-dot'></i>",
			props: { label: "Plan", options: "Free,Pro,Enterprise", selected: "Pro" },
		},
		toggle: {
			cat: "Forms",
			label: "Toggle",
			icon: "<i class='fa-regular fa-toggle-on'></i>",
			props: { label: "Notifications", on: true },
		},
		rangeSlider: {
			cat: "Forms",
			label: "Range",
			icon: "<i class='fa-regular fa-sliders'></i>",
			props: { label: "Volume", value: 60, min: 0, max: 100 },
		},
		image: {
			cat: "Media",
			label: "Image",
			icon: "<i class='fa-regular fa-image'></i>",
			props: { alt: "Placeholder", width: "100%", height: "120px" },
		},
		avatar: {
			cat: "Media",
			label: "Avatar",
			icon: "<i class='fa-regular fa-user'></i>",
			props: { initials: "JD", name: "Jane Doe", role: "Designer" },
		},
		icon: {
			cat: "Media",
			label: "Icon",
			icon: "<i class='fa-regular fa-star'></i>",
			props: { symbol: "★", size: "24px" },
		},
		navbar: {
			cat: "Navigation",
			label: "Navbar",
			icon: "<i class='fa-regular fa-bars'></i>",
			props: { brand: "Brand", items: "Home,About,Pricing,Contact" },
		},
		tabs: {
			cat: "Navigation",
			label: "Tabs",
			icon: "<i class='fa-regular fa-table-cells'></i>",
			props: { items: "Tab 1,Tab 2,Tab 3", active: "Tab 1" },
		},
		breadcrumb: {
			cat: "Navigation",
			label: "Breadcrumb",
			icon: "<i class='fa-regular fa-angles-right'></i>",
			props: { items: "Home,Products,Details", current: "Details" },
		},
		pagination: {
			cat: "Navigation",
			label: "Pagination",
			icon: "<i class='fa-regular fa-chevrons-right'></i>",
			props: { total: 5, current: 3 },
		},
		dropdown: {
			cat: "Navigation",
			label: "Dropdown",
			icon: "<i class='fa-regular fa-caret-down'></i>",
			props: { trigger: "Menu", items: "Profile,Settings,Logout" },
		},
		card: {
			cat: "Cards",
			label: "Card",
			icon: "<i class='fa-regular fa-credit-card'></i>",
			props: {
				header: "Card Title",
				body: "Card content here.",
				footer: "Footer",
			},
		},
		pricingCard: {
			cat: "Cards",
			label: "Pricing Card",
			icon: "<i class='fa-regular fa-money-bill'></i>",
			props: {
				plan: "Pro",
				price: "$29",
				period: "/mo",
				features: "Feature 1,Feature 2,Feature 3",
				cta: "Subscribe",
				featured: false,
			},
		},
		alert: {
			cat: "Feedback",
			label: "Alert",
			icon: "<i class='fa-regular fa-circle-exclamation'></i>",
			props: { variant: "info", text: "Informational message." },
		},
		badge: {
			cat: "Feedback",
			label: "Badge",
			icon: "<i class='fa-regular fa-tag'></i>",
			props: { variant: "primary", text: "New" },
		},
		progress: {
			cat: "Feedback",
			label: "Progress",
			icon: "<i class='fa-regular fa-chart-bar'></i>",
			props: { value: 65, label: "65% complete" },
		},
		spinner: {
			cat: "Feedback",
			label: "Spinner",
			icon: "<i class='fa-regular fa-spinner'></i>",
			props: { text: "Loading..." },
		},
		toast: {
			cat: "Feedback",
			label: "Toast",
			icon: "<i class='fa-regular fa-message'></i>",
			props: { text: "Saved!", variant: "success" },
		},
		skeleton: {
			cat: "Feedback",
			label: "Skeleton",
			icon: "<i class='fa-regular fa-rectangle'></i>",
			props: { lines: 3, width: "100%" },
		},
		list: {
			cat: "Data",
			label: "List",
			icon: "<i class='fa-regular fa-list'></i>",
			props: { items: "Item one,Item two,Item three" },
		},
		table: {
			cat: "Data",
			label: "Table",
			icon: "<i class='fa-regular fa-table'></i>",
			props: {
				headers: "Name,Role,Status",
				rows: "Alice,Admin,Active|Bob,User,Pending|Carol,Editor,Active",
			},
		},
		accordion: {
			cat: "Data",
			label: "Accordion",
			icon: "<i class='fa-regular fa-rectangle-vertical-history'></i>",
			props: { items: "Section 1~Content one.|Section 2~Content two." },
		},
		stats: {
			cat: "Data",
			label: "Stats",
			icon: "<i class='fa-regular fa-chart-simple'></i>",
			props: { items: "Users~2,400,Revenue~$12K,Active~89%" },
		},
		hero: {
			cat: "Sections",
			label: "Hero",
			icon: "<i class='fa-regular fa-star'></i>",
			props: {
				title: "Build Something Great",
				subtitle: "A clean platform.",
				cta: "Get Started",
			},
		},
		footer: {
			cat: "Sections",
			label: "Footer",
			icon: "<i class='fa-regular fa-shoe-prints'></i>",
			props: { text: "© 2026 Your Company" },
		},
		testimonial: {
			cat: "Sections",
			label: "Testimonial",
			icon: "<i class='fa-regular fa-comment'></i>",
			props: { quote: "Great product!", author: "Alex Chen", role: "CEO" },
		},
		modal: {
			cat: "Sections",
			label: "Modal",
			icon: "<i class='fa-regular fa-window-restore'></i>",
			props: {
				title: "Confirm",
				body: "Proceed?",
				cancel: "Cancel",
				confirm: "Confirm",
			},
		},
	};

	/* ═══ BUILT-IN SVG ICONS (for Assets library) ═══ */
	const BUILTIN_ICONS = [
		{ name: "Star", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
		{ name: "Heart", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
		{ name: "Settings", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
		{ name: "Mail", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' },
		{ name: "Bell", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
		{ name: "User", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
		{ name: "Search", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
		{ name: "Check", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
		{ name: "X", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' },
		{ name: "Menu", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' },
		{ name: "Download", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
		{ name: "Globe", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
		{ name: "Camera", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
		{ name: "Lock", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
	];

	/* ═══ RENDER PREVIEW (same logic, slightly smaller markup) ═══ */
	function renderPreview(type, p, ch) {
		const t = S.theme,
			r = RADIUS[t.radius] || "6px",
			s = SPACING[t.spacing] || "1rem";
		if (type === "root") return ch || "";
		if (type === "container")
			return `<div class="cp-container" style="padding:${s};border-radius:${r}"><div style="font-size:9px;color:var(--text-muted);opacity:.5;margin-bottom:4px">▣ Container</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">drop here</span>'}</div>`;
		if (type === "flexRow")
			return `<div class="cp-flex row" style="gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⇉ flex row</span>'}</div>`;
		if (type === "flexCol")
			return `<div class="cp-flex col" style="gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⇊ flex col</span>'}</div>`;
		if (type === "grid")
			return `<div class="cp-grid" style="grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⊞ grid</span>'}</div>`;
		if (type === "frame")
			return `<div style="width:${p.w}px;height:${p.h}px;background:${p.fill};border:1px solid var(--border);border-radius:${r};position:relative;padding:8px;overflow:hidden"><div style="font-size:8px;color:var(--text-muted);opacity:.4;position:absolute;top:2px;left:4px">Frame</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">frame content</span>'}</div>`;
		if (type === "sidebar")
			return `<div class="cp-sidebar" style="border-radius:${r}"><div class="side">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<span class="item${i.trim() === p.active ? " active" : ""}">${i.trim()}</span>`,
				)
				.join(
					"",
				)}</div><div class="main" style="padding:${s}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">main</span>'}</div></div>`;
		switch (type) {
			case "divider":
				return p.vertical
					? `<div class="cp-divider vertical" style="height:40px"><hr></div>`
					: `<div class="cp-divider"><hr><span>${esc(p.text)}</span><hr></div>`;
			case "spacer":
				return `<div style="height:${p.height};background:repeating-linear-gradient(90deg,var(--border),var(--border) 3px,transparent 3px,transparent 6px);border-radius:2px"></div>`;
			case "heading":
				return `<div class="cp-heading ${p.level}" style="color:${t.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.text)}</div>`;
			case "paragraph":
				return `<div class="cp-paragraph">${esc(p.text)}</div>`;
			case "link":
				return `<span class="cp-link">${esc(p.text)}</span>`;
			case "blockquote":
				return `<div class="cp-blockquote">${esc(p.text)}</div>`;
			case "inlineCode":
				return `<code style="background:var(--bg3);padding:1px 5px;border-radius:3px;font-size:11px">${esc(p.text)}</code>`;
			case "btnPrimary":
				return `<button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
			case "btnSecondary":
				return `<button class="cp-btn secondary" style="background:${t.secondary};border-radius:${r}">${esc(p.text)}</button>`;
			case "btnOutline":
				return `<button class="cp-btn outline" style="border-color:${t.primary};color:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
			case "btnGhost":
				return `<button style="padding:6px 16px;border-radius:${r};font-size:13px;font-weight:500;border:none;background:transparent;color:var(--text2)">${esc(p.text)}</button>`;
			case "btnGroup":
				return `<div style="display:inline-flex;border:1px solid var(--border);border-radius:${r};overflow:hidden">${(
					p.items || ""
				)
					.split(",")
					.map(
						(i, idx) =>
							`<span style="padding:5px 12px;font-size:11px;${idx < ((p.items || "").split(",").length - 1) ? "border-right:1px solid var(--border)" : ""};${i.trim() === p.active ? "background:var(--accent);color:#fff" : ""}">${i.trim()}</span>`,
					)
					.join("")}</div>`;
			case "input":
				return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><input class="cp-input" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></div>`;
			case "textarea":
				return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><textarea class="cp-textarea" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></textarea></div>`;
			case "select":
				return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><select class="cp-select" style="border-radius:${r}">${(
					p.options || ""
				)
					.split(",")
					.map((o) => `<option>${o.trim()}</option>`)
					.join("")}</select></div>`;
			case "checkbox":
				return `<label class="cp-checkbox"><input type="checkbox" ${p.checked ? "checked" : ""}> ${esc(p.label)}</label>`;
			case "radioGroup":
				return `<div class="cp-radio-group"><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div>${(
					p.options || ""
				)
					.split(",")
					.map(
						(o) =>
							`<label><input type="radio" name="rg" ${o.trim() === p.selected ? "checked" : ""}> ${o.trim()}</label>`,
					)
					.join("")}</div>`;
			case "toggle":
				return `<div class="cp-toggle"><div class="track ${p.on ? "on" : ""}"><div class="thumb"></div></div><span>${esc(p.label)}</span></div>`;
			case "rangeSlider":
				return `<div style="display:flex;flex-direction:column;gap:3px"><div style="font-size:10px;color:var(--text-muted)">${esc(p.label)}</div><input type="range" min="${p.min}" max="${p.max}" value="${p.value}" style="accent-color:${t.primary};width:100%"><span style="font-size:10px;color:var(--text-muted)">${p.value}%</span></div>`;
			case "image":
				if (p.src) return `<div class="cp-image" style="width:${p.width};height:${p.height};border-radius:${r};overflow:hidden;background:var(--bg)"><img src="${p.src}" alt="${esc(p.alt)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
				return `<div class="cp-image" style="width:${p.width};height:${p.height};border-radius:${r}">🖼 ${esc(p.alt)}</div>`;
			case "avatar":
				return `<div class="cp-avatar"><div class="circle">${esc(p.initials)}</div><div class="info"><div class="name">${esc(p.name)}</div><div class="sub">${esc(p.role)}</div></div></div>`;
			case "icon":
				return `<div class="cp-icon" style="font-size:${p.size};color:${t.primary}">${p.symbol}</div>`;
			case "navbar":
				return `<nav class="cp-navbar" style="border-radius:${r}"><span class="brand" style="color:${t.primary}">${esc(p.brand)}</span>${(
					p.items || ""
				)
					.split(",")
					.map((i) => `<span class="nav-item">${i.trim()}</span>`)
					.join("")}</nav>`;
			case "tabs":
				return `<div class="cp-tabs">${(p.items || "")
					.split(",")
					.map(
						(i) =>
							`<span class="tab${i.trim() === p.active ? " active" : ""}" style="${i.trim() === p.active ? `color:${t.primary}` : ""}">${i.trim()}</span>`,
					)
					.join("")}</div>`;
			case "breadcrumb":
				return `<div class="cp-breadcrumb">${(p.items || "")
					.split(",")
					.map(
						(i, idx, a) =>
							`<span${i.trim() === p.current ? ' class="current"' : ""}>${i.trim()}</span>${idx < a.length - 1 ? '<span class="sep">›</span>' : ""}`,
					)
					.join("")}</div>`;
			case "pagination":
				return `<div class="cp-pagination"><button>‹</button>${Array.from({ length: Math.min(p.total, 5) }, (_, i) => `<button${i + 1 === p.current ? ' class="active"' : ""}>${i + 1}</button>`).join("")}<button>›</button></div>`;
			case "dropdown":
				return `<div class="cp-dropdown"><span class="cp-dropdown-trigger">${esc(p.trigger)} ⏷</span><div class="cp-dropdown-menu">${(
					p.items || ""
				)
					.split(",")
					.map((i) => `<div class="cp-dropdown-item">${i.trim()}</div>`)
					.join("")}</div></div>`;
			case "card":
				return `<div class="cp-card" style="border-radius:${r}"><div class="cp-card-header">${esc(p.header)}</div><div class="cp-card-body">${esc(p.body)}</div><div class="cp-card-footer">${esc(p.footer)}</div></div>`;
			case "pricingCard":
				return `<div class="cp-pricing ${p.featured ? "featured" : ""}" style="border-radius:${r}${p.featured ? `;border-color:${t.primary}` : ""}"><div class="plan">${esc(p.plan)}</div><div class="price">${esc(p.price)}<span>${esc(p.period)}</span></div><ul>${(
					p.features || ""
				)
					.split(",")
					.map((f) => `<li>✓ ${f.trim()}</li>`)
					.join(
						"",
					)}</ul><button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.cta)}</button></div>`;
			case "alert":
				return `<div class="cp-alert ${p.variant}" style="border-radius:${r}">${p.variant === "error" ? "✕" : p.variant === "warn" ? "⚠" : "ℹ"} ${esc(p.text)}</div>`;
			case "badge":
				return `<span class="cp-badge ${p.variant}" style="background:${p.variant === "primary" ? t.primary : t.secondary}">${esc(p.text)}</span>`;
			case "progress":
				return `<div class="cp-progress"><div class="label">${esc(p.label)}</div><div class="track"><div class="fill" style="width:${p.value}%;background:${t.primary}"></div></div></div>`;
			case "spinner":
				return `<div class="cp-spinner"><div class="ring"></div><span>${esc(p.text)}</span></div>`;
			case "toast":
				return `<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:${r};font-size:11px;background:var(--green);color:var(--bg);max-width:240px">✓ ${esc(p.text)}</div>`;
			case "skeleton":
				return `<div style="display:flex;flex-direction:column;gap:6px;width:${p.width}">${Array.from({ length: Math.min(p.lines, 5) }, (_, i) => `<div style="height:10px;border-radius:${r};background:linear-gradient(90deg,var(--bg3) 25%,var(--border) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;width:${[100, 85, 90, 70, 95][i] || 100}%"></div>`).join("")}</div>`;
			case "tooltip":
				return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px"><span style="font-size:12px;border-bottom:1px dashed var(--text-muted)">${esc(p.trigger)}</span><span style="font-size:10px;padding:3px 6px;border-radius:${r};background:var(--bg3);color:var(--text-muted)">${esc(p.text)}</span></div>`;
			case "list":
				return `<ul class="cp-list">${(p.items || "")
					.split(",")
					.map((i) => `<li>${i.trim()}</li>`)
					.join("")}</ul>`;
			case "table":
				return `<table class="cp-table"><thead><tr>${(p.headers || "")
					.split(",")
					.map((h) => `<th>${h.trim()}</th>`)
					.join("")}</tr></thead><tbody>${(p.rows || "")
					.split("|")
					.filter(Boolean)
					.map(
						(r) =>
							"<tr>" +
							r
								.split(",")
								.map((c) => `<td>${c.trim()}</td>`)
								.join("") +
							"</tr>",
					)
					.join("")}</tbody></table>`;
			case "accordion":
				return `<div class="cp-accordion" style="border-radius:${r}">${(
					p.items || ""
				)
					.split("|")
					.filter(Boolean)
					.map((item) => {
						const [i, b] = item.split("~");
						return `<div class="item"><div class="item-header">${esc(i || "")} <span style="color:var(--text-muted)">▾</span></div><div class="item-body">${esc(b || "")}</div></div>`;
					})
					.join("")}</div>`;
			case "stats":
				return `<div class="cp-stats">${(p.items || "")
					.split(",")
					.map((item) => {
						const [l, n] = item.split("~");
						return `<div class="stat"><div class="num">${esc(n || "")}</div><div class="lbl">${esc(l || "")}</div></div>`;
					})
					.join("")}</div>`;
			case "hero":
				return `<div class="cp-hero"><h1 style="color:${t.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.title)}</h1><p>${esc(p.subtitle)}</p><button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.cta)}</button></div>`;
			case "footer":
				return `<div class="cp-footer">${esc(p.text)}</div>`;
			case "testimonial":
				return `<div class="cp-testimonial"><div class="quote">"${esc(p.quote)}"</div><div class="author">${esc(p.author)}</div><div class="role">${esc(p.role)}</div></div>`;
			case "modal":
				return `<div class="cp-modal" style="border-radius:${r}"><div class="cp-modal-header"><span>${esc(p.title)}</span><span style="color:var(--text-muted);font-size:14px">✕</span></div><div class="cp-modal-body">${esc(p.body)}</div><div class="cp-modal-footer"><span style="padding:5px 12px;border:1px solid var(--border);border-radius:${r};font-size:11px">${esc(p.cancel)}</span><span style="padding:5px 12px;background:${t.primary};color:#fff;border-radius:${r};font-size:11px">${esc(p.confirm)}</span></div></div>`;
			default:
				return `<div style="color:var(--text-muted);font-size:11px">${type}</div>`;
		}
	}

	/* ═══ TREE TO HTML (canvas render) ═══ */
	function renderTreeNode(node, depth) {
		if (node.type === "root")
			return (node.children || [])
				.map((c) => renderTreeNode(c, depth))
				.join("");
		const sel = S.selectedIds.has(node.id) ? " selected" : "";
		const isCont = isContainer(node.type);
		const ch = (node.children || [])
			.map((c) => renderTreeNode(c, depth + 1))
			.join("");
		const prev = renderPreview(node.type, node.props, ch);
		const def = COMPONENTS[node.type];
		const name = S.nodeNames[node.id] || def?.label || node.type;
		const icon = def && def.icon ? def.icon : "";
		const masterTag = node._masterId
			? ' <span style="font-size:8px;color:var(--accent);opacity:.6">◆</span>'
			: "";
		return `<div class="canvas-component${sel}" draggable="true" data-id="${node.id}" data-depth="${depth}" style="--depth:${depth}">
      <div class="drag-handle">
        <span class="node-badge">${icon} ${esc(name)}${masterTag}</span>
        ${isCont ? `<button onclick="event.stopPropagation();UI.addChild('${node.id}')" title="Add child">＋</button>` : ""}
        <button class="delete" onclick="event.stopPropagation();UI.deleteComponent('${node.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
      <div class="canvas-component-body" ondblclick="event.stopPropagation();UI.startEdit('${node.id}')">${prev}</div>
    </div>`;
	}

	/* ═══ RENDER ═══ */
	function render() {
		renderCanvas();
		renderResizeHandles();
		renderLayers();
		renderCode();
		renderInspector();
		renderComments();
		updateCounts();
		syncZoomLabel();
	}

	function renderCanvas() {
		const list = document.getElementById("canvas-list");
		if (!list) return;
		list.innerHTML = totalComponents() === 0 ? "" : renderTreeNode(S.tree, 0);
		document.getElementById("canvas-empty").style.display =
			totalComponents() === 0 ? "block" : "none";
	}

	function renderLayers() {
		const list = document.getElementById("layers-list");
		if (!list) return;
		if (totalComponents() === 0) {
			list.innerHTML =
				'<div style="padding:8px 10px;font-size:11px;color:var(--text-muted);opacity:.5">No components</div>';
			return;
		}
		list.innerHTML = renderLayerItem(S.tree, 0);
	}
	function renderLayerItem(node, depth) {
		if (node.type === "root")
			return (node.children || [])
				.map((c) => renderLayerItem(c, depth))
				.join("");
		const sel = S.selectedIds.has(node.id)
			? S.selectedIds.size > 1
				? " multi-selected"
				: " selected"
			: "";
		const def = COMPONENTS[node.type];
		const icon = def ? def.icon : "<i class='fa-regular fa-cube'></i>";
		const name = S.nodeNames[node.id] || def?.label || node.type;
		const vis = node._hidden ? " hidden" : "";
		const locked = node._locked ? " locked" : "";
		const hasKids = (node.children || []).length > 0;
		return `<div class="layer-item${sel}" data-id="${node.id}">
      <span class="ll-toggle" onclick="event.stopPropagation();UI.toggleLayer('${node.id}')">${hasKids ? "▾" : ""}</span>
      <span class="ll-icon">${icon}</span>
      <span class="ll-name" onclick="UI.selectComponent('${node.id}')">${esc(name)}</span>
      <span class="ll-vis${vis}" onclick="event.stopPropagation();UI.toggleVisibility('${node.id}')" title="Toggle visibility"><i class="fa-regular ${node._hidden ? "fa-eye-slash" : "fa-eye"}"></i></span>
      <span class="ll-lock${locked}" onclick="event.stopPropagation();UI.toggleLock('${node.id}')" title="Toggle lock"><i class="fa-regular ${node._locked ? "fa-lock" : "fa-unlock"}"></i></span>
    </div>${hasKids ? `<div class="layers-children">${(node.children || []).map((c) => renderLayerItem(c, depth + 1)).join("")}</div>` : ""}`;
	}

	function renderCode() {
		const out = document.getElementById("code-output");
		if (out) out.textContent = generateCode();
	}

	function renderInspector() {
		const panel = document.getElementById("inspector-content");
		const nodes = getSelectedNodes();
		if (!panel) return;
		if (nodes.length === 0) {
			panel.innerHTML = '<p class="muted">Select a component</p>';
			return;
		}
		if (nodes.length > 1) {
			panel.innerHTML = `<p class="muted">${nodes.length} components selected</p>`;
			return;
		}
		const c = nodes[0];
		if (!c || c.type === "root") return;
		const def = COMPONENTS[c.type];
		if (!def) {
			panel.innerHTML = '<p class="muted">No properties</p>';
			return;
		}
		const p = c.props;
		const isInst = !!c._masterId;
		const masterHTML = isInst
			? `<div class="ins-section"><div class="ins-header">Master <span style="font-size:9px;color:var(--accent)">◆ ${esc(c._masterName || "")}</span></div><div class="ins-body"><button class="btn-sm" onclick="UI.detachInstance('${c.id}')">Detach instance</button></div></div>`
			: "";
		const textProps =
			p.text !== undefined
				? `<div class="ins-row"><label>Text</label><input type="text" value="${esc(p.text)}" onchange="UI.updateProp('${c.id}','text',this.value)"></div>`
				: "";
		const labelProps =
			p.label !== undefined
				? `<div class="ins-row"><label>Label</label><input type="text" value="${esc(p.label)}" onchange="UI.updateProp('${c.id}','label',this.value)"></div>`
				: "";
		const placeholder =
			p.placeholder !== undefined
				? `<div class="ins-row"><label>Placeholder</label><input type="text" value="${esc(p.placeholder)}" onchange="UI.updateProp('${c.id}','placeholder',this.value)"></div>`
				: "";
		const colorProps =
			p.color !== undefined || p.bg !== undefined
				? `<div class="ins-half"><div class="ins-row"><label>Color</label><input type="color" value="${p.color || S.theme.text}" onchange="UI.updateProp('${c.id}','color',this.value)"></div><div class="ins-row"><label>Bg</label><input type="color" value="${p.bg || "transparent"}" onchange="UI.updateProp('${c.id}','bg',this.value)"></div></div>`
				: "";
		const layoutProps = isContainer(c.type)
			? `<div class="ins-section"><div class="ins-header">Layout</div><div class="ins-body"><div class="ins-row"><label>Display</label><select onchange="UI.updateProp('${c.id}','display',this.value)"><option ${p.display === "flex" ? "selected" : ""}>flex</option><option ${p.display === "grid" ? "selected" : ""}>grid</option><option ${(p.display || "block") === "block" ? "selected" : ""}>block</option></select></div><div class="ins-row"><label>Gap</label><input type="text" value="${p.gap || "8px"}" onchange="UI.updateProp('${c.id}','gap',this.value)"></div><div class="ins-row"><label>Justify</label><select onchange="UI.updateProp('${c.id}','justify',this.value)"><option ${p.justify === "start" ? "selected" : ""}>start</option><option ${p.justify === "center" ? "selected" : ""}>center</option><option ${p.justify === "end" ? "selected" : ""}>end</option><option ${p.justify === "between" ? "selected" : ""}>between</option></select></div><div class="ins-row"><label>Align</label><select onchange="UI.updateProp('${c.id}','align',this.value)"><option ${p.align === "start" ? "selected" : ""}>start</option><option ${p.align === "center" ? "selected" : ""}>center</option><option ${p.align === "end" ? "selected" : ""}>end</option><option ${(p.align || "stretch") === "stretch" ? "selected" : ""}>stretch</option></select></div></div></div>`
			: "";
		const sizing = `<div class="ins-section"><div class="ins-header">Position & Size</div><div class="ins-body"><div class="ins-half"><div class="ins-row"><label>W</label><input type="text" value="${p.w || "auto"}" onchange="UI.updateProp('${c.id}','w',this.value)"></div><div class="ins-row"><label>H</label><input type="text" value="${p.h || "auto"}" onchange="UI.updateProp('${c.id}','h',this.value)"></div></div></div></div>`;

		panel.innerHTML =
			masterHTML +
			sizing +
			layoutProps +
			`<div class="ins-section"><div class="ins-header">${def.cat} / ${def.label}</div><div class="ins-body">${textProps}${labelProps}${placeholder}${colorProps}${Object.entries(
				p,
			)
				.filter(
					([k]) =>
						![
							"text",
							"label",
							"placeholder",
							"color",
							"bg",
							"w",
							"h",
							"display",
							"gap",
							"justify",
							"align",
						].includes(k),
				)
				.map(([key, val]) => {
					const label =
						key.charAt(0).toUpperCase() +
						key.slice(1).replace(/([A-Z])/g, " $1");
					if (["checked", "on", "featured", "vertical"].includes(key))
						return `<div class="ins-row"><label>${label}</label><input type="checkbox" ${val ? "checked" : ""} onchange="UI.updateProp('${c.id}','${key}',this.checked)"></div>`;
					if (key === "level")
						return `<div class="ins-row"><label>${label}</label><select onchange="UI.updateProp('${c.id}','${key}',this.value)">${["h1", "h2", "h3", "h4", "h5", "h6"].map((l) => `<option ${l === val ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
					if (key === "variant")
						return `<div class="ins-row"><label>${label}</label><select onchange="UI.updateProp('${c.id}','${key}',this.value)">${["info", "warn", "error", "primary", "secondary", "success"].map((v) => `<option ${v === val ? "selected" : ""}>${v}</option>`).join("")}</select></div>`;
					if (
						[
							"value",
							"current",
							"total",
							"cols",
							"min",
							"max",
							"lines",
							"w",
							"h",
						].includes(key)
					)
						return `<div class="ins-row"><label>${label}</label><input type="number" value="${val}" onchange="UI.updateProp('${c.id}','${key}',parseInt(this.value)||0)"></div>`;
					if (key === "active")
						return `<div class="ins-row"><label>${label}</label><select onchange="UI.updateProp('${c.id}','${key}',this.value)">${(
							p.options ||
							p.items ||
							""
						)
							.split(",")
							.map(
								(o) =>
									`<option ${o.trim() === val ? "selected" : ""}>${o.trim()}</option>`,
							)
							.join("")}</select></div>`;
					return `<div class="ins-row"><label>${label}</label><input type="text" value="${esc(String(val))}" onchange="UI.updateProp('${c.id}','${key}',this.value)"></div>`;
				})
				.join("")}</div></div>`;
	}

	/* ═══ RESIZE HANDLES ═══ */
	function renderResizeHandles() {
		const handles = document.getElementById("resize-handles");
		if (!handles) return;
		if (S.selectedIds.size !== 1) {
			handles.style.display = "none";
			return;
		}
		const id = [...S.selectedIds][0];
		const el = document.querySelector(
			`.canvas-component[data-id="${CSS.escape(id)}"]`,
		);
		if (!el) {
			handles.style.display = "none";
			return;
		}
		const r = el.getBoundingClientRect();
		const cr = document
			.getElementById("canvas-container")
			.getBoundingClientRect();
		handles.style.display = "block";
		handles.style.left = r.left - cr.left + "px";
		handles.style.top = r.top - cr.top + "px";
		handles.style.width = r.width + "px";
		handles.style.height = r.height + "px";
		// 8 handles positioned by CSS relative to the parent
		handles.innerHTML = "n,s,e,w,ne,nw,se,sw"
			.split(",")
			.map(
				(d) => `<div class="resize-handle ${d}" data-direction="${d}"></div>`,
			)
			.join("");
	}

	function renderComments() {
		const list = document.getElementById("comments-list");
		if (!list) return;
		if (S.comments.length === 0) {
			list.innerHTML = '<p class="muted">No comments yet</p>';
			return;
		}
		list.innerHTML = S.comments
			.map((c) => {
				const comp = findNode(S.tree, c.compId);
				const compName = comp ? S.nodeNames[comp.id] || c.compId : "(deleted)";
				return `<div class="comment-item${c.resolved ? " resolved" : ""}">
        <div class="cmt-hdr"><span class="cmt-comp">@${esc(compName)}</span><span>${new Date(c.createdAt).toLocaleDateString()}</span></div>
        <div class="cmt-body">${esc(c.text)}</div>
        <div class="cmt-actions"><button onclick="UI.resolveComment('${c.id}')">${c.resolved ? "Reopen" : "Resolve"}</button><button onclick="UI.deleteComment('${c.id}')">Delete</button></div>
      </div>`;
			})
			.join("");
	}

	function updateCounts() {
		const n = totalComponents();
		const el = document.getElementById("component-count");
		if (el) el.textContent = `${n} component${n !== 1 ? "s" : ""}`;
	}
	function syncZoomLabel() {
		const el = document.getElementById("zoom-label");
		if (el) el.textContent = Math.round(S.zoom * 100) + "%";
	}

	/* ═══ CODE GENERATORS ═══ */
	function genHTML(c, t, ch) {
		const p = c.props,
			r = RADIUS[t.radius] || "6px",
			sp = SPACING[t.spacing] || "1rem",
			font = t.font,
			text = t.dark ? "#e2e4f0" : t.text;
		switch (c.type) {
			case "container":
				return `<div style="padding:${sp}">\n${ch || ""}\n</div>`;
			case "flexRow":
				return `<div style="display:flex;gap:${p.gap};align-items:${p.align || "center"}">\n${ch || "<span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "flexCol":
				return `<div style="display:flex;flex-direction:column;gap:${p.gap}">\n${ch || "<span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "grid":
				return `<div style="display:grid;grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap}">\n${ch || ""}\n</div>`;
			case "frame":
				return `<div style="width:${p.w}px;height:${p.h}px;background:${p.fill};position:relative">\n${ch || ""}\n</div>`;
			case "heading":
				return `<${p.level} style="font-family:${font};color:${text};margin:0 0 ${sp}">${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p style="color:${text};line-height:1.6;margin:0 0 ${sp}">${esc(p.text)}</p>`;
			case "link":
				return `<a href="${esc(p.href)}" style="color:${t.primary}">${esc(p.text)}</a>`;
			case "btnPrimary":
				return `<button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
			case "btnSecondary":
				return `<button style="background:${t.secondary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
			case "btnOutline":
				return `<button style="background:transparent;color:${t.primary};border:2px solid ${t.primary};padding:10px 24px;border-radius:${r};cursor:pointer">${esc(p.text)}</button>`;
			case "card":
				return `<div style="border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);margin:0 0 ${sp}"><div style="padding:16px 16px 0;font-weight:600;color:${text}">${esc(p.header)}</div><div style="padding:16px;color:${text}dd">${esc(p.body)}</div><div style="padding:0 16px 12px;font-size:.875rem;color:${text}99;border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px">${esc(p.footer)}</div></div>`;
			case "hero":
				return `<div style="text-align:center;padding:60px 20px;background:#f9fafb;border-radius:${r};margin:0 0 ${sp}"><h1 style="font-family:${font};font-size:2.5rem;font-weight:800;color:#111827;margin:0 0 8px">${esc(p.title)}</h1><p style="font-size:1.125rem;color:#6b7280;max-width:480px;margin:0 auto 24px">${esc(p.subtitle)}</p><button style="background:${t.primary};color:#fff;border:none;padding:12px 28px;border-radius:${r};font-weight:600;cursor:pointer">${esc(p.cta)}</button></div>`;
			case "footer":
				return `<footer style="text-align:center;padding:24px;color:#9ca3af;font-size:.75rem;border-top:1px solid #e5e7eb">${esc(p.text)}</footer>`;
			case "navbar":
				return `<nav style="display:flex;align-items:center;gap:${sp};padding:12px ${sp};background:#f3f4f6;border-radius:${r};margin:0 0 ${sp}"><span style="font-weight:700;color:${t.primary}">${esc(p.brand)}</span>${(
					p.items || ""
				)
					.split(",")
					.map(
						(i) =>
							`<span style="color:${text}99;font-size:.875rem">${i.trim()}</span>`,
					)
					.join("")}</nav>`;
			case "input":
				return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><input type="text" placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem"></div>`;
			case "textarea":
				return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><textarea placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem;min-height:80px"></textarea></div>`;
			case "select":
				return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><select style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem">${(
					p.options || ""
				)
					.split(",")
					.map((o) => `<option>${o.trim()}</option>`)
					.join("")}</select></div>`;
			case "table":
				return `<table style="width:100%;border-collapse:collapse;font-size:.875rem;margin:0 0 ${sp}"><thead><tr>${(
					p.headers || ""
				)
					.split(",")
					.map(
						(h) =>
							`<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;font-weight:600;text-transform:uppercase;font-size:.75rem;color:#6b7280">${h.trim()}</th>`,
					)
					.join("")}</tr></thead><tbody>${(p.rows || "")
					.split("|")
					.filter(Boolean)
					.map(
						(r) =>
							"<tr>" +
							r
								.split(",")
								.map(
									(c) =>
										`<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151">${c.trim()}</td>`,
								)
								.join("") +
							"</tr>",
					)
					.join("")}</tbody></table>`;
			case "accordion":
				return `<div style="border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;margin:0 0 ${sp}">${(
					p.items || ""
				)
					.split("|")
					.filter(Boolean)
					.map((item) => {
						const [hd, bd] = item.split("~");
						return `<div style="border-bottom:1px solid #e5e7eb"><div style="padding:12px 16px;font-weight:600;font-size:.875rem;display:flex;justify-content:space-between;background:#f9fafb">${esc(hd || "")}<span style="color:#9ca3af">▾</span></div><div style="padding:12px 16px;font-size:.875rem;color:#6b7280">${esc(bd || "")}</div></div>`;
					})
					.join("")}</div>`;
			case "sidebar":
				return `<div style="display:flex;border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;min-height:200px"><div style="width:200px;background:#f9fafb;padding:16px;flex-shrink:0">${(
					p.items || ""
				)
					.split(",")
					.map(
						(i) =>
							`<div style="padding:6px 10px;font-size:13px;border-radius:4px;${i.trim() === p.active ? "background:" + t.primary + ";color:#fff" : "color:#6b7280"}">${i.trim()}</div>`,
					)
					.join(
						"",
					)}</div><div style="flex:1;padding:16px;font-size:13px;color:#6b7280">${ch || "Main content"}</div></div>`;
			case "pricingCard":
				return `<div style="border:${p.featured ? "2px solid " + t.primary : "1px solid #e5e7eb"};border-radius:${r};padding:24px;text-align:center;background:#fff;max-width:300px;margin:0 auto ${sp}"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:4px">${esc(p.plan)}</div><div style="font-size:2rem;font-weight:800;color:#111827">${esc(p.price)}<span style="font-size:.875rem;font-weight:400;color:#6b7280">${esc(p.period)}</span></div><ul style="list-style:none;padding:0;margin:16px 0;font-size:.875rem;color:#6b7280">${(
					p.features || ""
				)
					.split(",")
					.map((f) => `<li style="padding:4px 0">✓ ${f.trim()}</li>`)
					.join(
						"",
					)}</ul><button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-weight:600;cursor:pointer">${esc(p.cta)}</button></div>`;
			case "modal":
				return `<div style="background:rgba(0,0,0,.5);padding:40px;display:flex;align-items:center;justify-content:center;margin:0 0 ${sp}"><div style="background:#fff;border-radius:${r};max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2)"><div style="padding:16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-weight:600"><span>${esc(p.title)}</span><span style="color:#9ca3af;cursor:pointer">✕</span></div><div style="padding:16px;font-size:.875rem;color:#6b7280">${esc(p.body)}</div><div style="padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:flex-end"><span style="padding:8px 16px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem">${esc(p.cancel)}</span><span style="padding:8px 16px;background:${t.primary};color:#fff;border-radius:${r};font-size:.875rem">${esc(p.confirm)}</span></div></div></div>`;
			case "testimonial":
				return `<div style="text-align:center;padding:32px 20px;max-width:500px;margin:0 auto ${sp}"><div style="font-style:italic;font-size:1rem;color:#6b7280;line-height:1.6;margin:0 0 16px">"${esc(p.quote)}"</div><div style="font-weight:600;font-size:.875rem;color:#111827">${esc(p.author)}</div><div style="font-size:.75rem;color:#9ca3af">${esc(p.role)}</div></div>`;
			case "alert":
				return `<div style="padding:12px 16px;border-radius:${r};font-size:.875rem;display:flex;align-items:center;gap:8px;margin:0 0 ${sp};background:#eff6ff;color:${t.primary};border:1px solid #bfdbfe">ℹ ${esc(p.text)}</div>`;
			case "badge":
				return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:600;background:${t.primary};color:#fff">${esc(p.text)}</span>`;
			case "progress":
				return `<div style="margin:0 0 ${sp}"><div style="font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label)}</div><div style="height:8px;border-radius:99px;background:#e5e7eb;overflow:hidden"><div style="height:100%;border-radius:99px;background:${t.primary};width:${p.value}%"></div></div></div>`;
			case "spinner":
				return `<div style="display:flex;align-items:center;gap:8px;color:${text}99;font-size:.875rem;margin:${sp} 0"><div style="width:20px;height:20px;border:2px solid #e5e7eb;border-top-color:${t.primary};border-radius:50%;animation:spin .6s linear infinite"></div>${esc(p.text)}</div>`;
			case "list":
				return `<ul style="list-style:disc;padding-left:20px;color:${text};font-size:.875rem;margin:0 0 ${sp}">${(
					p.items || ""
				)
					.split(",")
					.map((i) => `<li style="margin:4px 0">${i.trim()}</li>`)
					.join("")}</ul>`;
			case "stats":
				return `<div style="display:flex;gap:24px;justify-content:center;padding:${sp} 0">${(
					p.items || ""
				)
					.split(",")
					.map((item) => {
						const [l, n] = item.split("~");
						return `<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:${t.primary}">${esc(n || "")}</div><div style="font-size:.75rem;color:${text}99">${esc(l || "")}</div></div>`;
					})
					.join("")}</div>`;
			case "divider":
				return `<hr style="border:none;border-top:1px solid #d1d5db;margin:${sp} 0">`;
			case "spacer":
				return `<div style="height:${p.height}"></div>`;
			case "image":
				if (p.src) return `<div style="width:${p.width};height:${p.height};background:#e5e7eb;border-radius:${r};display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${p.src}" alt="${esc(p.alt)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
				return `<div style="width:${p.width};height:${p.height};background:#e5e7eb;border-radius:${r};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.875rem">🖼 ${esc(p.alt)}</div>`;
			case "avatar":
				return `<div style="display:flex;align-items:center;gap:10px;margin:0 0 ${sp}"><div style="width:40px;height:40px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${esc(p.initials)}</div><div><div style="font-weight:600;font-size:14px">${esc(p.name)}</div><div style="font-size:12px;color:${text}99">${esc(p.role)}</div></div></div>`;
			case "tabs":
				return `<div style="display:flex;gap:2px;border-bottom:2px solid #e5e7eb;margin:0 0 ${sp}">${(
					p.items || ""
				)
					.split(",")
					.map(
						(i) =>
							`<span style="padding:8px 16px;font-size:.875rem;${i.trim() === p.active ? `color:${t.primary};font-weight:600;border-bottom:2px solid ${t.primary};margin-bottom:-2px` : ""}">${i.trim()}</span>`,
					)
					.join("")}</div>`;
			default:
				return `<!-- ${c.type} -->`;
		}
	}

	function genReact(c, t, ch) {
		const p = c.props,
			sp = SPACING[t.spacing] || "1rem",
			text = t.dark ? "#e2e4f0" : "#1f2937",
			r = RADIUS[t.radius] || "6px";
		const wrap = (s) =>
			s
				.split("\n")
				.map((l) => (l.trim() ? "    " + l : ""))
				.join("\n");
		switch (c.type) {
			case "container":
				return `<div style={{padding:'${sp}'}}>\n${ch ? wrap(ch) : "  {/* children */}"}\n</div>`;
			case "flexRow":
				return `<div style={{display:'flex',gap:'${p.gap}',alignItems:'${p.align || "center"}'}}>\n${ch ? wrap(ch) : "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "flexCol":
				return `<div style={{display:'flex',flexDirection:'column',gap:'${p.gap}'}}>\n${ch ? wrap(ch) : "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "grid":
				return `<div style={{display:'grid',gridTemplateColumns:'repeat(${p.cols},1fr)',gap:'${p.gap}'}}>\n${ch ? wrap(ch) : ""}\n</div>`;
			case "heading":
				return `<${p.level} style={{fontFamily:'${t.font}',color:'${text}',marginBottom:'${sp}'}}>${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p style={{color:'${text}',lineHeight:1.6,marginBottom:'${sp}'}}>${esc(p.text)}</p>`;
			case "btnPrimary":
				return `<button style={{background:'${t.primary}',color:'#fff',border:'none',padding:'10px 24px',borderRadius:'${r}',fontWeight:500,cursor:'pointer'}}>\n  ${esc(p.text)}\n</button>`;
			case "card":
				return `<div style={{border:'1px solid #e5e7eb',borderRadius:'${r}',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>\n  <div style={{padding:'16px 16px 0',fontWeight:600,color:'${text}'}}>${esc(p.header)}</div>\n  <div style={{padding:16,color:'${text}dd'}}>${esc(p.body)}</div>\n  <div style={{padding:'0 16px 12px',fontSize:'0.875rem',color:'${text}99',borderTop:'1px solid #e5e7eb',marginTop:8,paddingTop:8}}>${esc(p.footer)}</div>\n</div>`;
			case "hero":
				return `<div style={{textAlign:'center',padding:'60px 20px',background:'#f9fafb',borderRadius:'${r}'}}>\n  <h1 style={{fontSize:'2.5rem',fontWeight:800,color:'#111827',margin:'0 0 8px'}}>${esc(p.title)}</h1>\n  <p style={{fontSize:'1.125rem',color:'#6b7280',maxWidth:480,margin:'0 auto 24px'}}>${esc(p.subtitle)}</p>\n  <button style={{background:'${t.primary}',color:'#fff',border:'none',padding:'12px 28px',borderRadius:'${r}',fontWeight:600,cursor:'pointer'}}>${esc(p.cta)}</button>\n</div>`;
			default:
				return `{/* ${c.type} */}`;
		}
	}

	function genTW(c, _t, ch) {
		const p = c.props;
		switch (c.type) {
			case "container":
				return `<div class="p-6">\n${ch || ""}\n</div>`;
			case "flexRow":
				return `<div class="flex flex-row gap-4 items-center">\n${ch || "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "flexCol":
				return `<div class="flex flex-col gap-3">\n${ch || "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
			case "grid":
				return `<div class="grid grid-cols-3 gap-4">\n${ch || ""}\n</div>`;
			case "heading":
				return `<${p.level} class="font-bold tracking-tight text-gray-900 dark:text-white">${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p class="text-gray-600 dark:text-gray-300 leading-relaxed">${esc(p.text)}</p>`;
			case "btnPrimary":
				return `<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">${esc(p.text)}</button>`;
			case "card":
				return `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">\n  <div class="px-4 pt-4 font-semibold text-gray-900">${esc(p.header)}</div>\n  <div class="p-4 text-gray-600">${esc(p.body)}</div>\n  <div class="px-4 pb-4 text-sm text-gray-400 border-t border-gray-100 mt-2 pt-2">${esc(p.footer)}</div>\n</div>`;
			case "hero":
				return `<div class="text-center py-16 px-4 bg-gray-50 rounded-xl">\n  <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">${esc(p.title)}</h1>\n  <p class="text-lg text-gray-500 max-w-lg mx-auto mb-6">${esc(p.subtitle)}</p>\n  <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">${esc(p.cta)}</button>\n</div>`;
			default:
				return `<!-- ${c.type} -->`;
		}
	}

	/* ── NEW: Vue, Svelte, Angular generators ── */
	function genVue(c, t, ch) {
		const p = c.props,
			sp = SPACING[t.spacing] || "1rem",
			text = t.dark ? "#e2e4f0" : "#1f2937";
		switch (c.type) {
			case "container":
				return `<div :style="{padding:'${sp}'}">\n${ch || ""}\n</div>`;
			case "flexRow":
				return `<div :style="{display:'flex',gap:'${p.gap}',alignItems:'${p.align || "center"}'}">\n${ch || ""}\n</div>`;
			case "flexCol":
				return `<div :style="{display:'flex',flexDirection:'column',gap:'${p.gap}'}">\n${ch || ""}\n</div>`;
			case "grid":
				return `<div :style="{display:'grid',gridTemplateColumns:'repeat(${p.cols},1fr)',gap:'${p.gap}'}">\n${ch || ""}\n</div>`;
			case "heading":
				return `<${p.level} :style="{color:'${text}',marginBottom:'${sp}'}">${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p :style="{color:'${text}',lineHeight:1.6}">${esc(p.text)}</p>`;
			case "btnPrimary":
				return `<button :style="{background:'${t.primary}',color:'#fff',border:'none',padding:'10px 24px',borderRadius:'${RADIUS[t.radius] || "6px"}'}">${esc(p.text)}</button>`;
			case "card":
				return `<div :style="{border:'1px solid #e5e7eb',borderRadius:'${RADIUS[t.radius] || "6px"}'}"><div :style="{padding:'16px 16px 0',fontWeight:600}">${esc(p.header)}</div><div :style="{padding:16}">${esc(p.body)}</div></div>`;
			case "hero":
				return `<div :style="{textAlign:'center',padding:'60px 20px',background:'#f9fafb'}"><h1 :style="{fontSize:'2.5rem',fontWeight:800}">${esc(p.title)}</h1><p :style="{color:'#6b7280'}">${esc(p.subtitle)}</p><button :style="{background:'${t.primary}',color:'#fff'}">${esc(p.cta)}</button></div>`;
			case "navbar":
				return `<nav :style="{display:'flex',gap:'${sp}',padding:'12px ${sp}',background:'#f3f4f6',borderRadius:'${RADIUS[t.radius] || "6px"}'}"><span :style="{fontWeight:700,color:'${t.primary}'}">${esc(p.brand)}</span><span v-for="item in '${p.items}'.split(',')" :key="item" :style="{color:'${text}99'}">{{ item.trim() }}</span></nav>`;
			case "list":
				return `<ul><li v-for="item in '${p.items}'.split(',')" :key="item">{{ item.trim() }}</li></ul>`;
			default:
				return `<!-- ${c.type} -->`;
		}
	}
	function genSvelte(c, t, ch) {
		const p = c.props,
			sp = SPACING[t.spacing] || "1rem",
			r = RADIUS[t.radius] || "6px";
		switch (c.type) {
			case "container":
				return `<div style="padding:${sp}">\n${ch || ""}\n</div>`;
			case "flexRow":
				return `<div style="display:flex;gap:${p.gap};align-items:${p.align || "center"}">\n${ch || ""}\n</div>`;
			case "flexCol":
				return `<div style="display:flex;flex-direction:column;gap:${p.gap}">\n${ch || ""}\n</div>`;
			case "grid":
				return `<div style="display:grid;grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap}">\n${ch || ""}\n</div>`;
			case "heading":
				return `<${p.level} style="color:${t.dark ? "#e2e4f0" : "#1f2937"};margin-bottom:${sp}">${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p style="color:${t.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.text)}</p>`;
			case "btnPrimary":
				return `<button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r}">${esc(p.text)}</button>`;
			case "card":
				return `<div style="border:1px solid #e5e7eb;border-radius:${r}"><div style="padding:16px 16px 0;font-weight:600">${esc(p.header)}</div><div style="padding:16px">${esc(p.body)}</div></div>`;
			default:
				return `<!-- {${c.type}} -->`;
		}
	}
	function genAngular(c, t, ch) {
		const p = c.props,
			sp = SPACING[t.spacing] || "1rem",
			r = RADIUS[t.radius] || "6px";
		switch (c.type) {
			case "container":
				return `<div [style.padding]="'${sp}'">\n${ch || ""}\n</div>`;
			case "flexRow":
				return `<div [ngStyle]="{'display':'flex','gap':'${p.gap}','align-items':'${p.align || "center"}'}">\n${ch || ""}\n</div>`;
			case "flexCol":
				return `<div [ngStyle]="{'display':'flex','flex-direction':'column','gap':'${p.gap}'}">\n${ch || ""}\n</div>`;
			case "grid":
				return `<div [ngStyle]="{'display':'grid','grid-template-columns':'repeat(${p.cols},1fr)','gap':'${p.gap}'}">\n${ch || ""}\n</div>`;
			case "heading":
				return `<${p.level} [style.color]="'${t.dark ? "#e2e4f0" : "#1f2937"}'" [style.margin-bottom]="'${sp}'">${esc(p.text)}</${p.level}>`;
			case "paragraph":
				return `<p [style.color]="'${t.dark ? "#e2e4f0" : "#1f2937"}'">${esc(p.text)}</p>`;
			case "btnPrimary":
				return `<button [ngStyle]="{'background':'${t.primary}','color':'#fff','border':'none','padding':'10px 24px','border-radius':'${r}'}">${esc(p.text)}</button>`;
			default:
				return `<!-- ${c.type} -->`;
		}
	}

	function ind(s, d) {
		return s
			.split("\n")
			.map((l) => (l.trim() ? "  ".repeat(d) + l : ""))
			.join("\n");
	}

	function generateNodeCode(node) {
		if (node.type === "root")
			return (node.children || []).map((c) => generateNodeCode(c)).join("\n\n");
		const ch = (node.children || []).map((c) => generateNodeCode(c)).join("\n");
		const f = S.format;
		if (f === "react") return genReact(node, S.theme, ch);
		if (f === "tailwind") return genTW(node, S.theme, ch);
		if (f === "vue") return genVue(node, S.theme, ch);
		if (f === "svelte") return genSvelte(node, S.theme, ch);
		if (f === "angular") return genAngular(node, S.theme, ch);
		return genHTML(node, S.theme, ch);
	}

	function generateCode() {
		if (totalComponents() === 0)
			return "<!-- Add components to generate code -->\n";
		let body = generateNodeCode(S.tree);
		const t = S.theme;
		const bg = t.dark ? "#1e1e1e" : t.bg;
		const text = t.dark ? "#e2e4f0" : t.text;
		const sp = SPACING[t.spacing] || "1rem";
		if (S.format === "html") {
			body = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n  <title>Design</title>\n  <style>\n    *{margin:0;padding:0;box-sizing:border-box}\n    body{font-family:${t.font};background:${bg};color:${text};line-height:1.5}\n    .container{max-width:1080px;margin:0 auto;padding:0 ${sp}}\n  </style>\n</head>\n<body>\n  <div class="container">\n${ind(body, 2)}\n  </div>\n</body>\n</html>`;
			if (S.styleMode === "cssmodules")
				body = body.replace(/style="[^"]*"/g, ""); // placeholder: CSS Modules mode
			if (S.styleMode === "styled")
				body = body.replace(
					/<style>.*?<\/style>/s,
					"<style>/* Styled Components */</style>",
				);
		}
		if (S.format === "react") {
			body = `import React from 'react';\n\nfunction DesignPrototype(){\n  return(\n    <div style={{maxWidth:1080,margin:'0 auto',padding:'${sp}'}}>\n${ind(body, 3)}\n    </div>\n  );\n}\n\nexport default DesignPrototype;`;
			if (S.styleMode === "cssmodules")
				body =
					`import styles from './Design.module.css';\n\n` +
					body.replace(/(style=[{][{][^}]+[}][}])/g, "");
			if (S.styleMode === "styled")
				body = `import styled from 'styled-components';\n\nconst Wrapper = styled.div\`max-width:1080px;margin:0 auto;padding:${sp}\`;\n\nfunction DesignPrototype(){return(\n  <Wrapper>\n${ind(body, 3)}\n  </Wrapper>\n);}`;
		}
		if (S.format === "tailwind") {
			body = `<div class="mx-auto max-w-6xl p-6">\n${ind(body, 1)}\n</div>`;
		}
		if (S.format === "vue") {
			body = `<template>\n  <div class="container">\n${ind(body, 2)}\n  </div>\n</template>\n\n<script>\nexport default { name: 'DesignPrototype' }\n</script>\n\n<style scoped>\n.container{max-width:1080px;margin:0 auto;padding:${sp}}\n</style>`;
		}
		if (S.format === "svelte") {
			body = `<div class="container">\n${ind(body, 1)}\n</div>\n\n<style>\n  .container{max-width:1080px;margin:0 auto;padding:${sp}}\n</style>`;
		}
		if (S.format === "angular") {
			body = `<div class="container">\n${ind(body, 1)}\n</div>\n\n<!-- Add to component styles: .container{max-width:1080px;margin:0 auto;padding:${sp}} -->`;
		}
		return body;
	}

	/* ═══ CANVAS: ZOOM & PAN ═══ */
	function updateCanvasTransform() {
		const layer = document.getElementById("canvas-layer");
		if (!layer) return;
		layer.style.transform = `translate(${S.panX}px, ${S.panY}px) scale(${S.zoom})`;
		document.getElementById("zoom-label") &&
			(document.getElementById("zoom-label").textContent =
				Math.round(S.zoom * 100) + "%");
	}

	function zoomTo(v) {
		if (v === 0) {
			S.zoom = 1;
			S.panX = 0;
			S.panY = 0;
		} else if (v === 1) {
			S.zoom = 1;
		} else if (v === 2) {
			S.zoom = 2;
		} else {
			S.zoom = Math.max(0.1, Math.min(5, S.zoom + (v > 0 ? 0.1 : -0.1)));
		}
		updateCanvasTransform();
	}

	/* ═══ CANVAS EVENT HANDLERS ═══ */
	function setupCanvasEvents() {
		const container = document.getElementById("canvas-container");
		const layer = document.getElementById("canvas-layer");
		if (!container || !layer) return;

		// Pan: middle mouse or space+drag
		container.addEventListener("mousedown", (e) => {
			if (e.button === 1 || (e.button === 0 && S.tool === "hand")) {
				_isPanning = true;
				_panStart = { x: e.clientX - S.panX, y: e.clientY - S.panY };
				container.classList.add("hand-tool");
				e.preventDefault();
				return;
			}
			// Marquee: left click on empty canvas (only in select tool, not on a component)
			if (e.button === 0 && S.tool === "select") {
				const comp = e.target.closest(".canvas-component");
				const handle = e.target.closest(".resize-handle");
				// Start resize if clicking on a resize handle
				if (handle) {
					const id = [...S.selectedIds][0];
					const node = findNode(S.tree, id);
					if (!node) return;
					const el = document.querySelector(
						`.canvas-component[data-id="${CSS.escape(id)}"]`,
					);
					if (!el) return;
					const rect = el.getBoundingClientRect();
					_resizeInfo = {
						id,
						dir: handle.dataset.direction,
						startX: e.clientX,
						startY: e.clientY,
						startW: rect.width,
						startH: rect.height,
					};
					e.preventDefault();
					return;
				}
				if (!comp && !handle) {
					_isMarquee = true;
					_marqueeStart = { x: e.clientX, y: e.clientY };
					const marquee = document.getElementById("marquee");
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

		document.addEventListener("mousemove", (e) => {
			if (_isPanning) {
				S.panX = e.clientX - _panStart.x;
				S.panY = e.clientY - _panStart.y;
				updateCanvasTransform();
				return;
			}
			if (_isMarquee && _marqueeStart) {
				const marquee = document.getElementById("marquee");
				if (!marquee) return;
				const x = Math.min(_marqueeStart.x, e.clientX);
				const y = Math.min(_marqueeStart.y, e.clientY);
				const w = Math.abs(e.clientX - _marqueeStart.x);
				const h = Math.abs(e.clientY - _marqueeStart.y);
				marquee.style.left = x + "px";
				marquee.style.top = y + "px";
				marquee.style.width = w + "px";
				marquee.style.height = h + "px";
				// Find components inside marquee
				const comps = container.querySelectorAll(".canvas-component");
				const selected = new Set();
				comps.forEach((el) => {
					const r = el.getBoundingClientRect();
					if (
						r.left >= x &&
						r.top >= y &&
						r.right <= x + w &&
						r.bottom <= y + h
					) {
						selected.add(el.dataset.id);
					}
				});
				if (selected.size > 0) {
					S.selectedIds = selected;
					render();
				}
				return;
			}
			// Resize: update component dimensions
			if (_resizeInfo) {
				const ri = _resizeInfo;
				const node = findNode(S.tree, ri.id);
				if (!node) return;
				const dx = e.clientX - ri.startX;
				const dy = e.clientY - ri.startY;
				let w = ri.startW;
				let h = ri.startH;
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
			// Snap guides during drag
			if (_dragInfo && _dragInfo.isDragging) {
				updateSnapGuides(e);
			}
		});

		document.addEventListener("mouseup", (_e) => {
			if (_isPanning) {
				_isPanning = false;
				_panStart = null;
				container.classList.remove("hand-tool");
			}
			if (_isMarquee) {
				_isMarquee = false;
				_marqueeStart = null;
				const marquee = document.getElementById("marquee");
				if (marquee) marquee.style.display = "none";
			}
			if (_resizeInfo) {
				pushHistory();
				_resizeInfo = null;
			}
		});

		// Zoom with Ctrl+wheel
		container.addEventListener(
			"wheel",
			(e) => {
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					const delta = -e.deltaY * 0.001;
					const newZoom = Math.max(0.1, Math.min(5, S.zoom + delta));
					// Zoom towards mouse position
					const rect = container.getBoundingClientRect();
					const mx = e.clientX - rect.left;
					const my = e.clientY - rect.top;
					const scale = newZoom / S.zoom;
					S.panX = mx - (mx - S.panX) * scale;
					S.panY = my - (my - S.panY) * scale;
					S.zoom = newZoom;
					updateCanvasTransform();
				}
			},
			{ passive: false },
		);

		// Click on canvas empty space to deselect
		container.addEventListener("click", (e) => {
			if (
				!e.target.closest(".canvas-component") &&
				!e.target.closest(".resize-handle")
			) {
				// Don't deselect if marquee was active
				if (!_isMarquee) {
					// ponytail: single click on empty deselects all
					S.selectedIds.clear();
					render();
				}
			}
		});
	}

	/* ═══ SNAP GUIDES ═══ */
	function updateSnapGuides(_e) {
		// Clear old guides
		clearSnapGuides();
		const container = document.getElementById("canvas-container");
		if (!container) return;
		const comps = container.querySelectorAll(
			".canvas-component:not(.dragging)",
		);
		if (comps.length === 0) return;
		const SNAP_THRESHOLD = 6;
		const guides = document.getElementById("snap-guides");
		if (!guides) return;

		// Get the dragged component position
		const dragging = container.querySelector(".canvas-component.dragging");
		if (!dragging) return;
		const dr = dragging.getBoundingClientRect();

		// Check alignment with each other component
		comps.forEach((el) => {
			if (el === dragging) return;
			const r = el.getBoundingClientRect();
			// Horizontal snap: top, bottom, vertical center
			if (Math.abs(dr.top - r.top) < SNAP_THRESHOLD) {
				addGuide("h", r.top, r.left, r.right, guides);
			}
			if (Math.abs(dr.bottom - r.bottom) < SNAP_THRESHOLD) {
				addGuide("h", r.bottom, r.left, r.right, guides);
			}
			if (Math.abs(dr.top - r.bottom) < SNAP_THRESHOLD) {
				addGuide("h", r.bottom, r.left, r.right, guides);
			}
			if (Math.abs(dr.bottom - r.top) < SNAP_THRESHOLD) {
				addGuide("h", r.top, r.left, r.right, guides);
			}
			// Vertical snap: left, right, horizontal center
			if (Math.abs(dr.left - r.left) < SNAP_THRESHOLD) {
				addGuide("v", r.left, r.top, r.bottom, guides);
			}
			if (Math.abs(dr.right - r.right) < SNAP_THRESHOLD) {
				addGuide("v", r.right, r.top, r.bottom, guides);
			}
			if (Math.abs(dr.left - r.right) < SNAP_THRESHOLD) {
				addGuide("v", r.right, r.top, r.bottom, guides);
			}
			if (Math.abs(dr.right - r.left) < SNAP_THRESHOLD) {
				addGuide("v", r.left, r.top, r.bottom, guides);
			}
		});
	}

	function addGuide(dir, pos, _a, _b, parent) {
		const el = document.createElement("div");
		el.className = "snap-guide " + dir;
		const cr = document
			.getElementById("canvas-container")
			.getBoundingClientRect();
		if (dir === "h") {
			el.style.top = pos - cr.top + "px";
		} else {
			el.style.left = pos - cr.left + "px";
		}
		el.style.opacity = "0.8";
		parent.appendChild(el);
	}

	function clearSnapGuides() {
		const parent = document.getElementById("snap-guides");
		if (parent) parent.innerHTML = "";
	}

	/* ═══ ACTIONS ═══ */
	function addComponent(type) {
		const def = COMPONENTS[type];
		if (!def) return;
		const id = nextId();
		const node = { id, type, props: { ...def.props }, children: [] };
		S.nodeNames[id] = genName(type);
		const sel =
			S.selectedIds.size === 1 ? findNode(S.tree, [...S.selectedIds][0]) : null;
		if (sel && isContainer(sel.type)) {
			sel.children = sel.children || [];
			sel.children.push(node);
		} else {
			S.tree.children.push(node);
		}
		S.selectedIds = new Set([id]);
		render();
		scheduleSave();
		pushHistory();
	}

	function selectComponent(id) {
		// Shift-click for multi-select
		if (window._shiftHeld) {
			if (S.selectedIds.has(id)) S.selectedIds.delete(id);
			else S.selectedIds.add(id);
		} else {
			S.selectedIds = new Set([id]);
		}
		render();
	}

	function deleteComponent(id) {
		if (id === "root") return;
		removeNode(S.tree, id);
		S.selectedIds.delete(id);
		if (S.selectedIds.size === 0 && S.tree.children.length > 0)
			S.selectedIds.add(S.tree.children[S.tree.children.length - 1].id);
		render();
		scheduleSave();
		pushHistory();
	}

	function duplicateComponent(id) {
		const node = findNode(S.tree, id);
		if (!node || node.type === "root") return;
		const parent = findParent(S.tree, id);
		if (!parent) return;
		const copy = JSON.parse(JSON.stringify(node));
		copy.id = nextId();
		(function walk(n) {
			S.nodeNames[n.id] = genName(n.type);
			for (const c of n.children || []) walk(c);
		})(copy);
		const idx = parent.children.findIndex((c) => c.id === id);
		parent.children.splice(idx + 1, 0, copy);
		S.selectedIds = new Set([copy.id]);
		render();
		scheduleSave();
		pushHistory();
		toast("Duplicated");
	}

	function toggleLayer(id) {
		// For now, just select. Collapse/expand would need per-node state
		selectComponent(id);
	}

	function toggleVisibility(id) {
		const node = findNode(S.tree, id);
		if (node) {
			node._hidden = !node._hidden;
			render();
			scheduleSave();
		}
	}

	function toggleLock(id) {
		const node = findNode(S.tree, id);
		if (node) {
			node._locked = !node._locked;
			render();
			scheduleSave();
		}
	}

	function addChild(parentId) {
		const parent = findNode(S.tree, parentId);
		if (!parent) return;
		S.selectedIds = new Set([parentId]);
		render();
		document.getElementById("palette-search") &&
			document.getElementById("palette-search").focus();
		toast("Click a palette item to add");
	}

	function updateProp(id, key, value) {
		const c = findNode(S.tree, id);
		if (!c) return;
		c.props[key] = value;
		render();
		scheduleSave();
		if (!_resizeInfo) pushHistory();
	}

	function clearAll() {
		if (totalComponents() === 0) return;
		S.tree.children = [];
		S.selectedIds.clear();
		render();
		scheduleSave();
	}

	function setTool(t) {
		S.tool = t;
		document.querySelectorAll(".tb-btn[data-tool]").forEach((b) => {
			b.classList.toggle("active", b.dataset.tool === t);
		});
		const container = document.getElementById("canvas-container");
		if (container) container.classList.toggle("hand-tool", t === "hand");
	}

	// Inline text editing
	function startEdit(id) {
		const node = findNode(S.tree, id);
		if (
			!node ||
			!["heading", "paragraph", "link", "blockquote", "inlineCode"].includes(
				node.type,
			)
		)
			return;
		const el = document.querySelector(
			`.canvas-component[data-id="${id}"] .canvas-component-body`,
		);
		if (!el) return;
		const txtEl = el.querySelector(
			".cp-heading, .cp-paragraph, .cp-link, .cp-blockquote",
		);
		if (!txtEl) return;
		_editInfo = { id, origText: node.props.text };
		txtEl.contentEditable = "true";
		txtEl.focus();
		// Select all text
		const range = document.createRange();
		range.selectNodeContents(txtEl);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		txtEl.addEventListener("blur", finishEdit);
		txtEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === "Escape") {
				e.preventDefault();
				txtEl.blur();
			}
		});
	}
	function finishEdit(e) {
		const el = e.target;
		el.contentEditable = "false";
		el.removeEventListener("blur", finishEdit);
		if (_editInfo) {
			const text = el.textContent.trim();
			if (text && text !== _editInfo.origText) {
				updateProp(_editInfo.id, "text", text);
				pushHistory();
			}
			_editInfo = null;
		}
	}

	// Master/Instance
	function createMaster(id) {
		const node = findNode(S.tree, id);
		if (!node) return;
		const masterId = "m" + Date.now();
		S.masters[masterId] = {
			id: masterId,
			type: node.type,
			props: JSON.parse(JSON.stringify(node.props)),
			children: JSON.parse(JSON.stringify(node.children || [])),
		};
		node._masterId = masterId;
		node._masterName = S.nodeNames[node.id];
		render();
		scheduleSave();
		pushHistory();
		toast("Master created");
	}
	function createInstance(masterId) {
		const master = S.masters[masterId];
		if (!master) return;
		const id = nextId();
		const node = {
			id,
			type: master.type,
			props: JSON.parse(JSON.stringify(master.props)),
			children: JSON.parse(JSON.stringify(master.children || [])),
			_masterId: masterId,
			_masterName: master.type,
		};
		S.nodeNames[id] = genName(master.type);
		S.tree.children.push(node);
		S.selectedIds = new Set([id]);
		render();
		scheduleSave();
		pushHistory();
		toast("Instance created");
	}
	// ponytail: retained for future master→instance sync, call manually after editing a master
	// function updateMasterInstances(masterId) { ... }
	function detachInstance(id) {
		const node = findNode(S.tree, id);
		if (!node) return;
		delete node._masterId;
		delete node._masterName;
		render();
		scheduleSave();
		pushHistory();
	}

	// Comments
	function addComment(text) {
		if (!text.trim()) return;
		const compId = S.selectedIds.size === 1 ? [...S.selectedIds][0] : "root";
		S.comments.push({
			id: "cmt" + Date.now(),
			compId,
			text: text.trim(),
			author: "User",
			resolved: false,
			createdAt: Date.now(),
		});
		render();
		scheduleSave();
	}
	function resolveComment(id) {
		const c = S.comments.find((c) => c.id === id);
		if (c) c.resolved = !c.resolved;
		renderComments();
		scheduleSave();
	}
	function deleteComment(id) {
		S.comments = S.comments.filter((c) => c.id !== id);
		renderComments();
		scheduleSave();
	}

	// Snapshots
	function saveSnapshot() {
		const id = "snap" + Date.now();
		S.snapshots.push({
			id,
			tree: JSON.parse(JSON.stringify(S.tree)),
			theme: JSON.parse(JSON.stringify(S.theme)),
			timestamp: Date.now(),
		});
		if (S.snapshots.length > 20) S.snapshots.shift();
		scheduleSave();
		toast("Snapshot saved");
	}
	function restoreSnapshot(id) {
		const snap = S.snapshots.find((s) => s.id === id);
		if (!snap) return;
		S.tree = JSON.parse(JSON.stringify(snap.tree));
		S.theme = JSON.parse(JSON.stringify(snap.theme));
		S.selectedIds.clear();
		syncThemeUI();
		render();
		scheduleSave();
		pushHistory();
		closeSnapshots();
		toast("Snapshot restored");
	}
	function openSnapshots() {
		const modal = document.getElementById("snapshots-modal");
		if (!modal) return;
		modal.style.display = "flex";
		const list = document.getElementById("snapshots-list");
		if (!list) return;
		if (S.snapshots.length === 0) {
			list.innerHTML = '<p class="muted">No snapshots yet</p>';
			return;
		}
		list.innerHTML = S.snapshots
			.slice()
			.reverse()
			.map(
				(s) =>
					`<div class="snap-item"><div><div class="snap-name">Snapshot ${new Date(s.timestamp).toLocaleString()}</div><div class="snap-date">${countNodes(s.tree) - 1} components</div></div><button class="btn-sm" onclick="UI.restoreSnapshot('${s.id}')">Restore</button></div>`,
			)
			.join("");
	}
	function closeSnapshots() {
		const modal = document.getElementById("snapshots-modal");
		if (modal) modal.style.display = "none";
	}

	// Toggle code panel / preview
	let _codeVisible = false;
	function toggleCode() {
		_codeVisible = !_codeVisible;
		const panel = document.getElementById("panel-code-output-panel");
		const sbTab = document.querySelector(
			'.sb-tab[data-panel="code-output-panel"]',
		);
		if (panel) {
			panel.classList.toggle("active", _codeVisible);
			if (_codeVisible) {
				renderCode();
				showPreview();
			}
		}
		if (sbTab) sbTab.classList.toggle("active", _codeVisible);
	}
	function showPreview() {
		const container = document.getElementById("preview-frame-container");
		const frame = document.getElementById("preview-frame");
		if (!container || !frame) return;
		container.style.display = "block";
		const code = generateCode();
		// Wrap in minimal HTML for iframe
		const t = S.theme;
		frame.srcdoc =
			S.format === "html"
				? code
				: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${t.font};background:${t.dark ? "#1e1e1e" : t.bg};color:${t.dark ? "#e2e4f0" : t.text};padding:16px}</style></head><body>${code}</body></html>`;
	}

	/* ═══ TABS ═══ */
	function switchTab(panelId) {
		document
			.querySelectorAll(".sb-panel")
			.forEach((p) => p.classList.remove("active"));
		document
			.querySelectorAll(".sb-tab")
			.forEach((t) => t.classList.remove("active"));
		const panel = document.getElementById("panel-" + panelId);
		const tab = document.querySelector(`.sb-tab[data-panel="${panelId}"]`);
		if (panel) panel.classList.add("active");
		if (tab) tab.classList.add("active");
		if (panelId === "code-output-panel") {
			renderCode();
			showPreview();
		}
	}

	/* ═══ TOAST ═══ */
	function toast(msg) {
		const el = document.createElement("div");
		el.className = "toast";
		el.textContent = msg;
		document.body.appendChild(el);
		setTimeout(() => el.remove(), 2000);
	}

	/* ═══ THEME ═══ */
	function applyThemeCSS() {
		const root = document.documentElement;
		root.style.setProperty("--accent", S.theme.primary);
		root.style.setProperty("--accent2", S.theme.secondary);
		root.style.setProperty("--accent-rgb", hexToRgb(S.theme.primary));
		root.style.setProperty("--radius", RADIUS[S.theme.radius] || "6px");
		document.documentElement.setAttribute(
			"data-theme",
			S.theme.dark ? "dark" : "light",
		);
	}
	function hexToRgb(h) {
		const r = parseInt(h.slice(1, 3), 16),
			g = parseInt(h.slice(3, 5), 16),
			b = parseInt(h.slice(5, 7), 16);
		return isNaN(r) ? "13,153,255" : `${r},${g},${b}`;
	}
	function updateThemeFromUI() {
		const g = (id) => document.getElementById(id);
		S.theme.primary = g("theme-primary").value;
		S.theme.bg = g("theme-bg").value;
		S.theme.text = g("theme-text").value;
		S.theme.spacing = g("theme-spacing").value;
		S.theme.radius = g("theme-radius").value;
		S.theme.font = g("theme-font").value;
		S.theme.dark = g("theme-dark").checked;
		applyThemeCSS();
		render();
		scheduleSave();
	}
	function syncThemeUI() {
		const g = (id) => document.getElementById(id);
		g("theme-primary").value = S.theme.primary;
		g("theme-bg").value = S.theme.bg;
		g("theme-text").value = S.theme.text;
		g("theme-spacing").value = S.theme.spacing;
		g("theme-radius").value = S.theme.radius;
		g("theme-font").value = S.theme.font;
		g("theme-dark").checked = S.theme.dark;
		applyThemeCSS();
	}

	/* ═══ SAVE / LOAD ═══ */
	function scheduleSave() {
		clearTimeout(_saveTimer);
		_saveTimer = setTimeout(saveDesign, 500);
	}
	async function saveDesign() {
		const html = generateCode();
		const design = getDesignJSON();
		try {
			const res = await fetch("/api/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ design, html }),
			});
			const status = document.getElementById("save-status");
			if (res.ok) {
				status.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Saved';
				setTimeout(() => {
					status.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Auto';
				}, 2000);
			} else {
				status.innerHTML = "⚠ Failed";
			}
		} catch {
			document.getElementById("save-status") &&
				(document.getElementById("save-status").innerHTML = "⚠ Failed");
		}
	}
	function getDesignJSON() {
		// Strip runtime-only fields from tree
		const clean = JSON.parse(JSON.stringify(S.tree));
		(function walk(n) {
			delete n._hidden;
			delete n._locked;
			for (const c of n.children || []) walk(c);
		})(clean);
		return {
			tree: clean,
			theme: S.theme,
			masters: S.masters,
			comments: S.comments,
			snapshots: S.snapshots,
			nodeNames: S.nodeNames,
			nodeNameCounts: S.nodeNameCounts,
			nextId: S.nextId,
			assets: S.assets,
		};
	}
	function exportDesign() {
		saveDesign().then(() => toast("Exported to .ui-design/"));
	}

	function initHistory() {
		_history = [];
		_historyPtr = -1;
		pushHistory();
	}

	/* ═══ INIT ═══ */
	document.addEventListener("DOMContentLoaded", () => {
		applyThemeCSS();

		// Bind UI events
		document
			.getElementById("palette-search")
			?.addEventListener("input", renderPalette);
		document
			.getElementById("layer-search")
			?.addEventListener("input", filterLayers);
		document.getElementById("btn-clear")?.addEventListener("click", clearAll);
		document
			.getElementById("btn-export")
			?.addEventListener("click", exportDesign);
		document.getElementById("btn-undo")?.addEventListener("click", undo);
		document.getElementById("btn-redo")?.addEventListener("click", redo);
		document.getElementById("btn-duplicate")?.addEventListener("click", () => {
			if (S.selectedIds.size === 1) duplicateComponent([...S.selectedIds][0]);
			else toast("Select one component to duplicate");
		});
		document.getElementById("btn-copy")?.addEventListener("click", copyCode);
		document
			.getElementById("btn-snapshots")
			?.addEventListener("click", openSnapshots);

		// Sidebar tabs
		document.querySelectorAll(".sb-tab").forEach((tab) => {
			tab.addEventListener("click", () => {
				switchTab(tab.dataset.panel);
				if (tab.dataset.panel === "assets") renderAssets();
			});
		});

		// Comment input
		document
			.getElementById("comment-input")
			?.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					UI.addComment(e.target.value);
					e.target.value = "";
				}
			});

		// Format & style mode
		document.getElementById("code-format")?.addEventListener("change", (e) => {
			S.format = e.target.value;
			renderCode();
			showPreview();
		});
		document.getElementById("code-style")?.addEventListener("change", (e) => {
			S.styleMode = e.target.value;
			renderCode();
		});

		// Theme inputs
		[
			"theme-primary",
			"theme-bg",
			"theme-text",
			"theme-spacing",
			"theme-radius",
			"theme-font",
			"theme-dark",
		].forEach((id) => {
			const el = document.getElementById(id);
			if (el) {
				el.addEventListener("input", updateThemeFromUI);
				el.addEventListener("change", updateThemeFromUI);
			}
		});

		// Palette drag
		setupPaletteDrag();

		// Canvas events
		setupCanvasEvents();

		// Keyboard shortcuts
		document.addEventListener("keydown", (e) => {
			window._shiftHeld = e.shiftKey;
			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				if (e.shiftKey) redo();
				else undo();
				e.preventDefault();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "d") {
				if (S.selectedIds.size === 1) duplicateComponent([...S.selectedIds][0]);
				e.preventDefault();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "g") {
				if (e.shiftKey) {
					// Ungroup: expand selected containers' children into parent
					const nodes = getSelectedNodes();
					nodes.forEach((node) => {
						if (!isContainer(node.type) || !node.children?.length) return;
						const parent = findParent(S.tree, node.id);
						if (!parent) return;
						const idx = parent.children.indexOf(node);
						parent.children.splice(idx, 1, ...node.children);
					});
				} else if (S.selectedIds.size > 1) {
					// Group: wrap selected in a container
					const selIds = [...S.selectedIds];
					const parent = findParent(S.tree, selIds[0]);
					if (!parent) return;
					const groupId = nextId();
					const nodes = selIds
						.map((id) => {
							const idx = parent.children.findIndex((c) => c.id === id);
							return idx !== -1 ? parent.children.splice(idx, 1)[0] : null;
						})
						.filter(Boolean);
					const group = {
						id: groupId,
						type: "container",
						props: { padding: true },
						children: nodes,
					};
					S.nodeNames[groupId] = "Group";
					parent.children.push(group);
					S.selectedIds = new Set([groupId]);
				}
				render();
				scheduleSave();
				pushHistory();
				e.preventDefault();
			}
			if (e.key === "Delete" || e.key === "Backspace") {
				if (
					S.selectedIds.size > 0 &&
					!e.target.closest("input,textarea,select")
				) {
					const ids = [...S.selectedIds];
					ids.forEach((id) => deleteComponent(id));
					e.preventDefault();
				}
			}
			if (e.key === "Escape") {
				S.selectedIds.clear();
				render();
			}
			// Tool shortcuts
			if (!e.target.closest("input,textarea,select")) {
				if (e.key === "v") setTool("select");
				if (e.key === "h") setTool("hand");
				if (e.key === "f") setTool("frame");
				if (e.key === "t") setTool("text");
				if (e.key === "r") setTool("rect");
				if (e.key === "o") setTool("ellipse");
				if (e.key === "l") setTool("line");
				if (e.key === "+" || e.key === "=") {
					zoomTo(1);
					e.preventDefault();
				}
				if (e.key === "-") {
					zoomTo(-1);
					e.preventDefault();
				}
				if (e.key === "0") {
					zoomTo(0);
					e.preventDefault();
				}
				if (e.key === "1") {
					zoomTo(1);
					e.preventDefault();
				}
			}
		});
		document.addEventListener("keyup", (e) => {
			if (e.key === "Shift") window._shiftHeld = false;
		});

		// Canvas component drag
		setupCanvasDragDrop();

		// Load saved state
		fetch("/api/state")
			.then((r) => r.json())
			.then((data) => {
				if (data.tree?.children?.length > 0) {
					S.tree = data.tree;
					let maxId = 0;
					S.nodeNames = {};
					S.nodeNameCounts = {};
					(function walk(node) {
						if (node.id?.startsWith("c")) {
							maxId = Math.max(maxId, parseInt(node.id.slice(1)) || 0);
							if (!S.nodeNames[node.id])
								S.nodeNames[node.id] = genName(node.type);
						}
						for (const c of node.children || []) walk(c);
					})(S.tree);
					S.nextId = maxId + 1;
				} else if (data.components?.length > 0) {
					S.tree.children = data.components.map((c) => ({
						id: c.id,
						type: c.type,
						props: { ...c.props },
						children: [],
					}));
					S.nextId =
						Math.max(
							...data.components.map((c) => parseInt(c.id.slice(1)) || 0),
							0,
						) + 1;
				}
				if (data.theme) {
					Object.assign(S.theme, data.theme);
					syncThemeUI();
				}
				if (data.masters) S.masters = data.masters;
				if (data.comments) S.comments = data.comments;
				if (data.snapshots) S.snapshots = data.snapshots;
				if (data.nodeNames) S.nodeNames = data.nodeNames;
				if (data.nodeNameCounts) S.nodeNameCounts = data.nodeNameCounts;
				if (data.assets) S.assets = data.assets;
				if (data.nextId) S.nextId = data.nextId;
				render();
				initHistory();
			})
			.catch(() => {
				render();
				initHistory();
			});
	});

	// Palette render
	function renderPalette() {
		const container = document.getElementById("palette-categories");
		if (!container) return;
		const q = (document.getElementById("palette-search")?.value || "").toLowerCase();
		const cats = {};
		for (const [type, def] of Object.entries(COMPONENTS)) {
			if (q && !def.label.toLowerCase().includes(q) && !def.cat.toLowerCase().includes(q)) continue;
			if (!cats[def.cat]) cats[def.cat] = [];
			cats[def.cat].push({ type, ...def });
		}
		container.innerHTML = Object.entries(cats).map(([cat, items]) =>
			`<div class="palette-category"><h4>${cat}</h4><div class="palette-grid">${items.map(item => {
				const preview = renderPreview(item.type, item.props, "");
				return `<div class="palette-item" draggable="true" data-type="${item.type}" onclick="UI.addComponent('${item.type}')">
					<div class="palette-preview">${preview}</div>
					<span class="label">${item.label}</span>
				</div>`;
			}).join("")}</div></div>`
		).join("");
	}

	/* ═══ ASSETS TAB (uploaded images + built-in SVG icons) ═══ */
	function renderAssets() {
		const panel = document.getElementById("panel-assets");
		if (!panel || !panel.classList.contains("active")) return;
		renderPalette();
		const catContainer = document.getElementById("palette-categories");
		if (!catContainer) return;
		const uploads = S.assets.length ? S.assets.map(a =>
			`<div class="asset-item" draggable="true" data-asset-id="${a.id}" onclick="UI.addAssetToCanvas('${a.id}')">
				<div class="asset-preview"><img src="${a.dataUrl}" alt="${esc(a.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:3px"></div>
				<span class="label">${esc(a.name)}</span>
			</div>`
		).join("") : "";
		const iconRows = BUILTIN_ICONS.map(icon =>
			`<div class="asset-item" draggable="true" data-icon-name="${icon.name}" onclick="UI.addIconToCanvas('${icon.name}')">
				<div class="asset-preview icon-preview" style="padding:4px;display:flex;align-items:center;justify-content:center;color:var(--accent)">${icon.svg}</div>
				<span class="label">${icon.name}</span>
			</div>`
		).join("");
		catContainer.insertAdjacentHTML("afterbegin",
			`<div class="palette-category"><h4><i class="fa-regular fa-upload"></i> My Assets</h4><div class="palette-grid asset-grid">${uploads}<div class="asset-item upload-trigger" onclick="UI.uploadAsset()"><div class="asset-preview" style="display:flex;align-items:center;justify-content:center;border:2px dashed var(--border);border-radius:4px"><i class="fa-regular fa-plus" style="font-size:18px;color:var(--text-muted)"></i></div><span class="label">Upload</span></div></div></div>` +
			`<div class="palette-category"><h4><i class="fa-regular fa-icons"></i> Icons</h4><div class="palette-grid icon-grid">${iconRows}</div></div>`
		);
	}

	function filterLayers() {
		const q = (
			document.getElementById("layer-search")?.value || ""
		).toLowerCase();
		document.querySelectorAll("#layers-list .layer-item").forEach((el) => {
			const name =
				el.querySelector(".ll-name")?.textContent?.toLowerCase() || "";
			el.style.display = name.includes(q) ? "" : "none";
		});
	}

	// Palette drag to canvas
	function setupPaletteDrag() {
		document.addEventListener("dragstart", (e) => {
			const item = e.target.closest(".palette-item");
			const asset = e.target.closest(".asset-item");
			const comp = e.target.closest(".canvas-component");
			// Asset item (image or icon) — trigger click handler instead of drag
			if (asset && !item) {
				asset.classList.add("dragging");
				_dragInfo = { source: "asset", el: asset, isDragging: true };
				e.dataTransfer.effectAllowed = "copy";
				return;
			}
			if (item) {
				const id = comp.dataset.id;
				_dragInfo = { source: "canvas", id, isDragging: true };
				comp.classList.add("dragging");
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", id);
			}
		});
		document.addEventListener("dragend", () => {
			document
				.querySelectorAll(
					".dragging,.drag-over,.drag-over-canvas,.childzone-active",
				)
				.forEach((el) =>
					el.classList.remove(
						"dragging",
						"drag-over",
						"drag-over-canvas",
						"childzone-active",
					),
				);
			clearSnapGuides();
			_dragInfo = null;
		});
	}

	function setupCanvasDragDrop() {
		const canvas = document.getElementById("canvas-container");
		if (!canvas) return;
		canvas.addEventListener("dragover", (e) => {
			if (!_dragInfo) return;
			e.preventDefault();
			canvas.classList.add("drag-over-canvas");
			e.dataTransfer.dropEffect =
				_dragInfo.source === "palette" ? "copy" : "move";
			// Highlight child zones
			const childZones = canvas.querySelectorAll(".canvas-childzone");
			childZones.forEach((zone) => {
				const zr = zone.getBoundingClientRect();
				if (
					e.clientX >= zr.left &&
					e.clientX <= zr.right &&
					e.clientY >= zr.top &&
					e.clientY <= zr.bottom
				) {
					zone.classList.add("childzone-active");
					_dragInfo.dropParentId = zone.dataset.parent;
				} else zone.classList.remove("childzone-active");
			});
			if (!_dragInfo.dropParentId) _dragInfo.dropParentId = null;

			// Also show drop zone at root level if hovering near bottom
			const dropZone = document.getElementById("canvas-drop-zone");
			if (dropZone) {
				const dzr = dropZone.getBoundingClientRect();
				dropZone.style.display =
					e.clientY >= dzr.top && e.clientY <= dzr.bottom ? "flex" : "none";
			}
		});

		canvas.addEventListener("drop", (e) => {
			e.preventDefault();
			canvas.classList.remove("drag-over-canvas");
			document
				.querySelectorAll(".drag-over,.childzone-active")
				.forEach((el) => el.classList.remove("drag-over", "childzone-active"));
			document.getElementById("canvas-drop-zone") &&
				(document.getElementById("canvas-drop-zone").style.display = "none");
			if (!_dragInfo) return;

			if (_dragInfo.source === "palette") {
				const type = _dragInfo.type;
				const def = COMPONENTS[type];
				if (!def) return;
				const id = nextId();
				const node = { id, type, props: { ...def.props }, children: [] };
				S.nodeNames[id] = genName(type);
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
				if (!srcId || srcId === "root") return;
				const srcParent = findParent(S.tree, srcId);
				if (!srcParent || !srcParent.children) return;
				const idx = srcParent.children.findIndex((x) => x.id === srcId);
				if (idx === -1) return;
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
			}
			_dragInfo = null;
		});
	}

	function copyCode() {
		const code = generateCode();
		navigator.clipboard
			.writeText(code)
			.then(() => toast("Copied!"))
			.catch(() => {
				const buf = document.getElementById("copy-buffer");
				buf.value = code;
				buf.select();
				document.execCommand("copy");
				toast("Copied!");
			});
	}

	/* ═══ ASSET UPLOAD & ADD ═══ */
	function uploadAsset() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e) => {
			const file = e.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				S.assets.push({ id: "a" + Date.now(), name: file.name, dataUrl: reader.result, type: "image" });
				render();
				toast("Asset added");
			};
			reader.readAsDataURL(file);
		};
		input.click();
	}
	function addAssetToCanvas(assetId) {
		const asset = S.assets.find(a => a.id === assetId);
		if (!asset) return;
		const id = nextId();
		const node = { id, type: "image", props: { alt: asset.name, src: asset.dataUrl, width: "200px", height: "160px" }, children: [] };
		S.nodeNames[id] = asset.name;
		const sel = S.selectedIds.size === 1 ? findNode(S.tree, [...S.selectedIds][0]) : null;
		if (sel && isContainer(sel.type)) { sel.children.push(node); }
		else { S.tree.children.push(node); }
		S.selectedIds = new Set([id]);
		render(); scheduleSave(); pushHistory();
	}
	function addIconToCanvas(iconName) {
		const icon = BUILTIN_ICONS.find(i => i.name === iconName);
		if (!icon) return;
		const id = nextId();
		const node = { id, type: "icon", props: { symbol: icon.svg, size: "24px" }, children: [] };
		S.nodeNames[id] = iconName;
		S.tree.children.push(node);
		S.selectedIds = new Set([id]);
		render(); scheduleSave(); pushHistory();
	}

	/* ═══ PUBLIC API ═══ */
	return {
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
		// For access from HTML onclick
		state: S,
	};
})();
