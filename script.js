const introScreen = document.getElementById("introScreen");

introScreen.addEventListener("click", function () {
  introScreen.classList.add("hide-intro");

  setTimeout(function () {
    introScreen.style.display = "none";
  }, 1000);
});

/* =========================
   PIXEL DUCK
========================= */

const pixelDuck =
  document.getElementById("pixelDuck");

const duckLayer =
  document.querySelector(".background-duck-layer");

let duckState = "sleeping";

let duckScareCount = 0;

let duckReturnTimeout = null;

let duckPanicTimeouts = [];

let duckAmbientTimeout = null;

let rareDuckTimeout = null;

let lastMousePosition = {
  x: 0,
  y: 0
};

let lastMouseTime = Date.now();

let duckPosition = {
  x: 40,
  y: 120
};

const DUCK_DANGER_DISTANCE = 75;

const DUCK_CURIOUS_DISTANCE = 140;

const DUCK_ESCAPE_LIMIT = 5;

const DUCK_HIDE_TIME = 90000;

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

function setDuckState(newState) {

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

  pixelDuck.classList.add(newState);

}

function clearPanicTimeouts() {

  duckPanicTimeouts.forEach(function (id) {
    clearTimeout(id);
  });

  duckPanicTimeouts = [];

}

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

function getDistance(a, b) {

  const dx = a.x - b.x;

  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);

}

function getMouseSpeed(event) {

  const now = Date.now();

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
    Math.max(1, now - lastMouseTime);

  lastMousePosition =
    currentMousePosition;

  lastMouseTime = now;

  return distance / timeDiff;

}

function getFarthestSpot(mouse) {

  const spots =
    getSafeSpots();

  let farthest = spots[0];

  let farthestDistance = 0;

  spots.forEach(function (spot) {

    const distance =
      getDistance(spot, mouse);

    if (distance > farthestDistance) {

      farthestDistance =
        distance;

      farthest = spot;

    }

  });

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

    x: duckPosition.x + moveX,

    y: duckPosition.y + moveY

  };

}

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

  for (let i = 0; i < steps; i++) {

    const timeoutId =
      setTimeout(function () {

        setDuckPosition(
          getNaturalMove()
        );

      }, i * delay);

    duckPanicTimeouts.push(
      timeoutId
    );

  }

  const finishTimeout =
    setTimeout(function () {

      setDuckState("idle");

      const sleepTimeout =
        setTimeout(function () {

          if (
            duckState === "idle"
          ) {

            setDuckState(
              "sleeping"
            );

            scheduleAmbientGrooming();

          }

        }, 1200);

      duckPanicTimeouts.push(
        sleepTimeout
      );

    }, steps * delay + 220);

  duckPanicTimeouts.push(
    finishTimeout
  );

}

function hideDuck() {

  clearPanicTimeouts();

  clearTimeout(
    duckAmbientTimeout
  );

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

  clearTimeout(
    duckReturnTimeout
  );

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

      setDuckState(
        "returning"
      );

      setTimeout(function () {

        setDuckPosition(
          returnSpot
        );

      }, 120);

      setTimeout(function () {

        setDuckState(
          "sleeping"
        );

        scheduleAmbientGrooming();

      }, 1600);

    }, DUCK_HIDE_TIME);

}

function scareDuck(
  mousePosition
) {

  if (

    duckState === "scared" ||

    duckState === "panicRunning" ||

    duckState === "hidden" ||

    duckState === "returning"

  ) {

    return;

  }

  duckScareCount++;

  clearTimeout(
    duckAmbientTimeout
  );

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
      getFarthestSpot(
        mousePosition
      );

    setDuckPosition(
      farthestSpot
    );

    startPanicMovement();

  }, 240);

}

function makeDuckCurious() {

  if (

    duckState !== "sleeping" &&

    duckState !== "idle"

  ) {

    return;

  }

  clearTimeout(
    duckAmbientTimeout
  );

  setDuckState("curious");

  setTimeout(function () {

    if (
      duckState === "curious"
    ) {

      setDuckState(
        "sleeping"
      );

      scheduleAmbientGrooming();

    }

  }, 1000);

}

function scheduleAmbientGrooming() {

  clearTimeout(
    duckAmbientTimeout
  );

  const delay =
    12000 +
    Math.random() * 18000;

  duckAmbientTimeout =
    setTimeout(function () {

      if (
        duckState !== "sleeping"
      ) {

        scheduleAmbientGrooming();

        return;

      }

      setDuckState(
        "grooming"
      );

      setTimeout(function () {

        if (
          duckState === "grooming"
        ) {

          setDuckState(
            "sleeping"
          );

          scheduleAmbientGrooming();

        }

      }, 1400);

    }, delay);

}

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

  setTimeout(function () {

    rareDuck.classList.add(
      "visible"
    );

    rareDuck.style.transform =
      `translate(${endX}px, ${y}px) scale(0.82)`;

  }, 100);

  setTimeout(function () {

    rareDuck.classList.remove(
      "visible"
    );

  }, 3200);

  setTimeout(function () {

    rareDuck.remove();

  }, 4500);

}

function scheduleRareDuck() {

  clearTimeout(
    rareDuckTimeout
  );

  const delay =
    35000 +
    Math.random() * 50000;

  rareDuckTimeout =
    setTimeout(function () {

      maybeSpawnRareDuck();

      scheduleRareDuck();

    }, delay);

}

function handleMouseMove(
  event
) {

  if (

    duckState === "scared" ||

    duckState === "panicRunning" ||

    duckState === "hidden" ||

    duckState === "returning" ||

    duckState === "grooming"

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

    duckState === "sleeping"

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

setDuckState("sleeping");

scheduleAmbientGrooming();

scheduleRareDuck();

/* =========================
   VIDEO OVERLAY
========================= */

const takeOffMarker =
  document.getElementById(
    "takeOffMarker"
  );

const landingMarker =
  document.getElementById(
    "landingMarker"
  );

/* =========================
   CMJ ANALYSIS
========================= */

const videoInput =
  document.getElementById(
    "videoInput"
  );

const video =
  document.getElementById(
    "video"
  );

const timeline =
  document.getElementById(
    "timeline"
  );

const currentTimeDisplay =
  document.getElementById(
    "currentTimeDisplay"
  );

const durationDisplay =
  document.getElementById(
    "durationDisplay"
  );

const playPauseBtn =
  document.getElementById(
    "playPauseBtn"
  );

const normalSpeedBtn =
  document.getElementById(
    "normalSpeedBtn"
  );

const slowSpeedBtn =
  document.getElementById(
    "slowSpeedBtn"
  );

const prevFrameBtn =
  document.getElementById(
    "prevFrameBtn"
  );

const nextFrameBtn =
  document.getElementById(
    "nextFrameBtn"
  );

const takeOffPoint =
  document.getElementById(
    "takeOffPoint"
  );

const landingPoint =
  document.getElementById(
    "landingPoint"
  );

const takeOffFrameInfo =
  document.getElementById(
    "takeOffFrameInfo"
  );

const landingFrameInfo =
  document.getElementById(
    "landingFrameInfo"
  );

const currentFrameInfo =
  document.getElementById(
    "currentFrameInfo"
  );

const frameDifferenceInfo =
  document.getElementById(
    "frameDifferenceInfo"
  );

const flightTimeInfo =
  document.getElementById(
    "flightTimeInfo"
  );

const jumpHeightInfo =
  document.getElementById(
    "jumpHeightInfo"
  );

const errorRangeInfo =
  document.getElementById(
    "errorRangeInfo"
  );

const unlockBtn =
  document.getElementById(
    "unlockBtn"
  );

const lockInfo =
  document.getElementById(
    "lockInfo"
  );

const athleteNameInput =
  document.getElementById(
    "athleteNameInput"
  );

const saveTestBtn =
  document.getElementById(
    "saveTestBtn"
  );

const saveMessage =
  document.getElementById(
    "saveMessage"
  );

const historyList =
  document.getElementById(
    "historyList"
  );

const clearHistoryBtn =
  document.getElementById(
    "clearHistoryBtn"
  );

const downloadCsvBtn =
  document.getElementById(
    "downloadCsvBtn"
  );

const FPS = 60;

const GRAVITY = 9.81;

const STORAGE_KEY =
  "biolab_cmj_tests";

let selectionStep = 0;

let isSelectionLocked =
  false;

let takeOffFrame = null;

let landingFrame = null;

let lastCMJResult = null;

function getFrameTime() {

  return 1 / FPS;

}

function getCurrentFrame() {

  return Math.round(
    video.currentTime * FPS
  );

}

function formatTime(seconds) {

  if (
    !seconds ||
    isNaN(seconds)
  ) {

    return "0.00 sn";

  }

  return `${seconds.toFixed(2)} sn`;

}

function updateCurrentFrameInfo() {

  currentFrameInfo.textContent =
    getCurrentFrame();

}

function updateTimeline() {

  if (
    !video.duration ||
    isNaN(video.duration)
  ) {

    timeline.value = 0;

    currentTimeDisplay.textContent =
      "0.00 sn";

    durationDisplay.textContent =
      "0.00 sn";

    return;

  }

  timeline.value =
    (video.currentTime /
      video.duration) *
    1000;

  currentTimeDisplay.textContent =
    formatTime(
      video.currentTime
    );

  durationDisplay.textContent =
    formatTime(
      video.duration
    );

}

function getVideoCoordinates(
  event
) {

  const rect =
    video.getBoundingClientRect();

  const x =
    event.clientX -
    rect.left;

  const y =
    event.clientY -
    rect.top;

  return {
    x,
    y
  };

}

function calculateJumpHeightCm(
  flightTime
) {

  const jumpHeightMeter =
    GRAVITY *
    Math.pow(
      flightTime,
      2
    ) / 8;

  return jumpHeightMeter * 100;

}

function calculateCMJ() {

  if (

    takeOffFrame === null ||

    landingFrame === null

  ) {

    return;

  }

  const frameDifference =
    landingFrame -
    takeOffFrame;

  if (
    frameDifference <= 0
  ) {

    frameDifferenceInfo.textContent =
      "Hatalı";

    flightTimeInfo.textContent =
      "-";

    jumpHeightInfo.textContent =
      "-";

    errorRangeInfo.textContent =
      "-";

    lastCMJResult = null;

    return;

  }

  const flightTime =
    frameDifference / FPS;

  const jumpHeightCm =
    calculateJumpHeightCm(
      flightTime
    );

  const minFrameDifference =
    Math.max(
      1,
      frameDifference - 1
    );

  const maxFrameDifference =
    frameDifference + 1;

  const minFlightTime =
    minFrameDifference / FPS;

  const maxFlightTime =
    maxFrameDifference / FPS;

  const minJumpHeightCm =
    calculateJumpHeightCm(
      minFlightTime
    );

  const maxJumpHeightCm =
    calculateJumpHeightCm(
      maxFlightTime
    );

  const errorRangeText =
    `${minJumpHeightCm.toFixed(2)} - ${maxJumpHeightCm.toFixed(2)} cm`;

  frameDifferenceInfo.textContent =
    frameDifference;

  flightTimeInfo.textContent =
    flightTime.toFixed(3);

  jumpHeightInfo.textContent =
    jumpHeightCm.toFixed(2);

  errorRangeInfo.textContent =
    errorRangeText;

  lastCMJResult = {

    jumpHeightCm:
      jumpHeightCm.toFixed(2),

    flightTimeS:
      flightTime.toFixed(3),

    takeOffFrame,

    landingFrame,

    frameDifference,

    errorRange:
      errorRangeText,

    fps: FPS

  };

}

function resetSelections() {

  selectionStep = 0;

  isSelectionLocked =
    false;

  takeOffFrame = null;

  landingFrame = null;

  lastCMJResult = null;

  takeOffPoint.textContent =
    "0, 0";

  landingPoint.textContent =
    "0, 0";

  takeOffFrameInfo.textContent =
    "-";

  landingFrameInfo.textContent =
    "-";

  frameDifferenceInfo.textContent =
    "-";

  flightTimeInfo.textContent =
    "-";

  jumpHeightInfo.textContent =
    "-";

  errorRangeInfo.textContent =
    "-";

  lockInfo.textContent =
    "Take-off seç";

  saveMessage.textContent =
    "";

  takeOffMarker.classList.remove(
    "visible"
  );

  landingMarker.classList.remove(
    "visible"
  );

}

function getSavedTests() {

  const rawData =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!rawData) {

    return [];

  }

  try {

    return JSON.parse(
      rawData
    );

  } catch (error) {

    return [];

  }

}

function saveTests(tests) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tests)
  );

}

function renderHistory() {

  const tests =
    getSavedTests();

  historyList.innerHTML =
    "";

  if (tests.length === 0) {

    historyList.innerHTML =
      `<p class="empty-history">Henüz kayıt yok.</p>`;

    return;

  }

  tests
    .slice()
    .reverse()
    .forEach(function (test) {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "history-card";

      card.innerHTML = `
        <div class="history-card-header">
          <h3>${test.athleteName}</h3>
          <small>${test.createdAt}</small>
        </div>

        <div class="history-card-grid">
          <p>Sıçrama: <strong>${test.jumpHeightCm} cm</strong></p>
          <p>Uçuş: <strong>${test.flightTimeS} sn</strong></p>
          <p>Frame Farkı: <strong>${test.frameDifference}</strong></p>
          <p>Hata: <strong>${test.errorRange}</strong></p>
        </div>
      `;

      historyList.appendChild(
        card
      );

    });

}

function saveCurrentTest() {

  if (!lastCMJResult) {

    saveMessage.textContent =
      "Önce take-off ve landing seçimi yapmalısın.";

    return;

  }

  const athleteName =
    athleteNameInput.value.trim();

  if (!athleteName) {

    saveMessage.textContent =
      "Sporcu adı girmelisin.";

    return;

  }

  const tests =
    getSavedTests();

  const newTest = {

    id: Date.now(),

    athleteName,

    createdAt:
      new Date().toLocaleString(
        "tr-TR"
      ),

    ...lastCMJResult

  };

  tests.push(newTest);

  saveTests(tests);

  saveMessage.textContent =
    "Test kaydedildi.";

  athleteNameInput.value =
    "";

  renderHistory();

}

function escapeCSV(value) {

  if (

    value === null ||

    value === undefined

  ) {

    return "";

  }

  const stringValue =
    String(value).replace(
      /"/g,
      '""'
    );

  return `"${stringValue}"`;

}

function downloadCSV() {

  const tests =
    getSavedTests();

  if (tests.length === 0) {

    saveMessage.textContent =
      "İndirilecek kayıt bulunamadı.";

    return;

  }

  const headers = [

    "Tarih",

    "Sporcu Adı",

    "Sıçrama Yüksekliği cm",

    "Uçuş Süresi sn",

    "Take-off Frame",

    "Landing Frame",

    "Frame Farkı",

    "Hata Aralığı",

    "FPS"

  ];

  const rows =
    tests.map(function (test) {

      return [

        test.createdAt,

        test.athleteName,

        test.jumpHeightCm,

        test.flightTimeS,

        test.takeOffFrame,

        test.landingFrame,

        test.frameDifference,

        test.errorRange,

        test.fps

      ]
        .map(escapeCSV)
        .join(",");

    });

  const csvContent = [

    headers
      .map(escapeCSV)
      .join(","),

    ...rows

  ].join("\n");

  const blob =
    new Blob(
      ["\uFEFF" + csvContent],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "biolab_cmj_testleri.csv";

  link.click();

  URL.revokeObjectURL(url);

  saveMessage.textContent =
    "CSV dosyası indirildi.";

}

videoInput.addEventListener(
  "change",
  function () {

    const file =
      videoInput.files[0];

    if (file) {

      const videoURL =
        URL.createObjectURL(
          file
        );

      video.src = videoURL;

      resetSelections();

      currentFrameInfo.textContent =
        "0";

      currentTimeDisplay.textContent =
        "0.00 sn";

      durationDisplay.textContent =
        "0.00 sn";

      timeline.value = 0;

    }

  }
);

video.addEventListener(
  "loadedmetadata",
  function () {

    updateTimeline();

  }
);

timeline.addEventListener(
  "input",
  function () {

    if (
      !video.duration ||
      isNaN(video.duration)
    ) {

      return;

    }

    video.currentTime =
      (Number(
        timeline.value
      ) / 1000) *
      video.duration;

    updateTimeline();

    updateCurrentFrameInfo();

  }
);

playPauseBtn.addEventListener(
  "click",
  function () {

    if (video.paused) {

      video.play();

    } else {

      video.pause();

    }

  }
);

slowSpeedBtn.addEventListener(
  "click",
  function () {

    video.playbackRate =
      0.25;

  }
);

normalSpeedBtn.addEventListener(
  "click",
  function () {

    video.playbackRate = 1;

  }
);

prevFrameBtn.addEventListener(
  "click",
  function () {

    video.pause();

    video.currentTime =
      Math.max(
        0,
        video.currentTime -
        getFrameTime()
      );

    updateCurrentFrameInfo();

    updateTimeline();

  }
);

nextFrameBtn.addEventListener(
  "click",
  function () {

    video.pause();

    video.currentTime =
      Math.min(
        video.duration,
        video.currentTime +
        getFrameTime()
      );

    updateCurrentFrameInfo();

    updateTimeline();

  }
);

video.addEventListener(
  "timeupdate",
  function () {

    updateCurrentFrameInfo();

    updateTimeline();

  }
);

video.addEventListener(
  "click",
  function (event) {

    if (
      !event.shiftKey ||
      isSelectionLocked
    ) {

      return;

    }

    video.pause();

    const coordinates =
      getVideoCoordinates(
        event
      );

    const coordinateText =
      `${Math.round(coordinates.x)}, ${Math.round(coordinates.y)}`;

    const currentFrame =
      getCurrentFrame();

    if (selectionStep === 0) {

      takeOffPoint.textContent =
        coordinateText;

      takeOffMarker.style.left =
        `${coordinates.x}px`;

      takeOffMarker.style.top =
        `${coordinates.y}px`;

      takeOffMarker.classList.add(
        "visible"
      );

      takeOffFrame =
        currentFrame;

      takeOffFrameInfo.textContent =
        takeOffFrame;

      selectionStep = 1;

      lockInfo.textContent =
        "Landing seç";

      return;

    }

    if (selectionStep === 1) {

      landingPoint.textContent =
        coordinateText;

      landingMarker.style.left =
        `${coordinates.x}px`;

      landingMarker.style.top =
        `${coordinates.y}px`;

      landingMarker.classList.add(
        "visible"
      );

      landingFrame =
        currentFrame;

      landingFrameInfo.textContent =
        landingFrame;

      selectionStep = 2;

      isSelectionLocked =
        true;

      lockInfo.textContent =
        "Kilitli";

      calculateCMJ();

    }

  }
);

unlockBtn.addEventListener(
  "click",
  function () {

    resetSelections();

  }
);

saveTestBtn.addEventListener(
  "click",
  function () {

    saveCurrentTest();

  }
);

downloadCsvBtn.addEventListener(
  "click",
  function () {

    downloadCSV();

  }
);

clearHistoryBtn.addEventListener(
  "click",
  function () {

    const confirmed =
      confirm(
        "Tüm kayıtları silmek istediğine emin misin?"
      );

    if (!confirmed) {

      return;

    }

    localStorage.removeItem(
      STORAGE_KEY
    );

    renderHistory();

  }
);

renderHistory();