/* ═══ Code generators — HTML, React, Tailwind, Vue, Svelte, Angular ═══ */

import type { ComponentNode } from "./types";
import { esc, SPACING, RADIUS } from "./utils";
import { S } from "./state";

function genHTML(c: ComponentNode, ch: string): string {
	const p = c.props,
		t = S.theme,
		r = RADIUS[t.radius] || "6px",
		sp = SPACING[t.spacing] || "1rem",
		font = t.font,
		text = t.dark ? "#e2e4f0" : t.text;
	switch (c.type) {
		case "container":
			return `<div style="padding:${sp}">\n${ch || ""}\n</div>`;
		case "wrapper":
			return `<div style="max-width:${p.maxW || "1080px"};margin:0 auto;padding:${sp}">\n${ch || ""}\n</div>`;
		case "section":
			return `<section style="padding:${sp}">\n${ch || ""}\n</section>`;
		case "article":
			return `<article style="padding:${sp}">\n${ch || ""}\n</article>`;
		case "header":
			return `<header style="display:flex;align-items:center;padding:8px 16px;background:#f3f4f6"><span style="font-weight:700;color:${t.primary}">${esc(p.brand || "Header")}</span></header>`;
		case "flexRow":
			return `<div style="display:flex;gap:${p.gap};align-items:${p.align || "center"}">\n${ch || "<span>Item 1</span><span>Item 2</span>"}\n</div>`;
		case "flexCol":
			return `<div style="display:flex;flex-direction:column;gap:${p.gap}">\n${ch || "<span>Item 1</span><span>Item 2</span>"}\n</div>`;
		case "stack":
			return `<div style="display:flex;flex-direction:${p.direction === "horizontal" ? "row" : "column"};gap:${p.gap}">\n${ch || ""}\n</div>`;
		case "grid":
			return `<div style="display:grid;grid-template-columns:repeat(${p.cols},1fr);gap:${p.gap}">\n${ch || ""}\n</div>`;
		case "panel":
			return `<div style="border:1px solid #e5e7eb;border-radius:${r};overflow:hidden"><div style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;background:#f9fafb">${esc(p.header || "Panel")}</div><div style="padding:16px">${ch || esc(p.body || "")}</div></div>`;
		case "frame":
			return `<div style="width:${p.w}px;height:${p.h}px;background:${p.fill};position:relative">\n${ch || ""}\n</div>`;
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
					(i: string) =>
						`<span style="color:${text}99;font-size:.875rem">${i.trim()}</span>`,
				)
				.join("")}</nav>`;
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
		case "input":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><input type="text" placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem"></div>`;
		case "textarea":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><textarea placeholder="${esc(p.placeholder)}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem;min-height:80px"></textarea></div>`;
		case "select":
			return `<div style="margin:0 0 ${sp}"><label style="display:block;font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label || "")}</label><select style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem">${(
				p.options || ""
			)
				.split(",")
				.map((o: string) => `<option>${o.trim()}</option>`)
				.join("")}</select></div>`;
		case "table":
			return `<table style="width:100%;border-collapse:collapse;font-size:.875rem;margin:0 0 ${sp}"><thead><tr>${(
				p.headers || ""
			)
				.split(",")
				.map(
					(h: string) =>
						`<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;font-weight:600;text-transform:uppercase;font-size:.75rem;color:#6b7280">${h.trim()}</th>`,
				)
				.join("")}</tr></thead><tbody>${(p.rows || "")
				.split("|")
				.filter(Boolean)
				.map(
					(r: string) =>
						"<tr>" +
						r
							.split(",")
							.map(
								(c: string) =>
									`<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151">${c.trim()}</td>`,
							)
							.join("") +
						"</tr>",
				)
				.join("")}</tbody></table>`;
		case "sidebar":
			return `<div style="display:flex;border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;min-height:200px"><div style="width:200px;background:#f9fafb;padding:16px;flex-shrink:0">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i: string) =>
						`<div style="padding:6px 10px;font-size:13px;border-radius:4px;${i.trim() === p.active ? "background:" + t.primary + ";color:#fff" : "color:#6b7280"}">${i.trim()}</div>`,
				)
				.join(
					"",
				)}</div><div style="flex:1;padding:16px;font-size:13px;color:#6b7280">${ch || "Main content"}</div></div>`;
		case "alert":
			return `<div style="padding:12px 16px;border-radius:${r};font-size:.875rem;display:flex;align-items:center;gap:8px;margin:0 0 ${sp};background:#eff6ff;color:${t.primary};border:1px solid #bfdbfe">ℹ ${esc(p.text)}</div>`;
		case "badge":
			return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:600;background:${t.primary};color:#fff">${esc(p.text)}</span>`;
		case "progress":
			return `<div style="margin:0 0 ${sp}"><div style="font-size:.875rem;color:${text}99;margin-bottom:4px">${esc(p.label)}</div><div style="height:8px;border-radius:99px;background:#e5e7eb;overflow:hidden"><div style="height:100%;border-radius:99px;background:${t.primary};width:${p.value}%"></div></div></div>`;
		case "spinner":
			return `<div style="display:flex;align-items:center;gap:8px;color:${text}99;font-size:.875rem;margin:${sp} 0"><div style="width:20px;height:20px;border:2px solid #e5e7eb;border-top-color:${t.primary};border-radius:50%;animation:spin .6s linear infinite"></div>${esc(p.text)}</div>`;
		case "modal":
			return `<div style="background:rgba(0,0,0,.5);padding:40px;display:flex;align-items:center;justify-content:center;margin:0 0 ${sp}"><div style="background:#fff;border-radius:${r};max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2)"><div style="padding:16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-weight:600"><span>${esc(p.title)}</span><span style="color:#9ca3af;cursor:pointer">✕</span></div><div style="padding:16px;font-size:.875rem;color:#6b7280">${esc(p.body)}</div><div style="padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:flex-end"><span style="padding:8px 16px;border:1px solid #d1d5db;border-radius:${r};font-size:.875rem">${esc(p.cancel)}</span><span style="padding:8px 16px;background:${t.primary};color:#fff;border-radius:${r};font-size:.875rem">${esc(p.confirm)}</span></div></div></div>`;
		case "dropdown":
			return `<div style="position:relative;display:inline-block"><span style="padding:8px 16px;border:1px solid #d1d5db;border-radius:${r};cursor:pointer">${esc(p.trigger)} ▾</span></div>`;
		case "list":
			return `<ul style="list-style:disc;padding-left:20px;color:${text};font-size:.875rem;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map((i: string) => `<li style="margin:4px 0">${i.trim()}</li>`)
				.join("")}</ul>`;
		case "stats":
			return `<div style="display:flex;gap:24px;justify-content:center;padding:${sp} 0">${(
				p.items || ""
			)
				.split(",")
				.map((item: string) => {
					const [l, n] = item.split("~");
					return `<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:${t.primary}">${esc(n || "")}</div><div style="font-size:.75rem;color:${text}99">${esc(l || "")}</div></div>`;
				})
				.join("")}</div>`;
		case "testimonial":
			return `<div style="text-align:center;padding:32px 20px;max-width:500px;margin:0 auto ${sp}"><div style="font-style:italic;font-size:1rem;color:#6b7280;line-height:1.6;margin:0 0 16px">"${esc(p.quote)}"</div><div style="font-weight:600;font-size:.875rem;color:#111827">${esc(p.author)}</div><div style="font-size:.75rem;color:#9ca3af">${esc(p.role)}</div></div>`;
		case "divider":
			return `<hr style="border:none;border-top:1px solid #d1d5db;margin:${sp} 0">`;
		case "spacer":
			return `<div style="height:${p.height}"></div>`;
		case "image":
			return p.src
				? `<div style="width:${p.width};height:${p.height};background:#e5e7eb;border-radius:${r};display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${p.src}" alt="${esc(p.alt)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
				: `<div style="width:${p.width};height:${p.height};background:#e5e7eb;border-radius:${r};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.875rem">🖼 ${esc(p.alt)}</div>`;
		case "avatar":
			return `<div style="display:flex;align-items:center;gap:10px;margin:0 0 ${sp}"><div style="width:40px;height:40px;border-radius:50%;background:${t.primary};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${esc(p.initials)}</div><div><div style="font-weight:600;font-size:14px">${esc(p.name)}</div><div style="font-size:12px;color:${text}99">${esc(p.role)}</div></div></div>`;
		case "tabs":
			return `<div style="display:flex;gap:2px;border-bottom:2px solid #e5e7eb;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i: string) =>
						`<span style="padding:8px 16px;font-size:.875rem;${i.trim() === p.active ? `color:${t.primary};font-weight:600;border-bottom:2px solid ${t.primary};margin-bottom:-2px` : ""}">${i.trim()}</span>`,
				)
				.join("")}</div>`;
		case "pricingCard":
			return `<div style="border:${p.featured ? "2px solid " + t.primary : "1px solid #e5e7eb"};border-radius:${r};padding:24px;text-align:center;background:#fff;max-width:300px;margin:0 auto ${sp}"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:4px">${esc(p.plan)}</div><div style="font-size:2rem;font-weight:800;color:#111827">${esc(p.price)}<span style="font-size:.875rem;font-weight:400;color:#6b7280">${esc(p.period)}</span></div><ul style="list-style:none;padding:0;margin:16px 0;font-size:.875rem;color:#6b7280">${(
				p.features || ""
			)
				.split(",")
				.map((f: string) => `<li style="padding:4px 0">✓ ${f.trim()}</li>`)
				.join(
					"",
				)}</ul><button style="background:${t.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r};font-weight:600;cursor:pointer">${esc(p.cta)}</button></div>`;
		case "breadcrumb":
			return `<div style="display:flex;align-items:center;gap:4px;font-size:.875rem;color:#6b7280;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split(",")
				.map(
					(i: string, idx: number, a: string[]) =>
						`<span${i.trim() === p.current ? ' style="font-weight:600;color:#111827"' : ""}>${i.trim()}</span>${idx < a.length - 1 ? '<span style="opacity:.4">›</span>' : ""}`,
				)
				.join("")}</div>`;
		case "pagination":
			return `<div style="display:flex;gap:4px;margin:0 0 ${sp}">${Array.from({ length: Math.min(Number(p.total) || 5, 5) }, (_, i) => `<button style="padding:6px 12px;border:1px solid #d1d5db;border-radius:4px;background:${i + 1 === (Number(p.current) || 1) ? t.primary : "#fff"};color:${i + 1 === (Number(p.current) || 1) ? "#fff" : "#374151"};cursor:pointer">${i + 1}</button>`).join("")}</div>`;
		case "accordion":
			return `<div style="border:1px solid #e5e7eb;border-radius:${r};overflow:hidden;margin:0 0 ${sp}">${(
				p.items || ""
			)
				.split("|")
				.filter(Boolean)
				.map((item: string) => {
					const [hd, bd] = item.split("~");
					return `<div style="border-bottom:1px solid #e5e7eb"><div style="padding:12px 16px;font-weight:600;font-size:.875rem;display:flex;justify-content:space-between;background:#f9fafb">${esc(hd || "")}<span style="color:#9ca3af">▾</span></div><div style="padding:12px 16px;font-size:.875rem;color:#6b7280">${esc(bd || "")}</div></div>`;
				})
				.join("")}</div>`;
		default:
			return `<!-- ${c.type} -->`;
	}
}

function genReact(c: ComponentNode, ch: string): string {
	const p = c.props,
		sp = SPACING[S.theme.spacing] || "1rem",
		text = S.theme.dark ? "#e2e4f0" : "#1f2937",
		r = RADIUS[S.theme.radius] || "6px";
	switch (c.type) {
		case "container":
			return `<div style={{padding:'${sp}'}}>\n${ch ? ind(ch) : "  {/* children */}"}\n</div>`;
		case "flexRow":
			return `<div style={{display:'flex',gap:'${p.gap}',alignItems:'${p.align || "center"}'}}>\n${ch ? ind(ch) : "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
		case "flexCol":
			return `<div style={{display:'flex',flexDirection:'column',gap:'${p.gap}'}}>\n${ch ? ind(ch) : "  <span>Item 1</span><span>Item 2</span>"}\n</div>`;
		case "grid":
			return `<div style={{display:'grid',gridTemplateColumns:'repeat(${p.cols},1fr)',gap:'${p.gap}'}}>\n${ch ? ind(ch) : ""}\n</div>`;
		case "heading":
			return `<${p.level} style={{fontFamily:'${S.theme.font}',color:'${text}',marginBottom:'${sp}'}}>${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p style={{color:'${text}',lineHeight:1.6,marginBottom:'${sp}'}}>${esc(p.text)}</p>`;
		case "btnPrimary":
			return `<button style={{background:'${S.theme.primary}',color:'#fff',border:'none',padding:'10px 24px',borderRadius:'${r}',fontWeight:500,cursor:'pointer'}}>\n  ${esc(p.text)}\n</button>`;
		case "card":
			return `<div style={{border:'1px solid #e5e7eb',borderRadius:'${r}',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>\n  <div style={{padding:'16px 16px 0',fontWeight:600,color:'${text}'}}>${esc(p.header)}</div>\n  <div style={{padding:16,color:'${text}dd'}}>${esc(p.body)}</div>\n  <div style={{padding:'0 16px 12px',fontSize:'0.875rem',color:'${text}99',borderTop:'1px solid #e5e7eb',marginTop:8,paddingTop:8}}>${esc(p.footer)}</div>\n</div>`;
		case "hero":
			return `<div style={{textAlign:'center',padding:'60px 20px',background:'#f9fafb',borderRadius:'${r}'}}>\n  <h1 style={{fontSize:'2.5rem',fontWeight:800,color:'#111827',margin:'0 0 8px'}}>${esc(p.title)}</h1>\n  <p style={{fontSize:'1.125rem',color:'#6b7280',maxWidth:480,margin:'0 auto 24px'}}>${esc(p.subtitle)}</p>\n  <button style={{background:'${S.theme.primary}',color:'#fff',border:'none',padding:'12px 28px',borderRadius:'${r}',fontWeight:600,cursor:'pointer'}}>${esc(p.cta)}</button>\n</div>`;
		default:
			return `{/* ${c.type} */}`;
	}
}

function genTW(c: ComponentNode, ch: string): string {
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

function genVue(c: ComponentNode, ch: string): string {
	const p = c.props,
		sp = SPACING[S.theme.spacing] || "1rem",
		text = S.theme.dark ? "#e2e4f0" : "#1f2937";
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
			return `<button :style="{background:'${S.theme.primary}',color:'#fff',border:'none',padding:'10px 24px',borderRadius:'${RADIUS[S.theme.radius] || "6px"}'}">${esc(p.text)}</button>`;
		case "card":
			return `<div :style="{border:'1px solid #e5e7eb',borderRadius:'${RADIUS[S.theme.radius] || "6px"}'}"><div :style="{padding:'16px 16px 0',fontWeight:600}">${esc(p.header)}</div><div :style="{padding:16}">${esc(p.body)}</div></div>`;
		case "hero":
			return `<div :style="{textAlign:'center',padding:'60px 20px',background:'#f9fafb'}"><h1 :style="{fontSize:'2.5rem',fontWeight:800}">${esc(p.title)}</h1><p :style="{color:'#6b7280'}">${esc(p.subtitle)}</p><button :style="{background:'${S.theme.primary}',color:'#fff'}">${esc(p.cta)}</button></div>`;
		default:
			return `<!-- ${c.type} -->`;
	}
}

function genSvelte(c: ComponentNode, ch: string): string {
	const p = c.props,
		sp = SPACING[S.theme.spacing] || "1rem",
		r = RADIUS[S.theme.radius] || "6px";
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
			return `<${p.level} style="color:${S.theme.dark ? "#e2e4f0" : "#1f2937"};margin-bottom:${sp}">${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p style="color:${S.theme.dark ? "#e2e4f0" : "#1f2937"}">${esc(p.text)}</p>`;
		case "btnPrimary":
			return `<button style="background:${S.theme.primary};color:#fff;border:none;padding:10px 24px;border-radius:${r}">${esc(p.text)}</button>`;
		case "card":
			return `<div style="border:1px solid #e5e7eb;border-radius:${r}"><div style="padding:16px 16px 0;font-weight:600">${esc(p.header)}</div><div style="padding:16px">${esc(p.body)}</div></div>`;
		default:
			return `<!-- {${c.type}} -->`;
	}
}

function genAngular(c: ComponentNode, ch: string): string {
	const p = c.props,
		sp = SPACING[S.theme.spacing] || "1rem",
		r = RADIUS[S.theme.radius] || "6px";
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
			return `<${p.level} [style.color]="'${S.theme.dark ? "#e2e4f0" : "#1f2937"}'" [style.margin-bottom]="'${sp}'">${esc(p.text)}</${p.level}>`;
		case "paragraph":
			return `<p [style.color]="'${S.theme.dark ? "#e2e4f0" : "#1f2937"}'">${esc(p.text)}</p>`;
		case "btnPrimary":
			return `<button [ngStyle]="{'background':'${S.theme.primary}','color':'#fff','border':'none','padding':'10px 24px','border-radius':'${r}'}">${esc(p.text)}</button>`;
		default:
			return `<!-- ${c.type} -->`;
	}
}

function generateNodeCode(node: ComponentNode): string {
	if (node.type === "root")
		return (node.children || []).map((c) => generateNodeCode(c)).join("\n\n");
	const ch = (node.children || []).map((c) => generateNodeCode(c)).join("\n");
	const f = S.format;
	if (f === "react") return genReact(node, ch);
	if (f === "tailwind") return genTW(node, ch);
	if (f === "vue") return genVue(node, ch);
	if (f === "svelte") return genSvelte(node, ch);
	if (f === "angular") return genAngular(node, ch);
	return genHTML(node, ch);
}

function ind(s: string): string {
	return s
		.split("\n")
		.map((l) => (l.trim() ? "  " + l : ""))
		.join("\n");
}

export function generateCode(): string {
	if (totalComponents() === 0)
		return "<!-- Add components to generate code -->\n";
	let body = generateNodeCode(S.tree);
	const t = S.theme,
		bg = t.dark ? "#1e1e1e" : t.bg,
		text = t.dark ? "#e2e4f0" : t.text,
		sp = SPACING[t.spacing] || "1rem";
	if (S.format === "html") {
		body = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1.0">\n  <title>Design</title>\n  <style>\n    *{margin:0;padding:0;box-sizing:border-box}\n    body{font-family:${t.font};background:${bg};color:${text};line-height:1.5}\n    .container{max-width:1080px;margin:0 auto;padding:0 ${sp}}\n  </style>\n</head>\n<body>\n  <div class="container">\n${ind(body)}\n  </div>\n</body>\n</html>`;
	}
	if (S.format === "react") {
		body = `import React from 'react';\n\nfunction DesignPrototype(){\n  return(\n    <div style={{maxWidth:1080,margin:'0 auto',padding:'${sp}'}}>\n${ind(body)}\n    </div>\n  );\n}\n\nexport default DesignPrototype;`;
	}
	if (S.format === "tailwind") {
		body = `<div class="mx-auto max-w-6xl p-6">\n${ind(body)}\n</div>`;
	}
	if (S.format === "vue") {
		body = `<template>\n  <div class="container">\n${ind(body)}\n  </div>\n</template>\n\n<script>\nexport default { name: 'DesignPrototype' }\n</script>\n\n<style scoped>\n.container{max-width:1080px;margin:0 auto;padding:${sp}}\n</style>`;
	}
	if (S.format === "svelte") {
		body = `<div class="container">\n${ind(body)}\n</div>\n\n<style>\n  .container{max-width:1080px;margin:0 auto;padding:${sp}}\n</style>`;
	}
	if (S.format === "angular") {
		body = `<div class="container">\n${ind(body)}\n</div>`;
	}
	return body;
}

function totalComponents(): number {
	let count = 0;
	function walk(n: ComponentNode) {
		count++;
		for (const c of n.children || []) walk(c);
	}
	walk(S.tree);
	return count - 1;
}

export function copyCode(): void {
	const code = generateCode();
	navigator.clipboard
		.writeText(code)
		.then(() => {
			const toast = document.body.querySelector(".toast");
			if (!toast) {
				const el = document.createElement("div");
				el.className = "toast";
				el.textContent = "Copied!";
				document.body.appendChild(el);
				setTimeout(() => el.remove(), 2000);
			}
		})
		.catch(() => {
			const buf = document.getElementById(
				"copy-buffer",
			) as HTMLTextAreaElement | null;
			if (buf) {
				buf.value = code;
				buf.select();
				document.execCommand("copy");
			}
		});
}
