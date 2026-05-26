import { GOD_CLASS, GOD_SYMBOL } from './gods.js';
import { buildSectionCells, UNLOCK_PLACEMENTS } from './layout.js';

export let tileElements = {};

export function renderBoard(allTiles, { onTileHover, onTileLeave, onTileClick }) {
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

      el.addEventListener('mouseenter', () => onTileHover(tile));
      el.addEventListener('mouseleave', () => onTileLeave());
      el.addEventListener('click', () => onTileClick(tile, el));

      board.appendChild(el);
      tileElements[tile.name] = el;
    }

    if (tiles.length > cells.length) {
      console.warn(`${god}: ${tiles.length - cells.length} tiles could not be placed`);
    }
  }

  // Render god symbol overlays
  renderGodOverlays(board, sectionCells);
}

function renderGodOverlays(board, sectionCells) {
  var merged = {};
  for (var god in sectionCells) {
    var base = god.replace(' Ascension', '');
    if (!merged[base]) merged[base] = [];
    merged[base] = merged[base].concat(sectionCells[god]);
  }

  for (var godName in merged) {
    var symbolUrl = GOD_SYMBOL[godName];
    if (!symbolUrl) continue;

    var cells = merged[godName];
    var minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;
    cells.forEach(function(c) {
      if (c[0] < minRow) minRow = c[0];
      if (c[0] > maxRow) maxRow = c[0];
      if (c[1] < minCol) minCol = c[1];
      if (c[1] > maxCol) maxCol = c[1];
    });

    var overlay = document.createElement('div');
    overlay.className = 'god-symbol-overlay';
    overlay.style.gridRow = (minRow + 1) + ' / ' + (maxRow + 2);
    overlay.style.gridColumn = (minCol + 1) + ' / ' + (maxCol + 2);
    overlay.style.backgroundImage = 'url(' + symbolUrl + ')';
    board.appendChild(overlay);
  }
}

function placeTilesStrategically(god, tiles, cells) {
  const result = [];
  const usedTiles = new Set();
  const usedCells = new Set();
  const cellKey = (r, c) => r + ',' + c;

  const config = UNLOCK_PLACEMENTS[god];

  // Pass 0: place pinned tiles
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
