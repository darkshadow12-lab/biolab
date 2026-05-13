const introScreen = document.getElementById("introScreen");

introScreen.addEventListener("click", function () {
  introScreen.classList.add("hide-intro");

  setTimeout(function () {
    introScreen.style.display = "none";
  }, 1000);
});

const fistikCat = document.getElementById("fistikCat");

// =========================
// FISTIK STATE MACHINE
// =========================

let catState = "sleeping";
let catScareCount = 0;
let catReturnTimeout = null;
let catPanicTimeouts = [];

let catPosition = {
  x: 40,
  y: 120
};

const CAT_DANGER_DISTANCE = 90;
const CAT_ESCAPE_LIMIT = 5;
const CAT_HIDE_TIME = 90000;

function getSafeSpots() {
  return [
    { x: 40, y: 120 },

    {
      x: window.innerWidth - 140,
      y: 140
    },

    {
      x: 50,
      y: window.innerHeight - 160
    },

    {
      x: window.innerWidth - 150,
      y: window.innerHeight - 170
    },

    {
      x: window.innerWidth * 0.2,
      y: window.innerHeight - 200
    },

    {
      x: window.innerWidth * 0.82,
      y: 200
    }
  ];
}

function clampInsideScreen(position) {
  const padding = 24;

  return {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - 120, position.x)
    ),

    y: Math.max(
      padding,
      Math.min(window.innerHeight - 120, position.y)
    )
  };
}

function setCatPosition(position, allowOutside = false) {
  catPosition = allowOutside
    ? position
    : clampInsideScreen(position);

  fistikCat.style.transform =
    `translate(${catPosition.x}px, ${catPosition.y}px)`;
}

function setCatState(newState) {
  catState = newState;

  fistikCat.classList.remove(
    "sleeping",
    "scared",
    "panicRunning",
    "idle",
    "hidden",
    "returning"
  );

  fistikCat.classList.add(newState);
}

function clearPanicTimeouts() {
  catPanicTimeouts.forEach(function (timeoutId) {
    clearTimeout(timeoutId);
  });

  catPanicTimeouts = [];
}

function getCatCenter() {
  const rect = fistikCat.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function getDistance(pointA, pointB) {
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function getFarthestSpot(mousePosition) {
  const spots = getSafeSpots();

  let farthestSpot = spots[0];
  let farthestDistance = 0;

  spots.forEach(function (spot) {
    const distance =
      getDistance(spot, mousePosition);

    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestSpot = spot;
    }
  });

  return farthestSpot;
}

function getNaturalMove() {
  const moveXOptions = [-32, -24, 24, 32];
  const moveYOptions = [-12, -8, 8, 12];

  const moveX =
    moveXOptions[
      Math.floor(Math.random() * moveXOptions.length)
    ];

  const moveY =
    moveYOptions[
      Math.floor(Math.random() * moveYOptions.length)
    ];

  return {
    x: catPosition.x + moveX,
    y: catPosition.y + moveY
  };
}

function startPanicMovement() {
  clearPanicTimeouts();

  setCatState("panicRunning");

  const steps = 5;
  const delay = 340;

  for (let i = 0; i < steps; i++) {
    const timeoutId = setTimeout(function () {
      setCatPosition(getNaturalMove());
    }, i * delay);

    catPanicTimeouts.push(timeoutId);
  }

  const finishTimeout = setTimeout(function () {
    setCatState("idle");

    const sleepTimeout = setTimeout(function () {
      if (catState === "idle") {
        setCatState("sleeping");
      }
    }, 1200);

    catPanicTimeouts.push(sleepTimeout);

  }, steps * delay + 220);

  catPanicTimeouts.push(finishTimeout);
}

function hideCat() {
  clearPanicTimeouts();

  setCatState("hidden");

  const exitLeft = Math.random() > 0.5;

  const exitPosition = {
    x: exitLeft
      ? -220
      : window.innerWidth + 220,

    y: catPosition.y
  };

  setCatPosition(exitPosition, true);

  clearTimeout(catReturnTimeout);

  catReturnTimeout = setTimeout(function () {

    const safeSpots = getSafeSpots();

    const returnSpot =
      safeSpots[
        Math.floor(Math.random() * safeSpots.length)
      ];

    const spawnLeft =
      returnSpot.x < window.innerWidth / 2;

    const outsidePosition = {
      x: spawnLeft
        ? -180
        : window.innerWidth + 180,

      y: returnSpot.y
    };

    catScareCount = 0;

    setCatPosition(outsidePosition, true);

    setCatState("returning");

    setTimeout(function () {
      setCatPosition(returnSpot);
    }, 120);

    setTimeout(function () {
      setCatState("sleeping");
    }, 1600);

  }, CAT_HIDE_TIME);
}

function scareCat(mousePosition) {

  if (
    catState === "scared" ||
    catState === "panicRunning" ||
    catState === "hidden" ||
    catState === "returning"
  ) {
    return;
  }

  catScareCount++;

  setCatState("scared");

  setTimeout(function () {

    if (catScareCount >= CAT_ESCAPE_LIMIT) {
      hideCat();
      return;
    }

    const farthestSpot =
      getFarthestSpot(mousePosition);

    setCatPosition(farthestSpot);

    startPanicMovement();

  }, 240);
}

function handleMouseMove(event) {

  if (
    catState === "scared" ||
    catState === "panicRunning" ||
    catState === "hidden" ||
    catState === "returning"
  ) {
    return;
  }

  const mousePosition = {
    x: event.clientX,
    y: event.clientY
  };

  const catCenter = getCatCenter();

  const distance =
    getDistance(mousePosition, catCenter);

  if (distance < CAT_DANGER_DISTANCE) {
    scareCat(mousePosition);
  }
}

function refreshCatPosition() {
  const spots = getSafeSpots();

  setCatPosition(spots[0]);
}

window.addEventListener(
  "mousemove",
  handleMouseMove
);

window.addEventListener(
  "resize",
  refreshCatPosition
);

refreshCatPosition();

setCatState("sleeping");

// =========================
// INTRO ANIMATION
// =========================

const intro = document.getElementById("introScreen");

intro.addEventListener("click", function () {

  intro.classList.add("hide-intro");

  setTimeout(function () {
    intro.style.display = "none";
  }, 1000);

});