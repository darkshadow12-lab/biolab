const videoInput = document.getElementById("videoInput");

const video = document.getElementById("video");

const playPauseBtn = document.getElementById("playPauseBtn");

const normalSpeedBtn = document.getElementById("normalSpeedBtn");

const slowSpeedBtn = document.getElementById("slowSpeedBtn");

const prevFrameBtn = document.getElementById("prevFrameBtn");

const nextFrameBtn = document.getElementById("nextFrameBtn");

const speedInfo = document.getElementById("speedInfo");

const timeInfo = document.getElementById("timeInfo");


// Ortalama 30 FPS varsayımı
const frameTime = 1 / 30;


// Video yükleme
videoInput.addEventListener("change", function () {

  const file = videoInput.files[0];

  if (file) {

    const videoURL = URL.createObjectURL(file);

    video.src = videoURL;
  }
});


// Oynat / Durdur
playPauseBtn.addEventListener("click", function () {

  if (video.paused) {

    video.play();

  } else {

    video.pause();
  }
});


// Normal hız
normalSpeedBtn.addEventListener("click", function () {

  video.playbackRate = 1;

  speedInfo.textContent = "1x";
});


// 0.25 hız
slowSpeedBtn.addEventListener("click", function () {

  video.playbackRate = 0.25;

  speedInfo.textContent = "0.25x";
});


// Kare geri
prevFrameBtn.addEventListener("click", function () {

  video.pause();

  video.currentTime =
    Math.max(0, video.currentTime - frameTime);
});


// Kare ileri
nextFrameBtn.addEventListener("click", function () {

  video.pause();

  video.currentTime =
    Math.min(video.duration,
      video.currentTime + frameTime);
});


// Süre bilgisini güncelle
video.addEventListener("timeupdate", function () {

  timeInfo.textContent =
    video.currentTime.toFixed(2);
});