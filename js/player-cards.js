// Player card hover tooltip
var tooltip = null;
var cardCache = {}; // name -> true/false (whether image exists)

function getTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement('div');
  tooltip.className = 'player-card-tooltip';
  tooltip.innerHTML = '<img class="player-card-img" src="" alt="">';
  document.body.appendChild(tooltip);
  return tooltip;
}

function getCardPath(name) {
  return 'assets/playercards_2026/' + name + '.png';
}

var currentTarget = null;

export function showPlayerCard(name, event) {
  // If we already know there's no image, skip
  if (cardCache[name] === false) return;

  currentTarget = event.currentTarget;
  var tip = getTooltip();
  var img = tip.querySelector('img');

  if (cardCache[name] === true) {
    img.src = getCardPath(name);
    positionTooltip(tip);
    tip.style.display = 'block';
    return;
  }

  // Probe if image exists
  var testImg = new Image();
  testImg.onload = function() {
    cardCache[name] = true;
    img.src = getCardPath(name);
    positionTooltip(tip);
    tip.style.display = 'block';
  };
  testImg.onerror = function() {
    cardCache[name] = false;
  };
  testImg.src = getCardPath(name);
}

export function hidePlayerCard() {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

function positionTooltip(tip) {
  if (!currentTarget) return;
  var rect = currentTarget.getBoundingClientRect();
  var w = 600;

  // Position to the right of the element, or left if no space
  var x = rect.right + 16;
  if (x + w > window.innerWidth) {
    x = rect.left - w - 16;
  }

  // Vertically center on the element, clamped to viewport
  var y = rect.top + rect.height / 2 - 200;
  if (y < 8) y = 8;
  if (y + 560 > window.innerHeight) y = window.innerHeight - 560;

  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}
