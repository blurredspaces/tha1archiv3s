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

    function play(n) {
      v.src = reels()[n];
      // Assigning src starts a fresh load, and a play() issued in the same
      // tick is aborted by it — the promise rejects and the reel sits on its
      // first frame. Wait until the element can actually play.
      if (v.readyState >= 3) start();
      else v.addEventListener('canplay', start, { once: true });
    }

    function start() {
      var p = v.play();
      // autoplay may still be deferred until the tab is visible — not an error
      if (p && p.catch) p.catch(function () {});
    }

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
