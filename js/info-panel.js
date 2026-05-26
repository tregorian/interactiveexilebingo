import { GOD_SYMBOL, GOD_BG_COLOR, GOD_CLASS } from './gods.js';
import { tileElements } from './board.js';

let selectedTile = null;
let allTilesRef = [];
let depGraphRef = {};
let teamsDataRef = null;

export function initInfoPanel({ allTiles, depGraph, teamsData }) {
  allTilesRef = allTiles;
  depGraphRef = depGraph;
  teamsDataRef = teamsData;

  document.getElementById('info-close').addEventListener('click', () => {
    document.getElementById('info-panel').classList.add('hidden');
    selectedTile = null;
    document.querySelectorAll('.tile').forEach(el => {
      el.classList.remove('dep-source', 'dep-target', 'dimmed', 'selected');
    });
  });
}

export function updateTeamsData(teamsData) {
  teamsDataRef = teamsData;
}

export function highlightDeps(tile) {
  if (selectedTile) return;

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

export function clearHighlights() {
  if (selectedTile) return;
  document.querySelectorAll('.tile').forEach(el => {
    el.classList.remove('dep-source', 'dep-target', 'dimmed');
  });
}

export function selectTile(tile, el) {
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

  // Highlight tiles that unlock THIS tile's god section (reverse dependency)
  const tilesUnlockingThisGod = depGraphRef.godUnlockedBy[tile.god];
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

  // God color + symbol on panel
  var godColor = GOD_BG_COLOR[tile.god] || '#444';
  panel.style.setProperty('--info-god-color', godColor);
  panel.style.background = 'linear-gradient(135deg, ' + godColor + '33 0%, #1a1a2e 30%)';

  var symbolImg = document.getElementById('info-god-symbol');
  if (GOD_SYMBOL[tile.god]) {
    symbolImg.src = GOD_SYMBOL[tile.god];
    symbolImg.style.display = 'block';
  } else {
    symbolImg.style.display = 'none';
  }

  const unlocksEl = document.getElementById('info-unlocks');
  if (tile.unlocks) {
    unlocksEl.textContent = 'Unlocks: ' + tile.unlocks;
    unlocksEl.style.display = 'block';
  } else {
    unlocksEl.style.display = 'none';
  }

  // Requirements (which tiles unlock this god section)
  var reqEl = document.getElementById('info-requirements');
  reqEl.innerHTML = '';
  var unlockers = depGraphRef.godUnlockedBy[tile.god];
  if (unlockers && unlockers.length > 0) {
    var label = document.createElement('span');
    label.className = 'req-label';
    label.textContent = 'Requires: ';
    reqEl.appendChild(label);

    unlockers.forEach(function(srcName) {
      var btn = document.createElement('span');
      btn.className = 'info-req-tile';
      btn.textContent = srcName;
      btn.addEventListener('click', function() {
        var srcEl = tileElements[srcName];
        var srcTile = allTilesRef.filter(function(t) { return t.name === srcName; })[0];
        if (srcEl && srcTile) {
          selectTile(srcTile, srcEl);
          srcEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      reqEl.appendChild(btn);
    });
    reqEl.style.display = 'block';
  } else {
    reqEl.style.display = 'none';
  }

  // Completion status
  var compEl = document.getElementById('info-completion');
  compEl.innerHTML = '';
  compEl.className = 'info-completion';
  if (teamsDataRef && teamsDataRef.teams) {
    var completedBy = teamsDataRef.teams.filter(function(t) {
      return t.completedTiles && t.completedTiles.indexOf(tile.name) !== -1;
    });
    if (completedBy.length > 0) {
      var text = 'Completed by: ';
      compEl.innerHTML = text + completedBy.map(function(t) {
        return '<span class="team-badge" style="background:' + t.color + '">' + t.name + '</span>';
      }).join(' ');
    } else {
      compEl.className = 'info-completion info-completion-none';
      compEl.textContent = 'Not yet completed';
    }
  }
  compEl.style.display = 'block';

  panel.classList.remove('hidden');
}
