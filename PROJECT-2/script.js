// /script.js
// Happy Little Pixels — Bob Ross inspired theme. Adds HUD, shortcuts, and soft UI polish.

const app = (() => {
  // Constants
  const DEFAULT_WIDTH = 32;
  // /script.js
  // Happy Little Pixels — new Paint-like implementation

  // This implementation focuses on a simple, responsive paint program:
  // - Tools: Pencil, Eraser, Line, Rectangle, Ellipse, Fill, Picker
  // - Undo/Redo (bitmap snapshots)
  // - Zoom & Pan, Save (PNG), Clear
  // - Uses main canvas for pixels and overlay canvas for previews

  (() => {
    // DOM
    const canvas = document.getElementById('canvas');
    const overlay = document.getElementById('overlayCanvas');
    const wrapper = document.getElementById('canvasWrapper');
    const colorInput = document.getElementById('colorPicker');
    const toolSelect = document.getElementById('toolSelect');
    const brushSizeEl = document.getElementById('brushSize');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const toggleGridBtn = document.getElementById('toggleGrid');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');

    const hudTool = document.getElementById('hudTool');
    const hudColor = document.getElementById('hudColor');
    const hudSize = document.getElementById('hudSize');
    const hudZoom = document.getElementById('hudZoom');
    const hudCoords = document.getElementById('hudCoords');

    // Config
    const BASE_WIDTH = 512;
    const BASE_HEIGHT = 384;

    // State
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = BASE_WIDTH;
    let height = BASE_HEIGHT;
    let zoom = 1;
    let pan = { x: 0, y: 0 };

    // Tools: pencil, eraser, line, rect, ellipse, fill, picker
    let tool = 'brush';
    let brushSize = Math.max(1, Math.min(50, parseInt(brushSizeEl.value || '5')));
    let color = colorInput.value || '#2b2b2b';
    let gridOn = false;

    // Canvas contexts
    const ctx = canvas.getContext('2d', { alpha: true });
    const octx = overlay.getContext('2d', { alpha: true });

    // History for undo/redo (store ImageData)
    const history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;

    // Interaction
    let isDrawing = false;
    let start = null; // start point in canvas pixels
    let last = null; // last point for continuous tools
    let isPanning = false;

    // Initialize
    function init() {
      resizeCanvas(width, height);
      clearCanvas();
      pushHistory();
      bindEvents();
      updateHUD();
      centerCanvas();
      render();
    }

    // Resize canvases (pixel buffer size) and scale for DPR
    function resizeCanvas(w, h) {
      width = w; height = h;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      overlay.width = Math.floor(width * dpr);
      overlay.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      overlay.style.width = width + 'px';
      overlay.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function clearCanvas() {
      ctx.clearRect(0, 0, width, height);
    }

    function pushHistory() {
      // trim redo states
      if (historyIndex < history.length - 1) history.splice(historyIndex + 1);
      // snapshot
      const snap = ctx.getImageData(0, 0, width, height);
      history.push(snap);
      if (history.length > MAX_HISTORY) history.shift();
      historyIndex = history.length - 1;
      updateUndoButtons();
    }

    function undo() {
      if (historyIndex <= 0) return;
      historyIndex--;
      const snap = history[historyIndex];
      ctx.putImageData(snap, 0, 0);
      render();
      updateUndoButtons();
    }

    function redo() {
      if (historyIndex >= history.length - 1) return;
      historyIndex++;
      const snap = history[historyIndex];
      ctx.putImageData(snap, 0, 0);
      render();
      updateUndoButtons();
    }

    function updateUndoButtons() {
      undoBtn.disabled = historyIndex <= 0;
      redoBtn.disabled = historyIndex >= history.length - 1;
    }

    function setTool(t) {
      tool = t;
      toolSelect.value = t;
      updateHUD();
      drawOverlay();
    }

    function setColor(c) {
      color = c;
      colorInput.value = c;
      updateHUD();
    }

    function setBrushSize(s) {
      brushSize = Math.max(1, Math.min(100, Math.round(s)));
      brushSizeEl.value = String(brushSize);
      updateHUD();
      drawOverlay();
    }

    function centerCanvas() {
      const rect = wrapper.getBoundingClientRect();
      pan.x = (rect.width - width * zoom) / 2;
      pan.y = (rect.height - height * zoom) / 2;
    }

    function render() {
      // main canvas already contains pixels (ctx)
      // just update overlay and styles
      overlay.style.transform = canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
      drawOverlay();
      updateHUD();
    }

    function drawOverlay() {
      octx.clearRect(0, 0, width, height);
      // grid
      if (gridOn && zoom > 1) {
        octx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color') || 'rgba(0,0,0,0.06)';
        octx.lineWidth = 1 / zoom;
        for (let x = 0; x <= width; x += 16) {
          octx.beginPath(); octx.moveTo(x + 0.5, 0); octx.lineTo(x + 0.5, height); octx.stroke();
        }
        for (let y = 0; y <= height; y += 16) {
          octx.beginPath(); octx.moveTo(0, y + 0.5); octx.lineTo(width, y + 0.5); octx.stroke();
        }
      }

      // preview for shapes
      if (isDrawing && start) {
        const s = start;
        octx.strokeStyle = color;
        octx.fillStyle = hexToRgba(color, 0.12);
        octx.lineWidth = Math.max(1, brushSize / 4);
        if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
          const e = last || s;
          const x = Math.min(s.x, e.x), y = Math.min(s.y, e.y);
          const w = Math.abs(e.x - s.x), h = Math.abs(e.y - s.y);
          if (tool === 'line') {
            octx.beginPath(); octx.moveTo(s.x + 0.5, s.y + 0.5); octx.lineTo(e.x + 0.5, e.y + 0.5); octx.stroke();
          } else if (tool === 'rect') {
            octx.fillRect(x, y, w, h);
            octx.strokeRect(x + 0.5, y + 0.5, w, h);
          } else if (tool === 'ellipse') {
            octx.beginPath();
            octx.ellipse((s.x + e.x) / 2, (s.y + e.y) / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            octx.fill(); octx.stroke();
          }
        }

        // pencil/eraser preview brush cursor
        if ((tool === 'brush' || tool === 'eraser') && last) {
          octx.fillStyle = hexToRgba(color, tool === 'eraser' ? 0.18 : 0.12);
          octx.beginPath(); octx.arc(last.x + 0.5, last.y + 0.5, Math.max(1, brushSize / 2), 0, Math.PI * 2);
          octx.fill();
        }
      }
    }

    // Helpers
    function clientToCanvasPoint(clientX, clientY) {
      const rect = wrapper.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x: Math.round(x), y: Math.round(y) };
    }

    function hexToRgba(hex, a = 1) {
      const h = (hex || '#000000').replace('#','');
      const r = parseInt(h.substring(0,2),16);
      const g = parseInt(h.substring(2,4),16);
      const b = parseInt(h.substring(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }

    // Draw routines
    function drawDot(x, y, size, col) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, Math.max(1, size / 2), 0, Math.PI * 2); ctx.fill();
    }

    function drawLinePixels(x0, y0, x1, y1, size, col) {
      // Bresenham with filled circles for thickness
      let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      let dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = (dx > dy ? dx : -dy) / 2;
      while (true) {
        drawDot(x0, y0, size, col);
        if (x0 === x1 && y0 === y1) break;
        const e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
      }
    }

    function floodFill(x, y, newColor) {
      const img = ctx.getImageData(0, 0, width, height);
      const data = img.data;
      const idx = (y * width + x) * 4;
      const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2], targetA = data[idx+3];
      const newR = parseInt(newColor.slice(1,3), 16);
      const newG = parseInt(newColor.slice(3,5), 16);
      const newB = parseInt(newColor.slice(5,7), 16);
      if (targetR === newR && targetG === newG && targetB === newB && targetA === 255) return;
      const stack = [[x,y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
        const i = (cy * width + cx) * 4;
        if (data[i] === targetR && data[i+1] === targetG && data[i+2] === targetB && data[i+3] === targetA) {
          data[i] = newR; data[i+1] = newG; data[i+2] = newB; data[i+3] = 255;
          stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    // Events
    function onPointerDown(e) {
      if (e.button === 1 || e.buttons === 4) { // middle: begin pan
        isPanning = true; wrapper.classList.add('panning'); return;
      }
      isDrawing = true;
      const p = clientToCanvasPoint(e.clientX, e.clientY);
      start = { x: p.x, y: p.y };
      last = { x: p.x, y: p.y };

      if (tool === 'picker') {
        const pix = ctx.getImageData(p.x, p.y, 1, 1).data;
        setColor(`#${[pix[0],pix[1],pix[2]].map(n=>n.toString(16).padStart(2,'0')).join('')}`);
        isDrawing = false; start = null; last = null;
        return;
      }

      if (tool === 'fill') {
        floodFill(p.x, p.y, color);
        pushHistory(); isDrawing = false; start = null; last = null; return;
      }

      if (tool === 'brush' || tool === 'eraser') {
        const c = tool === 'eraser' ? 'rgba(0,0,0,0)' : color;
        if (tool === 'eraser') {
          // Clear circle by compositing
          ctx.save(); ctx.globalCompositeOperation = 'destination-out'; drawDot(p.x, p.y, brushSize, 'rgba(0,0,0,1)'); ctx.restore();
        } else {
          drawDot(p.x, p.y, brushSize, c);
        }
      }
      render();
    }

    function onPointerMove(e) {
      const p = clientToCanvasPoint(e.clientX, e.clientY);
      last = { x: p.x, y: p.y };
      hudCoords.textContent = `${p.x}, ${p.y}`;
      if (e.buttons === 4 || e.button === 1) { // panning
        pan.x += e.movementX; pan.y += e.movementY; render(); return;
      }
      if (!isDrawing || !start) { drawOverlay(); return; }

      if (tool === 'brush' || tool === 'eraser') {
        if (tool === 'eraser') {
          ctx.save(); ctx.globalCompositeOperation = 'destination-out'; drawLinePixels(start.x, start.y, p.x, p.y, brushSize, 'rgba(0,0,0,1)'); ctx.restore();
        } else {
          drawLinePixels(start.x, start.y, p.x, p.y, brushSize, color);
        }
        start = { x: p.x, y: p.y };
      } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
        // just update last and overlay preview
      }
      render();
    }

    function onPointerUp(e) {
      if (isPanning) { isPanning = false; wrapper.classList.remove('panning'); return; }
      if (!isDrawing) return;
      isDrawing = false;

      if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
        const s = start, ept = last || start;
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1, brushSize / 4);
        if (tool === 'line') { ctx.beginPath(); ctx.moveTo(s.x + 0.5, s.y + 0.5); ctx.lineTo(ept.x + 0.5, ept.y + 0.5); ctx.stroke(); }
        else if (tool === 'rect') { const x = Math.min(s.x, ept.x), y = Math.min(s.y, ept.y), w = Math.abs(ept.x - s.x), h = Math.abs(ept.y - s.y); ctx.fillRect(x, y, w, h); ctx.strokeRect(x + 0.5, y + 0.5, w, h); }
        else if (tool === 'ellipse') { ctx.beginPath(); ctx.ellipse((s.x + ept.x) / 2, (s.y + ept.y) / 2, Math.abs(ept.x - s.x) / 2, Math.abs(ept.y - s.y) / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      }

      pushHistory(); start = null; last = null; render();
    }

    // Keyboard and wheel
    function onWheel(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        const old = zoom;
        zoom = Math.max(0.25, Math.min(8, zoom - Math.sign(e.deltaY) * 0.1));
        // zoom toward mouse
        const rect = wrapper.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        pan.x = mx - (mx - pan.x) * (zoom / old);
        pan.y = my - (my - pan.y) * (zoom / old);
        render();
      }
    }

    function onKeyDown(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      } else {
        if (e.key === 'g') { gridOn = !gridOn; render(); }
        if (e.key === '[') setBrushSize(brushSize - 1);
        if (e.key === ']') setBrushSize(brushSize + 1);
        if (e.key === '+') { zoom = Math.min(8, zoom + 0.25); render(); }
        if (e.key === '-') { zoom = Math.max(0.25, zoom - 0.25); render(); }
        if (e.key >= '1' && e.key <= '7') { // map digits to tools order
          const map = ['brush','eraser','line','rect','ellipse','fill','picker'];
          setTool(map[parseInt(e.key,10)-1]);
        }
      }
    }

    function updateHUD() {
      hudTool.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
      hudColor.textContent = color.toUpperCase();
      hudSize.textContent = String(brushSize);
      hudZoom.textContent = `${Math.round(zoom * 100)}%`;
    }

    function savePNG() {
      const out = document.createElement('canvas');
      out.width = width; out.height = height;
      const outCtx = out.getContext('2d', { alpha: true });
      outCtx.drawImage(canvas, 0, 0, width, height);
      out.toBlob(blob => {
        const link = document.createElement('a');
        link.download = `happy-little-pixels_${width}x${height}_${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    }

    function bindEvents() {
      // pointer events on wrapper to better handle transforms
      wrapper.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      wrapper.addEventListener('contextmenu', e => e.preventDefault());
      wrapper.addEventListener('wheel', onWheel, { passive: false });

      // controls
      toolSelect.addEventListener('change', () => setTool(toolSelect.value));
      colorInput.addEventListener('input', () => setColor(colorInput.value));
      brushSizeEl.addEventListener('input', () => setBrushSize(+brushSizeEl.value));
      undoBtn.addEventListener('click', undo);
      redoBtn.addEventListener('click', redo);
      toggleGridBtn.addEventListener('click', () => { gridOn = !gridOn; toggleGridBtn.classList.toggle('active', gridOn); render(); });
      resetBtn.addEventListener('click', () => { if (confirm('Clear the canvas?')) { clearCanvas(); pushHistory(); render(); } });
      exportBtn.addEventListener('click', savePNG);

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', () => { centerCanvas(); render(); });
    }

    // Start
    init();

  })();

})();
