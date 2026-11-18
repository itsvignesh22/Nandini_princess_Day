/* Shared Princess Day music controller.
   Edit MUSIC_URL once below. Navigation saves playback position and resumes it
   on the next page. Browsers may require a tap before the first playback. */
(function () {
  "use strict";
  const MUSIC_URL = "./iiage/music.mp3"; // EDIT: "assets/audio/our-song.mp3"
  const KEY = "princessDayMusicState";
  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = true;
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (_) {}
  const source = MUSIC_URL.trim();
  if (source) {
    audio.src = source;
    if (saved.src === source && Number.isFinite(saved.time)) {
      audio.addEventListener("loadedmetadata", function restore() {
        audio.removeEventListener("loadedmetadata", restore);
        try { audio.currentTime = Math.min(saved.time, Math.max(0, audio.duration - 0.25)); } catch (_) {}
        if (saved.playing) audio.play().catch(function () {});
      });
    } else if (saved.playing) {
      audio.addEventListener("canplay", function firstPlay() {
        audio.removeEventListener("canplay", firstPlay);
        audio.play().catch(function () {});
      });
    }
  }

  function save() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        src: source,
        time: source ? (audio.currentTime || 0) : 0,
        playing: source ? !audio.paused : false
      }));
    } catch (_) {}
  }
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") save();
  });

  window.PrincessMusic = {
    audio: audio,
    hasSource: !!source,
    play: function () {
      if (!source) return Promise.resolve(false);
      return audio.play().then(function () { save(); return true; }).catch(function () { save(); return false; });
    },
    pause: function () { audio.pause(); save(); },
    toggle: function () {
      if (!source) return Promise.resolve(false);
      if (audio.paused) return this.play();
      this.pause(); return Promise.resolve(true);
    },
    startFromGesture: function () { if (source && audio.paused) this.play(); },
    save: save
  };
  // Any first user interaction can satisfy Android Chrome's autoplay policy.
  document.addEventListener("pointerdown", function unlock() {
    if (source && saved.playing && audio.paused) audio.play().catch(function () {});
    document.removeEventListener("pointerdown", unlock);
  }, { once: true, passive: true });
})();