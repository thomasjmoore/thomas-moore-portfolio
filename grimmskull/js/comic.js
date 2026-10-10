// Comic reader behavior: click/tap left or right half of the page to go
// prev/next, keyboard navigation (arrow keys / WASD), and touch swipe on
// mobile. All reuse the actual "Previous"/"Next" link hrefs already on
// the page (#nav-prev / #nav-next) rather than recomputing URLs, so
// navigation always matches wherever the visible buttons point.
document.addEventListener("DOMContentLoaded", function () {
  // The current ChromaVision mode (if any) rides along as a URL hash, so
  // it should survive every navigation - not just within the reader, but
  // clicking the header logo/Home/Archive/About too. The decision of
  // *which* mode to show on load already happened before first paint
  // (see the inline script in <head>, which sets this same class on
  // <html>) - this just needs to keep carrying the hash forward so the
  // theme-wide look (grainy background, grayscale logo/links) stays
  // consistent even on pages that have no per-page image toggle of their
  // own, like the cover or any page without B&W art yet.
  function withHash(url) {
    return url + window.location.hash;
  }

  document.querySelectorAll("header a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (!window.location.hash) return;
      e.preventDefault();
      window.location.href = withHash(link.href);
    });
  });

  var wrap = document.querySelector(".comic-page-wrap");
  if (!wrap) return;

  // ChromaVision pages stack two images in .page-stack instead of a single
  // <img> - click/tap navigation should hit that sized container instead,
  // since it (not either individual stacked image) now represents "the
  // image" at the usual 80%-of-column size.
  var img = wrap.querySelector(".page-stack") || wrap.querySelector("img");

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

  // First/Previous/Next/Last and "Jump to the first/latest page" are real
  // anchors with real hrefs (so they work without JS) - intercept only to
  // carry the current hash forward, same as the synthetic navigation above.
  document.querySelectorAll(".comic-nav a, .jump-first, .jump-last").forEach(function (link) {
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
  // is a no-op. The <html class="chroma-mode-bw"> toggle itself is the
  // single source of truth driving all the CSS (image opacity, switch
  // thumb/tab styling, page background, logo/link grayscale) - this just
  // keeps it, the switch's ARIA state, and the URL hash in sync. Nothing
  // here needs to suppress animation on load: the class was already set
  // correctly before first paint by the inline <head> script, so there's
  // no "wrong" state ever rendered to transition away from - a transition
  // only actually plays when a live click (or hashchange) changes it
  // after the page is already sitting there painted.
  var switchEl = document.querySelector(".mode-switch");
  var stack = document.querySelector(".page-stack");
  if (switchEl && stack) {
    var tabs = switchEl.querySelectorAll(".switch-tab");
    var HASH_BY_MODE = { bw: "#grittyinknoir", color: "#chromavision" };
    var currentMode = null;

    var modeFromHash = function () {
      var h = window.location.hash.toLowerCase();
      return h.indexOf("noir") !== -1 ? "bw" : "color";
    };

    var applyMode = function (mode, updateHash) {
      currentMode = mode;
      var isBw = mode === "bw";
      document.documentElement.classList.toggle("chroma-mode-bw", isBw);
      // also toggled directly on .mode-switch itself, not just the <html>
      // ancestor - iPadOS has a real bug where a transform several levels
      // below a class change on a FAR ancestor doesn't get recomputed on
      // a live toggle (fine on fresh load, just never animates after a
      // click); toggling the near parent too works around it.
      switchEl.classList.toggle("mode-bw", isBw);
      switchEl.classList.toggle("mode-color", !isBw);
      void switchEl.offsetWidth; // nudge a layout read in, just in case
      tabs.forEach(function (tab) {
        tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
      });
      if (updateHash) history.replaceState(null, "", HASH_BY_MODE[mode]);
    };

    applyMode(modeFromHash(), false);

    // someone edits the hash by hand, or uses back/forward across a hash change
    window.addEventListener("hashchange", function () {
      applyMode(modeFromHash(), false);
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (tab.dataset.mode !== currentMode) applyMode(tab.dataset.mode, true);
      });
    });
  }
});
