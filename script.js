const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");

const playPauseBtn = document.getElementById("playPauseBtn");
const normalSpeedBtn = document.getElementById("normalSpeedBtn");
const slowSpeedBtn = document.getElementById("slowSpeedBtn");
const prevFrameBtn = document.getElementById("prevFrameBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");

const speedInfo = document.getElementById("speedInfo");
const timeInfo = document.getElementById("timeInfo");

const xCoordinate = document.getElementById("xCoordinate");
const yCoordinate = document.getElementById("yCoordinate");

const fpsInput = document.getElementById("fpsInput");

const takeOffPoint = document.getElementById("takeOffPoint");
const landingPoint = document.getElementById("landingPoint");

const takeOffFrameInfo = document.getElementById("takeOffFrameInfo");
const landingFrameInfo = document.getElementById("landingFrameInfo");

const currentFrameInfo = document.getElementById("currentFrameInfo");
const frameDifferenceInfo = document.getElementById("frameDifferenceInfo");
const flightTimeInfo = document.getElementById("flightTimeInfo");
const jumpHeightInfo = document.getElementById("jumpHeightInfo");

const unlockBtn = document.getElementById("unlockBtn");
const lockInfo = document.getElementById("lockInfo");

let selectionStep = 0;
let isSelectionLocked = false;

let takeOffFrame = null;
let landingFrame = null;

function getFPS() {
  const fps = Number(fpsInput.value);

  if (!fps || fps <= 0) {
    return 30;
  }

  return fps;
}

function getFrameTime() {
  return 1 / getFPS();
}

function getCurrentFrame() {
  return Math.round(video.currentTime * getFPS());
}

function updateCurrentFrameInfo() {
  currentFrameInfo.textContent = getCurrentFrame();
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

function calculateCMJ() {
  if (takeOffFrame === null || landingFrame === null) {
    return;
  }

  const frameDifference = landingFrame - takeOffFrame;

  if (frameDifference <= 0) {
    frameDifferenceInfo.textContent = "Hatalı";
    flightTimeInfo.textContent = "-";
    jumpHeightInfo.textContent = "-";
    return;
  }

  const flightTime = frameDifference / getFPS();

  const jumpHeightMeter = 9.81 * Math.pow(flightTime, 2) / 8;
  const jumpHeightCm = jumpHeightMeter * 100;

  frameDifferenceInfo.textContent = frameDifference;
  flightTimeInfo.textContent = flightTime.toFixed(3);
  jumpHeightInfo.textContent = jumpHeightCm.toFixed(2);
}

function resetSelections() {
  selectionStep = 0;
  isSelectionLocked = false;

  takeOffFrame = null;
  landingFrame = null;

  takeOffPoint.value = "0, 0";
  landingPoint.value = "0, 0";

  takeOffFrameInfo.textContent = "-";
  landingFrameInfo.textContent = "-";

  frameDifferenceInfo.textContent = "-";
  flightTimeInfo.textContent = "-";
  jumpHeightInfo.textContent = "-";

  lockInfo.textContent = "Take-off seç";
}

videoInput.addEventListener("change", function () {
  const file = videoInput.files[0];

  if (file) {
    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;

    resetSelections();
    currentFrameInfo.textContent = "0";
    timeInfo.textContent = "0.00";
  }
});

playPauseBtn.addEventListener("click", function () {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

normalSpeedBtn.addEventListener("click", function () {
  video.playbackRate = 1;
  speedInfo.textContent = "1x";
});

slowSpeedBtn.addEventListener("click", function () {
  video.playbackRate = 0.25;
  speedInfo.textContent = "0.25x";
});

prevFrameBtn.addEventListener("click", function () {
  video.pause();
  video.currentTime = Math.max(0, video.currentTime - getFrameTime());
  updateCurrentFrameInfo();
});

nextFrameBtn.addEventListener("click", function () {
  video.pause();
  video.currentTime = Math.min(video.duration, video.currentTime + getFrameTime());
  updateCurrentFrameInfo();
});

video.addEventListener("timeupdate", function () {
  timeInfo.textContent = video.currentTime.toFixed(2);
  updateCurrentFrameInfo();
});

video.addEventListener("mousemove", function (event) {
  const coordinates = getVideoCoordinates(event);

  xCoordinate.value = coordinates.x;
  yCoordinate.value = coordinates.y;
});

video.addEventListener("mouseleave", function () {
  xCoordinate.value = 0;
  yCoordinate.value = 0;
});

video.addEventListener("click", function (event) {
  if (!event.shiftKey) {
    return;
  }

  if (isSelectionLocked) {
    return;
  }

  video.pause();

  const coordinates = getVideoCoordinates(event);
  const coordinateText = `${coordinates.x}, ${coordinates.y}`;
  const currentFrame = getCurrentFrame();

  if (selectionStep === 0) {
    takeOffPoint.value = coordinateText;
    takeOffFrame = currentFrame;
    takeOffFrameInfo.textContent = takeOffFrame;

    selectionStep = 1;
    lockInfo.textContent = "Landing seç";

    return;
  }

  if (selectionStep === 1) {
    landingPoint.value = coordinateText;
    landingFrame = currentFrame;
    landingFrameInfo.textContent = landingFrame;

    selectionStep = 2;
    isSelectionLocked = true;
    lockInfo.textContent = "Kilitli";

    calculateCMJ();
  }
});

fpsInput.addEventListener("input", function () {
  updateCurrentFrameInfo();
  calculateCMJ();
});

unlockBtn.addEventListener("click", function () {
  resetSelections();
});