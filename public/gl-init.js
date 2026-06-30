/* ═══ WASM + WebGL Engine Initializer ═══
   Loads alongside app.js — adds GPU-accelerated canvas rendering
   while keeping the existing DOM interaction layer. */

(function initWasmEngine() {
  var canvas = document.getElementById("gl-canvas");
  if (!canvas) return;

  // Resize canvas to match container
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

  // Load WASM engine
  var engine = null;
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
    console.log("[WASM] Engine loaded, nodes:", engine.nodeCount());
    initWebGL();
  }).catch((e) => {
    console.warn("[WASM] Engine not available, fallback to DOM", e);
  });

  function initWebGL() {
    if (!engine) return;
    var gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) { console.warn("[WebGL] Not supported"); return; }

    // Passthrough vertex shader
    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, [
      "#version 300 es",
      "in vec2 a_pos;",
      "uniform vec2 u_res;",
      "uniform vec2 u_off;",
      "uniform float u_zoom;",
      "void main() {",
      "  vec2 p = (a_pos * u_zoom + u_off) / u_res * 2.0 - 1.0;",
      "  p.y = -p.y;",
      "  gl_Position = vec4(p, 0.0, 1.0);",
      "}"
    ].join("\n"));
    gl.compileShader(vs);

    // Flat color fragment shader
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, [
      "#version 300 es",
      "precision highp float;",
      "uniform vec4 u_color;",
      "out vec4 outColor;",
      "void main() { outColor = u_color; }"
    ].join("\n"));
    gl.compileShader(fs);

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Unit quad
    var verts = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0]);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 8, 0);

    var uRes = gl.getUniformLocation(prog, "u_res");
    var uOff = gl.getUniformLocation(prog, "u_off");
    var uZoom = gl.getUniformLocation(prog, "u_zoom");
    var uColor = gl.getUniformLocation(prog, "u_color");

    var offsetX = 0, offsetY = 0, zoom = 1;

    // Expose viewport for canvas events to update
    window.__glViewport = {
      get offsetX() { return offsetX; },
      get offsetY() { return offsetY; },
      get zoom() { return zoom; },
      setOffset: (x, y) => { offsetX = x; offsetY = y; },
      setZoom: (z) => { zoom = z; },
    };

    function render() {
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
      gl.uniform4f(uColor, 0.05, 0.35, 0.35, 0.2);

      // ponytail: batch draw all nodes as quads once node iteration is wired
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
    render();
    console.log("[WebGL] Canvas renderer active");
  }
})();
