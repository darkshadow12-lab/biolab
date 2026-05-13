const introScreen = document.getElementById("introScreen");

introScreen.addEventListener("click", function () {
  introScreen.classList.add("hide-intro");

  setTimeout(function () {
    introScreen.style.display = "none";
  }, 1000);
});

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");

const timeline = document.getElementById("timeline");
const currentTimeDisplay = document.getElementById("currentTimeDisplay");
const durationDisplay = document.getElementById("durationDisplay");

const playPauseBtn = document.getElementById("playPauseBtn");
const normalSpeedBtn = document.getElementById("normalSpeedBtn");
const slowSpeedBtn = document.getElementById("slowSpeedBtn");
const prevFrameBtn = document.getElementById("prevFrameBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");

const takeOffPoint = document.getElementById("takeOffPoint");
const landingPoint = document.getElementById("landingPoint");

const takeOffFrameInfo = document.getElementById("takeOffFrameInfo");
const landingFrameInfo = document.getElementById("landingFrameInfo");

const currentFrameInfo = document.getElementById("currentFrameInfo");
const frameDifferenceInfo = document.getElementById("frameDifferenceInfo");
const flightTimeInfo = document.getElementById("flightTimeInfo");
const jumpHeightInfo = document.getElementById("jumpHeightInfo");
const errorRangeInfo = document.getElementById("errorRangeInfo");

const unlockBtn = document.getElementById("unlockBtn");
const lockInfo = document.getElementById("lockInfo");

const athleteNameInput = document.getElementById("athleteNameInput");
const saveTestBtn = document.getElementById("saveTestBtn");
const saveMessage = document.getElementById("saveMessage");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

const pixelDog = document.getElementById("pixelDog");

const FPS = 60;
const GRAVITY = 9.81;
const STORAGE_KEY = "biolab_cmj_tests";

let selectionStep = 0;
let isSelectionLocked = false;

let takeOffFrame = null;
let landingFrame = null;
let lastCMJResult = null;

// =========================
// PIXEL DOG STATE MACHINE
// =========================

let dogState = "sleeping";
let dogScareCount = 0;
let dogPanicInterval = null;
let dogReturnTimeout = null;
let dogPosition = { x: 32, y: 130 };

const DOG_DANGER_DISTANCE = 95;
const DOG_ESCAPE_LIMIT = 5;
const DOG_HIDE_TIME = 18000;

function getDogSafeSpots() {
  return [
    { x: 32, y: 120 },
    { x: window.innerWidth - 110, y: 140 },
    { x: 38, y: window.innerHeight - 110 },
    { x: window.innerWidth - 125, y: window.innerHeight - 120 },
    { x: window.innerWidth * 0.12, y: window.innerHeight - 150 },
    { x: window.innerWidth * 0.82, y: 190 }
  ];
}

function clampDogPosition(position) {
  const padding = 24;

  return {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - 90, position.x)
    ),

    y: Math.max(
      padding,
      Math.min(window.innerHeight - 90, position.y)
    )
  };
}

function setDogPosition(position) {
  if (!pixelDog) return;

  dogPosition = clampDogPosition(position);

  pixelDog.style.transform =
    `translate(${dogPosition.x}px, ${dogPosition.y}px)`;
}

function setDogState(newState) {
  if (!pixelDog) return;

  dogState = newState;

  pixelDog.classList.remove(
    "sleeping",
    "scared",
    "moving",
    "panicRunning",
    "idle",
    "hidden",
    "returning"
  );

  pixelDog.classList.add(newState);
}

function getDogCenter() {
  const rect = pixelDog.getBoundingClientRect();

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

function getFarthestSafeSpotFromMouse(mousePosition) {
  const safeSpots = getDogSafeSpots();

  let farthestSpot = safeSpots[0];
  let farthestDistance = 0;

  safeSpots.forEach(function (spot) {
    const distance = getDistance(spot, mousePosition);

    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestSpot = spot;
    }
  });

  return farthestSpot;
}

function getSmallPanicMove() {
  const moveAmountX = Math.random() > 0.5 ? 80 : -80;
  const moveAmountY = Math.random() > 0.5 ? 38 : -38;

  return clampDogPosition({
    x: dogPosition.x + moveAmountX,
    y: dogPosition.y + moveAmountY
  });
}

function startPanicRunning() {
  if (!pixelDog) return;

  setDogState("panicRunning");

  let panicStep = 0;
  const maxPanicSteps = 9;

  clearInterval(dogPanicInterval);

  dogPanicInterval = setInterval(function () {
    panicStep++;

    setDogPosition(getSmallPanicMove());

    if (panicStep >= maxPanicSteps) {
      clearInterval(dogPanicInterval);
      dogPanicInterval = null;

      setDogState("idle");

      setTimeout(function () {
        if (dogState === "idle") {
          setDogState("sleeping");
        }
      }, 900);
    }
  }, 260);
}

function hideDogAndReturnLater() {
  if (!pixelDog) return;

  clearInterval(dogPanicInterval);
  dogPanicInterval = null;

  setDogState("hidden");

  const exitDirection = Math.random() > 0.5 ? -160 : window.innerWidth + 160;

  setDogPosition({
    x: exitDirection,
    y: dogPosition.y
  });

  clearTimeout(dogReturnTimeout);

  dogReturnTimeout = setTimeout(function () {
    const safeSpots = getDogSafeSpots();
    const returnSpot =
      safeSpots[Math.floor(Math.random() * safeSpots.length)];

    dogScareCount = 0;

    setDogState("returning");
    setDogPosition(returnSpot);

    setTimeout(function () {
      setDogState("sleeping");
    }, 1200);
  }, DOG_HIDE_TIME);
}

function scareDog(mousePosition) {
  if (!pixelDog) return;

  if (
    dogState === "scared" ||
    dogState === "panicRunning" ||
    dogState === "hidden" ||
    dogState === "returning"
  ) {
    return;
  }

  dogScareCount++;

  setDogState("scared");

  setTimeout(function () {
    if (dogScareCount >= DOG_ESCAPE_LIMIT) {
      hideDogAndReturnLater();
      return;
    }

    const farthestSpot = getFarthestSafeSpotFromMouse(mousePosition);

    setDogPosition(farthestSpot);

    startPanicRunning();
  }, 240);
}

function handleDogMouseMove(event) {
  if (!pixelDog) return;

  if (
    dogState === "scared" ||
    dogState === "panicRunning" ||
    dogState === "hidden" ||
    dogState === "returning"
  ) {
    return;
  }

  const mousePosition = {
    x: event.clientX,
    y: event.clientY
  };

  const dogCenter = getDogCenter();
  const distance = getDistance(mousePosition, dogCenter);

  if (distance < DOG_DANGER_DISTANCE) {
    scareDog(mousePosition);
  }
}

function refreshDogPosition() {
  const safeSpots = getDogSafeSpots();

  setDogPosition(safeSpots[0]);
}

window.addEventListener("mousemove", handleDogMouseMove);
window.addEventListener("resize", refreshDogPosition);

refreshDogPosition();
setDogState("sleeping");

// =========================
// CMJ ANALYSIS
// =========================

function getFrameTime() {
  return 1 / FPS;
}

function getCurrentFrame() {
  return Math.round(video.currentTime * FPS);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) {
    return "0.00 sn";
  }

  return `${seconds.toFixed(2)} sn`;
}

function updateCurrentFrameInfo() {
  currentFrameInfo.textContent = getCurrentFrame();
}

function updateTimeline() {
  if (!video.duration || isNaN(video.duration)) {
    timeline.value = 0;
    currentTimeDisplay.textContent = "0.00 sn";
    durationDisplay.textContent = "0.00 sn";
    return;
  }

  timeline.value = (video.currentTime / video.duration) * 1000;

  currentTimeDisplay.textContent = formatTime(video.currentTime);
  durationDisplay.textContent = formatTime(video.duration);
}

function getVideoCoordinates(event) {
  const rect = video.getBoundingClientRect();

  const x = Math.round(
    (event.clientX - rect.left) * (video.videoWidth / rect.width)
  );

  const y = Math.round(
    (event.clientY - rect.top) * (video.videoHeight / rect.height)
  );

  return { x, y };
}

function calculateJumpHeightCm(flightTime) {
  const jumpHeightMeter = GRAVITY * Math.pow(flightTime, 2) / 8;

  return jumpHeightMeter * 100;
}

function calculateCMJ() {
  if (takeOffFrame === null || landingFrame === null) {
    return;
  }

  const frameDifference = landingFrame - takeOffFrame;

  if (frameDifference <= 0) {
    frameDifferenceInfo.textContent = "Hatalı";
    flightTimeInfo.textContent = "-";
    jumpHeightInfo.textContent = "-";
    errorRangeInfo.textContent = "-";
    lastCMJResult = null;
    return;
  }

  const flightTime = frameDifference / FPS;
  const jumpHeightCm = calculateJumpHeightCm(flightTime);

  const minFrameDifference = Math.max(1, frameDifference - 1);
  const maxFrameDifference = frameDifference + 1;

  const minFlightTime = minFrameDifference / FPS;
  const maxFlightTime = maxFrameDifference / FPS;

  const minJumpHeightCm = calculateJumpHeightCm(minFlightTime);
  const maxJumpHeightCm = calculateJumpHeightCm(maxFlightTime);

  const errorRangeText =
    `${minJumpHeightCm.toFixed(2)} - ${maxJumpHeightCm.toFixed(2)} cm`;

  frameDifferenceInfo.textContent = frameDifference;
  flightTimeInfo.textContent = flightTime.toFixed(3);
  jumpHeightInfo.textContent = jumpHeightCm.toFixed(2);
  errorRangeInfo.textContent = errorRangeText;

  lastCMJResult = {
    jumpHeightCm: jumpHeightCm.toFixed(2),
    flightTimeS: flightTime.toFixed(3),
    takeOffFrame,
    landingFrame,
    frameDifference,
    errorRange: errorRangeText,
    fps: FPS
  };
}

function resetSelections() {
  selectionStep = 0;
  isSelectionLocked = false;

  takeOffFrame = null;
  landingFrame = null;
  lastCMJResult = null;

  takeOffPoint.textContent = "0, 0";
  landingPoint.textContent = "0, 0";

  takeOffFrameInfo.textContent = "-";
  landingFrameInfo.textContent = "-";

  frameDifferenceInfo.textContent = "-";
  flightTimeInfo.textContent = "-";
  jumpHeightInfo.textContent = "-";
  errorRangeInfo.textContent = "-";

  lockInfo.textContent = "Take-off seç";
  saveMessage.textContent = "";
}

// =========================
// LOCAL STORAGE
// =========================

function getSavedTests() {
  const rawData = localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    return [];
  }
}

function saveTests(tests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
}

function renderHistory() {
  const tests = getSavedTests();

  historyList.innerHTML = "";

  if (tests.length === 0) {
    historyList.innerHTML = `<p class="empty-history">Henüz kayıt yok.</p>`;
    return;
  }

  tests
    .slice()
    .reverse()
    .forEach(function (test) {
      const card = document.createElement("div");
      card.className = "history-card";

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

      historyList.appendChild(card);
    });
}

function saveCurrentTest() {
  if (!lastCMJResult) {
    saveMessage.textContent = "Önce take-off ve landing seçimi yapmalısın.";
    return;
  }

  const athleteName = athleteNameInput.value.trim();

  if (!athleteName) {
    saveMessage.textContent = "Sporcu adı girmelisin.";
    return;
  }

  const tests = getSavedTests();

  const newTest = {
    id: Date.now(),
    athleteName,
    createdAt: new Date().toLocaleString("tr-TR"),
    ...lastCMJResult
  };

  tests.push(newTest);
  saveTests(tests);

  saveMessage.textContent = "Test kaydedildi.";
  athleteNameInput.value = "";

  renderHistory();
}

// =========================
// CSV EXPORT
// =========================

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value).replace(/"/g, '""');

  return `"${stringValue}"`;
}

function downloadCSV() {
  const tests = getSavedTests();

  if (tests.length === 0) {
    saveMessage.textContent = "İndirilecek kayıt bulunamadı.";
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

  const rows = tests.map(function (test) {
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
    ].map(escapeCSV).join(",");
  });

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "biolab_cmj_testleri.csv";
  link.click();

  URL.revokeObjectURL(url);

  saveMessage.textContent = "CSV dosyası indirildi.";
}

// =========================
// EVENT LISTENERS
// =========================

videoInput.addEventListener("change", function () {
  const file = videoInput.files[0];

  if (file) {
    const videoURL = URL.createObjectURL(file);

    video.src = videoURL;

    resetSelections();

    currentFrameInfo.textContent = "0";
    currentTimeDisplay.textContent = "0.00 sn";
    durationDisplay.textContent = "0.00 sn";
    timeline.value = 0;
  }
});

video.addEventListener("loadedmetadata", function () {
  updateTimeline();
});

timeline.addEventListener("input", function () {
  if (!video.duration || isNaN(video.duration)) {
    return;
  }

  video.currentTime = (Number(timeline.value) / 1000) * video.duration;

  updateTimeline();
  updateCurrentFrameInfo();
});

playPauseBtn.addEventListener("click", function () {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

slowSpeedBtn.addEventListener("click", function () {
  video.playbackRate = 0.25;
});

normalSpeedBtn.addEventListener("click", function () {
  video.playbackRate = 1;
});

prevFrameBtn.addEventListener("click", function () {
  video.pause();

  video.currentTime =
    Math.max(0, video.currentTime - getFrameTime());

  updateCurrentFrameInfo();
  updateTimeline();
});

nextFrameBtn.addEventListener("click", function () {
  video.pause();

  video.currentTime =
    Math.min(video.duration, video.currentTime + getFrameTime());

  updateCurrentFrameInfo();
  updateTimeline();
});

video.addEventListener("timeupdate", function () {
  updateCurrentFrameInfo();
  updateTimeline();
});

video.addEventListener("click", function (event) {
  if (!event.shiftKey || isSelectionLocked) {
    return;
  }

  video.pause();

  const coordinates = getVideoCoordinates(event);
  const coordinateText = `${coordinates.x}, ${coordinates.y}`;
  const currentFrame = getCurrentFrame();

  if (selectionStep === 0) {
    takeOffPoint.textContent = coordinateText;
    takeOffFrame = currentFrame;
    takeOffFrameInfo.textContent = takeOffFrame;

    selectionStep = 1;
    lockInfo.textContent = "Landing seç";

    return;
  }

  if (selectionStep === 1) {
    landingPoint.textContent = coordinateText;
    landingFrame = currentFrame;
    landingFrameInfo.textContent = landingFrame;

    selectionStep = 2;
    isSelectionLocked = true;
    lockInfo.textContent = "Kilitli";

    calculateCMJ();
  }
});

unlockBtn.addEventListener("click", function () {
  resetSelections();
});

saveTestBtn.addEventListener("click", function () {
  saveCurrentTest();
});

downloadCsvBtn.addEventListener("click", function () {
  downloadCSV();
});

clearHistoryBtn.addEventListener("click", function () {
  const confirmed = confirm("Tüm kayıtları silmek istediğine emin misin?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

renderHistory();