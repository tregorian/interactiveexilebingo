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

  const response = await fetch(CSV_FILE);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const allTiles = parsed.data
    .filter(row => row['God'] && row['Tile Name'])
    .map(row => ({
      god: row['God'].trim(),
      name: row['Tile Name'].trim(),
      description: (row['Description'] || '').trim(),
      points: parseInt(row['Points']) || 0,
      unlocks: (row['Unlocks'] || '').trim().replace(/Ascenscion/g, 'Ascension'),
    }));

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
          return { name: t.name, color: t.color, captain: t.captain, members: t.members || [] };
        })};

        var tilePointsMap = {};
        allTiles.forEach(function(t) { tilePointsMap[t.name] = t.points; });

        teamsData.teams.forEach(function(team) {
          team.completedTiles = [];
          team.points = 0;
        });

        compRes.data.forEach(function(row) {
          var team = teamsData.teams.filter(function(t) { return t.name === row.team_name; })[0];
          if (!team) return;
          team.completedTiles.push(row.tile_name);
          team.points += tilePointsMap[row.tile_name] || 0;
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
