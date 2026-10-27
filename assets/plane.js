// 直角坐标系：世界坐标与画布像素互换；空白处拖动平移，滚轮缩放，双击复位
(function () {
  const { line, text, dot, vec, fmt, niceStep } = Lab;

  // o = { xmin, xmax, ymin, ymax, equal, draw(P), pick(px, py, r), move(obj, x, y, px, py), end(obj), pan, piX }
  function plane(cv, o) {
    const P = { o, cx: 0, cy: 0, kx: 1, ky: 1, zoom: 1 };
    let win = { xmin: o.xmin, xmax: o.xmax, ymin: o.ymin, ymax: o.ymax };
    let fitted = false;
    const view = Lab.canvas(cv, () => { if (!fitted) home(); else scale(); P.redraw(); });
    const c = view.ctx;
    P.view = view; P.ctx = c;

    function scale() {
      const W = view.W, H = view.H;
      let kx = W / (win.xmax - win.xmin) * P.zoom, ky = H / (win.ymax - win.ymin) * P.zoom;
      if (o.equal !== false) kx = ky = Math.min(kx, ky);
      P.kx = kx; P.ky = ky;
    }
    function home() {
      P.zoom = 1;
      P.cx = (win.xmin + win.xmax) / 2;
      P.cy = (win.ymin + win.ymax) / 2;
      fitted = view.W > 0;
      scale();
    }
    P.setWindow = (xmin, xmax, ymin, ymax) => { win = { xmin, xmax, ymin, ymax }; home(); P.redraw(); };
    P.X = x => view.W / 2 + (x - P.cx) * P.kx;
    P.Y = y => view.H / 2 - (y - P.cy) * P.ky;
    P.ix = px => P.cx + (px - view.W / 2) / P.kx;
    P.iy = py => P.cy - (py - view.H / 2) / P.ky;
    P.vis = () => ({ x0: P.ix(0), x1: P.ix(view.W), y0: P.iy(view.H), y1: P.iy(0) });
    P.near = (px, py, x, y, r) => Math.hypot(P.X(x) - px, P.Y(y) - py) <= r;
    P.redraw = () => { if (!view.W) return; view.begin(); o.draw(P, c); };

    Lab.draggable(cv, {
      pick(px, py, r) {
        const hit = o.pick && o.pick(px, py, r);
        if (hit) return hit;
        return o.pan === false ? null : { pan: true, px, py, cx: P.cx, cy: P.cy };
      },
      move(obj, px, py) {
        if (obj.pan) {
          P.cx = obj.cx - (px - obj.px) / P.kx;
          P.cy = obj.cy + (py - obj.py) / P.ky;
          P.redraw();
        } else o.move(obj, P.ix(px), P.iy(py), px, py);
      },
      end(obj) { if (!obj.pan && o.end) o.end(obj); },
    });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      const wx = P.ix(px), wy = P.iy(py);
      P.zoom = Math.min(20, Math.max(0.1, P.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      scale();
      P.cx = wx - (px - view.W / 2) / P.kx;
      P.cy = wy + (py - view.H / 2) / P.ky;
      P.redraw();
    }, { passive: false });
    cv.addEventListener('dblclick', () => { home(); P.redraw(); });

    // 网格、坐标轴和刻度
    P.grid = (opt = {}) => {
      const W = view.W, H = view.H, v = P.vis();
      const piX = opt.piX ?? o.piX;
      let sx = niceStep(v.x1 - v.x0, Math.max(4, W / 80)), sy = niceStep(v.y1 - v.y0, Math.max(3, H / 70));
      if (piX) { sx = Math.PI / 6; while ((v.x1 - v.x0) / sx > W / 70) sx *= 2; }
      if (opt.intX) sx = Math.max(1, Math.round(sx));
      const ax = Math.min(Math.max(P.Y(0), 0), H), ay = Math.min(Math.max(P.X(0), 0), W);
      for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1; x += sx) line(c, P.X(x), 0, P.X(x), H, '#f1f5f9');
      for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1; y += sy) line(c, 0, P.Y(y), W, P.Y(y), '#f1f5f9');
      Lab.vec(c, 0, ax, W - 2, ax, '#9ca3af', 1.3, 8);
      Lab.vec(c, ay, H, ay, 2, '#9ca3af', 1.3, 8);
      const dx = Math.max(0, -Math.floor(Math.log10(sx) + 1e-9)), dy = Math.max(0, -Math.floor(Math.log10(sy) + 1e-9));
      // 坐标轴贴近画布边缘时，刻度数字改画到轴的内侧
      const xlabY = ax > H - 22 ? ax - 12 : ax + 12, ylabRight = ay < 36;
      for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1; x += sx) {
        if (Math.abs(x) < sx / 2) continue;
        line(c, P.X(x), ax - 3, P.X(x), ax + 3, '#9ca3af');
        text(c, piX ? Lab.pi(Math.round(x / (Math.PI / 12)) * Math.PI / 12) : fmt(x, dx), P.X(x), xlabY, '#6b7280', { size: 11 });
      }
      for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1; y += sy) {
        if (Math.abs(y) < sy / 2) continue;
        line(c, ay - 3, P.Y(y), ay + 3, P.Y(y), '#9ca3af');
        text(c, fmt(y, dy), ylabRight ? ay + 6 : ay - 6, P.Y(y), '#6b7280', { size: 11, align: ylabRight ? 'left' : 'right' });
      }
      text(c, 'O', ay - 8, ax + 10, '#6b7280', { size: 11 });
      text(c, opt.xl || 'x', W - 4, ax - 12, '#374151', { size: 13, bold: true, align: 'right' });
      text(c, opt.yl || 'y', ay + 8, 10, '#374151', { size: 13, bold: true, align: 'left' });
    };

    // y = f(x) 的图像；遇到无定义或跳跃处断开
    P.fn = (f, color = '#2563eb', w = 2.4, dash, a = -Infinity, b = Infinity) => {
      const v = P.vis(), lo = Math.max(a, v.x0), hi = Math.min(b, v.x1);
      if (!(hi > lo)) return;
      const H = view.H, step = 1.5 / P.kx;
      c.save();
      if (dash) c.setLineDash(dash);
      c.strokeStyle = color; c.lineWidth = w; c.lineJoin = 'round';
      c.beginPath();
      let pen = false, prev = 0;
      for (let x = lo; x <= hi + step / 2; x += step) {
        const xx = Math.min(x, hi), y = f(xx);
        if (!Number.isFinite(y)) { pen = false; continue; }
        const py = Math.max(-4 * H, Math.min(5 * H, P.Y(y)));
        if (pen && Math.abs(py - prev) < 2 * H) c.lineTo(P.X(xx), py); else c.moveTo(P.X(xx), py);
        pen = true; prev = py;
      }
      c.stroke();
      c.restore();
    };

    // 参数曲线 (fx(t), fy(t))
    P.curve = (fx, fy, t0, t1, n = 400, color = '#2563eb', w = 2.4, dash) => {
      c.save();
      if (dash) c.setLineDash(dash);
      c.strokeStyle = color; c.lineWidth = w; c.lineJoin = 'round';
      c.beginPath();
      let pen = false;
      for (let i = 0; i <= n; i++) {
        const t = t0 + (t1 - t0) * i / n, x = fx(t), y = fy(t);
        if (!Number.isFinite(x) || !Number.isFinite(y)) { pen = false; continue; }
        if (pen) c.lineTo(P.X(x), P.Y(y)); else c.moveTo(P.X(x), P.Y(y));
        pen = true;
      }
      c.stroke();
      c.restore();
    };

    // 区域填充：f 与 g 之间（x 从 a 到 b）
    P.band = (f, g, a, b, fill) => {
      const n = 200;
      c.beginPath();
      for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; c[i ? 'lineTo' : 'moveTo'](P.X(x), P.Y(f(x))); }
      for (let i = n; i >= 0; i--) { const x = a + (b - a) * i / n; c.lineTo(P.X(x), P.Y(g(x))); }
      c.closePath(); c.fillStyle = fill; c.fill();
    };

    P.seg = (x1, y1, x2, y2, color = '#111827', w = 1.6, dash) => line(c, P.X(x1), P.Y(y1), P.X(x2), P.Y(y2), color, w, dash);
    // 过 (x, y)、方向 (dx, dy) 的整条直线
    P.line = (x, y, dx, dy, color = '#111827', w = 1.6, dash) => {
      const L = Math.hypot(dx, dy) || 1, v = P.vis(), R = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) + Math.hypot(x - P.cx, y - P.cy);
      P.seg(x - dx / L * R, y - dy / L * R, x + dx / L * R, y + dy / L * R, color, w, dash);
    };
    P.arrow = (x1, y1, x2, y2, color = '#111827', w = 2.5, size = 9) => vec(c, P.X(x1), P.Y(y1), P.X(x2), P.Y(y2), color, w, size);
    P.pt = (x, y, color = '#111827', label, o2 = {}) => {
      dot(c, P.X(x), P.Y(y), o2.r || 5, color, o2.stroke ?? '#fff');
      if (label) text(c, label, P.X(x) + (o2.dx ?? 10), P.Y(y) + (o2.dy ?? -12), o2.lc || color, { size: o2.size || 13, bold: true, align: o2.align || 'left' });
    };
    P.label = (s, x, y, color = '#111827', o2 = {}) => text(c, s, P.X(x) + (o2.dx || 0), P.Y(y) + (o2.dy || 0), color, { size: 13, ...o2 });
    P.circle = (x, y, r, color = '#111827', w = 1.6, dash, fill) => {
      c.save();
      if (dash) c.setLineDash(dash);
      c.beginPath(); c.ellipse(P.X(x), P.Y(y), r * P.kx, r * P.ky, 0, 0, Math.PI * 2);
      if (fill) { c.fillStyle = fill; c.fill(); }
      c.strokeStyle = color; c.lineWidth = w; c.stroke();
      c.restore();
    };
    P.poly = (pts, fill, stroke, w = 1.6, dash) => {
      if (pts.length < 2) return;
      c.save();
      if (dash) c.setLineDash(dash);
      c.beginPath();
      pts.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](P.X(x), P.Y(y)));
      c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.stroke(); }
      c.restore();
    };
    // 角的弧线标记：顶点 (x, y)，从方向角 a1 到 a2（弧度，逆时针）
    P.angle = (x, y, a1, a2, rpx, color = '#7c3aed', label) => {
      c.beginPath();
      c.arc(P.X(x), P.Y(y), rpx, -a1, -a2, true);
      c.strokeStyle = color; c.lineWidth = 1.6; c.stroke();
      if (label) { const m = (a1 + a2) / 2; text(c, label, P.X(x) + Math.cos(m) * (rpx + 12), P.Y(y) - Math.sin(m) * (rpx + 12), color, { size: 12, bold: true }); }
    };
    P.corner = (s, color = '#111827', align = 'left', row = 0) => {
      text(c, s, align === 'left' ? 14 : view.W - 14, 22 + row * 22, color, { size: 14, bold: true, align });
    };
    return P;
  }

  // 数值工具
  // 在 [a, b] 上找 f 的零点（等分 n 段，变号处二分；含"碰一下"的切点）
  function roots(f, a, b, n = 2000) {
    const out = [], h = (b - a) / n;
    let x0 = a, f0 = f(a);
    for (let i = 1; i <= n; i++) {
      const x1 = a + i * h, f1 = f(x1);
      if (Number.isFinite(f0) && Number.isFinite(f1)) {
        if (f0 === 0) out.push(x0);
        else if (f0 * f1 < 0) {
          let lo = x0, hi = x1, flo = f0;
          for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = f(m); if ((fm < 0) === (flo < 0)) { lo = m; flo = fm; } else hi = m; }
          const r = (lo + hi) / 2;
          // 排除间断点处的假变号（如 1/x）
          if (Math.abs(f(r)) < 1e-6 * (1 + Math.abs(f0) + Math.abs(f1))) out.push(r);
        }
      }
      x0 = x1; f0 = f1;
    }
    if (Number.isFinite(f0) && f0 === 0) out.push(b);
    return out.filter((r, i) => i === 0 || r - out[i - 1] > h / 2);
  }

  // f 的极值点（数值导数变号）
  function extrema(f, a, b, n = 2000) {
    const h = (b - a) / n, d = x => (f(x + h / 20) - f(x - h / 20)) / (h / 10);
    return roots(d, a + h, b - h, n).map(x => {
      const l = f(x - h), r = f(x + h), y = f(x);
      return { x, y, type: y > l && y > r ? 'max' : y < l && y < r ? 'min' : 'flat' };
    }).filter(e => e.type !== 'flat');
  }

  // 一元二次方程 ax² + bx + c = 0 的实根（a 可为 0）
  function quad(a, b, c) {
    if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
    const D = b * b - 4 * a * c;
    if (D < -1e-12) return [];
    if (Math.abs(D) <= 1e-12) return [-b / (2 * a)];
    const s = Math.sqrt(D);
    return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y);
  }

  // 多项式系数写成式子：poly([1, -2, 0, 3], 'x') → x³ − 2x² + 3（系数从最高次开始）
  function poly(cs, v = 'x', d = 2) {
    const n = cs.length - 1, sup = ['', '', '²', '³', '⁴'];
    let s = '';
    cs.forEach((a, i) => {
      const p = n - i;
      if (Math.abs(a) < 1e-12) return;
      const abs = Math.abs(a), sign = a < 0 ? ' − ' : ' + ';
      const coef = p > 0 && Math.abs(abs - 1) < 1e-12 ? '' : Lab.num(abs, d);
      const term = coef + (p > 0 ? v + sup[p] : '');
      s += s ? sign + term : (a < 0 ? '−' : '') + term;
    });
    return s || '0';
  }

  // "+ 3" / "− 3" 形式的带符号项
  const signed = (v, d = 2) => (v < 0 ? ` − ${Lab.num(-v, d)}` : ` + ${Lab.num(v, d)}`);

  window.Plane = { plane, roots, extrema, quad, poly, signed };
})();
