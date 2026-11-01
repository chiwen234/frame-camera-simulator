/* =========================================================
   FRAME — 矢量图标（纯内联 SVG，无位图、无 AI 图）
   钢铁雄心式的徽章：外环 + 内环 + 几何符号
   ========================================================= */
(function () {
  'use strict';

  // 每个图标一条 path（24x24 视口内）
  const GLYPH = {
    decisions: 'M5 4h14v3H5zM5 10h9v3H5zM5 16h12v3H5z',
    globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 2c1.6 0 3 3.1 3 7s-1.4 7-3 7-3-3.1-3-7 1.4-7 3-7zM4 11h16v2H4z',
    diplomacy: 'M7 5a3 3 0 100 6 3 3 0 000-6zm10 0a3 3 0 100 6 3 3 0 000-6zM3 18c0-2.2 1.8-4 4-4s4 1.8 4 4v1H3v-1zm10 0c0-2.2 1.8-4 4-4s4 1.8 4 4v1h-8v-1z',
    market: 'M4 19h16v2H4zM6 10h3v7H6zM11 5h3v12h-3zM16 13h3v4h-3z',
    chips: 'M9 3h6v2h3v3h2v8h-2v3h-3v2H9v-2H6v-3H4V8h2V5h3V3zm1 4v10h4V7h-4z',
    research: 'M10 3h4v6l5 9a2 2 0 01-2 3H7a2 2 0 01-2-3l5-9V3zm1 2v5l-5 9h12l-5-9V5h-2z',
    operations: 'M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3zm0 6a4 4 0 100 8 4 4 0 000-8z',
    finance: 'M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h3v4H8v-4zm5 0h3v4h-3v-4z',
    products: 'M4 7l8-4 8 4v10l-8 4-8-4V7zm8-1.8L6.6 8 12 10.6 17.4 8 12 5.2zM6 9.6v6.2l5 2.5v-6.2L6 9.6zm7 8.7l5-2.5V9.6l-5 2.5v6.2z',
    design: 'M4 20l3-1 9-9-2-2-9 9-1 3zm12-14l2-2 2 2-2 2-2-2z',
    launch: 'M12 2c3 2 5 6 5 10l-3 3v4l-2 2-2-2v-4l-3-3c0-4 2-8 5-10zm0 6a2 2 0 100 4 2 2 0 000-4z',
    company: 'M4 20V6l8-4 8 4v14h-4v-6H8v6H4zm6-8h4V8h-4v4z',
    // 决策线路
    sensor: 'M12 3l2.4 5.1L20 9.3l-4 4 1 5.7-5-2.7-5 2.7 1-5.7-4-4 5.6-1.2L12 3z',
    af: 'M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8l2.8 2.8M17.7 6.3l-2.8 2.8m-5.8 5.8l-2.8 2.8',
    optics: 'M12 4a8 8 0 100 16 8 8 0 000-16zm0 3a5 5 0 110 10 5 5 0 010-10z',
    video: 'M4 6h11v12H4V6zm13 3l4-2v10l-4-2V9z',
    brand: 'M12 3l2.6 5.8 6.4.7-4.8 4.3 1.3 6.2L12 16.9 6.5 20l1.3-6.2L3 9.5l6.4-.7L12 3z',
    biz: 'M4 18V9h4v9H4zm6 0V5h4v13h-4zm6 0v-6h4v6h-4z',
    // 政治路线
    iron: 'M4 20l3-9 4 3 3-8 6 14H4z',
    ally: 'M8 7l-4 5 4 5m8-10l4 5-4 5M9 12h6',
    ambush: 'M12 3l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6l3-7z',
    shadow: 'M12 3a9 9 0 100 18c-4-2-6-5-6-9s2-7 6-9z'
  };

  function svgIcon(name, size, color, strokeOnly) {
    const d = GLYPH[name] || GLYPH.company;
    const s = size || 16;
    const c = color || 'currentColor';
    if (strokeOnly) {
      return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' + c
        + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
    }
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + c + '"><path d="' + d + '"/></svg>';
  }

  // 钢铁雄心式徽章：外环 + 内环 + 符号
  function svgEmblem(name, size, color, active) {
    const s = size || 26;
    const d = GLYPH[name] || GLYPH.company;
    const ring = active ? '#d8a65a' : 'rgba(180,165,130,.42)';
    const inner = active ? 'rgba(216,166,90,.16)' : 'rgba(120,108,86,.12)';
    const glyphColor = active ? '#f0e2c0' : (color || '#a99c82');
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 32 32" aria-hidden="true">'
      + '<circle cx="16" cy="16" r="15" fill="' + inner + '" stroke="' + ring + '" stroke-width="1.2"/>'
      + '<circle cx="16" cy="16" r="12.2" fill="none" stroke="' + ring + '" stroke-width="0.6" opacity="0.6"/>'
      + '<g transform="translate(8.4,8.4) scale(0.62)"><path d="' + d + '" fill="' + glyphColor + '"/></g>'
      + '</svg>';
  }

  // 决策节点用的小徽章
  function svgNodeIcon(name, size, color) {
    const s = size || 12;
    const d = GLYPH[name] || GLYPH.company;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + (color || '#a99c82') + '"><path d="' + d + '"/></svg>';
  }

  window.FrameIcons = { GLYPH, svgIcon, svgEmblem, svgNodeIcon };
})();
