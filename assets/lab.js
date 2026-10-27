// 交互实验共用的绘图、格式化和控件工具
(function () {
  const FONT = '"Microsoft YaHei", "PingFang SC", sans-serif';
  const $ = id => document.getElementById(id);
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

  function fmt(v, d = 2) {
    if (!Number.isFinite(v)) return v === Infinity ? '+∞' : v === -Infinity ? '−∞' : '—';
    const r = Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v;
    return r.toFixed(d).replace('-', '−');
  }

  // 去掉末尾多余的 0：1.50 → 1.5，2.00 → 2
  function num(v, d = 3) {
    if (!Number.isFinite(v)) return fmt(v);
    return fmt(v, d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  // 有效数字约 d+1 位；数量级在 10⁻² ~ 10³ 之间直接写小数，否则写成科学计数法
  function sci(v, d = 2) {
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    if (e >= -2 && e <= 3) return fmt(v, Math.max(0, d - e));
    const m = v / Math.pow(10, e);
    return `${fmt(m, d)}×10${String(e).split('').map(ch => SUP[ch]).join('')}`;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  // 数字下标：sub(12) → ₁₂
  const sub = n => String(n).split('').map(ch => '₀₁₂₃₄₅₆₇₈₉'[ch] ?? ch).join('');

  // 能写成 pπ/q（q ≤ 72）的数写成 π 的分数，否则写小数
  function pi(v) {
    const r = v / Math.PI;
    for (let q = 1; q <= 72; q++) {
      const p = Math.round(r * q);
      if (Math.abs(p / q - r) > 1e-9) continue;
      if (p === 0) return '0';
      const s = (p < 0 ? '−' : '') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'π';
      return q === 1 ? s : `${s}/${q}`;
    }
    return num(v, 3);
  }

  // 有理数 p/q 的最简形式（用于概率等）
  function frac(p, q) {
    if (q < 0) { p = -p; q = -q; }
    const g = gcd(Math.round(p), Math.round(q)) || 1;
    p = Math.round(p) / g; q = Math.round(q) / g;
    return q === 1 ? `${p}` : `${p}/${q}`;
  }

  function text(c, s, x, y, color = '#111827', o = {}) {
    c.font = `${o.bold ? 'bold ' : ''}${o.size || 13}px ${o.font || FONT}`;
    c.textAlign = o.align || 'center';
    c.textBaseline = o.base || 'middle';
    if (o.halo !== false) {
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(255,255,255,.92)';
      c.strokeText(s, x, y);
    }
    c.fillStyle = color;
    c.fillText(s, x, y);
  }

  function head(c, x, y, ux, uy, size, color) {
    c.beginPath();
    c.moveTo(x + ux * size, y + uy * size);
    c.lineTo(x - ux * size * 0.6 - uy * size * 0.55, y - uy * size * 0.6 + ux * size * 0.55);
    c.lineTo(x - ux * size * 0.6 + uy * size * 0.55, y - uy * size * 0.6 - ux * size * 0.55);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  function line(c, x1, y1, x2, y2, color, width = 1, dash) {
    c.save();
    if (dash) c.setLineDash(dash);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
    c.restore();
  }

  // 从 (x1,y1) 指向 (x2,y2) 的箭头
  function vec(c, x1, y1, x2, y2, color, width = 2.5, size = 8) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1) return;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    line(c, x1, y1, x2 - ux * size * 0.8, y2 - uy * size * 0.8, color, width);
    head(c, x2 - ux * size * 0.5, y2 - uy * size * 0.5, ux, uy, size, color);
  }

  function dot(c, x, y, r, fill, stroke = '#fff', sw = 2) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); }
  }

  // 让画布跟随容器尺寸和屏幕像素比
  function canvas(cv, onResize) {
    const ctx = cv.getContext('2d');
    const o = {
      ctx, cv, W: 0, H: 0, DPR: 1,
      begin() {
        ctx.setTransform(o.DPR, 0, 0, o.DPR, 0, 0);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, o.W, o.H);
      },
    };
    new ResizeObserver(() => {
      o.DPR = window.devicePixelRatio || 1;
      o.W = cv.clientWidth;
      o.H = cv.clientHeight;
      cv.width = Math.round(o.W * o.DPR);
      cv.height = Math.round(o.H * o.DPR);
      onResize(o);
    }).observe(cv);
    return o;
  }

  // pick(px, py, r) 返回被按住的对象；手指触摸时命中半径更大
  function draggable(cv, { pick, move, end }) {
    let cur = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const radius = e => (e.pointerType === 'touch' ? 26 : 14);
    cv.addEventListener('pointerdown', e => {
      const [x, y] = pos(e);
      cur = pick(x, y, radius(e));
      if (!cur) return;
      try { cv.setPointerCapture(e.pointerId); } catch { /* 没有对应的活动指针时忽略 */ }
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      const [x, y] = pos(e);
      if (cur) move(cur, x, y);
      else cv.style.cursor = pick(x, y, radius(e)) ? 'grab' : 'default';
    });
    const stop = () => { if (cur && end) end(cur); cur = null; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
  }

  const ranges = {};
  function range(id, show, onInput) {
    const el = $(id), out = $(id + 'v');
    const upd = () => { if (out) out.textContent = show(+el.value); };
    el.addEventListener('input', () => { upd(); onInput(+el.value); });
    upd();
    ranges[id] = upd;
  }
  function setRange(id, v) { $(id).value = v; ranges[id] && ranges[id](); }
  function radios(name, onChange) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.addEventListener('change', () => { if (el.checked) onChange(el.value); }));
  }
  function setRadio(name, v) {
    const el = document.querySelector(`input[name="${name}"][value="${v}"]`);
    if (el) el.checked = true;
  }

  // 一组互斥按钮：<div class="seg" id="..."><button data-v="...">
  function seg(id, onChange) {
    const box = $(id);
    const set = v => box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { set(b.dataset.v); onChange(b.dataset.v); }));
    return set;
  }

  // 预设按钮：list = [[名称, 回调], ...]
  function presets(id, list) {
    list.forEach(([name, fn]) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.addEventListener('click', fn);
      $(id).appendChild(btn);
    });
  }

  function niceStep(span, n = 5) {
    const raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
  }

  // 坐标图。box = {x, y, w, h}；series 的 pts 为 [[x, y], ...]
  function plot(c, box, o) {
    const pad = { l: 50, r: 14, t: 24, b: 30, ...(o.pad || {}) };
    const x0 = box.x + pad.l, x1 = box.x + box.w - pad.r;
    const y0 = box.y + box.h - pad.b, y1 = box.y + pad.t;
    const X = v => x0 + (v - o.xmin) / (o.xmax - o.xmin) * (x1 - x0);
    const Y = v => y0 - (v - o.ymin) / (o.ymax - o.ymin) * (y0 - y1);

    const sx = o.xstep || niceStep(o.xmax - o.xmin, o.xticks || 5), sy = niceStep(o.ymax - o.ymin, o.yticks || 4);
    const dx = Math.max(0, -Math.floor(Math.log10(sx) + 1e-9)), dy = Math.max(0, -Math.floor(Math.log10(sy) + 1e-9));
    c.save();
    c.font = `11px ${FONT}`;
    for (let v = Math.ceil(o.xmin / sx) * sx; v <= o.xmax + 1e-9; v += sx) {
      line(c, X(v), y0, X(v), y1, '#f3f4f6');
      text(c, o.xfmt ? o.xfmt(v) : fmt(v, dx), X(v), y0 + 11, '#6b7280', { size: 11, halo: false });
    }
    for (let v = Math.ceil(o.ymin / sy) * sy; v <= o.ymax + 1e-9; v += sy) {
      line(c, x0, Y(v), x1, Y(v), '#f3f4f6');
      text(c, fmt(v, dy), x0 - 5, Y(v), '#6b7280', { size: 11, align: 'right', halo: false });
    }
    if (o.ymin < 0 && o.ymax > 0) line(c, x0, Y(0), x1, Y(0), '#9ca3af');
    line(c, x0, y0, x1 + 6, y0, '#9ca3af');
    line(c, x0, y0, x0, y1 - 6, '#9ca3af');
    if (o.ylabel) text(c, o.ylabel, x0 + 4, box.y + 11, '#374151', { size: 12, bold: true, align: 'left' });
    if (o.xlabel) text(c, o.xlabel, x1, y0 - 10, '#374151', { size: 12, align: 'right' });
    if (o.title) text(c, o.title, x1, box.y + 11, '#6b7280', { size: 12, align: 'right' });

    c.beginPath();
    c.rect(x0, y1 - 4, x1 - x0, y0 - y1 + 8);
    c.clip();
    for (const h of o.hlines || []) {
      line(c, x0, Y(h.y), x1, Y(h.y), h.color || '#111827', 1.2, [5, 4]);
      if (h.label) text(c, h.label, x1 - 4, Y(h.y) - 9, h.color || '#111827', { size: 12, bold: true, align: 'right' });
    }
    for (const v of o.vlines || []) {
      line(c, X(v.x), y0, X(v.x), y1, v.color || '#111827', 1.2, [5, 4]);
      if (v.label) text(c, v.label, X(v.x) + 4, y1 + 8, v.color || '#111827', { size: 12, bold: true, align: 'left' });
    }
    for (const s of o.series || []) {
      if (!s.pts.length) continue;
      c.save();
      if (s.dash) c.setLineDash(s.dash);
      c.globalAlpha = s.alpha ?? 1;
      c.beginPath();
      s.pts.forEach(([a, b], i) => (i ? c.lineTo(X(a), Y(b)) : c.moveTo(X(a), Y(b))));
      c.strokeStyle = s.color;
      c.lineWidth = s.width || 2.2;
      c.stroke();
      c.restore();
    }
    for (const p of o.points || []) {
      dot(c, X(p.x), Y(p.y), p.r || 5, p.color);
      if (p.label) text(c, p.label, X(p.x) + 8, Y(p.y) - 10, p.color, { size: 12, bold: true, align: 'left' });
    }
    c.restore();
    let lx = x0 + (o.legendX ?? 150);
    for (const s of o.series || []) {
      if (!s.label) continue;
      c.font = `12px ${FONT}`;
      const w = c.measureText(s.label).width;
      if (lx + w + 22 > x1) break;
      line(c, lx, box.y + 11, lx + 16, box.y + 11, s.color, 2.5, s.dash);
      text(c, s.label, lx + 20, box.y + 11, s.color, { size: 12, align: 'left', halo: false });
      lx += w + 36;
    }
    return { X, Y, x0, x1, y0, y1 };
  }

  function loop(step) {
    let last = 0, on = false;
    const tick = ts => {
      if (!on) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      if (step(dt) === false) { on = false; return; }
      requestAnimationFrame(tick);
    };
    return {
      start() { if (on) return; on = true; last = 0; requestAnimationFrame(tick); },
      stop() { on = false; },
      get on() { return on; },
    };
  }

  window.Lab = { $, fmt, num, sci, pi, frac, gcd, sub, text, head, line, vec, dot, canvas, draggable, range, setRange, radios, setRadio, seg, presets, niceStep, plot, loop, FONT };
})();
