import { tileElements } from './board.js';
import { showPlayerCard, hidePlayerCard } from './player-cards.js';

// SVG connector line
var connectorSvg = null;
function ensureConnectorSvg() {
  if (connectorSvg) return connectorSvg;
  connectorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  connectorSvg.setAttribute('class', 'connector-svg');
  document.body.appendChild(connectorSvg);
  return connectorSvg;
}

function showConnector(sourceEl, tileName, color) {
  var targetEl = tileElements[tileName];
  if (!targetEl) return;

  var svg = ensureConnectorSvg();
  svg.style.display = 'block';
  svg.innerHTML = '';

  var srcRect = sourceEl.getBoundingClientRect();
  var tgtRect = targetEl.getBoundingClientRect();

  var sx = srcRect.left < tgtRect.left ? srcRect.right : srcRect.left;
  var sy = srcRect.top + srcRect.height / 2;
  var tx = tgtRect.left + tgtRect.width / 2;
  var ty = tgtRect.top + tgtRect.height / 2;

  var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', sx);
  line.setAttribute('y1', sy);
  line.setAttribute('x2', tx);
  line.setAttribute('y2', ty);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '6,4');
  line.setAttribute('opacity', '0.7');
  svg.appendChild(line);

  // Dot on the board tile
  var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', tx);
  dot.setAttribute('cy', ty);
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', color);
  dot.setAttribute('opacity', '0.9');
  svg.appendChild(dot);

  targetEl.classList.add('connector-highlight');
  targetEl.style.setProperty('--connector-color', color);
}

function hideConnector() {
  if (connectorSvg) {
    connectorSvg.style.display = 'none';
    connectorSvg.innerHTML = '';
  }
  document.querySelectorAll('.connector-highlight').forEach(function(el) {
    el.classList.remove('connector-highlight');
  });
}

function addTileHover(el, tileName, color) {
  el.addEventListener('mouseenter', function() { showConnector(el, tileName, color); });
  el.addEventListener('mouseleave', hideConnector);
}

export function renderTeams(teamsData) {
  if (!teamsData || !teamsData.teams) return;
  var panels = [
    document.getElementById('team-panel-left'),
    document.getElementById('team-panel-right'),
  ];
  var tileCounters = teamsData.tileCounters || {};
  var fmt = teamsData.formatCounterValue || function(v) { return '' + v; };

  // Setup dialog close
  var dialog = document.getElementById('team-stats-dialog');
  var closeBtn = document.getElementById('team-stats-close');
  if (closeBtn && !closeBtn._bound) {
    closeBtn._bound = true;
    closeBtn.addEventListener('click', function() { dialog.close(); });
    dialog.addEventListener('click', function(e) { if (e.target === dialog) dialog.close(); });
  }

  teamsData.teams.forEach(function(team, idx) {
    var panel = panels[idx];
    if (!panel) return;

    panel.style.borderColor = team.color;

    // Header
    var header = document.createElement('div');
    header.className = 'team-header';
    header.style.borderBottomColor = team.color;

    var nameRow = document.createElement('div');
    nameRow.className = 'team-name-row';
    nameRow.style.color = team.color;
    nameRow.title = 'View team effort stats';
    nameRow.innerHTML = '<span class="team-name">' + escapeHtml(team.name) + '</span> <span class="team-stats-icon">\uD83D\uDD0D</span>';
    nameRow.addEventListener('click', function() {
      openTeamStats(team, tileCounters, fmt);
    });

    header.appendChild(nameRow);

    var pts = document.createElement('span');
    pts.className = 'team-points';
    pts.style.color = team.color;
    pts.textContent = team.points + ' pts';
    header.appendChild(pts);

    panel.appendChild(header);

    // Members
    var membersTitle = document.createElement('div');
    membersTitle.className = 'team-section-title';
    membersTitle.textContent = 'Roster (' + team.members.length + ')';
    panel.appendChild(membersTitle);

    team.members.forEach(function(member) {
      var el = document.createElement('a');
      el.className = 'team-member';
      if (member === team.captain) el.className += ' captain';
      el.textContent = member;
      el.href = 'https://wiseoldman.net/players/' + encodeURIComponent(member) + '/gained?metric=overall&startDate=2026-06-06T14%3A00%3A00.000Z&endDate=2026-06-23T14%3A00%3A00.000Z';
      el.target = '_blank';
      el.rel = 'noopener';
      el.addEventListener('mouseenter', function(e) { showPlayerCard(member, e); });
      el.addEventListener('mouseleave', hidePlayerCard);
      panel.appendChild(el);
    });

    // In-progress tiles
    if (team.inProgressTiles && team.inProgressTiles.length > 0) {
      var progTitle = document.createElement('div');
      progTitle.className = 'team-section-title';
      progTitle.textContent = 'In Progress (' + team.inProgressTiles.length + ')';
      panel.appendChild(progTitle);

      team.inProgressTiles.forEach(function(prog) {
        var el = document.createElement('div');
        el.className = 'in-progress-tile';
        el.style.borderLeft = '3px solid ' + team.color;
        var doneStr = prog.format ? fmt(prog.done, prog.format) : '' + prog.done;
        var totalStr = prog.format ? fmt(prog.total, prog.format) : '' + prog.total;
        el.innerHTML = '<span class="ip-name">' + escapeHtml(prog.name) + '</span>' +
          '<span class="ip-progress">' + doneStr + '/' + totalStr + '</span>';
        addTileHover(el, prog.name, team.color);
        panel.appendChild(el);
      });
    }

    // Completed tiles
    if (team.completedTiles && team.completedTiles.length > 0) {
      var compTitle = document.createElement('div');
      compTitle.className = 'team-section-title';
      compTitle.textContent = 'Completed (' + team.completedTiles.length + ')';
      panel.appendChild(compTitle);

      team.completedTiles.forEach(function(tileName) {
        var el = document.createElement('div');
        el.className = 'completed-tile';
        el.textContent = tileName;
        el.style.borderLeft = '3px solid ' + team.color;
        addTileHover(el, tileName, team.color);
        panel.appendChild(el);
      });
    }
  });
}

function openTeamStats(team, tileCounters, fmt) {
  var dialog = document.getElementById('team-stats-dialog');
  var nameEl = document.getElementById('team-stats-name');
  var body = document.getElementById('team-stats-body');

  nameEl.textContent = team.name + ' — Team Effort Stats';
  nameEl.style.color = team.color;
  body.innerHTML = '';

  // LMS Points
  var lmsRow = document.createElement('div');
  lmsRow.className = 'stats-row';
  var lmsDone = (team.lmsPoints || 0) >= 50;
  lmsRow.innerHTML =
    '<span class="stats-label">LMS Points</span>' +
    '<span class="stats-bar-wrap"><span class="stats-bar" style="width:' + Math.min(100, ((team.lmsPoints || 0) / 50) * 100) + '%;background:' + (lmsDone ? '#6f6' : team.color) + '"></span></span>' +
    '<span class="stats-value' + (lmsDone ? ' done' : '') + '">' + (team.lmsPoints || 0) + '/50</span>';
  body.appendChild(lmsRow);

  // All counter-based tiles
  var counterNames = Object.keys(tileCounters);
  counterNames.forEach(function(tileName) {
    var cfg = tileCounters[tileName];

    var val = (team.counters || {})[cfg.key] || 0;
    var pct = Math.min(100, (val / cfg.target) * 100);
    var isDone = val >= cfg.target;

    var row = document.createElement('div');
    row.className = 'stats-row';
    var valStr = fmt(val, cfg.format) + '/' + fmt(cfg.target, cfg.format);
    row.innerHTML =
      '<span class="stats-label">' + escapeHtml(cfg.label) + '</span>' +
      '<span class="stats-bar-wrap"><span class="stats-bar" style="width:' + pct + '%;background:' + (isDone ? '#6f6' : team.color) + '"></span></span>' +
      '<span class="stats-value' + (isDone ? ' done' : '') + '">' + valStr + '</span>';
    body.appendChild(row);
  });

  dialog.showModal();
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

export function clearCompletionStyles() {
  for (var name in tileElements) {
    var el = tileElements[name];
    el.classList.remove('completed-single', 'completed-both', 'in-progress', 'section-locked');
    el.style.removeProperty('--team-color');
    el.style.removeProperty('--team-color-1');
    el.style.removeProperty('--team-color-2');
    el.title = '';
    var badge = el.querySelector('.tile-progress-badge');
    if (badge) badge.remove();
    var lockIcon = el.querySelector('.tile-lock-icon');
    if (lockIcon) lockIcon.remove();
  }
}

export function markCompletedTiles(teamsData, viewMode, depGraph) {
  if (!teamsData || !teamsData.teams) return;

  clearCompletionStyles();

  var fmt = teamsData.formatCounterValue || function(v) { return '' + v; };
  var filterTeam = null;

  if (viewMode && viewMode !== 'neutral') {
    filterTeam = teamsData.teams.find(function(t) { return t.name === viewMode; });
  }

  // Track fully completed tiles per team
  var tileTeams = {};
  teamsData.teams.forEach(function(team) {
    if (filterTeam && team.name !== filterTeam.name) return;
    if (!team.completedTiles) return;
    team.completedTiles.forEach(function(tileName) {
      if (!tileTeams[tileName]) tileTeams[tileName] = [];
      tileTeams[tileName].push(team);
    });
  });

  // Track in-progress tiles per team
  var tileInProgress = {};
  teamsData.teams.forEach(function(team) {
    if (filterTeam && team.name !== filterTeam.name) return;
    if (!team.inProgressTiles) return;
    team.inProgressTiles.forEach(function(prog) {
      if (!tileInProgress[prog.name]) tileInProgress[prog.name] = [];
      tileInProgress[prog.name].push({ team: team, done: prog.done, total: prog.total, format: prog.format });
    });
  });

  // Apply completed styles
  for (var tileName in tileTeams) {
    var el = tileElements[tileName];
    if (!el) continue;
    var teams = tileTeams[tileName];

    if (!filterTeam && teams.length >= 2) {
      el.classList.add('completed-both');
      el.style.setProperty('--team-color-1', teams[0].color);
      el.style.setProperty('--team-color-2', teams[1].color);
      el.title = 'Completed by ' + teams[0].name + ' & ' + teams[1].name;
    } else {
      el.classList.add('completed-single');
      el.style.setProperty('--team-color', teams[0].color);
      el.title = 'Completed by ' + teams[0].name;
    }
  }

  // Apply in-progress styles
  for (var ipName in tileInProgress) {
    if (tileTeams[ipName]) continue;
    var el = tileElements[ipName];
    if (!el) continue;
    var entries = tileInProgress[ipName];

    var best = entries[0];
    for (var i = 1; i < entries.length; i++) {
      if (entries[i].done / entries[i].total > best.done / best.total) best = entries[i];
    }

    el.classList.add('in-progress');
    el.style.setProperty('--team-color', best.team.color);
    el.title = entries.map(function(e) {
      var d = e.format ? fmt(e.done, e.format) : '' + e.done;
      var t = e.format ? fmt(e.total, e.format) : '' + e.total;
      return e.team.name + ': ' + d + '/' + t;
    }).join(' | ');

    var badge = document.createElement('span');
    badge.className = 'tile-progress-badge';

    if (!filterTeam && entries.length >= 2) {
      var d0 = entries[0].format ? fmt(entries[0].done, entries[0].format) : '' + entries[0].done;
      var d1 = entries[1].format ? fmt(entries[1].done, entries[1].format) : '' + entries[1].done;
      var t0 = entries[0].format ? fmt(entries[0].total, entries[0].format) : '' + entries[0].total;
      badge.textContent = d0 + '|' + d1 + '/' + t0;
      badge.style.color = '#ffd700';
    } else {
      var dB = best.format ? fmt(best.done, best.format) : '' + best.done;
      var tB = best.format ? fmt(best.total, best.format) : '' + best.total;
      badge.textContent = dB + '/' + tB;
      badge.style.color = best.team.color;
    }
    el.appendChild(badge);
  }

  // In team view, dim tiles in god sections the team hasn't unlocked
  if (filterTeam && depGraph && depGraph.godUnlockedBy) {
    var teamCompleted = filterTeam.completedTiles || [];
    var lockedGods = {};

    for (var god in depGraph.godUnlockedBy) {
      var unlockers = depGraph.godUnlockedBy[god];
      var allDone = unlockers.every(function(tileName) {
        return teamCompleted.indexOf(tileName) !== -1;
      });
      if (!allDone) lockedGods[god] = true;
    }

    for (var tName in tileElements) {
      var tEl = tileElements[tName];
      var tileGod = tEl.dataset.god;
      if (tileGod && lockedGods[tileGod]) {
        tEl.classList.add('section-locked');
        var lock = document.createElement('span');
        lock.className = 'tile-lock-icon';
        lock.textContent = '\uD83D\uDD12';
        tEl.appendChild(lock);
      }
    }
  }
}
