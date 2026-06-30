/* ═══ All component type definitions ═══ */

import type { ComponentDef } from "./types";

export const COMPONENTS: Record<string, ComponentDef> = {
	// ── Layout ──
	container: {
		cat: "Layout", label: "Container",
		icon: "<i class='fa-regular fa-square'></i>",
		props: { padding: true },
	},
	wrapper: {
		cat: "Layout", label: "Wrapper",
		icon: "<i class='fa-regular fa-cube'></i>",
		props: { maxW: "1080px" },
	},
	section: {
		cat: "Layout", label: "Section",
		icon: "<i class='fa-regular fa-rectangle'></i>",
		props: { title: "Section Title" },
	},
	article: {
		cat: "Layout", label: "Article",
		icon: "<i class='fa-regular fa-newspaper'></i>",
		props: { title: "Article Title" },
	},
	header: {
		cat: "Layout", label: "Header",
		icon: "<i class='fa-regular fa-arrow-up-to-line'></i>",
		props: { brand: "Logo" },
	},
	footer: {
		cat: "Layout", label: "Footer",
		icon: "<i class='fa-regular fa-shoe-prints'></i>",
		props: { text: "© 2026 Your Company" },
	},
	flexRow: {
		cat: "Layout", label: "Flex Row",
		icon: "<i class='fa-regular fa-arrows-left-right'></i>",
		props: { gap: "16px", justify: "start", align: "center" },
	},
	flexCol: {
		cat: "Layout", label: "Flex Col",
		icon: "<i class='fa-regular fa-arrows-up-down'></i>",
		props: { gap: "12px", align: "stretch" },
	},
	stack: {
		cat: "Layout", label: "Stack",
		icon: "<i class='fa-regular fa-layer-group'></i>",
		props: { direction: "vertical", gap: "12px" },
	},
	grid: {
		cat: "Layout", label: "Grid",
		icon: "<i class='fa-regular fa-table-cells'></i>",
		props: { cols: 3, gap: "16px" },
	},
	panel: {
		cat: "Layout", label: "Panel",
		icon: "<i class='fa-regular fa-window-maximize'></i>",
		props: { header: "Panel", body: "Content" },
	},
	sidebar: {
		cat: "Layout", label: "Sidebar",
		icon: "<i class='fa-regular fa-tv'></i>",
		props: { items: "Dashboard,Analytics,Settings", active: "Dashboard" },
	},
	frame: {
		cat: "Layout", label: "Frame",
		icon: "<i class='fa-regular fa-crop'></i>",
		props: { w: 400, h: 300, fill: "transparent" },
	},
	divider: {
		cat: "Layout", label: "Divider",
		icon: "<i class='fa-regular fa-minus'></i>",
		props: { text: "Section", vertical: false },
	},
	spacer: {
		cat: "Layout", label: "Spacer",
		icon: "<i class='fa-regular fa-up-down'></i>",
		props: { height: "24px" },
	},
	card: {
		cat: "Cards", label: "Card",
		icon: "<i class='fa-regular fa-credit-card'></i>",
		props: { header: "Card Title", body: "Card content here.", footer: "Footer" },
	},
	pricingCard: {
		cat: "Cards", label: "Pricing Card",
		icon: "<i class='fa-regular fa-money-bill'></i>",
		props: { plan: "Pro", price: "$29", period: "/mo", features: "Feature 1,Feature 2,Feature 3", cta: "Subscribe", featured: false },
	},

	// ── Typography ──
	heading: {
		cat: "Typography", label: "Heading",
		icon: "<i class='fa-regular fa-heading'></i>",
		props: { level: "h2", text: "Heading Text" },
	},
	paragraph: {
		cat: "Typography", label: "Paragraph",
		icon: "<i class='fa-regular fa-paragraph'></i>",
		props: { text: "Paragraph text. Double-click to edit." },
	},
	link: {
		cat: "Typography", label: "Link",
		icon: "<i class='fa-regular fa-link'></i>",
		props: { text: "Click here", href: "#" },
	},
	blockquote: {
		cat: "Typography", label: "Blockquote",
		icon: "<i class='fa-regular fa-quote-left'></i>",
		props: { text: "A notable quote." },
	},
	inlineCode: {
		cat: "Typography", label: "Inline Code",
		icon: "<i class='fa-regular fa-code'></i>",
		props: { text: "npm install" },
	},
	label: {
		cat: "Typography", label: "Label",
		icon: "<i class='fa-regular fa-tag'></i>",
		props: { text: "Label text" },
	},
	codeBlock: {
		cat: "Typography", label: "Code Block",
		icon: "<i class='fa-regular fa-code'></i>",
		props: { code: "console.log('hello');", lang: "javascript" },
	},

	// ── Buttons ──
	btnPrimary: {
		cat: "Buttons", label: "Primary Btn",
		icon: "<i class='fa-regular fa-rectangle-ad'></i>",
		props: { text: "Get Started" },
	},
	btnSecondary: {
		cat: "Buttons", label: "Secondary Btn",
		icon: "<i class='fa-regular fa-rectangle-ad'></i>",
		props: { text: "Learn More" },
	},
	btnOutline: {
		cat: "Buttons", label: "Outline Btn",
		icon: "<i class='fa-regular fa-rectangle-ad'></i>",
		props: { text: "Cancel" },
	},
	btnGhost: {
		cat: "Buttons", label: "Ghost Btn",
		icon: "<i class='fa-regular fa-rectangle-ad'></i>",
		props: { text: "Dismiss" },
	},
	btnGroup: {
		cat: "Buttons", label: "Button Group",
		icon: "<i class='fa-regular fa-union'></i>",
		props: { items: "Left,Center,Right", active: "Center" },
	},
	iconBtn: {
		cat: "Buttons", label: "Icon Btn",
		icon: "<i class='fa-regular fa-star'></i>",
		props: { icon: "★", label: "Favorite" },
	},
	fab: {
		cat: "Buttons", label: "FAB",
		icon: "<i class='fa-regular fa-circle-plus'></i>",
		props: { icon: "+", label: "Add" },
	},

	// ── Navigation ──
	navbar: {
		cat: "Navigation", label: "Navbar",
		icon: "<i class='fa-regular fa-bars'></i>",
		props: { brand: "Brand", items: "Home,About,Pricing,Contact" },
	},
	tabs: {
		cat: "Navigation", label: "Tabs",
		icon: "<i class='fa-regular fa-table-cells'></i>",
		props: { items: "Tab 1,Tab 2,Tab 3", active: "Tab 1" },
	},
	verticalTabs: {
		cat: "Navigation", label: "Vertical Tabs",
		icon: "<i class='fa-regular fa-list'></i>",
		props: { items: "Tab 1,Tab 2,Tab 3", active: "Tab 1" },
	},
	breadcrumb: {
		cat: "Navigation", label: "Breadcrumb",
		icon: "<i class='fa-regular fa-angles-right'></i>",
		props: { items: "Home,Products,Details", current: "Details" },
	},
	pagination: {
		cat: "Navigation", label: "Pagination",
		icon: "<i class='fa-regular fa-chevrons-right'></i>",
		props: { total: 5, current: 3 },
	},
	dropdown: {
		cat: "Navigation", label: "Dropdown",
		icon: "<i class='fa-regular fa-caret-down'></i>",
		props: { trigger: "Menu", items: "Profile,Settings,Logout" },
	},
	megaMenu: {
		cat: "Navigation", label: "Mega Menu",
		icon: "<i class='fa-regular fa-rectangle'></i>",
		props: { items: "Products~Catalog,Pricing,About~Company,Careers" },
	},
	hamburger: {
		cat: "Navigation", label: "Hamburger",
		icon: "<i class='fa-regular fa-bars'></i>",
		props: { items: "Home,About,Contact" },
	},
	stepper: {
		cat: "Navigation", label: "Stepper",
		icon: "<i class='fa-regular fa-list-ol'></i>",
		props: { steps: "Step 1,Step 2,Step 3", current: 1 },
	},
	backToTop: {
		cat: "Navigation", label: "Back to Top",
		icon: "<i class='fa-regular fa-arrow-up'></i>",
		props: { text: "↑ Top" },
	},

	// ── Forms ──
	input: {
		cat: "Forms", label: "Input",
		icon: "<i class='fa-regular fa-keyboard'></i>",
		props: { placeholder: "Enter text...", label: "Name" },
	},
	textarea: {
		cat: "Forms", label: "Textarea",
		icon: "<i class='fa-regular fa-rectangle-history'></i>",
		props: { placeholder: "Enter details...", label: "Message" },
	},
	select: {
		cat: "Forms", label: "Select",
		icon: "<i class='fa-regular fa-caret-down'></i>",
		props: { label: "Choose", options: "Option 1,Option 2,Option 3" },
	},
	multiSelect: {
		cat: "Forms", label: "Multi-Select",
		icon: "<i class='fa-regular fa-list-check'></i>",
		props: { label: "Tags", options: "Red,Blue,Green", selected: "Red,Blue" },
	},
	checkbox: {
		cat: "Forms", label: "Checkbox",
		icon: "<i class='fa-regular fa-square-check'></i>",
		props: { label: "Accept terms", checked: false },
	},
	radioGroup: {
		cat: "Forms", label: "Radio Group",
		icon: "<i class='fa-regular fa-circle-dot'></i>",
		props: { label: "Plan", options: "Free,Pro,Enterprise", selected: "Pro" },
	},
	toggle: {
		cat: "Forms", label: "Toggle",
		icon: "<i class='fa-regular fa-toggle-on'></i>",
		props: { label: "Notifications", on: true },
	},
	rangeSlider: {
		cat: "Forms", label: "Range",
		icon: "<i class='fa-regular fa-sliders'></i>",
		props: { label: "Volume", value: 60, min: 0, max: 100 },
	},
	datePicker: {
		cat: "Forms", label: "Date Picker",
		icon: "<i class='fa-regular fa-calendar'></i>",
		props: { label: "Date", value: "2026-01-01" },
	},
	timePicker: {
		cat: "Forms", label: "Time Picker",
		icon: "<i class='fa-regular fa-clock'></i>",
		props: { label: "Time", value: "09:00" },
	},
	colorPicker: {
		cat: "Forms", label: "Color Picker",
		icon: "<i class='fa-regular fa-palette'></i>",
		props: { label: "Color", value: "#0d99ff" },
	},
	fileUpload: {
		cat: "Forms", label: "File Upload",
		icon: "<i class='fa-regular fa-upload'></i>",
		props: { label: "Upload", accept: "image/*", multiple: false },
	},
	imageUpload: {
		cat: "Forms", label: "Image Upload",
		icon: "<i class='fa-regular fa-image'></i>",
		props: { label: "Upload Image" },
	},
	fieldset: {
		cat: "Forms", label: "Fieldset",
		icon: "<i class='fa-regular fa-rectangle'></i>",
		props: { legend: "Details" },
	},
	autocomplete: {
		cat: "Forms", label: "Autocomplete",
		icon: "<i class='fa-regular fa-list'></i>",
		props: { label: "Search", suggestions: "Apple,Banana,Cherry" },
	},
	chipInput: {
		cat: "Forms", label: "Tag Input",
		icon: "<i class='fa-regular fa-tags'></i>",
		props: { label: "Tags", placeholder: "Add tag..." },
	},

	// ── Media ──
	image: {
		cat: "Media", label: "Image",
		icon: "<i class='fa-regular fa-image'></i>",
		props: { alt: "Placeholder", width: "100%", height: "120px" },
	},
	avatar: {
		cat: "Media", label: "Avatar",
		icon: "<i class='fa-regular fa-user'></i>",
		props: { initials: "JD", name: "Jane Doe", role: "Designer" },
	},
	icon: {
		cat: "Media", label: "Icon",
		icon: "<i class='fa-regular fa-star'></i>",
		props: { symbol: "★", size: "24px" },
	},
	video: {
		cat: "Media", label: "Video",
		icon: "<i class='fa-regular fa-circle-play'></i>",
		props: { src: "", poster: "", width: "320px", height: "240px" },
	},
	audio: {
		cat: "Media", label: "Audio",
		icon: "<i class='fa-regular fa-circle-play'></i>",
		props: { src: "", title: "Audio Player" },
	},
	figure: {
		cat: "Media", label: "Figure",
		icon: "<i class='fa-regular fa-image'></i>",
		props: { caption: "Caption text", alt: "Image" },
	},

	// ── Feedback ──
	alert: {
		cat: "Feedback", label: "Alert",
		icon: "<i class='fa-regular fa-circle-exclamation'></i>",
		props: { variant: "info", text: "Informational message." },
	},
	badge: {
		cat: "Feedback", label: "Badge",
		icon: "<i class='fa-regular fa-tag'></i>",
		props: { variant: "primary", text: "New" },
	},
	progress: {
		cat: "Feedback", label: "Progress",
		icon: "<i class='fa-regular fa-chart-bar'></i>",
		props: { value: 65, label: "65% complete" },
	},
	spinner: {
		cat: "Feedback", label: "Spinner",
		icon: "<i class='fa-regular fa-spinner'></i>",
		props: { text: "Loading..." },
	},
	skeleton: {
		cat: "Feedback", label: "Skeleton",
		icon: "<i class='fa-regular fa-rectangle'></i>",
		props: { lines: 3, width: "100%" },
	},
	toast: {
		cat: "Feedback", label: "Toast",
		icon: "<i class='fa-regular fa-message'></i>",
		props: { text: "Saved!", variant: "success" },
	},
	emptyState: {
		cat: "Feedback", label: "Empty State",
		icon: "<i class='fa-regular fa-box-open'></i>",
		props: { icon: "📦", title: "No items", text: "Get started by adding items." },
	},
	tooltip: {
		cat: "Feedback", label: "Tooltip",
		icon: "<i class='fa-regular fa-circle-info'></i>",
		props: { trigger: "Hover me", text: "Helpful hint!" },
	},
	popover: {
		cat: "Feedback", label: "Popover",
		icon: "<i class='fa-regular fa-comment'></i>",
		props: { trigger: "Click", title: "Details", body: "More info here." },
	},
	notificationCenter: {
		cat: "Feedback", label: "Notif. Center",
		icon: "<i class='fa-regular fa-bell'></i>",
		props: { count: 3 },
	},

	// ── Data ──
	list: {
		cat: "Data", label: "List",
		icon: "<i class='fa-regular fa-list'></i>",
		props: { items: "Item one,Item two,Item three" },
	},
	orderedList: {
		cat: "Data", label: "Ordered List",
		icon: "<i class='fa-regular fa-list-ol'></i>",
		props: { items: "First,Second,Third" },
	},
	table: {
		cat: "Data", label: "Table",
		icon: "<i class='fa-regular fa-table'></i>",
		props: { headers: "Name,Role,Status", rows: "Alice,Admin,Active|Bob,User,Pending|Carol,Editor,Active" },
	},
	stats: {
		cat: "Data", label: "Stats",
		icon: "<i class='fa-regular fa-chart-simple'></i>",
		props: { items: "Users~2,400,Revenue~$12K,Active~89%" },
	},
	timeline: {
		cat: "Data", label: "Timeline",
		icon: "<i class='fa-regular fa-clock-rotate-left'></i>",
		props: { items: "Design~Phase 1~2026-01,Build~Phase 2~2026-03,Launch~Phase 3~2026-06" },
	},
	treeView: {
		cat: "Data", label: "Tree View",
		icon: "<i class='fa-regular fa-sitemap'></i>",
		props: { items: "Root|Child 1,Child 2|Grandchild" },
	},
	accordion: {
		cat: "Data", label: "Accordion",
		icon: "<i class='fa-regular fa-rectangle-vertical-history'></i>",
		props: { items: "Section 1~Content one.|Section 2~Content two." },
	},
	carousel: {
		cat: "Data", label: "Carousel",
		icon: "<i class='fa-regular fa-images'></i>",
		props: { items: "Slide 1,Slide 2,Slide 3", current: 1 },
	},

	// ── Sections ──
	hero: {
		cat: "Sections", label: "Hero",
		icon: "<i class='fa-regular fa-star'></i>",
		props: { title: "Build Something Great", subtitle: "A clean platform.", cta: "Get Started" },
	},
	testimonial: {
		cat: "Sections", label: "Testimonial",
		icon: "<i class='fa-regular fa-comment'></i>",
		props: { quote: "Great product!", author: "Alex Chen", role: "CEO" },
	},
	modal: {
		cat: "Sections", label: "Modal",
		icon: "<i class='fa-regular fa-window-restore'></i>",
		props: { title: "Confirm", body: "Proceed?", cancel: "Cancel", confirm: "Confirm" },
	},
};
