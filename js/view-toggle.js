var currentView = 'neutral';

export function getCurrentView() {
  return currentView;
}

export function initViewToggle(teamsData, onViewChange) {
  var container = document.getElementById('view-toggle');
  if (!container || !teamsData || !teamsData.teams) return;

  container.innerHTML = '';

  // Neutral button
  var neutralBtn = document.createElement('button');
  neutralBtn.textContent = 'Neutral';
  neutralBtn.className = 'view-toggle-btn active';
  neutralBtn.dataset.view = 'neutral';
  neutralBtn.style.setProperty('--btn-color', '#ffd700');
  container.appendChild(neutralBtn);

  // Team buttons
  teamsData.teams.forEach(function(team) {
    var btn = document.createElement('button');
    btn.textContent = team.name;
    btn.className = 'view-toggle-btn';
    btn.dataset.view = team.name;
    btn.style.setProperty('--btn-color', team.color);
    container.appendChild(btn);
  });

  container.addEventListener('click', function(e) {
    var btn = e.target.closest('.view-toggle-btn');
    if (!btn) return;

    var view = btn.dataset.view;
    if (view === currentView) return;

    currentView = view;

    container.querySelectorAll('.view-toggle-btn').forEach(function(b) {
      b.classList.toggle('active', b === btn);
    });

    if (onViewChange) onViewChange(currentView);
  });
}
