// Comic reader behavior: click/tap left or right half of the page to go
// prev/next, keyboard navigation (arrow keys / WASD), and touch swipe on
// mobile. All reuse the actual "Previous"/"Next" link hrefs already on
// the page (#nav-prev / #nav-next) rather than recomputing URLs, so
// navigation always matches wherever the visible buttons point.
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.querySelector(".comic-page-wrap");
  if (!wrap) return;

  var img = wrap.querySelector("img");

  function goPrev() {
    var prev = document.getElementById("nav-prev");
    if (prev) window.location.href = prev.href;
  }

  function goNext() {
    var next = document.getElementById("nav-next");
    if (next) window.location.href = next.href;
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
});
