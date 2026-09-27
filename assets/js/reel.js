/* Montage rotation, shared by every page that shows one.

   Three cuts per device: portrait framing below Tailwind's md line, the
   landscape cuts above it. Start on a random one so repeat visits differ,
   then rotate through the rest. Only the current cut is fetched, so this
   costs no more bandwidth than a single reel and a phone never pulls down
   the desktop framing.

   Lives in one file because the clip lists would otherwise be duplicated
   across pages, and swapping a clip would mean remembering every copy. */
(function () {
  var DESKTOP = [
    'assets/video/Main_Page_Montage_ver1.mp4',
    'assets/video/Main_Page_Montage_ver2.mp4',
    'assets/video/Main_Page_Montage_ver3.mp4'
  ];
  var MOBILE = [
    'assets/video/hp_Montage_1.mp4',
    'assets/video/hp_Montage_2.mp4',
    'assets/video/hp_Montage_3.mp4'
  ];

  // 767px is Tailwind's md boundary, so the reel switches on the same line
  // the rest of the layout does
  var narrow = window.matchMedia('(max-width: 767px)');
  function reels() { return narrow.matches ? MOBILE : DESKTOP; }

  document.querySelectorAll('video[data-reel]').forEach(function (v) {
    var i = Math.floor(Math.random() * 3);
    var waiting = false;

    function play(n) {
      v.src = reels()[n];
      // the src assignment has already started a load
      whenReady();
    }

    // Assigning src starts a fresh load, and a play() issued in the same tick
    // is aborted by it — the promise rejects and the reel sits on its first
    // frame. Wait until the element can actually play.
    function whenReady() {
      if (v.readyState >= 3) { start(); return; }
      if (waiting) return;                 // one pending listener is enough
      waiting = true;
      v.addEventListener('canplay', function () {
        waiting = false;
        start();
      }, { once: true });
    }

    function start() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        /* Refused. Low Power Mode on iOS blocks autoplay outright, muted or
           not; so does a per-site Auto-Play:Never, a background tab and data
           saver. The element stays on its poster, which is what the browser
           draws its own play button over. Nothing to do here — the hooks
           below try again when the refusal may have lifted. */
      });
    }

    // A refusal is not permanent. Try again when the tab comes forward, and
    // on the first real gesture: browsers allow playback from inside a user
    // gesture even while autoplay is blocked. On the home page that covers
    // the padlock click, which every visitor makes before seeing the reel.
    function retry() {
      if (!v.paused) return;
      // NETWORK_LOADING is 2; if nothing is buffered and nothing is in
      // flight, the browser never started fetching — nudge it
      if (v.readyState < 3 && v.networkState !== 2) v.load();
      whenReady();
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) retry();
    });
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (evt) {
      document.addEventListener(evt, retry, { passive: true });
    });

    // no `loop` attribute: advance to the next cut instead of repeating. The
    // list is re-read here, so a rotated phone or a resized window picks up
    // the right set on the next cut rather than cutting away mid-play.
    v.addEventListener('ended', function () {
      i = (i + 1) % 3;
      play(i);
    });

    play(i);
  });
})();
