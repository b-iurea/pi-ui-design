/* ═══ WASM Engine Bridge — load and wrap the C++ scene graph ═══ */

interface EngineModule {
  addNode(type: number, parentIdx: number): number;
  removeNode(id: number): void;
  moveNode(id: number, newParentIdx: number, index: number): void;
  updateProp(id: number, key: string, value: string): void;
  setBounds(id: number, x: number, y: number, w: number, h: number): void;
  nodeCount(): number;
  getCommandBuffer(): { ptr: number; size: number };
  commandCount(): number;
  serialize(): Uint8Array;
  deserialize(buffer: { ptr: number; byteLength: number }): void;
  reset(): void;
}

let _engine: EngineModule | null = null;
let _ready = false;

export function isReady(): boolean { return _ready; }

export async function loadEngine(): Promise<EngineModule> {
  if (_engine) return _engine;

  // Load the Emscripten glue code
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/dist/engine.js";
    script.onload = () => {
      // After engine.js loads, the Module global is set by Emscripten's glue
      // Wait for the module to initialize
      const check = () => {
        if ((window as any).Module && typeof (window as any).Module._addNode === "function") {
          resolve();
        } else if ((window as any).Module && (window as any).Module.addNode) {
          // embind case — functions are on the Module object directly
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      setTimeout(check, 100);
    };
    script.onerror = () => reject(new Error("Failed to load engine.wasm glue code"));
    document.body.appendChild(script);
  });

  const mod = (window as any).Module as any;

  // Wrap the embind API
  _engine = {
    addNode: (type: number, parentIdx: number) => mod.addNode(type, parentIdx),
    removeNode: (id: number) => mod.removeNode(id),
    moveNode: (id: number, newParentIdx: number, index: number) => mod.moveNode(id, newParentIdx, index),
    updateProp: (id: number, key: string, value: string) => mod.updateProp(id, key, value),
    setBounds: (id: number, x: number, y: number, w: number, h: number) => mod.setBounds(id, x, y, w, h),
    nodeCount: () => mod.nodeCount(),
    getCommandBuffer: () => mod.getCommandBuffer(),
    commandCount: () => mod.commandCount(),
    serialize: () => mod.serialize(),
    deserialize: (buf: { ptr: number; byteLength: number }) => mod.deserialize(buf),
    reset: () => mod.reset(),
  };

  _ready = true;
  return _engine;
}

export function getEngine(): EngineModule {
  if (!_engine) throw new Error("Engine not loaded. Call loadEngine() first.");
  return _engine;
}

/* ─── Convenience wrappers ─── */
export const NodeType = {
  ROOT: 0,
  CONTAINER: 1,
  WRAPPER: 2,
  SECTION: 3,
  ARTICLE: 4,
  HEADER: 5,
  FOOTER: 6,
  MAIN: 7,
  SIDEBAR: 8,
  FLEX_ROW: 9,
  FLEX_COL: 10,
  GRID: 11,
  STACK: 12,
  FRAME: 13,
  PANEL: 14,
  CARD: 15,
  DIVIDER: 16,
  SPACER: 17,
  NAVBAR: 18,
  DROPDOWN: 19,
  TABS: 20,
  BREADCRUMB: 21,
  PAGINATION: 22,
  HERO: 23,
  HEADING: 24,
  PARAGRAPH: 25,
  LINK: 26,
  BUTTON: 27,
  INPUT: 28,
  TEXTAREA: 29,
  SELECT: 30,
  CHECKBOX: 31,
  TOGGLE: 32,
  IMAGE: 33,
  AVATAR: 34,
  ICON: 35,
  VIDEO: 36,
  SPINNER: 37,
  SKELETON: 38,
  TOAST: 39,
  ALERT: 40,
  BADGE: 41,
  PROGRESS: 42,
  MODAL: 43,
  TOOLTIP: 44,
  LIST: 45,
  TABLE: 46,
  STATS: 47,
  ACCORDION: 48,
  CAROUSEL: 49,
  EMPTY_STATE: 50,
  TIMELINE: 51,
  TREE_VIEW: 52,
  CODE_BLOCK: 53,
  LABEL: 54,
} as const;
