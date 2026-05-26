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
export const RECT_SECTIONS = {
  'Zamorak':             { startRow: 1, startCol: 2, cols: 9, rows: 1 },
  'Zamorak Ascension':   { startRow: 0, startCol: 5, cols: 3, rows: 1 },
  'Seren':               { startRow: 11, startCol: 2, cols: 9, rows: 1 },
  'Seren Ascension':     { startRow: 12, startCol: 5, cols: 3, rows: 1 },
  'Saradomin':           { startRow: 2, startCol: 1, cols: 1, rows: 9 },
  'Saradomin Ascension': { startRow: 5, startCol: 0, cols: 1, rows: 3 },
  'Zaros':               { startRow: 2, startCol: 11, cols: 1, rows: 9 },
  'Zaros Ascension':     { startRow: 5, startCol: 12, cols: 1, rows: 3 },
};

// Guthix: diamond inscribed in the 7x7 center (rows 3-9, cols 3-9), 25 cells
export const GUTHIX_CELLS = [
  [3, 6],
  [4, 5], [4, 6], [4, 7],
  [5, 4], [5, 5], [5, 6], [5, 7], [5, 8],
  [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9],
  [7, 4], [7, 5], [7, 6], [7, 7], [7, 8],
  [8, 5], [8, 6], [8, 7],
  [9, 6],
];

// Corner gods: fill the non-diamond cells of the 7x7 square
export const RALOS_CELLS = [
  [3, 3], [3, 4], [3, 5],
  [4, 3], [4, 4],
  [5, 3],
];

export const BANDOS_CELLS = [
  [3, 7], [3, 8], [3, 9],
  [4, 8], [4, 9],
  [5, 9],
];

export const ARMADYL_CELLS = [
  [7, 3],
  [8, 3], [8, 4],
  [9, 3], [9, 4], [9, 5],
];

export const TUMEKEN_CELLS = [
  [7, 9],
  [8, 8], [8, 9],
  [9, 7], [9, 8], [9, 9],
];

// ZAMAJOHNDAMIX: 4 connecting corners where lines meet
export const ZAMAJOHNDAMIX_CELLS = [
  [1, 1], [1, 11],
  [11, 1], [11, 11],
];

// === Strategic tile placement ===
export const UNLOCK_PLACEMENTS = {
  'Guthix': {
    pinned: [{ name: 'Equilibrium', cell: [6, 6] }],
    byTarget: {
      'Ralos':   [[4, 5], [5, 4], [5, 5]],
      'Bandos':  [[4, 7], [5, 7], [5, 8]],
      'Armadyl': [[7, 4], [7, 5], [8, 5]],
      'Tumeken': [[7, 7], [7, 8], [8, 7]],
    }
  },
  'Armadyl': {
    priorityCells: [[8, 3], [9, 4]],
  },
  'Ralos': {
    priorityCells: [[3, 4], [4, 3]],
  },
  'Bandos': {
    priorityCells: [[3, 8], [4, 9]],
  },
  'Tumeken': {
    priorityCells: [[9, 8], [8, 9]],
  },
  'Saradomin': {
    byTarget: { 'Saradomin Ascension': [[5, 1], [6, 1], [7, 1]] },
  },
  'Zaros': {
    byTarget: { 'Zaros Ascension': [[5, 11], [6, 11], [7, 11]] },
  },
  'Zamorak': {
    byTarget: { 'Zamorak Ascension': [[1, 5], [1, 6], [1, 7]] },
  },
  'Seren': {
    byTarget: { 'Seren Ascension': [[11, 5], [11, 6], [11, 7]] },
  },
};

// Build cell list for each section
export function buildSectionCells() {
  const sections = {};

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

// === Dependency graph ===
export function buildDependencyGraph(tiles) {
  const tileUnlocks = {};
  const godUnlockedBy = {};

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
