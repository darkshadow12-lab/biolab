const introScreen =
  document.getElementById("introScreen");

introScreen.addEventListener("click", function () {

  introScreen.classList.add("hide-intro");

  setTimeout(function () {
    introScreen.style.display = "none";
  }, 1000);

});

const pixelDuck =
  document.getElementById("pixelDuck");

/* =========================
   DUCK STATE MACHINE
========================= */

let duckState = "sleeping";

let duckScareCount = 0;

let duckReturnTimeout = null;

let duckPanicTimeouts = [];

let duckPosition = {
  x: 40,
  y: 120
};

const DUCK_DANGER_DISTANCE = 90;

const DUCK_ESCAPE_LIMIT = 5;

const DUCK_HIDE_TIME = 90000;

/* safe spots */

function getSafeSpots() {

  return [

    {
      x: 40,
      y: 120
    },

    {
      x: window.innerWidth - 150,
      y: 150
    },

    {
      x: 50,
      y: window.innerHeight - 170
    },

    {
      x: window.innerWidth - 160,
      y: window.innerHeight - 180
    },

    {
      x: window.innerWidth * 0.2,
      y: window.innerHeight - 220
    },

    {
      x: window.innerWidth * 0.82,
      y: 210
    }

  ];

}

/* keep inside screen */

function clampInside(position) {

  const padding = 24;

  return {

    x: Math.max(
      padding,
      Math.min(
        window.innerWidth - 120,
        position.x
      )
    ),

    y: Math.max(
      padding,
      Math.min(
        window.innerHeight - 120,
        position.y
      )
    )

  };

}

/* move duck */

function setDuckPosition(
  position,
  allowOutside = false
) {

  duckPosition =
    allowOutside
      ? position
      : clampInside(position);

  pixelDuck.style.transform =
    `translate(${duckPosition.x}px, ${duckPosition.y}px)`;

}

/* state */

function setDuckState(newState) {

  duckState = newState;

  pixelDuck.classList.remove(
    "sleeping",
    "scared",
    "panicRunning",
    "idle",
    "hidden",
    "returning"
  );

  pixelDuck.classList.add(newState);

}

/* clear timeouts */

function clearPanicTimeouts() {

  duckPanicTimeouts.forEach(function (id) {
    clearTimeout(id);
  });

  duckPanicTimeouts = [];

}

/* center */

function getDuckCenter() {

  const rect =
    pixelDuck.getBoundingClientRect();

  return {

    x:
      rect.left + rect.width / 2,

    y:
      rect.top + rect.height / 2

  };

}

/* distance */

function getDistance(a, b) {

  const dx = a.x - b.x;

  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);

}

/* farthest spot */

function getFarthestSpot(mouse) {

  const spots = getSafeSpots();

  let farthest = spots[0];

  let farthestDistance = 0;

  spots.forEach(function (spot) {

    const distance =
      getDistance(spot, mouse);

    if (distance > farthestDistance) {

      farthestDistance = distance;

      farthest = spot;

    }

  });

  return farthest;

}

/* natural movement */

function getNaturalMove() {

  const moveXOptions = [
    -30,
    -22,
    22,
    30
  ];

  const moveYOptions = [
    -10,
    -6,
    6,
    10
  ];

  const moveX =
    moveXOptions[
      Math.floor(
        Math.random() *
        moveXOptions.length
      )
    ];

  const moveY =
    moveYOptions[
      Math.floor(
        Math.random() *
        moveYOptions.length
      )
    ];

  return {

    x: duckPosition.x + moveX,

    y: duckPosition.y + moveY

  };

}

/* panic movement */

function startPanicMovement() {

  clearPanicTimeouts();

  setDuckState("panicRunning");

  const steps = 5;

  const delay = 340;

  for (let i = 0; i < steps; i++) {

    const timeoutId =
      setTimeout(function () {

        setDuckPosition(
          getNaturalMove()
        );

      }, i * delay);

    duckPanicTimeouts.push(timeoutId);

  }

  const finishTimeout =
    setTimeout(function () {

      setDuckState("idle");

      const sleepTimeout =
        setTimeout(function () {

          if (duckState === "idle") {

            setDuckState("sleeping");

          }

        }, 1200);

      duckPanicTimeouts.push(sleepTimeout);

    }, steps * delay + 220);

  duckPanicTimeouts.push(finishTimeout);

}

/* hide duck */

function hideDuck() {

  clearPanicTimeouts();

  setDuckState("hidden");

  const exitLeft =
    Math.random() > 0.5;

  const exitPosition = {

    x:
      exitLeft
        ? -220
        : window.innerWidth + 220,

    y: duckPosition.y

  };

  setDuckPosition(
    exitPosition,
    true
  );

  clearTimeout(duckReturnTimeout);

  duckReturnTimeout =
    setTimeout(function () {

      const spots =
        getSafeSpots();

      const returnSpot =
        spots[
          Math.floor(
            Math.random() *
            spots.length
          )
        ];

      const spawnLeft =
        returnSpot.x <
        window.innerWidth / 2;

      const outsidePosition = {

        x:
          spawnLeft
            ? -180
            : window.innerWidth + 180,

        y: returnSpot.y

      };

      duckScareCount = 0;

      setDuckPosition(
        outsidePosition,
        true
      );

      setDuckState("returning");

      setTimeout(function () {

        setDuckPosition(returnSpot);

      }, 120);

      setTimeout(function () {

        setDuckState("sleeping");

      }, 1600);

    }, DUCK_HIDE_TIME);

}

/* scare */

function scareDuck(mousePosition) {

  if (

    duckState === "scared" ||

    duckState === "panicRunning" ||

    duckState === "hidden" ||

    duckState === "returning"

  ) {

    return;

  }

  duckScareCount++;

  setDuckState("scared");

  setTimeout(function () {

    if (
      duckScareCount >=
      DUCK_ESCAPE_LIMIT
    ) {

      hideDuck();

      return;

    }

    const farthestSpot =
      getFarthestSpot(mousePosition);

    setDuckPosition(farthestSpot);

    startPanicMovement();

  }, 240);

}

/* mouse detection */

function handleMouseMove(event) {

  if (

    duckState === "scared" ||

    duckState === "panicRunning" ||

    duckState === "hidden" ||

    duckState === "returning"

  ) {

    return;

  }

  const mousePosition = {

    x: event.clientX,

    y: event.clientY

  };

  const duckCenter =
    getDuckCenter();

  const distance =
    getDistance(
      mousePosition,
      duckCenter
    );

  if (
    distance <
    DUCK_DANGER_DISTANCE
  ) {

    scareDuck(mousePosition);

  }

}

/* resize */

function refreshDuckPosition() {

  const spots =
    getSafeSpots();

  setDuckPosition(spots[0]);

}

/* listeners */

window.addEventListener(
  "mousemove",
  handleMouseMove
);

window.addEventListener(
  "resize",
  refreshDuckPosition
);

/* init */

refreshDuckPosition();

setDuckState("sleeping");