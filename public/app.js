/* ===== STATE ===== */
const state = {
	tree: { id: "root", type: "root", children: [] },
	selectedId: null,
	nextId: 1,
	theme: {
		primary: "#024345",
		secondary: "#03706b",
		bg: "#ffffff",
		text: "#1f2937",
		spacing: "normal",
		radius: "md",
		font: "Inter, sans-serif",
		dark: true,
	},
	format: "html",
};
let saveTimer = null;

const RADIUS = { none: "0", sm: "4px", md: "8px", lg: "12px", xl: "16px" };
const SPACING = { compact: ".5rem", normal: "1rem", spacious: "2rem" };
const CONTAINER_TYPES = new Set([
	"container",
	"flexRow",
	"flexCol",
	"grid",
	"sidebar",
	"root",
]);

/* ===== TREE HELPERS ===== */
function findNode(node, id) {
	if (node.id === id) return node;
	for (const c of node.children || []) {
		const found = findNode(c, id);
		if (found) return found;
	}
	return null;
}

function findParent(node, id) {
	for (const c of node.children || []) {
		if (c.id === id) return node;
		const found = findParent(c, id);
		if (found) return found;
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
	return countNodes(state.tree) - 1; // exclude root
}

function getChildren(node) {
	return node.children || [];
}

/* ===== COMPONENT DEFINITIONS ===== */
const COMPONENTS = {
	container: {
		cat: "Layout",
		label: "Container",
		icon: "▣",
		props: { padding: true },
	},
	flexRow: {
		cat: "Layout",
		label: "Flex Row",
		icon: "⇉",
		props: { gap: "16px", justify: "start", align: "center" },
	},
	flexCol: {
		cat: "Layout",
		label: "Flex Col",
		icon: "⇊",
		props: { gap: "12px", align: "stretch" },
	},
	grid: {
		cat: "Layout",
		label: "Grid",
		icon: "⊞",
		props: { cols: 3, gap: "16px" },
	},
	divider: {
		cat: "Layout",
		label: "Divider",
		icon: "—",
		props: { text: "Section", vertical: false },
	},
	spacer: {
		cat: "Layout",
		label: "Spacer",
		icon: "⤢",
		props: { height: "24px" },
	},
	sidebar: {
		cat: "Layout",
		label: "Sidebar",
		icon: "▐",
		props: {
			items: "Dashboard,Analytics,Settings,Profile",
			active: "Dashboard",
		},
	},
	heading: {
		cat: "Typography",
		label: "Heading",
		icon: "H",
		props: { level: "h2", text: "Heading Text" },
	},
	paragraph: {
		cat: "Typography",
		label: "Paragraph",
		icon: "¶",
		props: { text: "This is a paragraph of text. Click to edit." },
	},
	link: {
		cat: "Typography",
		label: "Link",
		icon: "🔗",
		props: { text: "Click here", href: "#" },
	},
	blockquote: {
		cat: "Typography",
		label: "Blockquote",
		icon: "❝",
		props: { text: "A notable quote or testimonial." },
	},
	inlineCode: {
		cat: "Typography",
		label: "Inline Code",
		icon: "<>",
		props: { text: "npm install ui-design" },
	},
	btnPrimary: {
		cat: "Buttons",
		label: "Primary Btn",
		icon: "▣",
		props: { text: "Get Started" },
	},
	btnSecondary: {
		cat: "Buttons",
		label: "Secondary Btn",
		icon: "▣",
		props: { text: "Learn More" },
	},
	btnOutline: {
		cat: "Buttons",
		label: "Outline Btn",
		icon: "▢",
		props: { text: "Cancel" },
	},
	btnGhost: {
		cat: "Buttons",
		label: "Ghost Btn",
		icon: "▢",
		props: { text: "Dismiss" },
	},
	btnGroup: {
		cat: "Buttons",
		label: "Button Group",
		icon: "◫",
		props: { items: "Left,Center,Right", active: "Center" },
	},
	input: {
		cat: "Forms",
		label: "Input",
		icon: "⌨",
		props: { placeholder: "Enter text...", label: "Name" },
	},
	textarea: {
		cat: "Forms",
		label: "Textarea",
		icon: "≡",
		props: { placeholder: "Enter details...", label: "Message" },
	},
	select: {
		cat: "Forms",
		label: "Select",
		icon: "▼",
		props: { label: "Choose", options: "Option 1,Option 2,Option 3" },
	},
	checkbox: {
		cat: "Forms",
		label: "Checkbox",
		icon: "☑",
		props: { label: "Accept terms", checked: false },
	},
	radioGroup: {
		cat: "Forms",
		label: "Radio Group",
		icon: "◉",
		props: { label: "Plan", options: "Free,Pro,Enterprise", selected: "Pro" },
	},
	toggle: {
		cat: "Forms",
		label: "Toggle Switch",
		icon: "⬤",
		props: { label: "Notifications", on: true },
	},
	rangeSlider: {
		cat: "Forms",
		label: "Range Slider",
		icon: "≡",
		props: { label: "Volume", value: 60, min: 0, max: 100 },
	},
	image: {
		cat: "Media",
		label: "Image",
		icon: "🖼",
		props: { alt: "Placeholder", width: "100%", height: "160px" },
	},
	avatar: {
		cat: "Media",
		label: "Avatar",
		icon: "◎",
		props: { initials: "JD", name: "Jane Doe", role: "Designer" },
	},
	icon: {
		cat: "Media",
		label: "Icon",
		icon: "✦",
		props: { symbol: "★", size: "32px" },
	},
	navbar: {
		cat: "Navigation",
		label: "Navbar",
		icon: "☰",
		props: { brand: "Brand", items: "Home,About,Pricing,Contact" },
	},
	tabs: {
		cat: "Navigation",
		label: "Tabs",
		icon: "📑",
		props: { items: "Tab 1,Tab 2,Tab 3", active: "Tab 1" },
	},
	breadcrumb: {
		cat: "Navigation",
		label: "Breadcrumb",
		icon: "›",
		props: { items: "Home,Products,Details", current: "Details" },
	},
	pagination: {
		cat: "Navigation",
		label: "Pagination",
		icon: "≪",
		props: { total: 5, current: 3 },
	},
	dropdown: {
		cat: "Navigation",
		label: "Dropdown",
		icon: "⏷",
		props: { trigger: "Menu", items: "Profile,Settings,Logout" },
	},
	card: {
		cat: "Cards",
		label: "Card",
		icon: "▭",
		props: {
			header: "Card Title",
			body: "Card content goes here.",
			footer: "Footer text",
		},
	},
	pricingCard: {
		cat: "Cards",
		label: "Pricing Card",
		icon: "💳",
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
		icon: "⚠",
		props: { variant: "info", text: "Informational message." },
	},
	badge: {
		cat: "Feedback",
		label: "Badge",
		icon: "⬟",
		props: { variant: "primary", text: "New" },
	},
	progress: {
		cat: "Feedback",
		label: "Progress Bar",
		icon: "▨",
		props: { value: 65, label: "65% complete" },
	},
	spinner: {
		cat: "Feedback",
		label: "Spinner",
		icon: "⟳",
		props: { text: "Loading..." },
	},
	toast: {
		cat: "Feedback",
		label: "Toast",
		icon: "💬",
		props: { text: "Changes saved!", variant: "success" },
	},
	skeleton: {
		cat: "Feedback",
		label: "Skeleton",
		icon: "▯",
		props: { lines: 3, width: "100%" },
	},
	tooltip: {
		cat: "Feedback",
		label: "Tooltip",
		icon: "💡",
		props: { trigger: "Hover me", text: "Helpful tip here" },
	},
	list: {
		cat: "Data",
		label: "List",
		icon: "☰",
		props: { items: "Item one,Item two,Item three" },
	},
	table: {
		cat: "Data",
		label: "Table",
		icon: "⊞",
		props: {
			headers: "Name,Role,Status",
			rows: "Alice,Admin,Active|Bob,User,Pending|Carol,Editor,Active",
		},
	},
	accordion: {
		cat: "Data",
		label: "Accordion",
		icon: "≡",
		props: {
			items:
				"Section 1~Content one.|Section 2~Content two.|Section 3~Content three.",
		},
	},
	stats: {
		cat: "Data",
		label: "Stats",
		icon: "📊",
		props: { items: "Users~2,400,Revenue~$12K,Active~89%" },
	},
	hero: {
		cat: "Sections",
		label: "Hero",
		icon: "★",
		props: {
			title: "Build Something Great",
			subtitle: "A clean, modern platform for your next project.",
			cta: "Get Started",
		},
	},
	footer: {
		cat: "Sections",
		label: "Footer",
		icon: "⎔",
		props: { text: "© 2026 Your Company. All rights reserved." },
	},
	testimonial: {
		cat: "Sections",
		label: "Testimonial",
		icon: "💬",
		props: {
			quote: "This product transformed our workflow. Highly recommended!",
			author: "Alex Chen",
			role: "CEO, Startup Co.",
		},
	},
	modal: {
		cat: "Sections",
		label: "Modal Dialog",
		icon: "⬜",
		props: {
			title: "Confirm Action",
			body: "Are you sure you want to proceed?",
			cancel: "Cancel",
			confirm: "Confirm",
		},
	},
};

/* ===== ESCAPE ===== */
function esc(s) {
	return String(s || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/* ===== RENDERER (canvas preview) ===== */
function renderPreview(type, p, childrenHtml) {
	const t = state.theme;
	const r = RADIUS[t.radius] || "8px";
	const s = SPACING[t.spacing] || "1rem";

	if (type === "root") return childrenHtml || "";

	// Container types: render wrapper with children inside
	if (type === "container")
		return `<div class="cp-container" style="padding:${s};border:1px solid var(--border);border-radius:${r}"><div style="font-size:10px;color:var(--text2);opacity:.5;margin-bottom:6px">▣ Container</div>${childrenHtml || '<span style="color:var(--text2);font-size:11px;opacity:.4">drop components here</span>'}</div>`;
	if (type === "flexRow")
		return `<div class="cp-flex row" style="gap:${p.gap};padding:${s};border:1px dashed var(--border);border-radius:${r}">${childrenHtml || '<span style="color:var(--text2);font-size:11px;opacity:.4">⇉ flex row</span>'}</div>`;
	if (type === "flexCol")
		return `<div class="cp-flex col" style="gap:${p.gap};padding:${s};border:1px dashed var(--border);border-radius:${r}">${childrenHtml || '<span style="color:var(--text2);font-size:11px;opacity:.4">⇊ flex col</span>'}</div>`;
	if (type === "grid")
		return `<div class="cp-grid" style="grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap};padding:${s};border:1px dashed var(--border);border-radius:${r}">${childrenHtml || '<span style="color:var(--text2);font-size:11px;opacity:.4">⊞ grid</span>'}</div>`;
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
			)}</div><div class="main" style="padding:${s}">${childrenHtml || '<span style="color:var(--text2);font-size:11px;opacity:.4">main content</span>'}</div></div>`;

	// Non-container types: same as before
	switch (type) {
		case "divider":
			return p.vertical
				? `<div class="cp-divider vertical" style="height:60px"><hr></div>`
				: `<div class="cp-divider"><hr><span>${esc(p.text)}</span><hr></div>`;
		case "spacer":
			return `<div style="height:${p.height};background:repeating-linear-gradient(90deg,var(--border),var(--border) 4px,transparent 4px,transparent 8px);border-radius:2px"></div>`;
		case "heading":
			return `<div class="cp-heading ${p.level}" style="color:${t.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.text)}</div>`;
		case "paragraph":
			return `<div class="cp-paragraph">${esc(p.text)}</div>`;
		case "link":
			return `<span class="cp-link">${esc(p.text)}</span>`;
		case "blockquote":
			return `<div class="cp-blockquote">${esc(p.text)}</div>`;
		case "inlineCode":
			return `<code style="background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:12px">${esc(p.text)}</code>`;
		case "btnPrimary":
			return `<button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnSecondary":
			return `<button class="cp-btn secondary" style="background:${t.secondary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnOutline":
			return `<button class="cp-btn outline" style="border-color:${t.primary};color:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnGhost":
			return `<button style="padding:8px 20px;border-radius:${r};font-size:14px;font-weight:500;border:none;background:transparent;color:var(--text)">${esc(p.text)}</button>`;
		case "btnGroup":
			return `<div style="display:inline-flex;border:1px solid var(--border);border-radius:${r};overflow:hidden">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<span style="padding:6px 14px;font-size:12px;border-right:1px solid var(--border);${i.trim() === p.active ? "background:var(--accent);color:#fff" : ""}">${i.trim()}</span>`,
				)
				.join("")}</div>`;
		case "input":
			return `<div><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${esc(p.label || "")}</div><input class="cp-input" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></div>`;
		case "textarea":
			return `<div><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${esc(p.label || "")}</div><textarea class="cp-textarea" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></textarea></div>`;
		case "select":
			return `<div><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${esc(p.label || "")}</div><select class="cp-select" style="border-radius:${r}">${(
				p.options || ""
			)
				.split(",")
				.map((o) => `<option>${o.trim()}</option>`)
				.join("")}</select></div>`;
		case "checkbox":
			return `<label class="cp-checkbox"><input type="checkbox" ${p.checked ? "checked" : ""}> ${esc(p.label)}</label>`;
		case "radioGroup":
			return `<div class="cp-radio-group"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${esc(p.label || "")}</div>${(
				p.options || ""
			)
				.split(",")
				.map(
					(o) =>
						`<label><input type="radio" name="rg_${p.label || "rg"}" ${o.trim() === p.selected ? "checked" : ""}> ${o.trim()}</label>`,
				)
				.join("")}</div>`;
		case "toggle":
			return `<div class="cp-toggle"><div class="track ${p.on ? "on" : ""}"><div class="thumb"></div></div><span>${esc(p.label)}</span></div>`;
		case "rangeSlider":
			return `<div style="display:flex;flex-direction:column;gap:4px"><div style="font-size:11px;color:var(--text2)">${esc(p.label)}</div><input type="range" min="${p.min}" max="${p.max}" value="${p.value}" style="accent-color:${t.primary};width:100%"><span style="font-size:11px;color:var(--text2)">${p.value}%</span></div>`;
		case "image":
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
			return `<div class="cp-pagination">${"<button>‹</button>" + Array.from({ length: Math.min(p.total, 5) }, (_, i) => `<button${i + 1 === p.current ? ' class="active"' : ""}>${i + 1}</button>`).join("") + "<button>›</button>"}</div>`;
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
			return `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:${r};font-size:12px;background:var(--green);color:var(--bg);max-width:280px;box-shadow:var(--shadow)">✓ ${esc(p.text)}</div>`;
		case "skeleton":
			return `<div style="display:flex;flex-direction:column;gap:8px;width:${p.width}">${Array.from({ length: Math.min(p.lines, 5) }, (_, i) => `<div style="height:12px;border-radius:${r};background:linear-gradient(90deg,var(--bg3) 25%,var(--border) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;width:${[100, 85, 90, 70, 95][i] || 100}%"></div>`).join("")}</div>`;
		case "tooltip":
			return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:4px"><span style="font-size:13px;border-bottom:1px dashed var(--text2)">${esc(p.trigger)}</span><span style="font-size:11px;padding:4px 8px;border-radius:${r};background:var(--bg3);color:var(--text2)">${esc(p.text)}</span></div>`;
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
					return `<div class="item"><div class="item-header">${esc(i || "")} <span style="color:var(--text2)">▾</span></div><div class="item-body">${esc(b || "")}</div></div>`;
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
			return `<div class="cp-hero"><h1 style="font-size:2.5rem;font-weight:800;color:${t.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.title)}</h1><p>${esc(p.subtitle)}</p><button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.cta)}</button></div>`;
		case "footer":
			return `<div class="cp-footer">${esc(p.text)}</div>`;
		case "testimonial":
			return `<div class="cp-testimonial"><div class="quote">"${esc(p.quote)}"</div><div class="author">${esc(p.author)}</div><div class="role">${esc(p.role)}</div></div>`;
		case "modal":
			return `<div class="cp-modal" style="border-radius:${r}"><div class="cp-modal-header"><span>${esc(p.title)}</span><span style="color:var(--text2);font-size:16px;cursor:default">✕</span></div><div class="cp-modal-body">${esc(p.body)}</div><div class="cp-modal-footer"><span style="padding:6px 14px;border:1px solid var(--border);border-radius:${r};font-size:12px">${esc(p.cancel)}</span><span style="padding:6px 14px;background:${t.primary};color:#fff;border-radius:${r};font-size:12px">${esc(p.confirm)}</span></div></div>`;
		default:
			return `<div style="color:var(--text2)">${type}</div>`;
	}
}

/* ===== TREE-TO-HTML HELPERS FOR CANVAS ===== */
function renderTreeNode(node, depth) {
	if (node.type === "root") {
		const children = (node.children || [])
			.map((c) => renderTreeNode(c, depth))
			.join("");
		if (!children) return "";
		return children;
	}

	const sel = node.id === state.selectedId ? " selected" : "";
	const isCont = CONTAINER_TYPES.has(node.type);
	const childrenArr = node.children || [];
	const childrenHtml = childrenArr
		.map((c) => renderTreeNode(c, depth + 1))
		.join("");

	const preview = renderPreview(node.type, node.props, childrenHtml);

	const def = COMPONENTS[node.type];
	const label = def ? def.icon + " " + def.label : node.type;
	const countLabel =
		isCont && childrenArr.length > 0
			? ` · ${childrenArr.length} child${childrenArr.length !== 1 ? "ren" : ""}`
			: "";
	const dropZoneHtml = isCont
		? `<div class="canvas-childzone" data-parent="${node.id}">+</div>`
		: "";

	return `<div class="canvas-component${sel}" draggable="true" data-id="${node.id}" data-depth="${depth}" onclick="selectComponent('${node.id}')" style="--depth:${depth}">
    <div class="drag-handle">
      <span class="node-badge">${esc(label)}${countLabel}</span>
      ${isCont ? `<button onclick="event.stopPropagation();addChild('${node.id}')" title="Add child">＋</button>` : ""}
      <button onclick="event.stopPropagation();moveComponent('${node.id}','up')" title="Up">↑</button>
      <button onclick="event.stopPropagation();moveComponent('${node.id}','down')" title="Down">↓</button>
      <button class="delete" onclick="event.stopPropagation();deleteComponent('${node.id}')" title="Delete">✕</button>
    </div>
    <div class="canvas-component-body">
      ${preview}
      ${isCont ? dropZoneHtml : ""}
    </div>
  </div>`;
}

/* ===== CODE GENERATORS ===== */
function genHTML(c, t, childrenHtml) {
	const p = c.props;
	const r = RADIUS[t.radius] || "8px";
	const sp = SPACING[t.spacing] || "1rem";
	const font = t.font;
	const bg = t.dark ? "#0f1117" : t.bg;
	const text = t.dark ? "#e2e4f0" : t.text;

	switch (c.type) {
		case "container":
			return `<div style="padding:${sp}">\n${childrenHtml || ""}\n</div>`;
		case "flexRow":
			return `<div style="display:flex;gap:${p.gap};align-items:${p.align || "center"};justify-content:${p.justify || "start"}">\n${childrenHtml || "<span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "flexCol":
			return `<div style="display:flex;flex-direction:column;gap:${p.gap}">\n${childrenHtml || "<span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "grid":
			return `<div style="display:grid;grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap}">\n${childrenHtml || "<span>1</span><span>2</span><span>3</span>"}\n</div>`;
		case "divider":
			return p.vertical
				? `<div style="width:1px;height:40px;background:#d1d5db;margin:0 auto"></div>`
				: `<hr style="border:none;border-top:1px solid #d1d5db;margin:${sp} 0">`;
		case "spacer":
			return `<div style="height:${p.height}"></div>`;
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
				)}</div><div style="flex:1;padding:16px;font-size:13px;color:#6b7280;min-width:0">${childrenHtml || "Main content"}</div></div>`;
		case "heading":
			return `<${p.level} style="font-family:${font};color:${text};margin:0 0 ${sp}">${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p style="color:${text};line-height:1.6;margin:0 0 ${sp}">${esc(p.text)}</p>`;
		case "link":
			return `<a href="${esc(p.href)}" style="color:${t.primary};text-decoration:underline">${esc(p.text)}</a>`;
		case "blockquote":
			return `<blockquote style="border-left:3px solid ${t.primary};padding-left:${sp};color:${text}99;font-style:italic;margin:0 0 ${sp}">${esc(p.text)}</blockquote>`;
		case "inlineCode":
			return `<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:.875rem">${esc(p.text)}</code>`;
		case "btnPrimary":
			return `<button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-size:1rem;font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
		case "btnSecondary":
			return `<button style="background:${t.secondary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-size:1rem;font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
		case "btnOutline":
			return `<button style="background:transparent;color:${t.primary};border:2px solid ${t.primary};padding:10px 24px;border-radius:${r};font-size:1rem;font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
		case "btnGhost":
			return `<button style="background:transparent;color:${text};border:none;padding:10px 24px;border-radius:${r};font-size:1rem;font-weight:500;cursor:pointer">${esc(p.text)}</button>`;
		case "btnGroup":
			return `<div style="display:inline-flex;border:1px solid #d1d5db;border-radius:${r};overflow:hidden">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<span style="padding:8px 16px;font-size:13px;border-right:1px solid #d1d5db;${i.trim() === p.active ? `background:${t.primary};color:#fff` : "background:#fff;color:#374151"};cursor:pointer">${i.trim()}</span>`,
				)
				.join("")}</div>`;
		case "input":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><input type="text" placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem"></div>`;
		case "textarea":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><textarea placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem;min-height:80px"></textarea></div>`;
		case "select":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><select style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem;background:#fff">${(
				p.options || ""
			)
				.split(",")
				.map((o) => `<option>${o.trim()}</option>`)
				.join("")}</select></div>`;
		case "checkbox":
			return `<label style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:${text};margin:0 0 ${sp}"><input type="checkbox" ${p.checked ? "checked" : ""}> ${esc(p.label)}</label>`;
		case "radioGroup":
			return `<div style="margin:0 0 ${sp}"><div style="font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label)}</div>${(
				p.options || ""
			)
				.split(",")
				.map(
					(o) =>
						`<label style="display:flex;align-items:center;gap:6px;font-size:.875rem;color:${text};margin:2px 0"><input type="radio" name="rg" ${o.trim() === p.selected ? "checked" : ""}> ${o.trim()}</label>`,
				)
				.join("")}</div>`;
		case "toggle":
			return `<label style="display:flex;align-items:center;gap:8px;font-size:.875rem;color:${text};margin:0 0 ${sp}"><div style="width:36px;height:20px;border-radius:99px;background:${p.on ? t.primary : "#d1d5db"};position:relative;cursor:pointer"><div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;${p.on ? "left:18px" : "left:2px"};transition:.2s"></div></div>${esc(p.label)}</label>`;
		case "image":
			return `<div style="width:${p.width};height:${p.height};background:#e5e7eb;border-radius:${r};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.875rem">${esc(p.alt)}</div>`;
		case "avatar":
			return `<div style="display:flex;align-items:center;gap:10px;margin:0 0 ${sp}"><div style="width:40px;height:40px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${esc(p.initials)}</div><div><div style="font-weight:600;font-size:14px;color:${text}">${esc(p.name)}</div><div style="font-size:12px;color:${text}99">${esc(p.role)}</div></div></div>`;
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
		case "tabs":
			return `<div style="display:flex;gap:2px;border-bottom:2px solid #e5e7eb;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<span style="padding:8px 16px;font-size:.875rem;cursor:pointer;${i.trim() === p.active ? `color:${t.primary};font-weight:600;border-bottom:2px solid ${t.primary};margin-bottom:-2px` : ""}">${i.trim()}</span>`,
				)
				.join("")}</div>`;
		case "breadcrumb":
			return `<nav style="display:flex;align-items:center;gap:4px;font-size:.875rem;color:${text}99;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i, idx, a) =>
						`<span${i.trim() === p.current ? ` style="color:${text};font-weight:500"` : ""}>${i.trim()}</span>${idx < a.length - 1 ? '<span style="opacity:.4">›</span>' : ""}`,
				)
				.join("")}</nav>`;
		case "pagination":
			return `<div style="display:flex;align-items:center;gap:4px;margin:${sp} 0">${Array.from({ length: Math.min(p.total, 5) }, (_, i) => `<span style="padding:6px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:.875rem;${i + 1 === p.current ? `background:${t.primary};color:#fff` : "color:#374151"};cursor:pointer">${i + 1}</span>`).join("")}</div>`;
		case "dropdown":
			return `<div style="position:relative;display:inline-block;margin:0 0 ${sp}"><span style="padding:8px 16px;border:1px solid #d1d5db;border-radius:4px;display:inline-flex;align-items:center;gap:6px;font-size:.875rem;color:#374151;background:#fff;cursor:pointer">${esc(p.trigger)} ▾</span></div>`;
		case "card":
			return `<div style="border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);margin:0 0 ${sp}"><div style="padding:16px 16px 0;font-weight:600;color:${text}">${esc(p.header)}</div><div style="padding:16px;color:${text}dd">${esc(p.body)}</div><div style="padding:0 16px 12px;font-size:.875rem;color:${text}99;border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px">${esc(p.footer)}</div></div>`;
		case "pricingCard":
			return `<div style="border:${p.featured ? "2px solid " + t.primary : "1px solid #e5e7eb"};border-radius:${r};padding:24px;text-align:center;background:#fff;max-width:300px;margin:0 auto ${sp}${p.featured ? ";box-shadow:0 0 0 4px " + t.primary + "15" : ""}"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:4px">${esc(p.plan)}</div><div style="font-size:2rem;font-weight:800;color:#111827">${esc(p.price)}<span style="font-size:.875rem;font-weight:400;color:#6b7280">${esc(p.period)}</span></div><ul style="list-style:none;padding:0;margin:16px 0;font-size:.875rem;color:#6b7280">${(
				p.features || ""
			)
				.split(",")
				.map((f) => `<li style="padding:4px 0">✓ ${f.trim()}</li>`)
				.join(
					"",
				)}</ul><button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-size:.875rem;font-weight:600;cursor:pointer">${esc(p.cta)}</button></div>`;
		case "alert":
			return `<div style="padding:12px 16px;border-radius:${r};font-size:.875rem;display:flex;align-items:center;gap:8px;margin:0 0 ${sp};${p.variant === "error" ? "background:#fef2f2;color:#dc2626;border:1px solid #fecaca" : p.variant === "warn" ? "background:#fffbeb;color:#d97706;border:1px solid #fde68a" : "background:#eff6ff;color:" + t.primary + ";border:1px solid #bfdbfe"}">${p.variant === "error" ? "✕" : p.variant === "warn" ? "⚠" : "ℹ"} ${esc(p.text)}</div>`;
		case "badge":
			return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:600;background:${t.primary};color:#fff">${esc(p.text)}</span>`;
		case "progress":
			return `<div style="margin:0 0 ${sp}"><div style="font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label)}</div><div style="height:8px;border-radius:99px;background:#e5e7eb;overflow:hidden"><div style="height:100%;border-radius:99px;background:${t.primary};transition:width .3s;width:${p.value}%"></div></div></div>`;
		case "spinner":
			return `<div style="display:flex;align-items:center;gap:8px;color:${text}99;font-size:.875rem;margin:${sp} 0"><div style="width:20px;height:20px;border:2px solid #e5e7eb;border-top-color:${t.primary};border-radius:50%;animation:spin .6s linear infinite"></div>${esc(p.text)}</div>`;
		case "toast":
			return `<div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:${r};font-size:.875rem;background:#10b981;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:320px">✓ ${esc(p.text)}</div>`;
		case "list":
			return `<ul style="list-style:disc;padding-left:20px;color:${text};font-size:.875rem;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map((i) => `<li style="margin:4px 0">${i.trim()}</li>`)
				.join("")}</ul>`;
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
					const [hdr, bdy] = item.split("~");
					return `<div style="border-bottom:1px solid #e5e7eb"><div style="padding:12px 16px;font-weight:600;font-size:.875rem;display:flex;justify-content:space-between;background:#f9fafb;color:#374151">${esc(hdr || "")} <span style="color:#9ca3af">▾</span></div><div style="padding:12px 16px;font-size:.875rem;color:#6b7280">${esc(bdy || "")}</div></div>`;
				})
				.join("")}</div>`;
		case "stats":
			return `<div style="display:flex;gap:24px;justify-content:center;padding:${sp} 0">${(
				p.items || ""
			)
				.split(",")
				.map((item) => {
					const [lbl, num] = item.split("~");
					return `<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:${t.primary}">${esc(num || "")}</div><div style="font-size:.75rem;color:${text}99">${esc(lbl || "")}</div></div>`;
				})
				.join("")}</div>`;
		case "hero":
			return `<div style="text-align:center;padding:60px 20px;background:#f9fafb;border-radius:${r};margin:0 0 ${sp}"><h1 style="font-family:${font};font-size:2.5rem;font-weight:800;color:#111827;margin:0 0 8px">${esc(p.title)}</h1><p style="font-size:1.125rem;color:#6b7280;max-width:480px;margin:0 auto 24px">${esc(p.subtitle)}</p><button style="background:${t.primary};color:#fff;border:none;padding:12px 28px;border-radius:${r};font-size:1rem;font-weight:600;cursor:pointer">${esc(p.cta)}</button></div>`;
		case "footer":
			return `<footer style="text-align:center;padding:24px;color:#9ca3af;font-size:.75rem;border-top:1px solid #e5e7eb">${esc(p.text)}</footer>`;
		case "testimonial":
			return `<div style="text-align:center;padding:32px 20px;max-width:500px;margin:0 auto ${sp}"><div style="font-style:italic;font-size:1rem;color:#6b7280;line-height:1.6;margin:0 0 16px">"${esc(p.quote)}"</div><div style="font-weight:600;font-size:.875rem;color:#111827">${esc(p.author)}</div><div style="font-size:.75rem;color:#9ca3af">${esc(p.role)}</div></div>`;
		case "modal":
			return `<div style="background:rgba(0,0,0,.5);padding:40px;display:flex;align-items:center;justify-content:center;margin:0 0 ${sp}"><div style="background:#fff;border-radius:${r};max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2)"><div style="padding:16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-weight:600;color:#111827"><span>${esc(p.title)}</span><span style="color:#9ca3af;cursor:pointer">✕</span></div><div style="padding:16px;font-size:.875rem;color:#6b7280">${esc(p.body)}</div><div style="padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:flex-end"><span style="padding:8px 16px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem;color:#374151;cursor:pointer">${esc(p.cancel)}</span><span style="padding:8px 16px;background:${t.primary};color:#fff;border-radius:${r};font-size:.875rem;cursor:pointer">${esc(p.confirm)}</span></div></div></div>`;
		default:
			return `<!-- ${c.type} -->`;
	}
}

function genReact(c, t, childrenHtml) {
	const p = c.props;
	const r = RADIUS[t.radius] || "8px";
	const sp = SPACING[t.spacing] || "1rem";
	const text = t.dark ? "#e2e4f0" : "#1f2937";

	switch (c.type) {
		case "container":
			return `<div style={{ padding: '${sp}' }}>\n${childrenHtml ? indentJSX(childrenHtml, 1) : "  {/* children */}"}\n</div>`;
		case "flexRow":
			return `<div style={{ display: 'flex', gap: '${p.gap}', alignItems: '${p.align || "center"}' }}>\n${childrenHtml ? indentJSX(childrenHtml, 1) : "  <span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "flexCol":
			return `<div style={{ display: 'flex', flexDirection: 'column', gap: '${p.gap}' }}>\n${childrenHtml ? indentJSX(childrenHtml, 1) : "  <span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "grid":
			return `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(${p.cols}, 1fr)', gap: '${p.gap}' }}>\n${childrenHtml ? indentJSX(childrenHtml, 1) : "  <span>1</span><span>2</span><span>3</span>"}\n</div>`;
		case "divider":
			return p.vertical
				? `<div style={{ width: 1, height: 40, background: '#d1d5db', margin: '0 auto' }} />`
				: `<hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '${sp} 0' }} />`;
		case "sidebar":
			return `<div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '${r}', overflow: 'hidden', minHeight: 200 }}>\n  <div style={{ width: 200, background: '#f9fafb', padding: 16, flexShrink: 0 }}>\n    ${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<div style={{ padding: '6px 10px', fontSize: 13, borderRadius: 4, ${i.trim() === p.active ? "background: '" + t.primary + "', color: '#fff'" : "color: '#6b7280'"} }}>${i.trim()}</div>`,
				)
				.join(
					"\n    ",
				)}\n  </div>\n  <div style={{ flex: 1, padding: 16, fontSize: 13, color: '#6b7280' }}>\n${childrenHtml ? indentJSX(childrenHtml, 2) : "    Main content"}\n  </div>\n</div>`;
		case "heading":
			return `<${p.level} style={{ fontFamily: '${t.font}', color: '${text}', marginBottom: '${sp}' }}>${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p style={{ color: '${text}', lineHeight: 1.6, marginBottom: '${sp}' }}>${esc(p.text)}</p>`;
		case "btnPrimary":
			return `<button style={{ background: '${t.primary}', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '${r}', fontWeight: 500, cursor: 'pointer' }}>\n  ${esc(p.text)}\n</button>`;
		case "btnSecondary":
			return `<button style={{ background: '${t.secondary}', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '${r}', fontWeight: 500, cursor: 'pointer' }}>\n  ${esc(p.text)}\n</button>`;
		case "btnOutline":
			return `<button style={{ background: 'transparent', color: '${t.primary}', border: '2px solid ${t.primary}', padding: '10px 24px', borderRadius: '${r}', fontWeight: 500, cursor: 'pointer' }}>\n  ${esc(p.text)}\n</button>`;
		case "navbar":
			return `<nav style={{ display: 'flex', alignItems: 'center', gap: '${sp}', padding: '12px ${sp}', background: '#f3f4f6', borderRadius: '${r}' }}>\n  <span style={{ fontWeight: 700, color: '${t.primary}' }}>${esc(p.brand)}</span>\n  ${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`  <span style={{ color: '${text}99', fontSize: '0.875rem' }}>${i.trim()}</span>`,
				)
				.join("\n")}\n</nav>`;
		case "card":
			return `<div style={{ border: '1px solid #e5e7eb', borderRadius: '${r}', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>\n  <div style={{ padding: '16px 16px 0', fontWeight: 600, color: '${text}' }}>${esc(p.header)}</div>\n  <div style={{ padding: 16, color: '${text}dd' }}>${esc(p.body)}</div>\n  <div style={{ padding: '0 16px 12px', fontSize: '0.875rem', color: '${text}99', borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 8 }}>${esc(p.footer)}</div>\n</div>`;
		case "pricingCard":
			return `<div style={{ border: '${p.featured ? "2px solid " + t.primary : "1px solid #e5e7eb"}', borderRadius: '${r}', padding: 24, textAlign: 'center', background: '#fff', maxWidth: 300, margin: '0 auto' }}>\n  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 4 }}>${esc(p.plan)}</div>\n  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>${esc(p.price)}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280' }}>${esc(p.period)}</span></div>\n  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', fontSize: '0.875rem', color: '#6b7280' }}>\n    ${(
				p.features || ""
			)
				.split(",")
				.map((f) => `    <li style={{ padding: '4px 0' }}>✓ ${f.trim()}</li>`)
				.join(
					"\n",
				)}\n  </ul>\n  <button style={{ background: '${t.primary}', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '${r}', fontWeight: 600, cursor: 'pointer' }}>${esc(p.cta)}</button>\n</div>`;
		case "hero":
			return `<div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '${r}' }}>\n  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>${esc(p.title)}</h1>\n  <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: 480, margin: '0 auto 24px' }}>${esc(p.subtitle)}</p>\n  <button style={{ background: '${t.primary}', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '${r}', fontWeight: 600, cursor: 'pointer' }}>${esc(p.cta)}</button>\n</div>`;
		case "footer":
			return `<footer style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: '0.75rem', borderTop: '1px solid #e5e7eb' }}>\n  ${esc(p.text)}\n</footer>`;
		case "input":
			return `<div style={{ marginBottom: '${sp}' }}>\n  <label style={{ display: 'block', fontSize: '0.875rem', color: '${text}99', marginBottom: 4 }}>${esc(p.label || "")}</label>\n  <input type="text" placeholder="${esc(p.placeholder)}" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '${r}', fontSize: '0.875rem' }} />\n</div>`;
		case "textarea":
			return `<div style={{ marginBottom: '${sp}' }}>\n  <label style={{ display: 'block', fontSize: '0.875rem', color: '${text}99', marginBottom: 4 }}>${esc(p.label || "")}</label>\n  <textarea placeholder="${esc(p.placeholder)}" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '${r}', fontSize: '0.875rem', minHeight: 80 }} />\n</div>`;
		case "table":
			return `<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>\n  <thead>\n    <tr>\n      ${(
				p.headers || ""
			)
				.split(",")
				.map(
					(h) =>
						`<th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: '#6b7280' }}>${h.trim()}</th>`,
				)
				.join("\n      ")}\n    </tr>\n  </thead>\n  <tbody>\n    ${(
				p.rows || ""
			)
				.split("|")
				.filter(Boolean)
				.map(
					(r) =>
						"    <tr>\n      " +
						r
							.split(",")
							.map(
								(c) =>
									`<td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>${c.trim()}</td>`,
							)
							.join("\n      ") +
						"\n    </tr>",
				)
				.join("\n    ")}\n  </tbody>\n</table>`;
		case "accordion":
			return `<div style={{ border: '1px solid #e5e7eb', borderRadius: '${r}', overflow: 'hidden' }}>\n  ${(
				p.items || ""
			)
				.split("|")
				.filter(Boolean)
				.map((item) => {
					const [h, b] = item.split("~");
					return `  <div style={{ borderBottom: '1px solid #e5e7eb' }}>\n    <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', background: '#f9fafb' }}>\n      ${esc(h || "")} <span style={{ color: '#9ca3af' }}>▾</span>\n    </div>\n    <div style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#6b7280' }}>${esc(b || "")}</div>\n  </div>`;
				})
				.join("\n")}\n</div>`;
		case "alert":
			return `<div style={{ padding: '12px 16px', borderRadius: '${r}', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, background: '#eff6ff', color: '${t.primary}', border: '1px solid #bfdbfe' }}>\n  ℹ ${esc(p.text)}\n</div>`;
		case "badge":
			return `<span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: '${t.primary}', color: '#fff' }}>${esc(p.text)}</span>`;
		case "progress":
			return `<div style={{ marginBottom: '${sp}' }}>\n  <div style={{ fontSize: '0.875rem', color: '${text}99', marginBottom: 4 }}>${esc(p.label)}</div>\n  <div style={{ height: 8, borderRadius: 99, background: '#e5e7eb', overflow: 'hidden' }}>\n    <div style={{ height: '100%', borderRadius: 99, background: '${t.primary}', width: '${p.value}%' }} />\n  </div>\n</div>`;
		case "spinner":
			return `<div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '${text}99', fontSize: '0.875rem' }}>\n  <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '${t.primary}', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />\n  ${esc(p.text)}\n</div>`;
		case "modal":
			return `<div style={{ background: 'rgba(0,0,0,0.5)', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n  <div style={{ background: '#fff', borderRadius: '${r}', maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>\n    <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>\n      <span>${esc(p.title)}</span>\n      <span style={{ cursor: 'pointer', color: '#9ca3af' }}>✕</span>\n    </div>\n    <div style={{ padding: 16, fontSize: '0.875rem', color: '#6b7280' }}>${esc(p.body)}</div>\n    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>\n      <span style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '${r}', fontSize: '0.875rem', cursor: 'pointer' }}>${esc(p.cancel)}</span>\n      <span style={{ padding: '8px 16px', background: '${t.primary}', color: '#fff', borderRadius: '${r}', fontSize: '0.875rem', cursor: 'pointer' }}>${esc(p.confirm)}</span>\n    </div>\n  </div>\n</div>`;
		case "testimonial":
			return `<div style={{ textAlign: 'center', padding: '32px 20px', maxWidth: 500, margin: '0 auto' }}>\n  <div style={{ fontStyle: 'italic', fontSize: '1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>"${esc(p.quote)}"</div>\n  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>${esc(p.author)}</div>\n  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>${esc(p.role)}</div>\n</div>`;
		case "toggle":
			return `<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', marginBottom: '${sp}' }}>\n  <div style={{ width: 36, height: 20, borderRadius: 99, background: '${p.on ? t.primary : "#d1d5db"}', position: 'relative', cursor: 'pointer' }}>\n    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, ${p.on ? "left: 18" : "left: 2"} }} />\n  </div>\n  ${esc(p.label)}\n</label>`;
		case "avatar":
			return `<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>\n  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '${t.primary}', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14 }}>${esc(p.initials)}</div>\n  <div>\n    <div style={{ fontWeight: 600, fontSize: 14 }}>${esc(p.name)}</div>\n    <div style={{ fontSize: 12, color: '${text}99' }}>${esc(p.role)}</div>\n  </div>\n</div>`;
		case "stats":
			return `<div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: '${sp} 0' }}>\n  ${(
				p.items || ""
			)
				.split(",")
				.map((item) => {
					const [l, n] = item.split("~");
					return `  <div style={{ textAlign: 'center' }}>\n    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '${t.primary}' }}>${esc(n || "")}</div>\n    <div style={{ fontSize: '0.75rem', color: '${text}99' }}>${esc(l || "")}</div>\n  </div>`;
				})
				.join("\n")}\n</div>`;
		case "breadcrumb":
			return `<nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: '${text}99' }}>\n  ${(
				p.items || ""
			)
				.split(",")
				.map(
					(i, idx, a) =>
						`<span${i.trim() === p.current ? ` style={{ color: '${text}', fontWeight: 500 }}` : ""}>${i.trim()}</span>${idx < a.length - 1 ? "<span style={{ opacity: 0.4 }}>›</span>" : ""}`,
				)
				.join("\n  ")}\n</nav>`;
		case "radioGroup":
			return `<div style={{ marginBottom: '${sp}' }}>\n  <div style={{ fontSize: '0.875rem', color: '${text}99', marginBottom: 4 }}>${esc(p.label)}</div>\n  ${(
				p.options || ""
			)
				.split(",")
				.map(
					(o) =>
						`<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', margin: '2px 0' }}>\n    <input type="radio" name="rg" defaultChecked={${o.trim() === p.selected}} /> ${o.trim()}\n  </label>`,
				)
				.join("\n  ")}\n</div>`;
		default:
			return `{/* ${c.type} */}`;
	}
}

function genTW(c, t, childrenHtml) {
	const p = c.props;
	const sp =
		t.spacing === "compact" ? "p-4" : t.spacing === "spacious" ? "p-8" : "p-6";

	switch (c.type) {
		case "container":
			return `<div class="${sp}">\n${childrenHtml || "  <!-- children -->"}\n</div>`;
		case "flexRow":
			return `<div class="flex flex-row gap-4 items-center">\n${childrenHtml || "  <span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "flexCol":
			return `<div class="flex flex-col gap-3">\n${childrenHtml || "  <span>Item 1</span><span>Item 2</span><span>Item 3</span>"}\n</div>`;
		case "grid":
			return `<div class="grid grid-cols-3 gap-4">\n${childrenHtml || '  <div class="bg-gray-100 p-4 rounded">1</div>\n  <div class="bg-gray-100 p-4 rounded">2</div>\n  <div class="bg-gray-100 p-4 rounded">3</div>'}\n</div>`;
		case "divider":
			return `<hr class="border-t border-gray-200 my-6">`;
		case "sidebar":
			return `<div class="flex border border-gray-200 rounded-xl overflow-hidden min-h-[200px]">\n  <div class="w-48 bg-gray-50 p-4 space-y-2 flex-shrink-0">\n    ${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<div class="px-3 py-2 text-sm rounded ${i.trim() === p.active ? "bg-blue-600 text-white" : "text-gray-600"}">${i.trim()}</div>`,
				)
				.join(
					"\n    ",
				)}\n  </div>\n  <div class="flex-1 p-4 text-sm text-gray-500">\n${childrenHtml ? indentTW(childrenHtml, 2) : "    Main content"}\n  </div>\n</div>`;
		case "heading":
			return `<${p.level} class="font-bold tracking-tight text-gray-900 dark:text-white">${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p class="text-gray-600 dark:text-gray-300 leading-relaxed">${esc(p.text)}</p>`;
		case "link":
			return `<a href="${esc(p.href)}" class="text-blue-600 underline hover:text-blue-800">${esc(p.text)}</a>`;
		case "btnPrimary":
			return `<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">${esc(p.text)}</button>`;
		case "btnSecondary":
			return `<button class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">${esc(p.text)}</button>`;
		case "btnOutline":
			return `<button class="bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-6 rounded-lg transition-colors">${esc(p.text)}</button>`;
		case "btnGhost":
			return `<button class="bg-transparent text-gray-700 hover:bg-gray-100 font-medium py-2.5 px-6 rounded-lg transition-colors">${esc(p.text)}</button>`;
		case "input":
			return `<div class="mb-4">\n  <label class="block text-sm text-gray-500 mb-1">${esc(p.label || "")}</label>\n  <input type="text" placeholder="${esc(p.placeholder)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\n</div>`;
		case "textarea":
			return `<div class="mb-4">\n  <label class="block text-sm text-gray-500 mb-1">${esc(p.label || "")}</label>\n  <textarea placeholder="${esc(p.placeholder)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" rows="4"></textarea>\n</div>`;
		case "navbar":
			return `<nav class="flex items-center gap-6 px-6 py-3 bg-gray-100 rounded-lg">\n  <span class="font-bold text-blue-600">${esc(p.brand)}</span>\n  ${(
				p.items || ""
			)
				.split(",")
				.map((i) => `<span class="text-gray-500 text-sm">${i.trim()}</span>`)
				.join("\n  ")}\n</nav>`;
		case "card":
			return `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">\n  <div class="px-4 pt-4 font-semibold text-gray-900">${esc(p.header)}</div>\n  <div class="p-4 text-gray-600">${esc(p.body)}</div>\n  <div class="px-4 pb-4 text-sm text-gray-400 border-t border-gray-100 mt-2 pt-2">${esc(p.footer)}</div>\n</div>`;
		case "pricingCard":
			return `<div class="border border-gray-200 rounded-xl p-6 text-center bg-white max-w-xs${p.featured ? " ring-2 ring-blue-500" : ""}">\n  <div class="text-xs uppercase tracking-widest text-gray-500 mb-1">${esc(p.plan)}</div>\n  <div class="text-3xl font-extrabold text-gray-900">${esc(p.price)}<span class="text-sm font-normal text-gray-400">${esc(p.period)}</span></div>\n  <ul class="list-none p-0 my-4 text-sm text-gray-500 space-y-2">\n    ${(
				p.features || ""
			)
				.split(",")
				.map((f) => `<li>✓ ${f.trim()}</li>`)
				.join(
					"\n    ",
				)}\n  </ul>\n  <button class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700">${esc(p.cta)}</button>\n</div>`;
		case "hero":
			return `<div class="text-center py-16 px-4 bg-gray-50 rounded-xl">\n  <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">${esc(p.title)}</h1>\n  <p class="text-lg text-gray-500 max-w-lg mx-auto mb-6">${esc(p.subtitle)}</p>\n  <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">${esc(p.cta)}</button>\n</div>`;
		case "footer":
			return `<footer class="text-center py-6 text-gray-400 text-xs border-t border-gray-200">\n  ${esc(p.text)}\n</footer>`;
		case "tabs":
			return `<div class="flex gap-0.5 border-b border-gray-200">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i) =>
						`<span class="px-4 py-2 text-sm cursor-pointer${i.trim() === p.active ? " text-blue-600 font-semibold border-b-2 border-blue-600 mb-[-2px]" : ""}">${i.trim()}</span>`,
				)
				.join("")}</div>`;
		case "alert":
			return `<div class="flex items-center gap-2 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">\n  ℹ ${esc(p.text)}\n</div>`;
		case "badge":
			return `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">${esc(p.text)}</span>`;
		case "progress":
			return `<div>\n  <div class="text-sm text-gray-500 mb-1">${esc(p.label)}</div>\n  <div class="h-2 rounded-full bg-gray-200 overflow-hidden">\n    <div class="h-full rounded-full bg-blue-600" style="width:${p.value}%"></div>\n  </div>\n</div>`;
		case "spinner":
			return `<div class="flex items-center gap-2 text-gray-500 text-sm">\n  <div class="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>\n  ${esc(p.text)}\n</div>`;
		case "list":
			return `<ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">${(
				p.items || ""
			)
				.split(",")
				.map((i) => `<li>${i.trim()}</li>`)
				.join("")}</ul>`;
		case "table":
			return `<table class="w-full text-sm border-collapse">\n  <thead><tr class="text-left text-xs uppercase text-gray-500">${(
				p.headers || ""
			)
				.split(",")
				.map(
					(h) =>
						`<th class="p-2 border-b-2 border-gray-200 font-semibold">${h.trim()}</th>`,
				)
				.join("")}</tr></thead>\n  <tbody>${(p.rows || "")
				.split("|")
				.filter(Boolean)
				.map(
					(r) =>
						"\n    <tr>" +
						r
							.split(",")
							.map(
								(c) =>
									`<td class="p-2 border-b border-gray-100">${c.trim()}</td>`,
							)
							.join("") +
						"</tr>",
				)
				.join("")}\n  </tbody>\n</table>`;
		case "accordion":
			return `<div class="border border-gray-200 rounded-xl overflow-hidden">\n  ${(
				p.items || ""
			)
				.split("|")
				.filter(Boolean)
				.map((item) => {
					const [h, b] = item.split("~");
					return `  <div class="border-b border-gray-200 last:border-b-0">\n    <div class="px-4 py-3 font-semibold text-sm flex justify-between bg-gray-50 text-gray-900">${esc(h || "")} <span class="text-gray-400">▾</span></div>\n    <div class="px-4 py-3 text-sm text-gray-600">${esc(b || "")}</div>\n  </div>`;
				})
				.join("\n")}\n</div>`;
		case "stats":
			return `<div class="flex gap-6 justify-center py-6">\n  ${(p.items || "")
				.split(",")
				.map((item) => {
					const [l, n] = item.split("~");
					return `  <div class="text-center">\n    <div class="text-2xl font-extrabold text-blue-600">${esc(n || "")}</div>\n    <div class="text-xs text-gray-400">${esc(l || "")}</div>\n  </div>`;
				})
				.join("\n")}\n</div>`;
		case "avatar":
			return `<div class="flex items-center gap-2.5">\n  <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">${esc(p.initials)}</div>\n  <div>\n    <div class="font-semibold text-sm text-gray-900">${esc(p.name)}</div>\n    <div class="text-xs text-gray-400">${esc(p.role)}</div>\n  </div>\n</div>`;
		case "toggle":
			return `<label class="flex items-center gap-2 text-sm text-gray-700">\n  <div class="w-9 h-5 rounded-full ${p.on ? "bg-blue-600" : "bg-gray-300"} relative cursor-pointer">\n    <div class="w-4 h-4 rounded-full bg-white absolute top-0.5 ${p.on ? "left-4" : "left-0.5"} transition-all"></div>\n  </div>\n  ${esc(p.label)}\n</label>`;
		case "breadcrumb":
			return `<nav class="flex items-center gap-1 text-sm text-gray-400">\n  ${(
				p.items || ""
			)
				.split(",")
				.map(
					(i, idx, a) =>
						`<span class="${i.trim() === p.current ? "text-gray-900 font-medium" : ""}">${i.trim()}</span>${idx < a.length - 1 ? '<span class="opacity-40">›</span>' : ""}`,
				)
				.join("")}\n</nav>`;
		case "modal":
			return `<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-10">\n  <div class="bg-white rounded-xl max-w-md w-full shadow-2xl">\n    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center font-semibold text-gray-900">\n      <span>${esc(p.title)}</span>\n      <span class="text-gray-400 cursor-pointer">✕</span>\n    </div>\n    <div class="px-6 py-4 text-sm text-gray-600">${esc(p.body)}</div>\n    <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">\n      <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">${esc(p.cancel)}</button>\n      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">${esc(p.confirm)}</button>\n    </div>\n  </div>\n</div>`;
		case "testimonial":
			return `<div class="text-center py-8 px-4 max-w-md mx-auto">\n  <div class="italic text-gray-500 text-base leading-relaxed mb-4">"${esc(p.quote)}"</div>\n  <div class="font-semibold text-gray-900 text-sm">${esc(p.author)}</div>\n  <div class="text-xs text-gray-400">${esc(p.role)}</div>\n</div>`;
		case "pagination":
			return `<div class="flex items-center gap-1">\n  <button class="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600">‹</button>\n  ${Array.from({ length: Math.min(p.total, 5) }, (_, i) => `<button class="px-3 py-1.5 border border-gray-300 rounded text-sm ${i + 1 === p.current ? "bg-blue-600 text-white border-blue-600" : "text-gray-600"}">${i + 1}</button>`).join("")}\n  <button class="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600">›</button>\n</div>`;
		case "radioGroup":
			return `<fieldset>\n  <legend class="text-sm text-gray-500 mb-1">${esc(p.label)}</legend>\n  ${(
				p.options || ""
			)
				.split(",")
				.map(
					(o) =>
						`<label class="flex items-center gap-1.5 text-sm text-gray-700 py-0.5"><input type="radio" name="rg" ${o.trim() === p.selected ? "checked" : ""} class="accent-blue-600"> ${o.trim()}</label>`,
				)
				.join("")}\n</fieldset>`;
		default:
			return `<!-- ${c.type} -->`;
	}
}

function indentJSX(html, depth) {
	const indent = "  ".repeat(depth);
	return html
		.split("\n")
		.map((l) => (l.trim() ? indent + l : ""))
		.join("\n");
}

function indentTW(html, depth) {
	const indent = "  ".repeat(depth);
	return html
		.split("\n")
		.map((l) => (l.trim() ? indent + l : ""))
		.join("\n");
}

/* ===== GENERATE WRAPPER ===== */
function generateNodeCode(node) {
	if (node.type === "root")
		return (node.children || []).map((c) => generateNodeCode(c)).join("\n\n");

	const childrenHtml = (node.children || [])
		.map((c) => generateNodeCode(c))
		.join("\n");

	switch (state.format) {
		case "react":
			return genReact(node, state.theme, childrenHtml);
		case "tailwind":
			return genTW(node, state.theme, childrenHtml);
		default:
			return genHTML(node, state.theme, childrenHtml);
	}
}

function generateCode() {
	if (totalComponents() === 0)
		return `<!-- Add components to generate code -->\n`;
	let body = generateNodeCode(state.tree);
	if (state.format === "html") {
		const t = state.theme;
		const bg = t.dark ? "#0f1117" : t.bg;
		const text = t.dark ? "#e2e4f0" : t.text;
		body = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n  <title>Design Prototype</title>\n  <style>\n    *{margin:0;padding:0;box-sizing:border-box}\n    body{font-family:${t.font};background:${bg};color:${text};line-height:1.5}\n    .container{max-width:1080px;margin:0 auto;padding:0 ${SPACING[t.spacing] || "1rem"}}\n  </style>\n</head>\n<body>\n  <div class="container">\n${body
			.split("\n")
			.map((l) => "    " + l)
			.join("\n")}\n  </div>\n</body>\n</html>`;
	}
	if (state.format === "react") {
		body = `import React from 'react';\n\nfunction DesignPrototype(){\n  return(\n    <div style={{maxWidth:1080,margin:'0 auto',padding:'${SPACING[state.theme.spacing] || "1rem"}'}}>\n${body
			.split("\n")
			.map((l) => "      " + l)
			.join("\n")}\n    </div>\n  );\n}\n\nexport default DesignPrototype;`;
	}
	if (state.format === "tailwind") {
		body = `<div class="mx-auto max-w-6xl p-${state.theme.spacing === "compact" ? "4" : state.theme.spacing === "spacious" ? "8" : "6"}">\n${body
			.split("\n")
			.map((l) => "  " + l)
			.join("\n")}\n</div>`;
	}
	return body;
}

function getDesignJSON() {
	return { tree: state.tree, theme: state.theme };
}

/* ===== RENDER ===== */
function render() {
	renderPalette();
	renderCanvas();
	renderCode();
	renderProperties();
	updateCounts();
}

function renderPalette() {
	const container = document.getElementById("palette-categories");
	const q = (
		document.getElementById("palette-search").value || ""
	).toLowerCase();
	const cats = {};
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
				`<div class="palette-category"><h4>${cat}</h4>${items.map((item) => `<div class="palette-item" draggable="true" data-type="${item.type}" onclick="addComponent('${item.type}')"><span class="icon">${item.icon}</span><span class="label">${item.label}</span></div>`).join("")}</div>`,
		)
		.join("");
}

function renderCanvas() {
	const list = document.getElementById("canvas-list");
	if (totalComponents() === 0) {
		list.innerHTML = "";
		return;
	}
	list.innerHTML = renderTreeNode(state.tree, 0);
}

function renderCode() {
	document.getElementById("code-output").textContent = generateCode();
}

function renderProperties() {
	const panel = document.getElementById("properties-content");
	const c = state.selectedId ? findNode(state.tree, state.selectedId) : null;
	if (!c || c.type === "root") {
		const n = totalComponents();
		panel.innerHTML = `<p class="muted">${n > 0 ? `${n} component${n !== 1 ? "s" : ""} on canvas. Select one to edit.` : "Add components from the palette to start."}</p>`;
		return;
	}
	const def = COMPONENTS[c.type];
	if (!def) {
		panel.innerHTML = '<p class="muted">No properties</p>';
		return;
	}
	const p = c.props;
	const isCont = CONTAINER_TYPES.has(c.type);
	const rows = Object.entries(p)
		.map(([key, val]) => {
			const label =
				key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
			if (
				key === "checked" ||
				key === "on" ||
				key === "featured" ||
				key === "vertical"
			)
				return `<div class="prop-row"><label>${label}</label><input type="checkbox" ${val ? "checked" : ""} onchange="updateProp('${c.id}','${key}',this.checked)"></div>`;
			if (key === "level")
				return `<div class="prop-row"><label>${label}</label><select onchange="updateProp('${c.id}','${key}',this.value)">${["h1", "h2", "h3", "h4", "h5", "h6"].map((l) => `<option ${l === val ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
			if (key === "variant")
				return `<div class="prop-row"><label>${label}</label><select onchange="updateProp('${c.id}','${key}',this.value)">${["info", "warn", "error", "primary", "secondary", "success"].map((v) => `<option ${v === val ? "selected" : ""}>${v}</option>`).join("")}</select></div>`;
			if (key === "value" || key === "current")
				return `<div class="prop-row"><label>${label}</label><input type="number" value="${val}" onchange="updateProp('${c.id}','${key}',parseInt(this.value)||0)" style="width:80px"></div>`;
			if (key === "active")
				return `<div class="prop-row"><label>${label}</label><select onchange="updateProp('${c.id}','${key}',this.value)">${(
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
			return `<div class="prop-row"><label>${label}</label><input type="text" value="${esc(String(val))}" onchange="updateProp('${c.id}','${key}',this.value)"></div>`;
		})
		.join("");
	const childrenInfo = isCont
		? `<div class="prop-row" style="font-size:11px;color:var(--text2)"><label>Children</label><span>${(c.children || []).length} item${(c.children || []).length !== 1 ? "s" : ""} ${c.children && c.children.length > 0 ? "(nested below)" : "(drop components here)"}</span></div>`
		: "";
	panel.innerHTML = `<div class="prop-row" style="font-size:11px;color:var(--text2);margin-bottom:4px"><strong>${def.cat} / ${def.label}</strong></div>${childrenInfo}${rows || '<p class="muted">No editable properties</p>'}`;
}

function updateCounts() {
	const n = totalComponents();
	document.getElementById("canvas-count").textContent =
		`${n} component${n !== 1 ? "s" : ""}`;
	document.getElementById("component-count").textContent = `${n} components`;
}

/* ===== ACTIONS ===== */
function addComponent(type) {
	const def = COMPONENTS[type];
	if (!def) return;
	const id = "c" + state.nextId++;
	const node = { id, type, props: { ...def.props }, children: [] };

	// If a container is selected, add as its child; otherwise add to root
	const selected = state.selectedId
		? findNode(state.tree, state.selectedId)
		: null;
	if (selected && CONTAINER_TYPES.has(selected.type)) {
		selected.children = selected.children || [];
		selected.children.push(node);
	} else {
		state.tree.children.push(node);
	}

	state.selectedId = id;
	render();
	scheduleSave();
}

function addChild(parentId) {
	const parent = findNode(state.tree, parentId);
	if (!parent || !CONTAINER_TYPES.has(parent.type)) return;
	state.selectedId = parentId;
	render();
	// Focus palette and show helper
	document.getElementById("palette-search").focus();
	toast("Click a palette item to add to this container");
}

function selectComponent(id) {
	state.selectedId = state.selectedId === id ? null : id;
	render();
}

function updateProp(id, key, value) {
	const c = findNode(state.tree, id);
	if (!c) return;
	c.props[key] = value;
	render();
	scheduleSave();
}

function deleteComponent(id) {
	if (id === "root") return;
	removeNode(state.tree, id);
	if (state.selectedId === id) state.selectedId = null;
	render();
	scheduleSave();
}

function moveComponent(id, dir) {
	const parent = findParent(state.tree, id);
	if (!parent || !parent.children) return;
	const idx = parent.children.findIndex((x) => x.id === id);
	if (idx === -1) return;
	if (dir === "up" && idx > 0)
		[parent.children[idx - 1], parent.children[idx]] = [
			parent.children[idx],
			parent.children[idx - 1],
		];
	else if (dir === "down" && idx < parent.children.length - 1)
		[parent.children[idx], parent.children[idx + 1]] = [
			parent.children[idx + 1],
			parent.children[idx],
		];
	render();
	scheduleSave();
}

function clearAll() {
	if (totalComponents() === 0) return;
	state.tree.children = [];
	state.selectedId = null;
	render();
	scheduleSave();
}

/* ===== DRAG & DROP ===== */
let _dragInfo = null;

document.addEventListener("dragstart", (e) => {
	const item = e.target.closest(".palette-item");
	const comp = e.target.closest(".canvas-component");
	if (item) {
		_dragInfo = { source: "palette", type: item.dataset.type };
		item.classList.add("dragging");
		e.dataTransfer.effectAllowed = "copy";
		e.dataTransfer.setData("text/plain", item.dataset.type);
	} else if (comp) {
		const id = comp.dataset.id;
		_dragInfo = { source: "canvas", id };
		comp.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", id);
	}
});

document.addEventListener("dragend", (e) => {
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
	_dragInfo = null;
});

document.addEventListener("dragover", (e) => {
	const list = document.getElementById("canvas-list");
	const canvas = document.getElementById("canvas");
	if (!_dragInfo) return;

	const rect = canvas.getBoundingClientRect();
	const inCanvas =
		e.clientX >= rect.left &&
		e.clientX <= rect.right &&
		e.clientY >= rect.top &&
		e.clientY <= rect.bottom;

	if (!inCanvas) {
		canvas.classList.remove("drag-over-canvas");
		document
			.querySelectorAll(".childzone-active")
			.forEach((el) => el.classList.remove("childzone-active"));
		return;
	}

	e.preventDefault();
	canvas.classList.add("drag-over-canvas");
	e.dataTransfer.dropEffect = _dragInfo.source === "palette" ? "copy" : "move";

	// Check if hovering over a child zone (container drop area)
	const childZones = canvas.querySelectorAll(".canvas-childzone");
	let foundZone = false;
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
			foundZone = true;
		} else {
			zone.classList.remove("childzone-active");
		}
	});

	if (!foundZone) {
		_dragInfo.dropParentId = null;
		// Determine insert position among root children
		const comps = canvas.querySelectorAll(".canvas-component[data-depth='0']");
		let insertIdx = state.tree.children.length;
		comps.forEach((el, i) => {
			const r = el.getBoundingClientRect();
			const mid = r.top + r.height / 2;
			if (e.clientY > mid) insertIdx = i + 1;
			el.classList.toggle(
				"drag-over",
				Math.abs(e.clientY - (r.top + r.height / 2)) < r.height / 3,
			);
		});
		_dragInfo.insertIdx = insertIdx;
	}
});

document.addEventListener("drop", (e) => {
	e.preventDefault();
	if (!_dragInfo) return;
	const canvas = document.getElementById("canvas");
	canvas.classList.remove("drag-over-canvas");
	document
		.querySelectorAll(".drag-over,.childzone-active")
		.forEach((el) => el.classList.remove("drag-over", "childzone-active"));

	const def = COMPONENTS[_dragInfo.type];

	if (_dragInfo.source === "palette" && def) {
		const id = "c" + state.nextId++;
		const node = {
			id,
			type: _dragInfo.type,
			props: { ...def.props },
			children: [],
		};

		if (_dragInfo.dropParentId) {
			const parent = findNode(state.tree, _dragInfo.dropParentId);
			if (parent) {
				parent.children = parent.children || [];
				parent.children.push(node);
			} else {
				state.tree.children.push(node);
			}
		} else {
			const idx = Math.min(
				_dragInfo.insertIdx || state.tree.children.length,
				state.tree.children.length,
			);
			state.tree.children.splice(idx, 0, node);
		}
		state.selectedId = id;
		render();
		scheduleSave();
	} else if (_dragInfo.source === "canvas") {
		const srcId = _dragInfo.id;
		if (!srcId || srcId === "root") return;

		const srcParent = findParent(state.tree, srcId);
		if (!srcParent || !srcParent.children) return;
		const srcIdx = srcParent.children.findIndex((x) => x.id === srcId);
		if (srcIdx === -1) return;

		// Remove from current position
		const [item] = srcParent.children.splice(srcIdx, 1);

		if (_dragInfo.dropParentId) {
			// Move into container
			const target = findNode(state.tree, _dragInfo.dropParentId);
			if (target) {
				target.children = target.children || [];
				target.children.push(item);
			} else {
				state.tree.children.push(item);
			}
		} else {
			// Reorder at root level
			const targetIdx = _dragInfo.insertIdx || state.tree.children.length;
			state.tree.children.splice(targetIdx, 0, item);
		}

		state.selectedId = srcId;
		render();
		scheduleSave();
	}
	_dragInfo = null;
});

/* ===== SAVE ===== */
function scheduleSave() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(saveDesign, 500);
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
		if (res.ok) {
			document.getElementById("save-status").textContent = "💾 Saved";
			setTimeout(
				() =>
					(document.getElementById("save-status").textContent =
						"💾 Auto-save enabled"),
				2000,
			);
		}
	} catch (e) {
		document.getElementById("save-status").textContent = "⚠ Save failed";
	}
}

async function exportDesign() {
	await saveDesign();
	toast("Exported to .ui-design/");
}

function copyCode() {
	const code = generateCode();
	navigator.clipboard
		.writeText(code)
		.then(() => toast("Code copied!"))
		.catch(() => {
			const buf = document.getElementById("copy-buffer");
			buf.value = code;
			buf.select();
			document.execCommand("copy");
			toast("Code copied!");
		});
}

function toast(msg) {
	const el = document.createElement("div");
	el.className = "toast";
	el.textContent = msg;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 2000);
}

/* ===== THEME ===== */
function applyThemeCSS() {
	const t = state.theme;
	const root = document.documentElement;
	// ponytail: --accent/--accent2 only affect canvas previews, not layout chrome
	root.style.setProperty("--accent", t.primary);
	root.style.setProperty("--accent2", t.secondary);
	if (!t.dark) {
		root.style.setProperty("--bg", t.bg);
		root.style.setProperty("--text", t.text);
	}
	root.style.setProperty("--radius", RADIUS[t.radius] || "8px");
}
function updateThemeFromUI() {
	state.theme.primary = document.getElementById("theme-primary").value;
	state.theme.secondary = document.getElementById("theme-secondary").value;
	state.theme.bg = document.getElementById("theme-bg").value;
	state.theme.text = document.getElementById("theme-text").value;
	state.theme.spacing = document.getElementById("theme-spacing").value;
	state.theme.radius = document.getElementById("theme-radius").value;
	state.theme.font = document.getElementById("theme-font").value;
	state.theme.dark = document.getElementById("theme-dark").checked;
	document.documentElement.setAttribute(
		"data-theme",
		state.theme.dark ? "dark" : "light",
	);
	applyThemeCSS();
	render();
	scheduleSave();
}

function syncThemeUI() {
	document.getElementById("theme-primary").value = state.theme.primary;
	document.getElementById("theme-secondary").value = state.theme.secondary;
	document.getElementById("theme-bg").value = state.theme.bg;
	document.getElementById("theme-text").value = state.theme.text;
	document.getElementById("theme-spacing").value = state.theme.spacing;
	document.getElementById("theme-radius").value = state.theme.radius;
	document.getElementById("theme-font").value = state.theme.font;
	document.getElementById("theme-dark").checked = state.theme.dark;
}

function onFormatChange() {
	state.format = document.getElementById("code-format").value;
	renderCode();
	scheduleSave();
}

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener("keydown", (e) => {
	if (e.key === "Delete" || e.key === "Backspace") {
		if (state.selectedId && !e.target.closest("input,textarea,select")) {
			deleteComponent(state.selectedId);
			e.preventDefault();
		}
	}
	if (e.key === "Escape") {
		state.selectedId = null;
		render();
	}
});

/* ===== CODE PANEL TOGGLE ===== */
function toggleCodePanel() {
	const panel = document.getElementById("code-panel");
	panel.classList.toggle("collapsed");
	const btn = document.getElementById("btn-toggle-code");
	btn.textContent = panel.classList.contains("collapsed")
		? "◈ Code ▸"
		: "◈ Code";
}

/* ===== PALETTE RESIZE ===== */
(function initPaletteResize() {
	const palette = document.getElementById("palette");
	const handle = document.getElementById("palette-resize");
	if (!palette || !handle) return;
	let isResizing = false;
	handle.addEventListener("mousedown", (e) => {
		e.preventDefault();
		isResizing = true;
		handle.classList.add("resizing");
		document.body.style.cursor = "col-resize";
		const startX = e.clientX;
		const startW = palette.offsetWidth;
		const onMove = (ev) => {
			if (!isResizing) return;
			const w = Math.max(160, Math.min(400, startW + ev.clientX - startX));
			palette.style.width = w + "px";
		};
		const onUp = () => {
			isResizing = false;
			handle.classList.remove("resizing");
			document.body.style.cursor = "";
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		};
		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
	});
})();

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
	applyThemeCSS();
	document
		.getElementById("palette-search")
		.addEventListener("input", renderPalette);
	document.getElementById("btn-clear").addEventListener("click", clearAll);
	document.getElementById("btn-export").addEventListener("click", exportDesign);
	document.getElementById("btn-copy").addEventListener("click", copyCode);
	document
		.getElementById("btn-toggle-code")
		.addEventListener("click", toggleCodePanel);
	document
		.getElementById("code-format")
		.addEventListener("change", onFormatChange);
	[
		"theme-primary",
		"theme-secondary",
		"theme-bg",
		"theme-text",
		"theme-spacing",
		"theme-radius",
		"theme-font",
		"theme-dark",
	].forEach((id) => {
		document.getElementById(id).addEventListener("input", updateThemeFromUI);
		document.getElementById(id).addEventListener("change", updateThemeFromUI);
	});

	// Load saved state
	fetch("/api/state")
		.then((r) => r.json())
		.then((data) => {
			if (data.tree && data.tree.children && data.tree.children.length > 0) {
				state.tree = data.tree;
				// Compute nextId from tree
				let maxId = 0;
				(function walk(node) {
					if (node.id && node.id.startsWith("c"))
						maxId = Math.max(maxId, parseInt(node.id.slice(1)) || 0);
					for (const c of node.children || []) walk(c);
				})(state.tree);
				state.nextId = maxId + 1;
			} else if (data.components && data.components.length > 0) {
				// Migrate flat format → tree
				state.tree.children = data.components.map((c) => ({
					id: c.id,
					type: c.type,
					props: { ...c.props },
					children: [],
				}));
				state.nextId =
					Math.max(
						...data.components.map((c) => parseInt(c.id.slice(1)) || 0),
						0,
					) + 1;
			}
			if (data.theme && Object.keys(data.theme).length > 0) {
				Object.assign(state.theme, data.theme);
				syncThemeUI();
				document.documentElement.setAttribute(
					"data-theme",
					state.theme.dark ? "dark" : "light",
				);
			}
			render();
		})
		.catch(() => render());
});
