// 每章一张示意图，viewBox 240×150
(() => {
  const C = { red: '#dc2626', blue: '#2563eb', green: '#16a34a', orange: '#ea580c', purple: '#7c3aed', gray: '#6b7280', ink: '#111827', teal: '#0d9488', light: '#dbeafe' };

  function arrow(x1, y1, x2, y2, color = C.ink, w = 2, head = 7) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const px = -uy * head * 0.5, py = ux * head * 0.5;
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>` +
      `<polygon points="${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}" fill="${color}"/>`;
  }
  const t = (x, y, s, color = C.ink, size = 11, anchor = 'middle', weight = 'normal') =>
    `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" dominant-baseline="middle">${s}</text>`;
  const line = (x1, y1, x2, y2, color = C.ink, w = 1.5, dash = '') =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const circle = (cx, cy, r, fill = 'none', stroke = C.ink, w = 1.5, dash = '') =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const path = (d, color = C.ink, w = 1.8, fill = 'none', dash = '') =>
    `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`;
  const axes = (x0, y0, x1, y1, xl = 'x', yl = 'y', xs = x0, ys = y0) =>
    arrow(xs, y0, x1, y0, C.gray, 1.2, 6) + arrow(x0, ys, x0, y1, C.gray, 1.2, 6) +
    t(x1 - 2, y0 + 10, xl, C.gray, 10, 'end') + t(x0 + 6, y1 + 2, yl, C.gray, 10, 'start');
  // 函数 f 在 [a, b] 上的折线；X、Y 把数学坐标映射到图上
  const fn = (f, a, b, n, X, Y) => {
    let d = '';
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; d += (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1); }
    return d;
  };
  const map = (ox, oy, k) => [x => ox + x * k, y => oy - y * k];

  const FIG = {
    venn: () =>
      `<rect x="20" y="14" width="200" height="112" rx="6" fill="#f9fafb" stroke="${C.gray}"/>` +
      circle(95, 70, 40, 'rgba(37,99,235,.15)', C.blue, 1.8) + circle(145, 70, 40, 'rgba(234,88,12,.15)', C.orange, 1.8) +
      t(70, 70, 'A', C.blue, 14, 'middle', 'bold') + t(170, 70, 'B', C.orange, 14, 'middle', 'bold') + t(120, 70, 'A∩B', C.purple, 11, 'middle', 'bold') +
      t(34, 24, 'U', C.gray, 11) + t(120, 140, 'p ⇒ q：小范围推大范围', C.ink, 10),

    quadIneq: () => {
      const [X, Y] = map(120, 95, 22);
      return axes(20, 95, 225, 12, 'x', 'y', 20, 140) +
        `<path d="${fn(x => 0.5 * x * x - 2, -3.2, 3.2, 60, X, Y)}" fill="none" stroke="${C.blue}" stroke-width="2.4"/>` +
        line(X(-2), 95, X(2), 95, C.red, 4) + circle(X(-2), 95, 3.5, '#fff', C.red, 2) + circle(X(2), 95, 3.5, '#fff', C.red, 2) +
        t(X(-2), 108, 'x₁', C.ink, 10) + t(X(2), 108, 'x₂', C.ink, 10) +
        t(120, 140, '解集端点 = 方程的根', C.red, 10, 'middle', 'bold');
    },

    oddEven: () => {
      const [X, Y] = map(120, 80, 30);
      return axes(20, 80, 225, 10, 'x', 'y', 20, 145) +
        `<path d="${fn(x => x * x * x / 2 - x, -2.4, 2.4, 60, X, Y)}" fill="none" stroke="${C.blue}" stroke-width="2.4"/>` +
        circle(X(1.6), Y(1.6 ** 3 / 2 - 1.6), 3.5, C.blue, C.blue) + circle(X(-1.6), Y(-(1.6 ** 3 / 2 - 1.6)), 3.5, C.blue, C.blue) +
        line(X(1.6), Y(1.6 ** 3 / 2 - 1.6), X(-1.6), Y(-(1.6 ** 3 / 2 - 1.6)), C.gray, 1, '3 3') +
        t(200, 30, '奇函数', C.blue, 11, 'end', 'bold') + t(120, 140, '关于原点中心对称', C.ink, 10);
    },

    expLog: () => {
      const [X, Y] = map(70, 110, 25);
      return axes(70, 110, 225, 8, 'x', 'y', 15, 145) +
        `<path d="${fn(x => Math.pow(2, x), -2, 2.1, 50, X, Y)}" fill="none" stroke="${C.blue}" stroke-width="2.3"/>` +
        `<path d="${fn(x => Math.log2(x), 0.06, 5.5, 80, X, Y)}" fill="none" stroke="${C.orange}" stroke-width="2.3"/>` +
        line(X(-1.8), Y(-1.8), X(4), Y(4), C.gray, 1, '4 3') +
        t(X(1.5), Y(3.4), 'y = 2ˣ', C.blue, 11, 'end', 'bold') + t(X(5.4), Y(2.8), 'y = log₂x', C.orange, 11, 'end', 'bold') +
        t(X(3.9), Y(4.3), 'y = x', C.gray, 10);
    },

    sine: () => {
      const [X, Y] = map(28, 72, 26);
      return axes(28, 72, 228, 10, 'x', 'y', 18, 138) +
        `<path d="${fn(x => Math.sin(x), 0, 2 * Math.PI, 60, X, Y)}" fill="none" stroke="${C.gray}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
        `<path d="${fn(x => 1.8 * Math.sin(2 * x + Math.PI / 3), 0, 2 * Math.PI, 120, X, Y)}" fill="none" stroke="${C.teal}" stroke-width="2.4"/>` +
        t(120, 140, 'y = A sin(ωx + φ)：A 管高低，ω 管疏密，φ 管左右', C.ink, 10);
    },

    vectors: () =>
      `<polygon points="40,120 150,120 200,50 90,50" fill="rgba(13,148,136,.08)" stroke="${C.gray}" stroke-dasharray="4 3"/>` +
      arrow(40, 120, 150, 120, C.blue, 2.4) + arrow(40, 120, 90, 50, C.orange, 2.4) + arrow(40, 120, 200, 50, C.teal, 2.6) +
      t(95, 132, 'a', C.blue, 13, 'middle', 'bold') + t(56, 80, 'b', C.orange, 13, 'middle', 'bold') + t(135, 76, 'a + b', C.teal, 12, 'middle', 'bold') +
      t(120, 16, 'a·b = |a||b|cos θ', C.ink, 11),

    complex: () =>
      axes(40, 110, 220, 12, '实轴', '虚轴', 20, 140) +
      line(40, 110, 160, 40, C.purple, 2.2) + circle(160, 40, 4, C.purple, C.purple) +
      line(160, 40, 160, 110, C.gray, 1, '3 3') + line(40, 40, 160, 40, C.gray, 1, '3 3') +
      t(172, 32, 'Z(a, b)', C.purple, 11, 'start', 'bold') + t(160, 120, 'a', C.ink, 10) + t(32, 40, 'b', C.ink, 10) +
      t(92, 64, '|z| = √(a² + b²)', C.purple, 10, 'end'),

    cube: () =>
      path('M50 120 L150 120 L150 50 L50 50 Z', C.ink, 1.6) + path('M50 50 L90 22 L190 22 L150 50', C.ink, 1.6) + path('M150 120 L190 92 L190 22', C.ink, 1.6) +
      line(50, 120, 90, 92, C.ink, 1.3, '4 3') + line(90, 92, 190, 92, C.ink, 1.3, '4 3') + line(90, 92, 90, 22, C.ink, 1.3, '4 3') +
      `<polygon points="50,120 190,92 90,22" fill="rgba(234,88,12,.18)" stroke="${C.orange}" stroke-width="1.4"/>` +
      t(42, 128, 'A', C.ink, 10) + t(158, 128, 'B', C.ink, 10) + t(198, 92, 'C', C.ink, 10) + t(88, 14, 'D₁', C.ink, 10) +
      t(120, 142, '截面、外接球、线面关系', C.ink, 10),

    histogram: () => {
      const h = [20, 45, 75, 60, 30, 15];
      return axes(30, 125, 225, 12, '分组', '频率/组距', 30, 125) +
        h.map((v, i) => `<rect x="${36 + i * 30}" y="${125 - v}" width="30" height="${v}" fill="rgba(220,38,38,.18)" stroke="${C.red}"/>`).join('') +
        line(108, 125, 108, 30, C.blue, 1.6, '4 3') + t(110, 24, '中位数：两侧面积各 0.5', C.blue, 10, 'start');
    },

    dice: () =>
      `<rect x="40" y="40" width="60" height="60" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="2"/>` +
      [[55, 55], [85, 55], [70, 70], [55, 85], [85, 85]].map(([x, y]) => circle(x, y, 5, C.red, C.red)).join('') +
      `<rect x="130" y="40" width="60" height="60" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="2"/>` +
      [[145, 55], [175, 85]].map(([x, y]) => circle(x, y, 5, C.ink, C.ink)).join('') +
      t(120, 122, 'P(A) = 有利结果数 / 总结果数', C.ink, 11) + t(120, 18, '古典概型：等可能、有限', C.gray, 10),

    planeNormal: () =>
      `<polygon points="30,110 160,110 210,70 80,70" fill="rgba(234,88,12,.12)" stroke="${C.orange}" stroke-width="1.5"/>` +
      arrow(120, 90, 120, 18, C.blue, 2.4) + t(130, 22, 'n', C.blue, 13, 'start', 'bold') +
      arrow(60, 40, 120, 90, C.purple, 2.2) + t(54, 34, 'l', C.purple, 13, 'middle', 'bold') +
      line(120, 90, 160, 90, C.gray, 1, '3 3') + t(196, 100, 'α', C.orange, 13, 'middle', 'bold') +
      t(120, 134, '线面角 sin θ = |cos⟨l, n⟩|', C.ink, 10),

    circleLine: () =>
      circle(110, 75, 45, 'rgba(37,99,235,.06)', C.blue, 2) + circle(110, 75, 3, C.ink, C.ink) +
      line(20, 118, 220, 78, C.orange, 2.2) +
      line(110, 75, 114.8, 99, C.purple, 1.6, '4 3') + t(118, 86, 'd', C.purple, 12, 'start', 'bold') +
      line(110, 75, 77.8, 106.4, C.gray, 1.2) + t(86, 86, 'r', C.gray, 12) +
      t(120, 140, '弦长 = 2√(r² − d²)', C.ink, 10),

    ellipse: () =>
      `<ellipse cx="120" cy="72" rx="90" ry="52" fill="rgba(234,88,12,.06)" stroke="${C.orange}" stroke-width="2.2"/>` +
      circle(46, 72, 3.5, C.ink, C.ink) + circle(194, 72, 3.5, C.ink, C.ink) + t(46, 84, 'F₁', C.ink, 10) + t(194, 84, 'F₂', C.ink, 10) +
      line(46, 72, 150, 22.5, C.blue, 1.6) + line(194, 72, 150, 22.5, C.blue, 1.6) + circle(150, 22.5, 4, C.blue, C.blue) + t(158, 14, 'P', C.blue, 11, 'start', 'bold') +
      t(120, 140, '|PF₁| + |PF₂| = 2a', C.ink, 11),

    seq: () => {
      const v = [3, 2.2, 1.4, 0.6, -0.2, -1, -1.8];
      return axes(25, 80, 228, 10, 'n', 'aₙ', 25, 140) +
        v.map((a, i) => `<rect x="${35 + i * 26}" y="${a > 0 ? 80 - a * 18 : 80}" width="16" height="${Math.abs(a) * 18}" fill="${a > 0 ? 'rgba(124,58,237,.3)' : 'rgba(220,38,38,.25)'}" stroke="${a > 0 ? C.purple : C.red}"/>`).join('') +
        t(150, 22, 'aₙ 由正变负：Sₙ 最大', C.purple, 10, 'start', 'bold');
    },

    tangent: () => {
      const [X, Y] = map(40, 120, 28), f = x => 0.25 * x * x * x - 1.2 * x * x + 1.4 * x + 1.2;
      const x0 = 1.0, k = 0.75 * x0 * x0 - 2.4 * x0 + 1.4, y0 = f(x0);
      return axes(40, 120, 228, 8, 'x', 'y', 18, 145) +
        `<path d="${fn(f, -0.5, 6, 80, X, Y)}" fill="none" stroke="${C.blue}" stroke-width="2.4"/>` +
        line(X(x0 - 1.4), Y(y0 - 1.4 * k), X(x0 + 2.5), Y(y0 + 2.5 * k), C.orange, 1.8) +
        circle(X(x0), Y(y0), 4, C.orange, C.orange) + t(X(x0), Y(y0) - 12, '斜率 = f′(x₀)', C.orange, 10, 'middle', 'bold');
    },

    binom: () =>
      [1, 4, 6, 4, 1].map((v, i) => `<rect x="${55 + i * 28}" y="${115 - v * 14}" width="22" height="${v * 14}" fill="rgba(220,38,38,.2)" stroke="${C.red}"/>` + t(66 + i * 28, 108 - v * 14, `C₄${'⁰¹²³⁴'[i]}`, C.ink, 10)).join('') +
      line(40, 115, 210, 115, C.gray, 1.2) + t(120, 135, '(a + b)⁴ 的二项式系数', C.ink, 10),

    normal: () => {
      const [X, Y] = map(120, 118, 32);
      const f = x => 2.8 * Math.exp(-x * x / 2);
      return line(20, 118, 222, 118, C.gray, 1.2) +
        `<path d="${fn(f, -1, 1, 30, X, Y)} L${X(1)} 118 L${X(-1)} 118 Z" fill="rgba(220,38,38,.18)"/>` +
        `<path d="${fn(f, -3, 3, 80, X, Y)}" fill="none" stroke="${C.red}" stroke-width="2.4"/>` +
        line(120, 118, 120, Y(2.8), C.gray, 1, '3 3') + t(120, 130, 'μ', C.ink, 11) + t(X(-1), 130, 'μ−σ', C.ink, 10) + t(X(1), 130, 'μ+σ', C.ink, 10) +
        t(120, 82, '68.27%', C.red, 11, 'middle', 'bold');
    },

    scatter: () => {
      const pts = [[40, 112], [58, 100], [70, 104], [88, 86], [102, 90], [118, 72], [135, 76], [150, 58], [168, 60], [186, 42], [200, 46]];
      return axes(30, 125, 225, 12, 'x', 'y', 30, 125) +
        pts.map(([x, y]) => circle(x, y, 3.5, C.red, C.red)).join('') +
        line(35, 114, 210, 40, C.blue, 2) + t(150, 20, 'ŷ = b̂x + â，r ≈ 0.97', C.blue, 10, 'middle', 'bold');
    },
  };

  window.figureSVG = name => `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" font-family="Microsoft YaHei, PingFang SC, sans-serif">${(FIG[name] || (() => ''))()}</svg>`;
})();
