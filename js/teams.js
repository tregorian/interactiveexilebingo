import { tileElements } from './board.js';

export function renderTeams(teamsData) {
  if (!teamsData || !teamsData.teams) return;
  var panels = [
    document.getElementById('team-panel-left'),
    document.getElementById('team-panel-right'),
  ];

  teamsData.teams.forEach(function(team, idx) {
    var panel = panels[idx];
    if (!panel) return;

    panel.style.borderColor = team.color;

    // Header
    var header = document.createElement('div');
    header.className = 'team-header';
    header.style.borderBottomColor = team.color;

    var name = document.createElement('span');
    name.className = 'team-name';
    name.style.color = team.color;
    name.textContent = team.name;
    header.appendChild(name);

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
      el.href = 'https://wiseoldman.net/players/' + encodeURIComponent(member) + '/gained';
      el.target = '_blank';
      el.rel = 'noopener';
      panel.appendChild(el);
    });

    // LMS Points
    if (typeof team.lmsPoints === 'number') {
      var lmsEl = document.createElement('div');
      lmsEl.className = 'team-lms-points';
      lmsEl.style.color = team.lmsPoints >= 50 ? '#6f6' : '#ff8c00';
      lmsEl.textContent = 'LMS Points: ' + team.lmsPoints + '/50';
      panel.appendChild(lmsEl);
    }

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
        el.innerHTML = '<span class="ip-name">' + escapeHtml(prog.name) + '</span>' +
          '<span class="ip-progress">' + prog.done + '/' + prog.total + '</span>';
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
        panel.appendChild(el);
      });
    }
  });
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

export function markCompletedTiles(teamsData) {
  if (!teamsData || !teamsData.teams) return;

  var tileSubItems = teamsData.tileSubItems || {};
  var completionDetails = teamsData.completionDetails || {};

  // Track fully completed tiles per team (existing logic)
  var tileTeams = {};
  teamsData.teams.forEach(function(team) {
    if (!team.completedTiles) return;
    team.completedTiles.forEach(function(tileName) {
      if (!tileTeams[tileName]) tileTeams[tileName] = [];
      tileTeams[tileName].push(team);
    });
  });

  // Track in-progress tiles per team
  var tileInProgress = {};
  teamsData.teams.forEach(function(team) {
    if (!team.inProgressTiles) return;
    team.inProgressTiles.forEach(function(prog) {
      if (!tileInProgress[prog.name]) tileInProgress[prog.name] = [];
      tileInProgress[prog.name].push({ team: team, done: prog.done, total: prog.total });
    });
  });

  // Apply completed styles
  for (var tileName in tileTeams) {
    var el = tileElements[tileName];
    if (!el) continue;
    var teams = tileTeams[tileName];

    if (teams.length >= 2) {
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
    if (tileTeams[ipName]) continue; // already fully completed by someone, skip
    var el = tileElements[ipName];
    if (!el) continue;
    var entries = tileInProgress[ipName];

    // Show progress badge for the team furthest along
    var best = entries[0];
    for (var i = 1; i < entries.length; i++) {
      if (entries[i].done > best.done) best = entries[i];
    }

    el.classList.add('in-progress');
    el.style.setProperty('--team-color', best.team.color);
    el.title = entries.map(function(e) {
      return e.team.name + ': ' + e.done + '/' + e.total;
    }).join(' | ');

    // Add progress badge
    var badge = document.createElement('span');
    badge.className = 'tile-progress-badge';

    if (entries.length >= 2) {
      badge.textContent = entries[0].done + '|' + entries[1].done + '/' + entries[0].total;
      badge.style.color = '#ffd700';
    } else {
      badge.textContent = best.done + '/' + best.total;
      badge.style.color = best.team.color;
    }
    el.appendChild(badge);
  }
}
