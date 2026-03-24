/* ============================================================
   Thomas Moore Portfolio — main.js
   - Smooth scroll with fixed header offset (topbar 26px + nav 48px = 74px)
   - GLightbox initialization
   - Justified illustration grid layout (baked image dimensions)
============================================================ */

/* ------------------------------------------------------------
   Smooth scroll
------------------------------------------------------------ */
var SCROLL_OFFSET = 48;

document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
});

/* ------------------------------------------------------------
   GLightbox
------------------------------------------------------------ */
GLightbox();

/* ------------------------------------------------------------
   Justified illustration grid
   Dimensions are baked in — must match HTML image order exactly.
   Each entry: [naturalWidth, naturalHeight]
------------------------------------------------------------ */
var ILLO_DIMS = [
  [1650, 2101], // bozz08sm.jpg
  [1458, 1686], // cash07sm.jpg
  [1800, 2250], // coby06.jpg
  [1500, 2250], // derbyPoster18sm.jpg
  [1479, 2100], // doug02sm.jpg
  [2348, 2160], // episodes02sm.jpg
  [1485, 1642], // episodes04sm.jpg
  [2034, 3000], // hader01.jpg
  [1306, 2640], // judith04sm.jpg
  [1500, 1396], // mike03sm.jpg
  [1200, 1500], // momoa04sm.jpg
  [1200, 1500], // parker06sm.jpg
  [1500, 1028], // portlandia13sm.jpg
  [1500, 1665], // rahm15sm.jpg
  [1650, 2100], // rdg05sm.jpg
  [1414, 1800], // rey05sm.jpg
  [1180, 1680], // self11sm.jpg
  [2400, 3000], // skylar02.jpg
  [1000, 1600], // stephenskrivanos11.jpg
  [1200, 1500], // vinnie07sm.jpg
  [1440, 1440], // yuffie04sm.jpg
];

var ILLO_GAP = 6;
var ILLO_TARGET_HEIGHT = 280; // target row height; taller = fewer images per row
var ILLO_MAX_HEIGHT    = 360; // cap: rows that would stretch taller than this left-align instead

function layoutIlloGrid() {
  var grid = document.querySelector('.illo-grid');
  if (!grid) return;

  var links = Array.from(grid.querySelectorAll('a'));

  // Subtract padding so image widths don't overflow the content area
  var cs = getComputedStyle(grid);
  var containerWidth = grid.clientWidth
    - parseFloat(cs.paddingLeft)
    - parseFloat(cs.paddingRight);
  if (containerWidth <= 0) return;

  var aspects = ILLO_DIMS.map(function (d) { return d[0] / d[1]; });

  // Greedy row packing
  var rows = [];
  var i = 0;
  while (i < aspects.length) {
    var row = [i];
    var sumAspects = aspects[i];
    i++;
    while (i < aspects.length) {
      var testWidth = (sumAspects + aspects[i]) * ILLO_TARGET_HEIGHT + row.length * ILLO_GAP;
      if (testWidth > containerWidth) break;
      sumAspects += aspects[i];
      row.push(i);
      i++;
    }
    rows.push({ indices: row, sumAspects: sumAspects });
  }

  // Apply pixel dimensions to each <a>
  rows.forEach(function (row, rowIndex) {
    var isLastRow = rowIndex === rows.length - 1;
    var gapTotal  = (row.indices.length - 1) * ILLO_GAP;

    // Height needed to stretch this row to full container width
    var stretchHeight = (containerWidth - gapTotal) / row.sumAspects;

    // Last row: never stretch (one or two images blown up full-width looks wrong).
    // Any row whose stretch height exceeds the cap: render at cap and left-align.
    // Normal rows: stretch to fill.
    var rowHeight = isLastRow
      ? ILLO_TARGET_HEIGHT
      : Math.min(stretchHeight, ILLO_MAX_HEIGHT);

    row.indices.forEach(function (idx) {
      links[idx].style.width  = (aspects[idx] * rowHeight) + 'px';
      links[idx].style.height = rowHeight + 'px';
    });
  });
}

// Run on load and on resize (debounced)
document.addEventListener('DOMContentLoaded', layoutIlloGrid);

var illoResizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(illoResizeTimer);
  illoResizeTimer = setTimeout(layoutIlloGrid, 100);
});
