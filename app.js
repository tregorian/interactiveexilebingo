// === God color CSS class mapping ===
const GOD_CLASS = {
  'Guthix': 'god-guthix',
  'Armadyl': 'god-armadyl',
  'Bandos': 'god-bandos',
  'Saradomin': 'god-saradomin',
  'Saradomin Ascension': 'god-saradomin-ascension',
  'Seren': 'god-seren',
  'Seren Ascension': 'god-seren-ascension',
  'Zamorak': 'god-zamorak',
  'Zamorak Ascension': 'god-zamorak-ascension',
  'Zaros': 'god-zaros',
  'Zaros Ascension': 'god-zaros-ascension',
  'Tumeken': 'god-tumeken',
  'Ralos': 'god-ralos',
  'ZAMAJOHNDAMIX': 'god-zamajohndamix',
};

// === Board layout: section definitions ===
// Grid: 13 cols (0-12) x 13 rows (0-12)
//
// Layout overview (. = gap, G = Guthix diamond, R/B/T/A = corner gods):
//
//  0   1   2   3   4   5   6   7   8   9  10  11  12
//  .  .   .   .   .  ZA  ZA  ZA   .   .   .   .   .   row 0  (Zammy Ascension centered)
//  .  X  Zm  Zm  Zm  Zm  Zm  Zm  Zm  Zm  Zm   X   .   row 1  (Zamorak line + ZAMAJOHNDAMIX corners)
//  . Sa   .   .   .   .   .   .   .   .   .  Zr   .   row 2  (gap row, sides continue)
//  . Sa   .   R   R   R   G   B   B   B   .  Zr   .   row 3  (7x7 starts)
//  . Sa   .   R   R   G   G   G   B   B   .  Zr   .   row 4
// SaA Sa   .   R   G   G   G   G   G   B   .  Zr ZrA   row 5
// SaA Sa   .   G   G   G   G   G   G   G   .  Zr ZrA   row 6  (widest diamond row)
// SaA Sa   .   A   G   G   G   G   G   T   .  Zr ZrA   row 7
//  . Sa   .   A   A   G   G   G   T   T   .  Zr   .   row 8
//  . Sa   .   A   A   A   G   T   T   T   .  Zr   .   row 9  (7x7 ends)
//  . Sa   .   .   .   .   .   .   .   .   .  Zr   .   row 10 (gap row, sides continue)
//  .  X  Se  Se  Se  Se  Se  Se  Se  Se  Se   X   .   row 11 (Seren line + ZAMAJOHNDAMIX corners)
//  .  .   .   .   .  SeA SeA SeA  .   .   .   .   .   row 12 (Seren Ascension centered)

// Lines: single-tile-wide lines connecting the ZAMAJOHNDAMIX corners
const RECT_SECTIONS = {
  // Zamorak: top horizontal line (row 1, cols 2-10)
  'Zamorak':             { startRow: 1, startCol: 2, cols: 9, rows: 1 },
  // Zamorak Ascension: 1 step outward, centered (row 0, cols 5-7)
  'Zamorak Ascension':   { startRow: 0, startCol: 5, cols: 3, rows: 1 },
  // Seren: bottom horizontal line (row 11, cols 2-10)
  'Seren':               { startRow: 11, startCol: 2, cols: 9, rows: 1 },
  // Seren Ascension: 1 step outward, centered (row 12, cols 5-7)
  'Seren Ascension':     { startRow: 12, startCol: 5, cols: 3, rows: 1 },
  // Saradomin: left vertical line (col 1, rows 2-10)
  'Saradomin':           { startRow: 2, startCol: 1, cols: 1, rows: 9 },
  // Saradomin Ascension: 1 step outward, centered (col 0, rows 5-7)
  'Saradomin Ascension': { startRow: 5, startCol: 0, cols: 1, rows: 3 },
  // Zaros: right vertical line (col 11, rows 2-10)
  'Zaros':               { startRow: 2, startCol: 11, cols: 1, rows: 9 },
  // Zaros Ascension: 1 step outward, centered (col 12, rows 5-7)
  'Zaros Ascension':     { startRow: 5, startCol: 12, cols: 1, rows: 3 },
};

// Guthix: diamond inscribed in the 7x7 center (rows 3-9, cols 3-9), 25 cells
const GUTHIX_CELLS = [
  [3, 6],
  [4, 5], [4, 6], [4, 7],
  [5, 4], [5, 5], [5, 6], [5, 7], [5, 8],
  [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9],
  [7, 4], [7, 5], [7, 6], [7, 7], [7, 8],
  [8, 5], [8, 6], [8, 7],
  [9, 6],
];

// Corner gods: fill the non-diamond cells of the 7x7 square
// Ralos (top-left corner of 7x7)
const RALOS_CELLS = [
  [3, 3], [3, 4], [3, 5],
  [4, 3], [4, 4],
  [5, 3],
];
// Bandos (top-right corner of 7x7)
const BANDOS_CELLS = [
  [3, 7], [3, 8], [3, 9],
  [4, 8], [4, 9],
  [5, 9],
];
// Armadyl (bottom-left corner of 7x7)
const ARMADYL_CELLS = [
  [7, 3],
  [8, 3], [8, 4],
  [9, 3], [9, 4], [9, 5],
];
// Tumeken (bottom-right corner of 7x7)
const TUMEKEN_CELLS = [
  [7, 9],
  [8, 8], [8, 9],
  [9, 7], [9, 8], [9, 9],
];

// ZAMAJOHNDAMIX: 4 connecting corners where lines meet
const ZAMAJOHNDAMIX_CELLS = [
  [1, 1], [1, 11],
  [11, 1], [11, 11],
];

// Build cell list for each section
function buildSectionCells() {
  const sections = {};

  // Rectangular sections
  for (const [god, def] of Object.entries(RECT_SECTIONS)) {
    const cells = [];
    for (let r = def.startRow; r < def.startRow + def.rows; r++) {
      for (let c = def.startCol; c < def.startCol + def.cols; c++) {
        cells.push([r, c]);
      }
    }
    sections[god] = cells;
  }

  sections['Guthix'] = GUTHIX_CELLS;
  sections['ZAMAJOHNDAMIX'] = ZAMAJOHNDAMIX_CELLS;
  sections['Ralos'] = RALOS_CELLS;
  sections['Bandos'] = BANDOS_CELLS;
  sections['Tumeken'] = TUMEKEN_CELLS;
  sections['Armadyl'] = ARMADYL_CELLS;

  return sections;
}

// === Strategic tile placement ===
// Tiles with unlocks are placed at cells adjacent to/facing the god they unlock.
// For Guthix: unlock tiles go at the 3 cells that "complete the square" with that corner god.
// For corner gods: unlock tiles face the adjacent side-line god.
// For side gods: unlock tiles go at the cells aligned with their ascension tiles.
const UNLOCK_PLACEMENTS = {
  'Guthix': {
    pinned: [{ name: 'Equilibrium', cell: [6, 6] }],  // center of diamond
    byTarget: {
      'Ralos':   [[4, 5], [5, 4], [5, 5]],   // cells completing Ralos's square
      'Bandos':  [[4, 7], [5, 7], [5, 8]],   // cells completing Bandos's square
      'Armadyl': [[7, 4], [7, 5], [8, 5]],   // cells completing Armadyl's square
      'Tumeken': [[7, 7], [7, 8], [8, 7]],   // cells completing Tumeken's square
    }
  },
  'Armadyl': {
    // Bottom-left corner: unlock tiles face Saradomin (left) and Seren (bottom)
    priorityCells: [[8, 3], [9, 4]],  // left-facing, center-bottom
  },
  'Ralos': {
    // Top-left corner: unlock tiles face Zamorak (top) and Saradomin (left)
    priorityCells: [[3, 4], [4, 3]],  // center of top edge, center of left edge
  },
  'Bandos': {
    // Top-right corner: unlock tiles face Zamorak (top) and Zaros (right)
    priorityCells: [[3, 8], [4, 9]],  // center of top edge, center of right edge
  },
  'Tumeken': {
    // Bottom-right corner: unlock tiles face Seren (bottom) and Zaros (right)
    priorityCells: [[9, 8], [8, 9]],  // center of bottom edge, center of right edge
  },
  'Saradomin': {
    // Tiles unlocking Saradomin Ascension → aligned with ascension (col 0, rows 5-7)
    byTarget: { 'Saradomin Ascension': [[5, 1], [6, 1], [7, 1]] },
  },
  'Zaros': {
    // Tiles unlocking Zaros Ascension → aligned with ascension (col 12, rows 5-7)
    byTarget: { 'Zaros Ascension': [[5, 11], [6, 11], [7, 11]] },
  },
  'Zamorak': {
    // Tiles unlocking Zamorak Ascension → aligned with ascension (row 0, cols 5-7)
    byTarget: { 'Zamorak Ascension': [[1, 5], [1, 6], [1, 7]] },
  },
  'Seren': {
    // Tiles unlocking Seren Ascension → aligned with ascension (row 12, cols 5-7)
    byTarget: { 'Seren Ascension': [[11, 5], [11, 6], [11, 7]] },
  },
};

// === Dependency graph ===
// Build a map: tile name → { unlockGods: string[], god: string }
// And reverse: god → tiles that unlock it
function buildDependencyGraph(tiles) {
  const tileUnlocks = {}; // tileName → [godName, ...]
  const godUnlockedBy = {}; // godName → [tileName, ...]

  for (const tile of tiles) {
    if (tile.unlocks) {
      const gods = tile.unlocks.split('/').map(g => g.trim()).filter(Boolean);
      tileUnlocks[tile.name] = gods;
      for (const god of gods) {
        if (!godUnlockedBy[god]) godUnlockedBy[god] = [];
        godUnlockedBy[god].push(tile.name);
      }
    }
  }

  return { tileUnlocks, godUnlockedBy };
}

// === Main ===
const CSV_FILE = 'ThoseExiles 2026 bingo clarifications - TileClarifications.csv';
let allTiles = [];
let tileElements = {}; // tileName → DOM element
let selectedTile = null;
let depGraph = {};

async function init() {
  const response = await fetch(CSV_FILE);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  allTiles = parsed.data
    .filter(row => row['God'] && row['Tile Name'])
    .map(row => ({
      god: row['God'].trim(),
      name: row['Tile Name'].trim(),
      description: (row['Description'] || '').trim(),
      points: parseInt(row['Points']) || 0,
      unlocks: (row['Unlocks'] || '').trim().replace(/Ascenscion/g, 'Ascension'),
    }));

  depGraph = buildDependencyGraph(allTiles);
  renderBoard();
  setupInfoPanel();
}

function renderBoard() {
  const board = document.getElementById('board');
  const sectionCells = buildSectionCells();

  // Group tiles by god
  const tilesByGod = {};
  for (const tile of allTiles) {
    if (!tilesByGod[tile.god]) tilesByGod[tile.god] = [];
    tilesByGod[tile.god].push(tile);
  }

  // Place tiles into their section cells using strategic placement
  for (const [god, cells] of Object.entries(sectionCells)) {
    const tiles = tilesByGod[god] || [];
    const placement = placeTilesStrategically(god, tiles, cells);

    for (const { tile, cell } of placement) {
      const [row, col] = cell;

      const el = document.createElement('div');
      el.className = `tile ${GOD_CLASS[god] || ''}`;
      el.style.gridRow = row + 1;
      el.style.gridColumn = col + 1;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'tile-name';
      nameSpan.textContent = tile.name;
      el.appendChild(nameSpan);

      const ptsSpan = document.createElement('span');
      ptsSpan.className = 'tile-points';
      ptsSpan.textContent = tile.points + 'pt';
      el.appendChild(ptsSpan);

      if (tile.unlocks) {
        const unlockIcon = document.createElement('span');
        unlockIcon.className = 'tile-unlock-icon';
        unlockIcon.textContent = '\u{1F513}';
        el.appendChild(unlockIcon);
      }

      el.dataset.tileName = tile.name;
      el.dataset.god = tile.god;

      el.addEventListener('mouseenter', () => highlightDeps(tile, false));
      el.addEventListener('mouseleave', () => clearHighlights());
      el.addEventListener('click', () => selectTile(tile, el));

      board.appendChild(el);
      tileElements[tile.name] = el;
    }

    if (tiles.length > cells.length) {
      console.warn(`${god}: ${tiles.length - cells.length} tiles could not be placed`);
    }
  }
}

function placeTilesStrategically(god, tiles, cells) {
  const result = [];
  const usedTiles = new Set();
  const usedCells = new Set();
  const cellKey = (r, c) => r + ',' + c;

  const config = UNLOCK_PLACEMENTS[god];

  // Pass 0: place pinned tiles (specific tile name → specific cell)
  if (config && config.pinned) {
    for (var p = 0; p < config.pinned.length; p++) {
      var pin = config.pinned[p];
      var pinTile = tiles.filter(function(t) { return t.name === pin.name; })[0];
      if (pinTile) {
        result.push({ tile: pinTile, cell: pin.cell });
        usedTiles.add(pinTile.name);
        usedCells.add(cellKey(pin.cell[0], pin.cell[1]));
      }
    }
  }

  // Pass 1: place tiles by unlock target at specific cells
  if (config && config.byTarget) {
    for (const [target, targetCells] of Object.entries(config.byTarget)) {
      const matching = tiles.filter(function(t) {
        return !usedTiles.has(t.name) && t.unlocks && t.unlocks.indexOf(target) !== -1;
      });
      for (var i = 0; i < targetCells.length && i < matching.length; i++) {
        result.push({ tile: matching[i], cell: targetCells[i] });
        usedTiles.add(matching[i].name);
        usedCells.add(cellKey(targetCells[i][0], targetCells[i][1]));
      }
    }
  }

  // Pass 2: place tiles with any unlock at priority cells
  if (config && config.priorityCells) {
    var unlockTiles = tiles.filter(function(t) {
      return !usedTiles.has(t.name) && t.unlocks;
    });
    for (var j = 0; j < config.priorityCells.length && j < unlockTiles.length; j++) {
      result.push({ tile: unlockTiles[j], cell: config.priorityCells[j] });
      usedTiles.add(unlockTiles[j].name);
      usedCells.add(cellKey(config.priorityCells[j][0], config.priorityCells[j][1]));
    }
  }

  // Pass 3: fill remaining cells with remaining tiles (sorted by points desc)
  var remaining = tiles
    .filter(function(t) { return !usedTiles.has(t.name); })
    .sort(function(a, b) { return b.points - a.points; });
  var remainCells = cells.filter(function(c) { return !usedCells.has(cellKey(c[0], c[1])); });

  for (var k = 0; k < remainCells.length && k < remaining.length; k++) {
    result.push({ tile: remaining[k], cell: remainCells[k] });
  }

  return result;
}

function highlightDeps(tile, persistent) {
  if (selectedTile) return; // don't override click highlight with hover

  const allTileEls = document.querySelectorAll('.tile');

  if (!tile.unlocks) return;

  const unlockGods = tile.unlocks.split('/').map(g => g.trim());
  let hasTargets = false;

  allTileEls.forEach(el => {
    const elGod = el.dataset.god;
    if (el.dataset.tileName === tile.name) {
      el.classList.add('dep-source');
    } else if (unlockGods.includes(elGod)) {
      el.classList.add('dep-target');
      hasTargets = true;
    } else {
      el.classList.add('dimmed');
    }
  });

  if (!hasTargets) {
    allTileEls.forEach(el => el.classList.remove('dimmed'));
  }
}

function clearHighlights() {
  if (selectedTile) return;
  document.querySelectorAll('.tile').forEach(el => {
    el.classList.remove('dep-source', 'dep-target', 'dimmed');
  });
}

function selectTile(tile, el) {
  const panel = document.getElementById('info-panel');

  // Deselect if clicking the same tile
  if (selectedTile === tile.name) {
    selectedTile = null;
    el.classList.remove('selected');
    panel.classList.add('hidden');
    document.querySelectorAll('.tile').forEach(e => {
      e.classList.remove('dep-source', 'dep-target', 'dimmed', 'selected');
    });
    return;
  }

  // Clear previous selection
  selectedTile = tile.name;
  document.querySelectorAll('.tile').forEach(e => {
    e.classList.remove('dep-source', 'dep-target', 'dimmed', 'selected');
  });
  el.classList.add('selected');

  // Show dependency highlights (persistent)
  if (tile.unlocks) {
    const unlockGods = tile.unlocks.split('/').map(g => g.trim());
    document.querySelectorAll('.tile').forEach(e => {
      if (e.dataset.tileName === tile.name) {
        e.classList.add('dep-source');
      } else if (unlockGods.includes(e.dataset.god)) {
        e.classList.add('dep-target');
      } else {
        e.classList.add('dimmed');
      }
    });
  }

  // Also highlight tiles that unlock THIS tile's god section
  // (reverse dependency: which tiles are needed to reach this god?)
  const tilesUnlockingThisGod = depGraph.godUnlockedBy[tile.god];
  if (tilesUnlockingThisGod) {
    for (const srcName of tilesUnlockingThisGod) {
      const srcEl = tileElements[srcName];
      if (srcEl) {
        srcEl.classList.remove('dimmed');
        srcEl.classList.add('dep-source');
      }
    }
  }

  // Update info panel
  document.getElementById('info-god').textContent = tile.god;
  document.getElementById('info-god').className = `info-god ${GOD_CLASS[tile.god] || ''}`;
  document.getElementById('info-points').textContent = tile.points + ' points';
  document.getElementById('info-name').textContent = tile.name;
  document.getElementById('info-desc').textContent = tile.description;

  const unlocksEl = document.getElementById('info-unlocks');
  if (tile.unlocks) {
    unlocksEl.textContent = 'Unlocks: ' + tile.unlocks;
    unlocksEl.style.display = 'block';
  } else {
    unlocksEl.style.display = 'none';
  }

  panel.classList.remove('hidden');
}

function setupInfoPanel() {
  document.getElementById('info-close').addEventListener('click', () => {
    document.getElementById('info-panel').classList.add('hidden');
    selectedTile = null;
    document.querySelectorAll('.tile').forEach(el => {
      el.classList.remove('dep-source', 'dep-target', 'dimmed', 'selected');
    });
  });
}

init();
