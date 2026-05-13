const introScreen =
  document.getElementById("introScreen");

const introDuckFamily =
  document.getElementById("introDuckFamily");

/* =========================
   INTRO CLICK
========================= */

introScreen.addEventListener(
  "click",
  function () {

    if (introDuckFamily) {

      introDuckFamily.classList.add(
        "intro-family-exit"
      );

    }

    setTimeout(function () {

      introScreen.classList.add(
        "hide-intro"
      );

    }, 380);

    setTimeout(function () {

      introScreen.style.display =
        "none";

    }, 1400);

  }
);

/* =========================
   PIXEL DUCK
========================= */

const pixelDuck =
  document.getElementById(
    "pixelDuck"
  );

const duckLayer =
  document.querySelector(
    ".background-duck-layer"
  );

let duckState =
  "sleeping";

let duckScareCount = 0;

let duckReturnTimeout =
  null;

let duckPanicTimeouts =
  [];

let duckAmbientTimeout =
  null;

let rareDuckTimeout =
  null;

let lastMousePosition = {
  x: 0,
  y: 0
};

let lastMouseTime =
  Date.now();

let duckPosition = {
  x: 40,
  y: 120
};

const DUCK_DANGER_DISTANCE =
  75;

const DUCK_CURIOUS_DISTANCE =
  140;

const DUCK_ESCAPE_LIMIT =
  5;

const DUCK_HIDE_TIME =
  90000;

/* =========================
   SAFE SPOTS
========================= */

function getSafeSpots() {

  return [

    {
      x: 40,
      y: 120
    },

    {
      x:
        window.innerWidth - 150,
      y: 150
    },

    {
      x: 50,
      y:
        window.innerHeight - 170
    },

    {
      x:
        window.innerWidth - 160,
      y:
        window.innerHeight - 180
    },

    {
      x:
        window.innerWidth * 0.2,
      y:
        window.innerHeight - 220
    },

    {
      x:
        window.innerWidth * 0.82,
      y: 210
    }

  ];

}

function clampInside(
  position
) {

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

function setDuckState(
  newState
) {

  duckState = newState;

  pixelDuck.classList.remove(
    "sleeping",
    "scared",
    "panicRunning",
    "idle",
    "hidden",
    "returning",
    "curious",
    "grooming"
  );

  pixelDuck.classList.add(
    newState
  );

}

/* =========================
   DUCK HELPERS
========================= */

function clearPanicTimeouts() {

  duckPanicTimeouts.forEach(
    function (id) {

      clearTimeout(id);

    }
  );

  duckPanicTimeouts = [];

}

function getDuckCenter() {

  const rect =
    pixelDuck.getBoundingClientRect();

  return {

    x:
      rect.left +
      rect.width / 2,

    y:
      rect.top +
      rect.height / 2

  };

}

function getDistance(a, b) {

  const dx = a.x - b.x;

  const dy = a.y - b.y;

  return Math.sqrt(
    dx * dx + dy * dy
  );

}

function getMouseSpeed(
  event
) {

  const now =
    Date.now();

  const currentMousePosition = {

    x: event.clientX,

    y: event.clientY

  };

  const distance =
    getDistance(
      currentMousePosition,
      lastMousePosition
    );

  const timeDiff =
    Math.max(
      1,
      now - lastMouseTime
    );

  lastMousePosition =
    currentMousePosition;

  lastMouseTime = now;

  return distance / timeDiff;

}

function getFarthestSpot(
  mouse
) {

  const spots =
    getSafeSpots();

  let farthest =
    spots[0];

  let farthestDistance =
    0;

  spots.forEach(
    function (spot) {

      const distance =
        getDistance(
          spot,
          mouse
        );

      if (
        distance >
        farthestDistance
      ) {

        farthestDistance =
          distance;

        farthest = spot;

      }

    }
  );

  return farthest;

}

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

    x:
      duckPosition.x + moveX,

    y:
      duckPosition.y + moveY

  };

}

/* =========================
   DUCK BEHAVIOUR
========================= */

function startPanicMovement() {

  clearPanicTimeouts();

  clearTimeout(
    duckAmbientTimeout
  );

  setDuckState(
    "panicRunning"
  );

  const steps = 5;

  const delay = 340;

  for (
    let i = 0;
    i < steps;
    i++
  ) {

    const timeoutId =
      setTimeout(
        function () {

          setDuckPosition(
            getNaturalMove()
          );

        },
        i * delay
      );

    duckPanicTimeouts.push(
      timeoutId
    );

  }

  const finishTimeout =
    setTimeout(
      function () {

        setDuckState("idle");

        const sleepTimeout =
          setTimeout(
            function () {

              if (
                duckState ===
                "idle"
              ) {

                setDuckState(
                  "sleeping"
                );

                scheduleAmbientGrooming();

              }

            },
            1200
          );

        duckPanicTimeouts.push(
          sleepTimeout
        );

      },
      steps * delay + 220
    );

  duckPanicTimeouts.push(
    finishTimeout
  );

}

function hideDuck() {

  clearPanicTimeouts();

  clearTimeout(
    duckAmbientTimeout
  );

  setDuckState(
    "hidden"
  );

  const exitLeft =
    Math.random() > 0.5;

  const exitPosition = {

    x:
      exitLeft
        ? -220
        : window.innerWidth + 220,

    y:
      duckPosition.y

  };

  setDuckPosition(
    exitPosition,
    true
  );

  clearTimeout(
    duckReturnTimeout
  );

  duckReturnTimeout =
    setTimeout(
      function () {

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

          y:
            returnSpot.y

        };

        duckScareCount = 0;

        setDuckPosition(
          outsidePosition,
          true
        );

        setDuckState(
          "returning"
        );

        setTimeout(
          function () {

            setDuckPosition(
              returnSpot
            );

          },
          120
        );

        setTimeout(
          function () {

            setDuckState(
              "sleeping"
            );

            scheduleAmbientGrooming();

          },
          1600
        );

      },
      DUCK_HIDE_TIME
    );

}

function scareDuck(
  mousePosition
) {

  if (

    duckState ===
      "scared" ||

    duckState ===
      "panicRunning" ||

    duckState ===
      "hidden" ||

    duckState ===
      "returning"

  ) {

    return;

  }

  duckScareCount++;

  clearTimeout(
    duckAmbientTimeout
  );

  setDuckState(
    "scared"
  );

  setTimeout(
    function () {

      if (
        duckScareCount >=
        DUCK_ESCAPE_LIMIT
      ) {

        hideDuck();

        return;

      }

      const farthestSpot =
        getFarthestSpot(
          mousePosition
        );

      setDuckPosition(
        farthestSpot
      );

      startPanicMovement();

    },
    240
  );

}

function makeDuckCurious() {

  if (

    duckState !==
      "sleeping" &&

    duckState !==
      "idle"

  ) {

    return;

  }

  clearTimeout(
    duckAmbientTimeout
  );

  setDuckState(
    "curious"
  );

  setTimeout(
    function () {

      if (
        duckState ===
        "curious"
      ) {

        setDuckState(
          "sleeping"
        );

        scheduleAmbientGrooming();

      }

    },
    1000
  );

}

function scheduleAmbientGrooming() {

  clearTimeout(
    duckAmbientTimeout
  );

  const delay =
    12000 +
    Math.random() * 18000;

  duckAmbientTimeout =
    setTimeout(
      function () {

        if (
          duckState !==
          "sleeping"
        ) {

          scheduleAmbientGrooming();

          return;

        }

        setDuckState(
          "grooming"
        );

        setTimeout(
          function () {

            if (
              duckState ===
              "grooming"
            ) {

              setDuckState(
                "sleeping"
              );

              scheduleAmbientGrooming();

            }

          },
          1400
        );

      },
      delay
    );

}

/* =========================
   RARE DUCK
========================= */

function maybeSpawnRareDuck() {

  if (!duckLayer) return;

  const chance =
    Math.random();

  if (chance > 0.08) {

    return;

  }

  const rareDuck =
    document.createElement(
      "div"
    );

  rareDuck.className =
    "rare-duck";

  const rareDuckPixel =
    document.createElement(
      "div"
    );

  rareDuckPixel.className =
    "rare-duck-pixel";

  rareDuck.appendChild(
    rareDuckPixel
  );

  duckLayer.appendChild(
    rareDuck
  );

  const y =
    window.innerHeight -
    120 -
    Math.random() * 120;

  const fromLeft =
    Math.random() > 0.5;

  const startX =
    fromLeft
      ? -80
      : window.innerWidth + 80;

  const endX =
    fromLeft
      ? 70
      : window.innerWidth - 120;

  rareDuck.style.transform =
    `translate(${startX}px, ${y}px) scale(0.82)`;

  setTimeout(
    function () {

      rareDuck.classList.add(
        "visible"
      );

      rareDuck.style.transform =
        `translate(${endX}px, ${y}px) scale(0.82)`;

    },
    100
  );

  setTimeout(
    function () {

      rareDuck.classList.remove(
        "visible"
      );

    },
    3200
  );

  setTimeout(
    function () {

      rareDuck.remove();

    },
    4500
  );

}

function scheduleRareDuck() {

  clearTimeout(
    rareDuckTimeout
  );

  const delay =
    35000 +
    Math.random() * 50000;

  rareDuckTimeout =
    setTimeout(
      function () {

        maybeSpawnRareDuck();

        scheduleRareDuck();

      },
      delay
    );

}

/* =========================
   MOUSE TRACKING
========================= */

function handleMouseMove(
  event
) {

  if (

    duckState ===
      "scared" ||

    duckState ===
      "panicRunning" ||

    duckState ===
      "hidden" ||

    duckState ===
      "returning" ||

    duckState ===
      "grooming"

  ) {

    return;

  }

  const mousePosition = {

    x: event.clientX,

    y: event.clientY

  };

  const mouseSpeed =
    getMouseSpeed(event);

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

    scareDuck(
      mousePosition
    );

    return;

  }

  if (

    distance <
      DUCK_CURIOUS_DISTANCE &&

    mouseSpeed < 0.55 &&

    duckState ===
      "sleeping"

  ) {

    makeDuckCurious();

  }

}

function refreshDuckPosition() {

  const spots =
    getSafeSpots();

  setDuckPosition(
    spots[0]
  );

}

window.addEventListener(
  "mousemove",
  handleMouseMove
);

window.addEventListener(
  "resize",
  refreshDuckPosition
);

refreshDuckPosition();

setDuckState(
  "sleeping"
);

scheduleAmbientGrooming();

scheduleRareDuck();