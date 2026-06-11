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

  document.getElementById('info-close').addEventListener('click', closeInfoPanel);

  // Close panel when clicking background (not a tile or the panel)
  document.addEventListener('click', function(e) {
    if (!selectedTile) return;
    var panel = document.getElementById('info-panel');
    if (panel.contains(e.target)) return;
    if (e.target.closest('.tile')) return;
    closeInfoPanel();
  });
}

function closeInfoPanel() {
  document.getElementById('info-panel').classList.add('hidden');
  selectedTile = null;
  document.querySelectorAll('.tile').forEach(el => {
    el.classList.remove('dep-source', 'dep-target', 'dimmed', 'selected');
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

  // Completion status + sub-items checklist / counter display
  var compEl = document.getElementById('info-completion');
  compEl.innerHTML = '';
  compEl.className = 'info-completion';

  if (teamsDataRef && teamsDataRef.teams) {
    var tileSubItems = (teamsDataRef.tileSubItems || {})[tile.name];
    var tileCounter = (teamsDataRef.tileCounters || {})[tile.name];
    var completionDetails = teamsDataRef.completionDetails || {};
    var tileComps = completionDetails[tile.name] || {};
    var fmt = teamsDataRef.formatCounterValue || function(v) { return '' + v; };

    if (tileCounter) {
      // Counter-based (team effort) tile: show progress bar per team
      teamsDataRef.teams.forEach(function(team) {
        var val = (team.counters || {})[tileCounter.key] || 0;
        var pct = Math.min(100, (val / tileCounter.target) * 100);
        var isDone = val >= tileCounter.target;
        var hasSimple = tileCounter.allowSimple && tileComps[team.name] &&
          tileComps[team.name].some(function(c) { return c.sub_item === '__complete__'; });
        var isComplete = isDone || hasSimple;

        var teamBlock = document.createElement('div');
        teamBlock.className = 'info-sub-team';

        var teamHeader = document.createElement('div');
        teamHeader.className = 'info-sub-team-header';
        var progressText = hasSimple && !isDone
          ? 'Completed (direct)'
          : fmt(val, tileCounter.format) + '/' + fmt(tileCounter.target, tileCounter.format);
        teamHeader.innerHTML = '<span class="team-badge" style="background:' + team.color + '">' +
          escapeHtml(team.name) + '</span> ' +
          '<span class="info-sub-progress' + (isComplete ? ' done' : '') + '">' +
          progressText + '</span>';
        teamBlock.appendChild(teamHeader);

        var barWrap = document.createElement('div');
        barWrap.className = 'info-counter-bar-wrap';
        var barPct = isComplete ? 100 : pct;
        barWrap.innerHTML = '<div class="info-counter-bar" style="width:' + barPct + '%;background:' + (isComplete ? '#6f6' : team.color) + '"></div>';
        teamBlock.appendChild(barWrap);

        if (tileCounter.simpleLabel) {
          var hint = document.createElement('div');
          hint.style.cssText = 'font-size:0.75rem;color:#888;font-style:italic;margin-top:2px;';
          hint.textContent = tileCounter.simpleLabel;
          teamBlock.appendChild(hint);
        }

        // Equilibrium: per-skill XP breakdown (collapsed by default to limit clutter)
        if (tile.name === 'Equilibrium') {
          var eqSkills = (team.counters || {}).equilibrium_skills;
          if (eqSkills && Object.keys(eqSkills).length) {
            var names = Object.keys(eqSkills).sort(function(a, b) {
              return eqSkills[a] - eqSkills[b]; // lowest first — the bottleneck gates the points
            });
            var lowSkill = names[0];

            var details = document.createElement('details');
            details.className = 'eq-skills';

            var summary = document.createElement('summary');
            summary.className = 'eq-skills-summary';
            summary.innerHTML = 'Lowest: <strong>' + capitalize(lowSkill) + '</strong> ' +
              fmt(eqSkills[lowSkill], 'xp') +
              '<span class="eq-skills-toggle"> · all 24 skills</span>';
            details.appendChild(summary);

            var grid = document.createElement('div');
            grid.className = 'eq-skills-grid';
            names.forEach(function(sk) {
              var cell = document.createElement('div');
              cell.className = 'eq-skill' + (sk === lowSkill ? ' low' : '');
              cell.innerHTML = '<span class="eq-skill-name">' + capitalize(sk) + '</span>' +
                '<span class="eq-skill-xp">' + fmt(eqSkills[sk], 'xp') + '</span>';
              grid.appendChild(cell);
            });
            details.appendChild(grid);
            teamBlock.appendChild(details);
          }
        }

        compEl.appendChild(teamBlock);
      });
    } else if (tileSubItems && tileSubItems.length > 0) {
      // Multi-item tile: show checklist per team
      teamsDataRef.teams.forEach(function(team) {
        var teamComps = tileComps[team.name] || [];
        var compMap = {};
        teamComps.forEach(function(c) { compMap[c.sub_item] = c; });
        var doneCount = 0;
        tileSubItems.forEach(function(s) {
          if (compMap[s]) doneCount++;
        });

        var teamBlock = document.createElement('div');
        teamBlock.className = 'info-sub-team';

        // Grouped tiles: show sets completed instead of items
        var groupedTiles = {
          'Brothers Betrayed': {
            required: 2,
            groups: [
              { name: "Ahrim's", items: ["Ahrim's Hood", "Ahrim's Robetop", "Ahrim's Robeskirt", "Ahrim's Staff"] },
              { name: "Dharok's", items: ["Dharok's Helm", "Dharok's Platebody", "Dharok's Platelegs", "Dharok's Greataxe"] },
              { name: "Guthan's", items: ["Guthan's Helm", "Guthan's Platebody", "Guthan's Chainskirt", "Guthan's Warspear"] },
              { name: "Karil's", items: ["Karil's Coif", "Karil's Leathertop", "Karil's Leatherskirt", "Karil's Crossbow"] },
              { name: "Torag's", items: ["Torag's Helm", "Torag's Platebody", "Torag's Platelegs", "Torag's Hammers"] },
              { name: "Verac's", items: ["Verac's Helm", "Verac's Brassard", "Verac's Plateskirt", "Verac's Flail"] },
            ]
          }
        };
        var grouped = groupedTiles[tile.name];

        var teamHeader = document.createElement('div');
        teamHeader.className = 'info-sub-team-header';
        if (grouped) {
          var setsComplete = 0;
          grouped.groups.forEach(function(g) {
            if (g.items.every(function(i) { return !!compMap[i]; })) setsComplete++;
          });
          teamHeader.innerHTML = '<span class="team-badge" style="background:' + team.color + '">' +
            escapeHtml(team.name) + '</span> ' +
            '<span class="info-sub-progress' + (setsComplete >= grouped.required ? ' done' : '') + '">' +
            setsComplete + '/' + grouped.required + ' sets</span>';
        } else {
          teamHeader.innerHTML = '<span class="team-badge" style="background:' + team.color + '">' +
            escapeHtml(team.name) + '</span> ' +
            '<span class="info-sub-progress">' + doneCount + '/' + tileSubItems.length + '</span>';
        }
        teamBlock.appendChild(teamHeader);

        var list = document.createElement('div');
        list.className = 'info-sub-list' + (grouped ? ' info-sub-list-grouped' : '');

        tileSubItems.forEach(function(subItem, idx) {
          // Insert group header for grouped tiles
          if (grouped) {
            for (var gi = 0; gi < grouped.groups.length; gi++) {
              var g = grouped.groups[gi];
              if (g.items[0] === subItem) {
                var groupDone = g.items.every(function(i) { return !!compMap[i]; });
                var groupCount = g.items.filter(function(i) { return !!compMap[i]; }).length;
                var gh = document.createElement('div');
                gh.className = 'info-sub-group-header' + (groupDone ? ' done' : '');
                gh.textContent = g.name + ' (' + groupCount + '/' + g.items.length + ')';
                list.appendChild(gh);
              }
            }
          }
          var comp = compMap[subItem];
          var done = !!comp;
          var item = document.createElement('div');
          item.className = 'info-sub-item' + (done ? ' done' : '');

          var check = '<span class="info-sub-check">' + (done ? '\u2713' : '\u2717') + '</span> ';
          // Counter-linked sub-items
          var counterLinks = {
            '50 LMS Points': { getValue: function(t) { return t.lmsPoints || 0; }, target: 50 },
            '120 Telekinetic pts': { key: 'mta_telekinetic', target: 120 },
            '120 Alchemist pts': { key: 'mta_alchemist', target: 120 },
            '120 Graveyard pts': { key: 'mta_graveyard', target: 120 },
            '1200 Enchantment pts': { key: 'mta_enchantment', target: 1200 },
            '8,600 Mox Resin': { key: 'goggles_mox', target: 8600 },
            '7,000 Aga Resin': { key: 'goggles_aga', target: 7000 },
            '9,350 Lye Resin': { key: 'goggles_lye', target: 9350 },
          };
          var cLink = counterLinks[subItem];
          if (cLink) {
            var cVal = cLink.getValue ? cLink.getValue(team) : ((team.counters || {})[cLink.key] || 0);
            var cText = subItem + ' (' + cVal + '/' + cLink.target + ')';
            item.innerHTML = check + escapeHtml(cText);
          } else if (done && comp.note) {
            item.innerHTML = check + escapeHtml(subItem) + ' <span class="info-sub-note">(' + escapeHtml(comp.note) + ')</span>';
          } else {
            item.innerHTML = check + escapeHtml(subItem);
          }
          list.appendChild(item);
        });

        teamBlock.appendChild(list);
        compEl.appendChild(teamBlock);
      });
    } else {
      // Single-item tile: show completed-by badges (original behavior)
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
  }
  compEl.style.display = 'block';

  panel.classList.remove('hidden');

  // Disabled per user feedback — panel overlays on top of board instead of pushing content
  // requestAnimationFrame(function() {
  //   var panelHeight = panel.offsetHeight;
  //   document.querySelector('main').style.paddingBottom = (panelHeight + 16) + 'px';
  //   if (el) {
  //     var tileRect = el.getBoundingClientRect();
  //     var panelTop = window.innerHeight - panelHeight;
  //     if (tileRect.bottom > panelTop) {
  //       window.scrollBy({ top: tileRect.bottom - panelTop + 20, behavior: 'smooth' });
  //     }
  //   }
  // });
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function capitalize(s) {
  s = '' + (s || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
