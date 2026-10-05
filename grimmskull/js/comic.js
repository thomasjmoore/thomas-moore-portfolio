// Comic reader behavior: click/tap left or right half of the page to go
// prev/next, keyboard navigation (arrow keys / WASD), and touch swipe on
// mobile. All reuse the actual "Previous"/"Next" link hrefs already on
// the page (#nav-prev / #nav-next) rather than recomputing URLs, so
// navigation always matches wherever the visible buttons point.
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.querySelector(".comic-page-wrap");
  if (!wrap) return;

  // ChromaVision pages stack two images in .page-stack instead of a single
  // <img> - click/tap navigation should hit that sized container instead,
  // since it (not either individual stacked image) now represents "the
  // image" at the usual 80%-of-column size.
  var img = wrap.querySelector(".page-stack") || wrap.querySelector("img");

  // the current ChromaVision mode (if any) rides along as a URL hash, so
  // it should survive every page navigation, not just this reader's own
  // click-to-navigate - appended wherever we send the browser onward.
  function withHash(url) {
    return url + window.location.hash;
  }

  function goPrev() {
    var prev = document.getElementById("nav-prev");
    if (prev) window.location.href = withHash(prev.href);
  }

  function goNext() {
    var next = document.getElementById("nav-next");
    if (next) window.location.href = withHash(next.href);
  }

  // click/tap left half = previous, right half = next
  if (img) {
    img.style.cursor = "pointer";
    img.addEventListener("click", function (e) {
      if (justSwiped) return; // a swipe gesture already handled navigation
      var rect = img.getBoundingClientRect();
      var clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) {
        goPrev();
      } else {
        goNext();
      }
    });
  }

  // First/Previous/Next/Last and "Jump to the first page" are real anchors
  // with real hrefs (so they work without JS) - intercept only to carry
  // the current hash forward, same as the synthetic navigation above.
  document.querySelectorAll(".comic-nav a, .jump-first").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (!window.location.hash) return;
      e.preventDefault();
      window.location.href = withHash(link.href);
    });
  });

  // keyboard
  document.addEventListener("keydown", function (e) {
    // don't hijack typing if focus is ever in a form field
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    var key = e.key.toLowerCase();
    if (key === "arrowright" || key === "d") {
      goNext();
    } else if (key === "arrowleft" || key === "a") {
      goPrev();
    }
  });

  // touch swipe
  var touchStartX = 0;
  var touchStartY = 0;
  var justSwiped = false;
  var SWIPE_MIN_DISTANCE = 60; // px
  var SWIPE_MAX_OFF_AXIS = 80; // px of vertical drift still counted as a horizontal swipe

  wrap.addEventListener(
    "touchstart",
    function (e) {
      var t = e.changedTouches[0];
      touchStartX = t.screenX;
      touchStartY = t.screenY;
    },
    { passive: true }
  );

  wrap.addEventListener(
    "touchend",
    function (e) {
      var t = e.changedTouches[0];
      var dx = t.screenX - touchStartX;
      var dy = t.screenY - touchStartY;

      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return; // too short, let it fall through to a tap/click
      if (Math.abs(dy) > SWIPE_MAX_OFF_AXIS) return; // mostly a vertical scroll

      justSwiped = true;
      setTimeout(function () {
        justSwiped = false;
      }, 400);

      if (dx < 0) {
        goNext(); // swiped left -> next page
      } else {
        goPrev(); // swiped right -> previous page
      }
    },
    { passive: true }
  );

  // ChromaVision mode toggle - only present on pages with a B&W
  // counterpart image (see comic-mode-switch.html / comic-page-image.html);
  // on every other page these elements don't exist and this whole block
  // is a no-op.
  var switchEl = document.querySelector(".mode-switch");
  var stack = document.querySelector(".page-stack");
  if (switchEl && stack) {
    var tabs = switchEl.querySelectorAll(".switch-tab");
    var imgColor = stack.querySelector(".img-color");
    var imgBw = stack.querySelector(".img-bw");
    var HASH_BY_MODE = { bw: "#grittyinknoir", color: "#chromavision" };
    var currentMode = "color";

    var modeFromHash = function () {
      var h = window.location.hash.toLowerCase();
      return h.indexOf("noir") !== -1 ? "bw" : "color";
    };

    var updateSwitchUI = function (mode, skipAnimation) {
      var isColor = mode === "color";
      if (skipAnimation) switchEl.classList.add("no-anim");
      switchEl.classList.toggle("mode-color", isColor);
      switchEl.classList.toggle("mode-bw", !isColor);
      tabs.forEach(function (tab) {
        tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
      });
      if (skipAnimation) {
        void switchEl.offsetHeight; // force reflow before re-enabling transitions
        requestAnimationFrame(function () {
          switchEl.classList.remove("no-anim");
        });
      }
    };

    var setMode = function (mode, opts) {
      opts = opts || {};
      if (mode === currentMode && !opts.force) return;

      var outgoing = currentMode === "color" ? imgColor : imgBw;
      var incoming = mode === "color" ? imgColor : imgBw;
      currentMode = mode;

      updateSwitchUI(mode, opts.skipAnimation);

      if (opts.skipAnimation) {
        outgoing.classList.remove("fade-curve");
        incoming.classList.remove("fade-curve");
      } else {
        outgoing.classList.add("fade-curve");
        incoming.classList.add("fade-curve");
      }
      outgoing.style.opacity = 0;
      incoming.style.opacity = 1;

      if (!opts.skipHashUpdate) {
        history.replaceState(null, "", HASH_BY_MODE[mode]);
      }
    };

    // land on the mode the URL asks for, instantly (no crossfade on load)
    setMode(modeFromHash(), { skipAnimation: true, skipHashUpdate: true, force: true });

    // someone edits the hash by hand, or uses back/forward across a hash change
    window.addEventListener("hashchange", function () {
      setMode(modeFromHash(), { skipAnimation: true, skipHashUpdate: true });
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setMode(tab.dataset.mode);
      });
    });
  }
});
