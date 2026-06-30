/* ═══ Canvas rendering — preview, tree, layers, inspector, resize handles ═══ */

import type { ComponentNode, ComponentDef, Theme } from "./types";
import { esc, RADIUS, SPACING, findNode, isContainer, totalComponents, getSelectedNodes } from "./utils";
import { COMPONENTS } from "./components";
import { S, pushHistory, scheduleSave } from "./state";

let _editInfo: { id: string; origText: string } | null = null;

export function getEditInfo() { return _editInfo; }
export function setEditInfo(e: typeof _editInfo) { _editInfo = e; }

/* ── Preview renderer ── */
export function renderPreview(type: string, p: Record<string, any>, ch: string): string {
	const t = S.theme, r = RADIUS[t.radius] || "6px", s = SPACING[t.spacing] || "1rem";
	const textColor = t.dark ? "#e2e4f0" : "#1f2937";
	if (type === "root") return ch || "";
	if (type === "container")
		return `<div class="cp-container" style="padding:${s};border-radius:${r}"><div style="font-size:9px;color:var(--text-muted);opacity:.5;margin-bottom:4px">▣ Container</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">drop here</span>'}</div>`;
	if (type === "wrapper")
		return `<div style="max-width:${p.maxW || "1080px"};margin:0 auto;padding:${s}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">wrapper</span>'}</div>`;
	if (type === "section")
		return `<div class="cp-container" style="padding:${s};border-radius:${r}"><div style="font-size:9px;color:var(--text-muted);opacity:.5;margin-bottom:4px">§ ${esc(p.title || "Section")}</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">content</span>'}</div>`;
	if (type === "article")
		return `<div style="padding:${s};border-radius:${r}"><div style="font-size:12px;font-weight:600;margin-bottom:6px">${esc(p.title || "Article")}</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">content</span>'}</div>`;
	if (type === "header")
		return `<div style="display:flex;align-items:center;padding:8px 12px;background:var(--bg3);border-radius:${r};font-weight:600">${esc(p.brand || "Header")}</div>`;
	if (type === "stack")
		return `<div style="display:flex;flex-direction:${p.direction === "horizontal" ? "row" : "column"};gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">stack</span>'}</div>`;
	if (type === "panel")
		return `<div style="border:1px solid var(--border);border-radius:${r};overflow:hidden"><div style="padding:8px 12px;background:var(--bg3);font-weight:600;font-size:12px;border-bottom:1px solid var(--border)">${esc(p.header || "Panel")}</div><div style="padding:${s}">${ch || esc(p.body || "Content")}</div></div>`;
	if (type === "flexRow")
		return `<div class="cp-flex row" style="gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⇉ flex row</span>'}</div>`;
	if (type === "flexCol")
		return `<div class="cp-flex col" style="gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⇊ flex col</span>'}</div>`;
	if (type === "grid")
		return `<div class="cp-grid" style="grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap};padding:${s};border-radius:${r}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">⊞ grid</span>'}</div>`;
	if (type === "frame")
		return `<div style="width:${p.w}px;height:${p.h}px;background:${p.fill};border:1px solid var(--border);border-radius:${r};position:relative;padding:8px;overflow:hidden"><div style="font-size:8px;color:var(--text-muted);opacity:.4;position:absolute;top:2px;left:4px">Frame</div>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">frame content</span>'}</div>`;
	if (type === "sidebar")
		return `<div class="cp-sidebar" style="border-radius:${r}"><div class="side">${(p.items || "").split(",").map((i: string) => `<span class="item${i.trim() === p.active ? " active" : ""}">${i.trim()}</span>`).join("")}</div><div class="main" style="padding:${s}">${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">main</span>'}</div></div>`;

	switch (type) {
		case "divider":
			return p.vertical
				? `<div class="cp-divider vertical" style="height:40px"><hr></div>`
				: `<div class="cp-divider"><hr><span>${esc(p.text)}</span><hr></div>`;
		case "spacer":
			return `<div style="height:${p.height};background:repeating-linear-gradient(90deg,var(--border),var(--border) 3px,transparent 3px,transparent 6px);border-radius:2px"></div>`;
		case "heading":
			return `<div class="cp-heading ${p.level}" style="color:${textColor}">${esc(p.text)}</div>`;
		case "paragraph":
			return `<div class="cp-paragraph">${esc(p.text)}</div>`;
		case "link":
			return `<span class="cp-link">${esc(p.text)}</span>`;
		case "blockquote":
			return `<div class="cp-blockquote">${esc(p.text)}</div>`;
		case "inlineCode":
			return `<code style="background:var(--bg3);padding:1px 5px;border-radius:3px;font-size:11px">${esc(p.text)}</code>`;
		case "codeBlock":
			return `<pre style="background:var(--bg3);border-radius:${r};padding:8px;font-size:10px;overflow:auto;border:1px solid var(--border)"><code>${esc(p.code || "")}</code></pre>`;
		case "label":
			return `<span style="font-size:11px;color:var(--text-muted);font-weight:500">${esc(p.text)}</span>`;
		case "btnPrimary":
			return `<button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnSecondary":
			return `<button class="cp-btn secondary" style="background:${t.secondary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnOutline":
			return `<button class="cp-btn outline" style="border-color:${t.primary};color:${t.primary};border-radius:${r}">${esc(p.text)}</button>`;
		case "btnGhost":
			return `<button style="padding:6px 16px;border-radius:${r};font-size:13px;font-weight:500;border:none;background:transparent;color:var(--text2)">${esc(p.text)}</button>`;
		case "btnGroup":
			return `<div style="display:inline-flex;border:1px solid var(--border);border-radius:${r};overflow:hidden">${(p.items || "").split(",").map((i: string, idx: number, a: string[]) => `<span style="padding:5px 12px;font-size:11px;${idx < a.length - 1 ? "border-right:1px solid var(--border)" : ""};${i.trim() === p.active ? "background:var(--accent);color:#fff" : ""}">${i.trim()}</span>`).join("")}</div>`;
		case "iconBtn":
			return `<button style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid var(--border);border-radius:${r};font-size:12px">${p.icon || "★"} ${esc(p.label || "")}</button>`;
		case "fab":
			return `<button style="width:40px;height:40px;border-radius:50%;background:${t.primary};color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)">${p.icon || "+"}</button>`;
		case "input":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><input class="cp-input" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></div>`;
		case "textarea":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><textarea class="cp-textarea" placeholder="${esc(p.placeholder)}" style="border-radius:${r}"></textarea></div>`;
		case "select":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><select class="cp-select" style="border-radius:${r}">${(p.options || "").split(",").map((o: string) => `<option>${o.trim()}</option>`).join("")}</select></div>`;
		case "multiSelect":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><select multiple class="cp-select" style="border-radius:${r};min-height:60px">${(p.options || "").split(",").map((o: string) => `<option${(p.selected || "").includes(o.trim()) ? " selected" : ""}>${o.trim()}</option>`).join("")}</select></div>`;
		case "checkbox":
			return `<label class="cp-checkbox"><input type="checkbox" ${p.checked ? "checked" : ""}> ${esc(p.label)}</label>`;
		case "radioGroup":
			return `<div class="cp-radio-group"><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div>${(p.options || "").split(",").map((o: string) => `<label><input type="radio" name="rg" ${o.trim() === p.selected ? "checked" : ""}> ${o.trim()}</label>`).join("")}</div>`;
		case "toggle":
			return `<div class="cp-toggle"><div class="track ${p.on ? "on" : ""}"><div class="thumb"></div></div><span>${esc(p.label)}</span></div>`;
		case "rangeSlider":
			return `<div style="display:flex;flex-direction:column;gap:3px"><div style="font-size:10px;color:var(--text-muted)">${esc(p.label)}</div><input type="range" min="${p.min}" max="${p.max}" value="${p.value}" style="accent-color:${t.primary};width:100%"><span style="font-size:10px;color:var(--text-muted)">${p.value}%</span></div>`;
		case "datePicker":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><input type="date" value="${p.value || ""}" class="cp-input" style="border-radius:${r}"></div>`;
		case "timePicker":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><input type="time" value="${p.value || ""}" class="cp-input" style="border-radius:${r}"></div>`;
		case "colorPicker":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><div style="display:flex;align-items:center;gap:4px"><input type="color" value="${p.value || t.primary}" style="width:28px;height:24px;border:1px solid var(--border);border-radius:3px;background:none;padding:1px"><span style="font-size:11px;color:var(--text-muted)">${p.value || ""}</span></div></div>`;
		case "fileUpload":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><div style="border:2px dashed var(--border);border-radius:${r};padding:12px;text-align:center;font-size:11px;color:var(--text-muted)"><i class="fa-regular fa-upload"></i> Drop or click to upload</div></div>`;
		case "imageUpload":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><div style="border:2px dashed var(--border);border-radius:${r};padding:12px;text-align:center;font-size:11px;color:var(--text-muted)"><i class="fa-regular fa-image"></i> Click to upload image</div></div>`;
		case "fieldset":
			return `<fieldset style="border:1px solid var(--border);border-radius:${r};padding:${s}"><legend style="font-size:11px;color:var(--text-muted);padding:0 6px">${esc(p.legend || "")}</legend>${ch || '<span style="color:var(--text-muted);font-size:10px;opacity:.4">fieldset content</span>'}</fieldset>`;
		case "autocomplete":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><div style="position:relative"><input class="cp-input" placeholder="Type to search..." style="border-radius:${r}"><div style="position:absolute;top:100%;left:0;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin-top:2px;max-height:80px;overflow:hidden">${(p.suggestions || "").split(",").slice(0, 3).map((s: string) => `<div style="padding:4px 8px;font-size:10px;border-bottom:1px solid var(--border)">${s.trim()}</div>`).join("")}</div></div></div>`;
		case "chipInput":
			return `<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px">${esc(p.label || "")}</div><div style="display:flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--border);border-radius:${r};background:var(--bg3)"><span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:var(--accent);color:#fff;border-radius:3px;font-size:9px">Tag <span style="cursor:default">×</span></span><input placeholder="${esc(p.placeholder || "Add...")}" style="border:none;background:none;outline:none;font-size:10px;color:var(--text);width:60px"></div></div>`;
		case "image":
			if (p.src) return `<div class="cp-image" style="width:${p.width};height:${p.height};border-radius:${r};overflow:hidden;background:var(--bg)"><img src="${p.src}" alt="${esc(p.alt)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
			return `<div class="cp-image" style="width:${p.width};height:${p.height};border-radius:${r}">🖼 ${esc(p.alt)}</div>`;
		case "avatar":
			return `<div class="cp-avatar"><div class="circle">${esc(p.initials)}</div><div class="info"><div class="name">${esc(p.name)}</div><div class="sub">${esc(p.role)}</div></div></div>`;
		case "icon":
			return `<div class="cp-icon" style="font-size:${p.size};color:${t.primary}">${p.symbol}</div>`;
		case "video":
			return `<div style="width:${p.width || "320px"};height:${p.height || "240px"};background:#000;border-radius:${r};display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px"><i class="fa-regular fa-circle-play" style="font-size:24px;margin-right:6px"></i> Video</div>`;
		case "audio":
			return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg3);border-radius:${r}"><i class="fa-regular fa-circle-play" style="color:${t.primary}"></i><span style="font-size:11px;color:var(--text-muted)">${esc(p.title || "Audio")}</span></div>`;
		case "figure":
			return `<figure style="border-radius:${r};overflow:hidden;border:1px solid var(--border)"><div style="height:60px;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px">🖼</div><figcaption style="padding:4px 8px;font-size:10px;color:var(--text-muted)">${esc(p.caption || "")}</figcaption></figure>`;
		case "navbar":
			return `<nav class="cp-navbar" style="border-radius:${r}"><span class="brand" style="color:${t.primary}">${esc(p.brand)}</span>${(p.items || "").split(",").map((i: string) => `<span class="nav-item">${i.trim()}</span>`).join("")}</nav>`;
		case "tabs":
			return `<div class="cp-tabs">${(p.items || "").split(",").map((i: string) => `<span class="tab${i.trim() === p.active ? " active" : ""}" style="${i.trim() === p.active ? `color:${t.primary}` : ""}">${i.trim()}</span>`).join("")}</div>`;
		case "verticalTabs":
			return `<div style="display:flex;gap:2px;flex-direction:column;padding:4px">${(p.items || "").split(",").map((i: string) => `<span style="padding:5px 10px;font-size:11px;border-radius:4px;${i.trim() === p.active ? "background:var(--accent);color:#fff" : "background:var(--bg3)"}">${i.trim()}</span>`).join("")}</div>`;
		case "breadcrumb":
			return `<div class="cp-breadcrumb">${(p.items || "").split(",").map((i: string, idx: number, a: string[]) => `<span${i.trim() === p.current ? ' class="current"' : ""}>${i.trim()}</span>${idx < a.length - 1 ? '<span class="sep">›</span>' : ""}`).join("")}</div>`;
		case "pagination":
			return `<div class="cp-pagination"><button>‹</button>${Array.from({ length: Math.min(Number(p.total) || 5, 5) }, (_, i) => `<button${i + 1 === (Number(p.current) || 1) ? ' class="active"' : ""}>${i + 1}</button>`).join("")}<button>›</button></div>`;
		case "dropdown":
			return `<div class="cp-dropdown"><span class="cp-dropdown-trigger">${esc(p.trigger)} ⏷</span><div class="cp-dropdown-menu">${(p.items || "").split(",").map((i: string) => `<div class="cp-dropdown-item">${i.trim()}</div>`).join("")}</div></div>`;
		case "megaMenu":
			return `<div style="display:flex;gap:16px;padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:${r}">${(p.items || "").split(",").map((i: string) => { const [hd, ...rest] = i.split("~"); return `<div style="min-width:100px"><div style="font-weight:600;font-size:11px;margin-bottom:6px;color:var(--text)">${esc(hd || "")}</div>${rest.length ? rest.map((r: string) => `<div style="font-size:10px;color:var(--text-muted);padding:3px 0">${r.trim()}</div>`).join("") : ""}</div>`; }).join("")}</div>`;
		case "hamburger":
			return `<div style="display:flex;flex-direction:column;gap:3px;padding:8px;cursor:pointer;width:40px"><div style="height:2px;background:var(--text-muted);border-radius:1px"></div><div style="height:2px;background:var(--text-muted);border-radius:1px"></div><div style="height:2px;background:var(--text-muted);border-radius:1px"></div></div>`;
		case "stepper":
			return `<div style="display:flex;align-items:center;gap:4px;padding:4px">${(p.steps || "").split(",").map((s: string, i: number) => `<div style="display:flex;align-items:center;gap:2px"><span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:9px;font-weight:600;${i < (Number(p.current) || 1) ? "background:var(--accent);color:#fff" : "background:var(--bg3);color:var(--text-muted)"}">${i + 1}</span><span style="font-size:9px;color:var(--text-muted);${i < (Number(p.current) || 1) ? "color:var(--text)" : ""}">${s.trim()}</span>${i < (p.steps || "").split(",").length - 1 ? '<span style="color:var(--border)">─</span>' : ""}</div>`).join("")}</div>`;
		case "backToTop":
			return `<div style="display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 12px;cursor:pointer;color:var(--text-muted);font-size:10px"><i class="fa-regular fa-arrow-up"></i> ${esc(p.text || "Top")}</div>`;
		case "card":
			return `<div class="cp-card" style="border-radius:${r}"><div class="cp-card-header">${esc(p.header)}</div><div class="cp-card-body">${esc(p.body)}</div><div class="cp-card-footer">${esc(p.footer)}</div></div>`;
		case "pricingCard":
			return `<div class="cp-pricing ${p.featured ? "featured" : ""}" style="border-radius:${r}${p.featured ? `;border-color:${t.primary}` : ""}"><div class="plan">${esc(p.plan)}</div><div class="price">${esc(p.price)}<span>${esc(p.period)}</span></div><ul>${(p.features || "").split(",").map((f: string) => `<li>✓ ${f.trim()}</li>`).join("")}</ul><button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.cta)}</button></div>`;
		case "alert":
			return `<div class="cp-alert ${p.variant}" style="border-radius:${r}">${p.variant === "error" ? "✕" : p.variant === "warn" ? "⚠" : "ℹ"} ${esc(p.text)}</div>`;
		case "badge":
			return `<span class="cp-badge ${p.variant}" style="background:${p.variant === "primary" ? t.primary : t.secondary}">${esc(p.text)}</span>`;
		case "progress":
			return `<div class="cp-progress"><div class="label">${esc(p.label)}</div><div class="track"><div class="fill" style="width:${p.value}%;background:${t.primary}"></div></div></div>`;
		case "spinner":
			return `<div class="cp-spinner"><div class="ring"></div><span>${esc(p.text)}</span></div>`;
		case "skeleton":
			return `<div style="display:flex;flex-direction:column;gap:6px;width:${p.width}">${Array.from({ length: Math.min(Number(p.lines) || 3, 5) }, (_, i) => `<div style="height:10px;border-radius:${r};background:linear-gradient(90deg,var(--bg3) 25%,var(--border) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;width:${[100, 85, 90, 70, 95][i] || 100}%"></div>`).join("")}</div>`;
		case "toast":
			return `<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:${r};font-size:11px;background:var(--green);color:var(--bg);max-width:240px">✓ ${esc(p.text)}</div>`;
		case "emptyState":
			return `<div style="text-align:center;padding:24px;opacity:.7"><div style="font-size:24px;margin-bottom:8px">${p.icon || "📦"}</div><div style="font-weight:600;font-size:13px;margin-bottom:4px">${esc(p.title || "No items")}</div><div style="font-size:11px;color:var(--text-muted)">${esc(p.text || "")}</div></div>`;
		case "tooltip":
			return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px"><span style="font-size:12px;border-bottom:1px dashed var(--text-muted)">${esc(p.trigger)}</span><span style="font-size:10px;padding:3px 6px;border-radius:${r};background:var(--bg3);color:var(--text-muted)">${esc(p.text)}</span></div>`;
		case "popover":
			return `<div style="display:inline-flex;flex-direction:column;gap:2px;border:1px solid var(--border);border-radius:${r};padding:8px;background:var(--bg2);box-shadow:var(--shadow)"><div style="font-weight:600;font-size:11px;margin-bottom:4px">${esc(p.title || "")}</div><div style="font-size:10px;color:var(--text-muted)">${esc(p.body || "")}</div></div>`;
		case "notificationCenter":
			return `<div style="position:relative;display:inline-flex"><i class="fa-regular fa-bell" style="font-size:18px"></i><span style="position:absolute;top:-4px;right:-6px;background:var(--red);color:#fff;font-size:8px;font-weight:700;border-radius:99px;padding:1px 5px;min-width:16px;text-align:center">${Number(p.count) || 0}</span></div>`;
		case "list":
			return `<ul class="cp-list">${(p.items || "").split(",").map((i: string) => `<li>${i.trim()}</li>`).join("")}</ul>`;
		case "orderedList":
			return `<ol style="list-style:decimal;padding-left:18px;font-size:12px">${(p.items || "").split(",").map((i: string) => `<li style="margin:2px 0">${i.trim()}</li>`).join("")}</ol>`;
		case "table":
			return `<table class="cp-table"><thead><tr>${(p.headers || "").split(",").map((h: string) => `<th>${h.trim()}</th>`).join("")}</tr></thead><tbody>${(p.rows || "").split("|").filter(Boolean).map((r: string) => "<tr>" + r.split(",").map((c: string) => `<td>${c.trim()}</td>`).join("") + "</tr>").join("")}</tbody></table>`;
		case "stats":
			return `<div class="cp-stats">${(p.items || "").split(",").map((item: string) => { const [l, n] = item.split("~"); return `<div class="stat"><div class="num">${esc(n || "")}</div><div class="lbl">${esc(l || "")}</div></div>`; }).join("")}</div>`;
		case "timeline":
			return `<div style="display:flex;flex-direction:column;gap:8px;padding:4px">${(p.items || "").split(",").map((item: string) => { const [t, d, date] = item.split("~"); return `<div style="display:flex;gap:8px"><div style="display:flex;flex-direction:column;align-items:center;width:12px"><div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0"></div><div style="width:1px;flex:1;background:var(--border);margin:2px 0"></div></div><div style="flex:1"><div style="font-weight:600;font-size:11px">${esc(t || "")}</div><div style="font-size:10px;color:var(--text-muted)">${esc(d || "")}</div><div style="font-size:9px;color:var(--text-muted);opacity:.6">${esc(date || "")}</div></div></div>`; }).join("")}</div>`;
		case "treeView":
			return `<div style="padding:4px;font-size:11px">${(p.items || "").split("|").map((level: string, i: number) => `<div style="padding-left:${i * 16}px;display:flex;align-items:center;gap:4px;padding-top:2px;padding-bottom:2px">${level.split(",").map((item: string) => `<span style="color:var(--text-muted)">${item.trim()}</span>`).join(", ")}</div>`).join("")}</div>`;
		case "accordion":
			return `<div class="cp-accordion" style="border-radius:${r}">${(p.items || "").split("|").filter(Boolean).map((item: string) => { const [i, b] = item.split("~"); return `<div class="item"><div class="item-header">${esc(i || "")} <span style="color:var(--text-muted)">▾</span></div><div class="item-body">${esc(b || "")}</div></div>`; }).join("")}</div>`;
		case "carousel":
			return `<div style="display:flex;align-items:center;gap:6px;padding:8px;background:var(--bg3);border-radius:${r}"><button style="padding:3px 6px;border:1px solid var(--border);border-radius:3px;font-size:10px">‹</button><div style="flex:1;text-align:center;font-size:11px;color:var(--text-muted)">${(p.items || "").split(",")[(Number(p.current) || 1) - 1] || "Slide"}</div><button style="padding:3px 6px;border:1px solid var(--border);border-radius:3px;font-size:10px">›</button></div>`;
		case "hero":
			return `<div class="cp-hero"><h1 style="color:${textColor}">${esc(p.title)}</h1><p>${esc(p.subtitle)}</p><button class="cp-btn primary" style="background:${t.primary};border-radius:${r}">${esc(p.cta)}</button></div>`;
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

/* ── Tree → HTML for canvas ── */
export function renderTreeNode(node: ComponentNode, depth: number): string {
	if (node.type === "root")
		return (node.children || []).map((c) => renderTreeNode(c, depth)).join("");
	const sel = S.selectedIds.has(node.id) ? " selected" : "";
	const isCont = isContainer(node.type);
	const ch = (node.children || []).map((c) => renderTreeNode(c, depth + 1)).join("");
	const prev = renderPreview(node.type, node.props, ch);
	const def = COMPONENTS[node.type];
	const name = S.nodeNames[node.id] || def?.label || node.type;
	const icon = def?.icon || "";
	const masterTag = node._masterId ? ' <span style="font-size:8px;color:var(--accent);opacity:.6">◆</span>' : "";
	return `<div class="canvas-component${sel}" draggable="true" data-id="${node.id}" data-depth="${depth}" style="--depth:${depth}">
      <div class="drag-handle">
        <span class="node-badge">${icon} ${esc(name)}${masterTag}</span>
        ${isCont ? `<button onclick="event.stopPropagation();window.UI.addChild('${node.id}')" title="Add child">＋</button>` : ""}
        <button class="delete" onclick="event.stopPropagation();window.UI.deleteComponent('${node.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
      <div class="canvas-component-body" ondblclick="event.stopPropagation();window.UI.startEdit('${node.id}')">${prev}</div>
    </div>`;
}

/* ── Layer tree ── */
export function renderLayerItem(node: ComponentNode, depth: number): string {
	if (node.type === "root")
		return (node.children || []).map((c) => renderLayerItem(c, depth)).join("");
	const sel = S.selectedIds.has(node.id) ? (S.selectedIds.size > 1 ? " multi-selected" : " selected") : "";
	const def = COMPONENTS[node.type];
	const icon = def?.icon || "<i class='fa-regular fa-cube'></i>";
	const name = S.nodeNames[node.id] || def?.label || node.type;
	const vis = node._hidden ? " hidden" : "";
	const locked = node._locked ? " locked" : "";
	const hasKids = (node.children || []).length > 0;
	return `<div class="layer-item${sel}" data-id="${node.id}">
      <span class="ll-toggle" onclick="event.stopPropagation();window.UI.toggleLayer('${node.id}')">${hasKids ? "▾" : ""}</span>
      <span class="ll-icon">${icon}</span>
      <span class="ll-name" onclick="window.UI.selectComponent('${node.id}')">${esc(name)}</span>
      <span class="ll-vis${vis}" onclick="event.stopPropagation();window.UI.toggleVisibility('${node.id}')" title="Toggle visibility"><i class="fa-regular ${node._hidden ? "fa-eye-slash" : "fa-eye"}"></i></span>
      <span class="ll-lock${locked}" onclick="event.stopPropagation();window.UI.toggleLock('${node.id}')" title="Toggle lock"><i class="fa-regular ${node._locked ? "fa-lock" : "fa-unlock"}"></i></span>
    </div>${hasKids ? `<div class="layers-children">${(node.children || []).map((c) => renderLayerItem(c, depth + 1)).join("")}</div>` : ""}`;
}

/* ── Resize handles ── */
export function renderResizeHandles(): void {
	const handles = document.getElementById("resize-handles");
	if (!handles) return;
	if (S.selectedIds.size !== 1) { handles.style.display = "none"; return; }
	const id = [...S.selectedIds][0];
	const el = document.querySelector(`.canvas-component[data-id="${CSS.escape(id)}"]`) as HTMLElement | null;
	if (!el) { handles.style.display = "none"; return; }
	const r = el.getBoundingClientRect();
	const cr = document.getElementById("canvas-container")!.getBoundingClientRect();
	handles.style.display = "block";
	handles.style.left = ((r.left - cr.left) / S.zoom) + "px";
	handles.style.top = ((r.top - cr.top) / S.zoom) + "px";
	handles.style.width = (r.width / S.zoom) + "px";
	handles.style.height = (r.height / S.zoom) + "px";
	handles.innerHTML = "n,s,e,w,ne,nw,se,sw".split(",").map((d) => `<div class="resize-handle ${d}" data-direction="${d}"></div>`).join("");
}

/* ── Full render ── */
export function render(): void {
	renderCanvas();
	renderResizeHandles();
	renderLayers();
	renderCode();
	renderInspector();
	renderComments();
	updateCounts();
	syncZoomLabel();
}

function renderCanvas(): void {
	const list = document.getElementById("canvas-list");
	if (!list) return;
	list.innerHTML = totalComponents(S.tree) === 0 ? "" : renderTreeNode(S.tree, 0);
	const empty = document.getElementById("canvas-empty");
	if (empty) empty.style.display = totalComponents(S.tree) === 0 ? "block" : "none";
}

function renderLayers(): void {
	const list = document.getElementById("layers-list");
	if (!list) return;
	if (totalComponents(S.tree) === 0) {
		list.innerHTML = '<div style="padding:8px 10px;font-size:11px;color:var(--text-muted);opacity:.5">No components</div>';
		return;
	}
	list.innerHTML = renderLayerItem(S.tree, 0);
}

function renderCode(): void {
	const out = document.getElementById("code-output");
	if (out) out.textContent = generateCode();
}

function renderInspector(): void {
	const panel = document.getElementById("inspector-content");
	const nodes = getSelectedNodes(S.tree, S.selectedIds);
	if (!panel) return;
	if (nodes.length === 0) { panel.innerHTML = '<p class="muted">Select a component</p>'; return; }
	if (nodes.length > 1) { panel.innerHTML = `<p class="muted">${nodes.length} components selected</p>`; return; }
	const c = nodes[0];
	if (!c || c.type === "root") return;
	const def = COMPONENTS[c.type];
	if (!def) { panel.innerHTML = '<p class="muted">No properties</p>'; return; }
	const p = c.props;
	const t = S.theme;
	const r = RADIUS[t.radius] || "6px";
	const masterHTML = c._masterId ? `<div class="ins-section"><div class="ins-header">Master <span style="font-size:9px;color:var(--accent)">◆ ${esc(c._masterName || "")}</span></div><div class="ins-body"><button class="btn-sm" onclick="window.UI.detachInstance('${c.id}')">Detach instance</button></div></div>` : "";
	const textHTML = p.text !== undefined ? `<div class="ins-row"><label>Text</label><input type="text" value="${esc(p.text)}" onchange="window.UI.updateProp('${c.id}','text',this.value)"></div>` : "";
	const labelHTML = p.label !== undefined ? `<div class="ins-row"><label>Label</label><input type="text" value="${esc(p.label)}" onchange="window.UI.updateProp('${c.id}','label',this.value)"></div>` : "";
	const placeholderHTML = p.placeholder !== undefined ? `<div class="ins-row"><label>Placeholder</label><input type="text" value="${esc(p.placeholder)}" onchange="window.UI.updateProp('${c.id}','placeholder',this.value)"></div>` : "";
	const colorHTML = p.color !== undefined || p.bg !== undefined
		? `<div class="ins-half"><div class="ins-row"><label>Color</label><input type="color" value="${p.color || t.text}" onchange="window.UI.updateProp('${c.id}','color',this.value)"></div><div class="ins-row"><label>Bg</label><input type="color" value="${p.bg || "transparent"}" onchange="window.UI.updateProp('${c.id}','bg',this.value)"></div></div>`
		: "";
	const layoutHTML = isContainer(c.type) ? `<div class="ins-section"><div class="ins-header">Layout</div><div class="ins-body"><div class="ins-row"><label>Display</label><select onchange="window.UI.updateProp('${c.id}','display',this.value)"><option ${p.display === "flex" ? "selected" : ""}>flex</option><option ${p.display === "grid" ? "selected" : ""}>grid</option><option ${(p.display || "block") === "block" ? "selected" : ""}>block</option></select></div><div class="ins-row"><label>Gap</label><input type="text" value="${p.gap || "8px"}" onchange="window.UI.updateProp('${c.id}','gap',this.value)"></div><div class="ins-row"><label>Justify</label><select onchange="window.UI.updateProp('${c.id}','justify',this.value)"><option ${p.justify === "start" ? "selected" : ""}>start</option><option ${p.justify === "center" ? "selected" : ""}>center</option><option ${p.justify === "end" ? "selected" : ""}>end</option><option ${p.justify === "between" ? "selected" : ""}>between</option></select></div><div class="ins-row"><label>Align</label><select onchange="window.UI.updateProp('${c.id}','align',this.value)"><option ${p.align === "start" ? "selected" : ""}>start</option><option ${p.align === "center" ? "selected" : ""}>center</option><option ${p.align === "end" ? "selected" : ""}>end</option><option ${(p.align || "stretch") === "stretch" ? "selected" : ""}>stretch</option></select></div></div></div>` : "";
	const sizingHTML = `<div class="ins-section"><div class="ins-header">Position & Size</div><div class="ins-body"><div class="ins-half"><div class="ins-row"><label>W</label><input type="text" value="${p.w || "auto"}" onchange="window.UI.updateProp('${c.id}','w',this.value)"></div><div class="ins-row"><label>H</label><input type="text" value="${p.h || "auto"}" onchange="window.UI.updateProp('${c.id}','h',this.value)"></div></div></div></div>`;

	panel.innerHTML = masterHTML + sizingHTML + layoutHTML +
		`<div class="ins-section"><div class="ins-header">${def.cat} / ${def.label}</div><div class="ins-body">${textHTML}${labelHTML}${placeholderHTML}${colorHTML}${Object.entries(p).filter(([k]) => !["text","label","placeholder","color","bg","w","h","display","gap","justify","align"].includes(k)).map(([key, val]) => {
			const lbl = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
			if (["checked","on","featured","vertical","multiple"].includes(key)) return `<div class="ins-row"><label>${lbl}</label><input type="checkbox" ${val ? "checked" : ""} onchange="window.UI.updateProp('${c.id}','${key}',this.checked)"></div>`;
			if (key === "level") return `<div class="ins-row"><label>${lbl}</label><select onchange="window.UI.updateProp('${c.id}','${key}',this.value)">${["h1","h2","h3","h4","h5","h6"].map((l) => `<option ${l === val ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
			if (key === "variant") return `<div class="ins-row"><label>${lbl}</label><select onchange="window.UI.updateProp('${c.id}','${key}',this.value)">${["info","warn","error","primary","secondary","success"].map((v) => `<option ${v === val ? "selected" : ""}>${v}</option>`).join("")}</select></div>`;
			if (key === "direction") return `<div class="ins-row"><label>${lbl}</label><select onchange="window.UI.updateProp('${c.id}','${key}',this.value)"><option ${val === "vertical" ? "selected" : ""}>vertical</option><option ${val === "horizontal" ? "selected" : ""}>horizontal</option></select></div>`;
			if (key === "active") return `<div class="ins-row"><label>${lbl}</label><select onchange="window.UI.updateProp('${c.id}','${key}',this.value)">${(p.options || p.items || "").split(",").map((o: string) => `<option ${o.trim() === val ? "selected" : ""}>${o.trim()}</option>`).join("")}</select></div>`;
			if (["value","current","total","cols","min","max","lines","count"].includes(key)) return `<div class="ins-row"><label>${lbl}</label><input type="number" value="${val}" onchange="window.UI.updateProp('${c.id}','${key}',parseInt(this.value)||0)"></div>`;
			return `<div class="ins-row"><label>${lbl}</label><input type="text" value="${esc(String(val))}" onchange="window.UI.updateProp('${c.id}','${key}',this.value)"></div>`;
		}).join("")}</div></div>`;
}

function renderComments(): void {
	const list = document.getElementById("comments-list");
	if (!list) return;
	if (S.comments.length === 0) { list.innerHTML = '<p class="muted">No comments yet</p>'; return; }
	list.innerHTML = S.comments.map((cmt) => {
		const comp = findNode(S.tree, cmt.compId) as ComponentNode | null;
		const compName = comp ? S.nodeNames[comp.id] || cmt.compId : "(deleted)";
		return `<div class="comment-item${cmt.resolved ? " resolved" : ""}">
        <div class="cmt-hdr"><span class="cmt-comp">@${esc(compName)}</span><span>${new Date(cmt.createdAt).toLocaleDateString()}</span></div>
        <div class="cmt-body">${esc(cmt.text)}</div>
        <div class="cmt-actions"><button onclick="window.UI.resolveComment('${cmt.id}')">${cmt.resolved ? "Reopen" : "Resolve"}</button><button onclick="window.UI.deleteComment('${cmt.id}')">Delete</button></div>
      </div>`;
	}).join("");
}

function updateCounts(): void {
	const n = totalComponents(S.tree);
	const el = document.getElementById("component-count");
	if (el) el.textContent = `${n} component${n !== 1 ? "s" : ""}`;
}

function syncZoomLabel(): void {
	const el = document.getElementById("zoom-label");
	if (el) el.textContent = Math.round(S.zoom * 100) + "%";
}

/* ── Import codegen lazily (avoid circular deps during module init) ── */
import { generateCode } from "./codegen";
