/* ═══ WASM + WebGL Engine Initializer ═══
   Loads alongside app.js — adds GPU-accelerated canvas rendering
   while keeping the existing DOM interaction layer. */

(function initWasmEngine() {
  var canvas = document.getElementById("gl-canvas");
  if (!canvas) return;

  var container = document.getElementById("canvas");
  if (!container) return;

  function resize() {
    var rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
  }
  resize();
  window.addEventListener("resize", resize);

  var engine = null;
  var gl = null;
  var prog = null;
  var vao = null;

  // Shader locations
  var uRes, uOff, uZoom, uColor, uSizeW, uSizeH, uPosX, uPosY, uRadius;

  var offsetX = 0, offsetY = 0, zoom = 1;

  /* ─── Load WASM engine ─── */
  function loadEngine() {
    return new Promise((resolve, reject) => {
      var s = document.createElement("script");
      s.src = "/dist/engine.js";
      s.onload = () => {
        function check() {
          var M = window.Module;
          if (M && typeof M.addNode === "function") {
            resolve(M);
          } else {
            setTimeout(check, 50);
          }
        }
        setTimeout(check, 100);
      };
      s.onerror = () => { reject(new Error("Failed to load engine.js")); };
      document.body.appendChild(s);
    });
  }

  loadEngine().then((mod) => {
    engine = mod;
    console.log("[WASM] Engine loaded");

    // Add a demo node so there's something to render
    // ponytail: demo node, remove once UI integration is wired
    var nid = engine.addNode(1, 0); // type 1 = CONTAINER
    engine.setBounds(nid, 50, 50, 200, 100);
    engine.updateProp(nid, "text", "Hello WASM!");
    engine.updateProp(nid, "r", "13");
    engine.updateProp(nid, "g", "153");
    engine.updateProp(nid, "b", "255");
    engine.updateProp(nid, "a", "200");
    engine.updateProp(nid, "radius", "8");

    initWebGL();
  }).catch((e) => {
    console.warn("[WASM] Engine not available, fallback to DOM", e);
  });

  /* ─── Init WebGL ─── */
  function initWebGL() {
    if (!engine) return;
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) { console.warn("[WebGL] Not supported"); return; }

    // Rounded-rect vertex shader
    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, [
      "#version 300 es",
      "in vec2 a_pos;",
      "in vec2 a_uv;",
      "uniform vec2 u_res;",
      "uniform vec2 u_off;",
      "uniform float u_zoom;",
      "uniform float u_sizeW;",
      "uniform float u_sizeH;",
      "uniform float u_posX;",
      "uniform float u_posY;",
      "out vec2 v_uv;",
      "void main() {",
      "  vec2 p = ((vec2(a_pos.x * u_sizeW + u_posX, a_pos.y * u_sizeH + u_posY)) * u_zoom + u_off) / u_res * 2.0 - 1.0;",
      "  p.y = -p.y;",
      "  gl_Position = vec4(p, 0.0, 1.0);",
      "  v_uv = a_uv * vec2(u_sizeW, u_sizeH);",
      "}"
    ].join("\n"));
    gl.compileShader(vs);

    // Rounded-rect fragment shader
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, [
      "#version 300 es",
      "precision highp float;",
      "in vec2 v_uv;",
      "uniform vec4 u_color;",
      "uniform float u_radius;",
      "out vec4 outColor;",
      "",
      "float roundedBox(vec2 p, vec2 size, float r) {",
      "  vec2 d = abs(p) - size + r;",
      "  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;",
      "}",
      "",
      "void main() {",
      "  vec2 halfSize = vec2(0.5);",
      "  float d = roundedBox(v_uv - halfSize, halfSize, u_radius);",
      "  float alpha = u_color.a * smoothstep(1.0, 0.0, d);",
      "  outColor = vec4(u_color.rgb, alpha);",
      "}"
    ].join("\n"));
    gl.compileShader(fs);

    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad with UVs
    var verts = new Float32Array([
      0,0, 0,0,
      1,0, 1,0,
      0,1, 0,1,
      1,1, 1,1,
      0,1, 0,1,
      1,0, 1,0,
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var aPos = gl.getAttribLocation(prog, "a_pos");
    var aUv = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

    uRes = gl.getUniformLocation(prog, "u_res");
    uOff = gl.getUniformLocation(prog, "u_off");
    uZoom = gl.getUniformLocation(prog, "u_zoom");
    uColor = gl.getUniformLocation(prog, "u_color");
    uSizeW = gl.getUniformLocation(prog, "u_sizeW");
    uSizeH = gl.getUniformLocation(prog, "u_sizeH");
    uPosX = gl.getUniformLocation(prog, "u_posX");
    uPosY = gl.getUniformLocation(prog, "u_posY");
    uRadius = gl.getUniformLocation(prog, "u_radius");

    // Expose viewport for canvas event synchronization
    window.__glViewport = {
      get offsetX() { return offsetX; },
      get offsetY() { return offsetY; },
      get zoom() { return zoom; },
      setOffset: (x, y) => { offsetX = x; offsetY = y; },
      setZoom: (z) => { zoom = z; },
    };

    engine.addNode(1, 0);
    renderLoop();
    console.log("[WebGL] Render loop started");
  }

  /* ─── Read draw commands from WASM and render ─── */
  function renderLoop() {
    if (!gl || !engine) { requestAnimationFrame(renderLoop); return; }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.12, 0.12, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uOff, offsetX, offsetY);
    gl.uniform1f(uZoom, zoom);

    // Get command buffer from engine
    var cmdInfo = engine.getCommandBuffer();
    var count = engine.commandCount();

    if (cmdInfo && cmdInfo.size > 0 && cmdInfo.ptr > 0) {
      var bytesPerCmd = 172; // sizeof(DrawCommand)
      var heapU8 = new Uint8Array(Module.HEAPU8.buffer, cmdInfo.ptr, cmdInfo.size);

      for (var i = 0; i < count; i++) {
        var off = i * bytesPerCmd;

        // Read DrawCommand fields from raw memory
        var fx = readFloat(heapU8, off + 1);                  // x
        var fy = readFloat(heapU8, off + 5);                  // y
        var fw = readFloat(heapU8, off + 9);                  // w
        var fh = readFloat(heapU8, off + 13);                 // h
        var r  = heapU8[off + 17];                            // fill r
        var g  = heapU8[off + 18];                            // fill g
        var b  = heapU8[off + 19];                            // fill b
        var a  = heapU8[off + 20];                            // fill a
        var radius = readFloat(heapU8, off + 37);             // radius

        // Set per-node uniforms
        gl.uniform4f(uColor, r / 255, g / 255, b / 255, a / 255);
        gl.uniform1f(uSizeW, fw);
        gl.uniform1f(uSizeH, fh);
        gl.uniform1f(uPosX, fx);
        gl.uniform1f(uPosY, fy);
        gl.uniform1f(uRadius, radius);

        // ponytail: one draw call per node, instancing deferred when perf matters
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    requestAnimationFrame(renderLoop);
  }

  /* ─── Helper: read float from byte buffer ─── */
  function readFloat(buf, off) {
    var view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getFloat32(off, true); // little-endian
  }

  // Also expose for canvas event handlers to update offset/zoom
  // The existing app.js mousedown/mousemove handlers should call:
  //   window.__glViewport.setOffset(newPanX, newPanY);
  //   window.__glViewport.setZoom(newZoom);
  // In the future, the canvas events module will call this directly.

  console.log("[WASM+GL] Engine initializer complete");
})();
