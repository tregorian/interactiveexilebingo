import { buildDependencyGraph } from './layout.js';
import { renderBoard } from './board.js';
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

  // Fetch CSV and sub-items map in parallel
  var csvPromise = fetch(CSV_FILE).then(function(r) { return r.text(); });
  var subItemsPromise = fetch('tile-subitems.json').then(function(r) { return r.json(); }).catch(function() { return {}; });

  var csvText = await csvPromise;
  var tileSubItems = await subItemsPromise;

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
          };
        })};

        var tilePointsMap = {};
        var tileSubItemsMap = {};
        allTiles.forEach(function(t) {
          tilePointsMap[t.name] = t.points;
          if (t.subItems.length > 0) tileSubItemsMap[t.name] = t.subItems;
        });

        // Build completion details: { tileName: { teamName: ['sub1', 'sub2'] } }
        var completionDetails = {};
        compRes.data.forEach(function(row) {
          if (!completionDetails[row.tile_name]) completionDetails[row.tile_name] = {};
          if (!completionDetails[row.tile_name][row.team_name]) completionDetails[row.tile_name][row.team_name] = [];
          if (row.sub_item) {
            completionDetails[row.tile_name][row.team_name].push(row.sub_item);
          } else {
            // Legacy record (no sub_item) — marks full tile complete for tiles without sub-items
            completionDetails[row.tile_name][row.team_name].push('__complete__');
          }
        });

        // Inject LMS auto-completions
        teamsData.teams.forEach(function(team) {
          if (team.lmsPoints >= 50) {
            var kpn = "Krystilia's Phone Number";
            if (!completionDetails[kpn]) completionDetails[kpn] = {};
            if (!completionDetails[kpn][team.name]) completionDetails[kpn][team.name] = [];
            if (completionDetails[kpn][team.name].indexOf('50 LMS Points') === -1) {
              completionDetails[kpn][team.name].push('50 LMS Points');
            }
          }
        });

        // Store on teamsData for info panel / teams display
        teamsData.completionDetails = completionDetails;
        teamsData.tileSubItems = tileSubItemsMap;

        // Compute per-team completed / in-progress tiles
        teamsData.teams.forEach(function(team) {
          team.completedTiles = [];
          team.inProgressTiles = [];
          team.points = 0;

          allTiles.forEach(function(tile) {
            var teamComps = (completionDetails[tile.name] || {})[team.name] || [];
            var subs = tileSubItemsMap[tile.name];

            if (subs) {
              // Multi-item tile: count how many sub-items are done
              var done = 0;
              subs.forEach(function(s) {
                if (teamComps.indexOf(s) !== -1) done++;
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
}

// Wait for DOM + all scripts to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
