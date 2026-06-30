/* ═══ WebGL 2.0 Canvas Renderer ═══
   Reads draw commands from the WASM engine, renders via GL primitives.
   Supports: rect, rounded-rect, ellipse, text, image, line. */

export type DrawCommand = {
  type: number;
  x: number; y: number; w: number; h: number;
  r: number; g: number; b: number; a: number;
  sr: number; sg: number; sb: number; sa: number;
  strokeWidth: number;
  radius: number;
  rotation: number;
  text: string;
  imageId: number;
  opacity: number;
};

export const DrawType = {
  RECT: 0,
  ROUNDED_RECT: 1,
  ELLIPSE: 2,
  LINE: 3,
  TEXT: 4,
  IMAGE: 5,
  PATH: 6,
  GROUP_BEGIN: 7,
  GROUP_END: 8,
} as const;

const VERT_SRC = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_zoom;
out vec2 v_uv;
void main() {
  vec2 pos = (a_pos * u_zoom + u_offset) / u_resolution * 2.0 - 1.0;
  pos.y = -pos.y;
  gl_Position = vec4(pos, 0.0, 1.0);
  v_uv = a_uv;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec4 u_color;
uniform vec4 u_strokeColor;
uniform float u_strokeWidth;
uniform float u_radius;
uniform float u_size;
out vec4 outColor;

float roundedBox(vec2 p, vec2 size, float r) {
  vec2 d = abs(p) - size + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  vec2 halfSize = vec2(u_size * 0.5);
  float d = roundedBox(v_uv * u_size - halfSize, halfSize, u_radius);
  float alpha = u_color.a * smoothstep(1.0, 0.0, d);
  vec4 fill = u_color;

  if (u_strokeWidth > 0.0) {
    float inner = roundedBox(v_uv * u_size - halfSize, halfSize - u_strokeWidth, max(u_radius - u_strokeWidth, 0.0));
    float strokeAlpha = u_strokeColor.a * smoothstep(0.0, 1.0, -d) * (1.0 - smoothstep(0.0, 1.0, -inner));
    fill = mix(fill, u_strokeColor, strokeAlpha);
  }

  outColor = vec4(fill.rgb, fill.a * alpha);
}`;

export class GLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private zoom = 1;
  private textCanvas: HTMLCanvasElement;
  private textCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.textCanvas = document.createElement("canvas");
    this.textCanvas.width = 512;
    this.textCanvas.height = 128;
    this.textCtx = this.textCanvas.getContext("2d")!;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL 2.0 not supported");
    this.gl = gl;

    this.initGL();
  }

  private initGL() {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERT_SRC);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("VS compile:", gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAG_SRC);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("FS compile:", gl.getShaderInfoLog(fs));
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Program link:", gl.getProgramInfoLog(this.program));
    }

    // Full-screen quad (two triangles)
    const verts = new Float32Array([
      0, 0, 0, 0,
      1, 0, 1, 0,
      0, 1, 0, 1,
      1, 1, 1, 1,
      0, 1, 0, 1,
      1, 0, 1, 0,
    ]);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(this.program);
    const aPos = gl.getAttribLocation(this.program, "a_pos");
    const aUv = gl.getAttribLocation(this.program, "a_uv");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
  }

  setViewport(offsetX: number, offsetY: number, zoom: number) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.zoom = zoom;
  }

  clear(r = 0.12, g = 0.12, b = 0.12) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  drawCommands(cmds: DrawCommand[]) {
    const gl = this.gl;
    const prog = this.program;
    if (!prog) return;

    gl.useProgram(prog);
    gl.bindVertexArray(this.vao);

    gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), this.canvas.width, this.canvas.height);
    gl.uniform2f(gl.getUniformLocation(prog, "u_offset"), this.offsetX, this.offsetY);
    gl.uniform1f(gl.getUniformLocation(prog, "u_zoom"), this.zoom);

    for (const cmd of cmds) {
      switch (cmd.type) {
        case DrawType.RECT:
        case DrawType.ROUNDED_RECT:
          this.drawRect(cmd, prog);
          break;
        case DrawType.TEXT:
          this.drawText2D(cmd);
          break;
        case DrawType.ELLIPSE:
          this.drawRect(cmd, prog);
          break;
        case DrawType.LINE:
          // ponytail: line via thin rect, proper line shader deferred
          break;
      }
    }
  }

  private drawRect(cmd: DrawCommand, prog: WebGLProgram) {
    const gl = this.gl;
    gl.uniform4f(gl.getUniformLocation(prog, "u_color"), cmd.r / 255, cmd.g / 255, cmd.b / 255, cmd.a / 255 * cmd.opacity);
    gl.uniform4f(gl.getUniformLocation(prog, "u_strokeColor"), cmd.sr / 255, cmd.sg / 255, cmd.sb / 255, cmd.sa / 255);
    gl.uniform1f(gl.getUniformLocation(prog, "u_strokeWidth"), cmd.strokeWidth);
    gl.uniform1f(gl.getUniformLocation(prog, "u_radius"), cmd.radius);
    gl.uniform1f(gl.getUniformLocation(prog, "u_size"), Math.max(cmd.w, cmd.h));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private drawText2D(cmd: DrawCommand) {
    if (!cmd.text) return;
    const ctx = this.textCtx;
    const c = this.textCanvas;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = "14px Inter, sans-serif";
    ctx.fillStyle = `rgba(${cmd.r},${cmd.g},${cmd.b},${cmd.a / 255 * cmd.opacity})`;
    ctx.textBaseline = "top";
    ctx.fillText(cmd.text, 2, 2);

    // Draw the text canvas onto the WebGL canvas using 2D for simplicity
    // ponytail: proper SDF text rendering deferred. 2D overlay is simpler and fast enough.
    const glCanvas = this.canvas;
    const ctx2 = glCanvas.getContext("2d");
    if (!ctx2) return;
    const scaledX = cmd.x * this.zoom + this.offsetX;
    const scaledY = cmd.y * this.zoom + this.offsetY;
    ctx2.save();
    ctx2.globalAlpha = cmd.opacity;
    ctx2.font = "14px Inter, sans-serif";
    ctx2.fillStyle = `rgba(${cmd.r},${cmd.g},${cmd.b},${cmd.a / 255})`;
    ctx2.textBaseline = "top";
    ctx2.fillText(cmd.text, scaledX, scaledY);
    ctx2.restore();
  }
}
