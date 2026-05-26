import { buildDependencyGraph } from './layout.js';
import { renderBoard, tileElements } from './board.js';
import { initInfoPanel, highlightDeps, clearHighlights, selectTile } from './info-panel.js';
import { renderTeams, markCompletedTiles } from './teams.js';

// === Page help dialog ===
document.getElementById('page-help-btn').addEventListener('click', function() {
  document.getElementById('page-help-dialog').showModal();
});
document.getElementById('page-help-close').addEventListener('click', function() {
  document.getElementById('page-help-dialog').close();
});
document.getElementById('page-help-dialog').addEventListener('click', function(e) {
  if (e.target === this) this.close();
});

// === Supabase client ===
var SUPABASE_URL = 'https://guopmuftxabughhnllol.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_eAo1MmVKKvz_hjsVQgJzfQ_62lCD-pT';
var supabaseClient = null;

const CSV_FILE = 'ThoseExiles 2026 bingo clarifications - TileClarifications.csv';

function formatCounterValue(val, format) {
  if (format === 'xp' || format === 'gp') {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (val >= 1000) return Math.floor(val / 1000) + 'k';
    return '' + val;
  }
  return '' + val;
}

async function init() {
  // Init Supabase
  try {
    var sbLib = window.supabase;
    if (sbLib && sbLib.createClient) {
      supabaseClient = sbLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    if (!supabaseClient) console.warn('Could not find Supabase createClient');
  } catch (e) {
    console.warn('Supabase init failed:', e);
  }

  // Fetch CSV, sub-items map, and counters config in parallel
  var csvPromise = fetch(CSV_FILE).then(function(r) { return r.text(); });
  var subItemsPromise = fetch('tile-subitems.json').then(function(r) { return r.json(); }).catch(function() { return {}; });
  var countersPromise = fetch('tile-counters.json').then(function(r) { return r.json(); }).catch(function() { return {}; });

  var csvText = await csvPromise;
  var tileSubItems = await subItemsPromise;
  var tileCounters = await countersPromise;

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const allTiles = parsed.data
    .filter(row => row['God'] && row['Tile Name'])
    .map(row => {
      var name = row['Tile Name'].trim();
      return {
        god: row['God'].trim(),
        name: name,
        description: (row['Description'] || '').trim(),
        points: parseInt(row['Points']) || 0,
        unlocks: (row['Unlocks'] || '').trim().replace(/Ascenscion/g, 'Ascension'),
        subItems: tileSubItems[name] || [],
        counter: tileCounters[name] || null,
      };
    });

  const depGraph = buildDependencyGraph(allTiles);

  renderBoard(allTiles, {
    onTileHover: (tile) => highlightDeps(tile),
    onTileLeave: () => clearHighlights(),
    onTileClick: (tile, el) => selectTile(tile, el),
  });

  initInfoPanel({ allTiles, depGraph, teamsData: null });

  // Load teams + completions
  var teamsData = null;

  if (supabaseClient) {
    try {
      var teamsRes = await supabaseClient.from('teams').select('*');
      var compRes = await supabaseClient.from('completions').select('*');

      if (!teamsRes.error && !compRes.error && teamsRes.data) {
        teamsData = { teams: teamsRes.data.map(function(t) {
          return {
            name: t.name, color: t.color, captain: t.captain,
            members: t.members || [], lmsPoints: t.lms_points || 0,
            counters: t.counters || {},
          };
        })};

        var tilePointsMap = {};
        var tileSubItemsMap = {};
        var tileCountersMap = {};
        allTiles.forEach(function(t) {
          tilePointsMap[t.name] = t.points;
          if (t.subItems.length > 0) tileSubItemsMap[t.name] = t.subItems;
          if (t.counter) tileCountersMap[t.name] = t.counter;
        });

        // Build completion details: { tileName: { teamName: [{sub_item, note}, ...] } }
        var completionDetails = {};
        compRes.data.forEach(function(row) {
          if (!completionDetails[row.tile_name]) completionDetails[row.tile_name] = {};
          if (!completionDetails[row.tile_name][row.team_name]) completionDetails[row.tile_name][row.team_name] = [];
          completionDetails[row.tile_name][row.team_name].push({
            sub_item: row.sub_item || '__complete__',
            note: row.note || '',
          });
        });

        // Auto-complete sub-items linked to counters
        var counterSubItems = [
          { tile: "Krystilia's Phone Number", subItem: '50 LMS Points', key: '_lms', getValue: function(t) { return t.lmsPoints || 0; }, target: 50 },
          { tile: 'Ultimate Booty Call', subItem: '120 Telekinetic pts', key: 'mta_telekinetic', target: 120 },
          { tile: 'Ultimate Booty Call', subItem: '120 Alchemist pts', key: 'mta_alchemist', target: 120 },
          { tile: 'Ultimate Booty Call', subItem: '120 Graveyard pts', key: 'mta_graveyard', target: 120 },
          { tile: 'Ultimate Booty Call', subItem: '1200 Enchantment pts', key: 'mta_enchantment', target: 1200 },
        ];
        teamsData.teams.forEach(function(team) {
          counterSubItems.forEach(function(csi) {
            var val = csi.getValue ? csi.getValue(team) : ((team.counters || {})[csi.key] || 0);
            if (val >= csi.target) {
              if (!completionDetails[csi.tile]) completionDetails[csi.tile] = {};
              if (!completionDetails[csi.tile][team.name]) completionDetails[csi.tile][team.name] = [];
              var has = completionDetails[csi.tile][team.name].some(function(c) { return c.sub_item === csi.subItem; });
              if (!has) {
                completionDetails[csi.tile][team.name].push({ sub_item: csi.subItem, note: '' });
              }
            }
          });
        });

        // Store on teamsData for info panel / teams display
        teamsData.completionDetails = completionDetails;
        teamsData.tileSubItems = tileSubItemsMap;
        teamsData.tileCounters = tileCountersMap;
        teamsData.formatCounterValue = formatCounterValue;

        // Compute per-team completed / in-progress tiles
        teamsData.teams.forEach(function(team) {
          team.completedTiles = [];
          team.inProgressTiles = [];
          team.points = 0;

          allTiles.forEach(function(tile) {
            var teamComps = (completionDetails[tile.name] || {})[team.name] || [];
            var subs = tileSubItemsMap[tile.name];
            var counter = tileCountersMap[tile.name];

            if (counter) {
              // Counter-based (team effort) tile
              var val = team.counters[counter.key] || 0;
              var hasSimpleComp = counter.allowSimple && teamComps.some(function(c) { return c.sub_item === '__complete__'; });
              if (val >= counter.target || hasSimpleComp) {
                team.completedTiles.push(tile.name);
                team.points += tile.points;
              } else if (val > 0) {
                team.inProgressTiles.push({
                  name: tile.name,
                  done: val,
                  total: counter.target,
                  format: counter.format,
                });
              }
            } else if (subs) {
              // Multi-item tile: count how many sub-items are done
              var done = 0;
              var compNames = teamComps.map(function(c) { return c.sub_item; });
              subs.forEach(function(s) {
                if (compNames.indexOf(s) !== -1) done++;
              });
              if (done >= subs.length) {
                team.completedTiles.push(tile.name);
                team.points += tile.points;
              } else if (done > 0) {
                team.inProgressTiles.push({ name: tile.name, done: done, total: subs.length });
              }
            } else {
              // Single-item tile: any completion record = done
              if (teamComps.length > 0) {
                team.completedTiles.push(tile.name);
                team.points += tile.points;
              }
            }
          });
        });
      }
    } catch (e) {
      console.warn('Supabase fetch failed:', e);
    }
  }

  if (!teamsData) {
    console.warn('Could not load team data from Supabase');
    return;
  }

  // Update info panel with teams data and render
  initInfoPanel({ allTiles, depGraph, teamsData });
  renderTeams(teamsData);
  markCompletedTiles(teamsData);

  // Tile search
  var searchInput = document.getElementById('tile-search');
  var searchCount = document.getElementById('search-count');
  var searchTimeout = null;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
      var query = searchInput.value.trim().toLowerCase();
      // Clear previous search highlights
      document.querySelectorAll('.tile').forEach(function(el) {
        el.classList.remove('search-match', 'search-dimmed');
      });
      searchCount.textContent = '';

      if (!query || query.length < 2) return;

      var matches = 0;
      allTiles.forEach(function(tile) {
        var el = tileElements[tile.name];
        if (!el) return;
        var haystack = (tile.name + ' ' + tile.description + ' ' + tile.god).toLowerCase();
        if (haystack.indexOf(query) !== -1) {
          el.classList.add('search-match');
          matches++;
        } else {
          el.classList.add('search-dimmed');
        }
      });
      if (matches === 0) {
        document.querySelectorAll('.tile').forEach(function(el) {
          el.classList.add('search-dimmed');
        });
      }
      searchCount.textContent = matches + ' match' + (matches !== 1 ? 'es' : '');
    }, 200);
  });
  // Clear on Escape
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchCount.textContent = '';
      document.querySelectorAll('.tile').forEach(function(el) {
        el.classList.remove('search-match', 'search-dimmed');
      });
    }
  });
}

// Wait for DOM + all scripts to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
