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

export function markCompletedTiles(teamsData) {
  if (!teamsData || !teamsData.teams) return;

  var tileTeams = {};
  teamsData.teams.forEach(function(team) {
    if (!team.completedTiles) return;
    team.completedTiles.forEach(function(tileName) {
      if (!tileTeams[tileName]) tileTeams[tileName] = [];
      tileTeams[tileName].push(team);
    });
  });

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
}
