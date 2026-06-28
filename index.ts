import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "public");
const UI_DIR = ".ui-design";

let server: ReturnType<typeof createServer> | null = null;
let serverPort = 0;

const MIME: Record<string, string> = {
	".html": "text/html",
	".css": "text/css",
	".js": "application/javascript",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
};

function mimeType(path: string): string {
	return MIME[extname(path)] || "application/octet-stream";
}

function serveStatic(res: ServerResponse, filePath: string): void {
	if (!existsSync(filePath)) {
		res.writeHead(404);
		res.end("Not found");
		return;
	}
	res.writeHead(200, { "Content-Type": mimeType(filePath) });
	res.end(readFileSync(filePath));
}

function handleAPI(req: IncomingMessage, res: ServerResponse): boolean {
	const url = new URL(req.url || "/", `http://localhost:${serverPort}`);
	const path = url.pathname;

	if (path === "/api/save" && req.method === "POST") {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", () => {
			try {
				const data = JSON.parse(body);
				const dir = join(process.cwd(), UI_DIR);
				if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
				if (data.design)
					writeFileSync(
						join(dir, "current-design.json"),
						JSON.stringify(data.design, null, 2),
					);
				if (data.html) writeFileSync(join(dir, "current.html"), data.html);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true }));
			} catch (e: any) {
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: e.message }));
			}
		});
		return true;
	}

	if (path === "/api/code") {
		const htmlPath = join(process.cwd(), UI_DIR, "current.html");
		if (existsSync(htmlPath)) {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(readFileSync(htmlPath, "utf-8"));
		} else {
			res.writeHead(404);
			res.end("No design saved yet");
		}
		return true;
	}

	if (path === "/api/state") {
		const jsonPath = join(process.cwd(), UI_DIR, "current-design.json");
		if (existsSync(jsonPath)) {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(readFileSync(jsonPath, "utf-8"));
		} else {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ components: [], theme: {} }));
		}
		return true;
	}

	return false;
}

function startServer(port: number): Promise<number> {
	return new Promise((resolve, reject) => {
		const s = createServer((req, res) => {
			if (handleAPI(req, res)) return;
			const url = new URL(req.url || "/", `http://localhost:${port}`);
			const filePath = join(
				publicDir,
				url.pathname === "/" ? "index.html" : url.pathname,
			);
			serveStatic(res, filePath);
		});
		s.on("error", (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE")
				reject(new Error(`Port ${port} is in use`));
			else reject(err);
		});
		s.listen(port, () => {
			server = s;
			serverPort = port;
			resolve(port);
		});
	});
}

function stopServer(): void {
	if (server) {
		server.close();
		server = null;
		serverPort = 0;
	}
}

function openBrowser(url: string): void {
	const cmd =
		process.platform === "darwin"
			? "open"
			: process.platform === "win32"
				? "start"
				: "xdg-open";
	spawn(cmd, [url], { detached: true, stdio: "ignore" });
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("ui-design", {
		description:
			"UI design prototyping tool. Subcommands: start [port], stop, status",
		getArgumentCompletions: (prefix) => {
			const cmds = ["start", "stop", "status"];
			const filtered = cmds.filter((c) => c.startsWith(prefix));
			return filtered.length > 0
				? filtered.map((c) => ({
						value: c,
						label: c === "start" ? "start [port] — launch server" : c,
					}))
				: null;
		},
		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/);
			const subcmd = parts[0] || "start";

			if (subcmd === "start") {
				if (server) {
					ctx.ui.notify(
						`Already running on http://localhost:${serverPort}`,
						"info",
					);
					return;
				}
				const port = parseInt(parts[1]) || 8765;
				try {
					await startServer(port);
					const url = `http://localhost:${port}`;
					openBrowser(url);
					ctx.ui.notify(`UI Design tool → ${url}`, "info");
				} catch (e: any) {
					ctx.ui.notify(`Failed: ${e.message}`, "error");
				}
				return;
			}

			if (subcmd === "stop") {
				if (!server) {
					ctx.ui.notify("No server running", "info");
					return;
				}
				stopServer();
				ctx.ui.notify("Server stopped", "info");
				return;
			}

			if (subcmd === "status") {
				if (server)
					ctx.ui.notify(`Running on http://localhost:${serverPort}`, "info");
				else ctx.ui.notify("Not running", "info");
				return;
			}
		},
	});

	pi.registerTool({
		name: "read_ui_design",
		label: "Read UI Design blueprint — skeleton for building the full frontend",
		description:
			"Read a visual UI prototype from the .ui-design/ folder (built with the ui-design drag-and-drop tool). " +
			"The prototype is a SKELETON — just structure, placeholder content, and rough layout. " +
			"Use it as a BLUEPRINT. Build the REAL frontend from it: expand every section with full detail, " +
			"modern design system, animations, real copy, polished spacing, responsive layout, " +
			"and proper components. The prototype shows WHAT goes where. The agent builds WHAT IT LOOKS LIKE.",
		parameters: Type.Object({}),
		async execute() {
			const htmlPath = join(process.cwd(), UI_DIR, "current.html");
			const jsonPath = join(process.cwd(), UI_DIR, "current-design.json");

			if (!existsSync(htmlPath)) {
				return {
					content: [
						{
							type: "text",
							text: "No UI design saved yet. Run /ui-design start, compose a design, and the tool auto-saves to .ui-design/",
						},
					],
					details: {},
				};
			}

			const html = readFileSync(htmlPath, "utf-8");
			let design = {};
			if (existsSync(jsonPath)) {
				try {
					design = JSON.parse(readFileSync(jsonPath, "utf-8"));
				} catch {
					/* ignore */
				}
			}

			// ponytail: clear instruction at the end so LLM sees it right after the prototype
			const skeletonHtml = html;
			const theme = (design as any).theme || {};

			return {
				content: [{ type: "text", text: html }],
				details: {
					skeletonHtml,
					theme,
					componentTree: design,
					source: htmlPath,
					instructions: [
						"This is a SKELETON prototype. It defines the structure — what sections go where.",
						"Build the REAL frontend using this as a blueprint. Do NOT copy the prototype literally.",
						"Instead, use every section as a starting point and expand it with:",
						"  • Modern, polished design (gradients, shadows, smooth transitions)",
						"  • Real copy, icons, images, and meaningful content",
						"  • Responsive layout (mobile-first)",
						"  • Accessible markup and semantic HTML",
						"  • Subtle animations / micro-interactions",
						"Theme colors from prototype: " + JSON.stringify(theme),
						"Use the theme as a hint (not a constraint) — feel free to design a richer palette.",
					].join("\n"),
				},
			};
		},
	});

	pi.on("session_shutdown", () => {
		stopServer();
	});
}
