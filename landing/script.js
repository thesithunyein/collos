// Landing page behaviour. No dependencies, and every enhancement degrades to a
// working page: the anchors work without JavaScript, and <details> opens on its
// own, so nothing here is load-bearing.

// Smooth scrolling for in-page links, respecting a reduced-motion preference.
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (event) {
    var target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    // The mobile overlay locks page scrolling while it is open, so it has to be
    // dismissed before the scroll is asked for — hence the next frame.
    var wasOpen = closeMenu();
    var scroll = function () {
      target.scrollIntoView({ behavior: smoothOrInstant() });
    };
    if (wasOpen) requestAnimationFrame(scroll);
    else scroll();
  });
});

function smoothOrInstant() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

// Mobile navigation: the bar cannot hold four links on a phone, so they move
// into a full-screen overlay behind a hamburger. Returns whether it was open.
var burger = document.getElementById("hamburger");
var overlay = document.getElementById("mobile-nav");

function closeMenu() {
  if (!burger || !overlay) return false;
  var wasOpen = overlay.classList.contains("open");
  overlay.classList.remove("open");
  burger.classList.remove("active");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Open menu");
  document.body.classList.remove("nav-open");
  return wasOpen;
}

if (burger && overlay) {
  burger.addEventListener("click", function () {
    var open = burger.getAttribute("aria-expanded") === "true";
    overlay.classList.toggle("open", !open);
    burger.classList.toggle("active", !open);
    burger.setAttribute("aria-expanded", String(!open));
    burger.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    document.body.classList.toggle("nav-open", !open);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  // A resize past the breakpoint restores the desktop bar; drop the state so
  // the overlay cannot reappear already-open.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) closeMenu();
  });
}

// Hero depth.
//
// The phone tilts by two or three degrees and drifts a few pixels against the
// pointer, and the aurora behind it travels the other way — more than twice as
// far, at the same time. That difference is the whole effect: two layers moving
// in opposite directions at different rates is what the eye reads as depth,
// which is the thing a flat picture of a device cannot do. Values are small on
// purpose — a hero that swings around is a trick, a hero that leans is a
// material.
//
// The pointer also drives two things the CSS cannot: a pool of brand light that
// follows the cursor, and the lit half of the dot field (the mask of
// `.hero-grid-hot` is positioned by `--gx`/`--gy`). Both are switched on by the
// `aiming` class, so nothing is visible before a pointer arrives and nothing is
// left on screen after it leaves.
//
// The travelling aurora is `.aurora-a` specifically. It spins with the CSS
// `rotate` property rather than `transform`, which leaves `transform` free for
// this loop — one element, two movements, and neither overrides the other.
//
// Pointer-only, and skipped entirely under `prefers-reduced-motion`, where the
// page is already still: no layer moves, and no frame loop runs at all.
(function heroDepth() {
  var hero = document.querySelector(".hero");
  var glow = document.querySelector(".hero-glow");
  var phone = document.querySelector(".hero-phone-body");
  var aurora = document.querySelector(".aurora-a");
  var spot = document.querySelector(".hero-spot");
  if (!hero || (!phone && !aurora && !spot)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var target = { x: 0, y: 0 };
  var shown = { x: 0, y: 0 };
  // The light is eased separately from the layers, and much faster: it should
  // feel attached to the cursor, while what it lights lags behind it.
  var light = { x: 0.5, y: 0.46 };
  var aim = { x: 0.5, y: 0.46 };
  var box = { width: 0, height: 0, left: 0, top: 0 };
  var hot = { x: -1, y: -1 };
  var running = false;
  var last = 0;

  function draw(now) {
    // Eased toward the pointer rather than pinned to it, so the layers settle
    // instead of snapping and a fast cursor still moves them smoothly.
    //
    // The step is derived from the frame's own duration — `1 - e^(-dt/tau)` —
    // rather than being a fixed fraction per frame. A fixed fraction is the
    // usual shortcut and it makes the same code feel different on every
    // display: it crawls on a throttled tab, and on a 120Hz phone it arrives in
    // half the time it does on a 60Hz one. The clamp keeps a tab that was
    // backgrounded for a second from teleporting the layers on its first frame.
    var dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    var k = 1 - Math.exp(-dt / 90);
    var kLight = 1 - Math.exp(-dt / 45);
    shown.x += (target.x - shown.x) * k;
    shown.y += (target.y - shown.y) * k;
    light.x += (aim.x - light.x) * kLight;
    light.y += (aim.y - light.y) * kLight;

    if (phone) {
      phone.style.transform =
        "perspective(1200px) translate3d(" +
        (shown.x * -12).toFixed(2) + "px," + (shown.y * -12).toFixed(2) + "px,0)" +
        " rotateY(" + (shown.x * 4).toFixed(2) + "deg)" +
        " rotateX(" + (shown.y * -4).toFixed(2) + "deg)";
    }
    if (aurora) {
      // No centring offset here: the layer is centred by its own `translate`, so
      // this `transform` only has to carry the drift. Writing the -50%, -50% in
      // here as well would centre it twice — and, worse, a `rotate` animation on
      // a child would then swing the layer around the wrong anchor.
      aurora.style.transform =
        "translate3d(" + (shown.x * 34).toFixed(2) + "px," + (shown.y * 34).toFixed(2) + "px,0)";
    }
    if (spot) {
      spot.style.transform =
        "translate3d(" + (light.x * box.width).toFixed(1) + "px," +
        (light.y * box.height).toFixed(1) + "px,0)";
      // Only rewrite the mask when the light has actually travelled: setting a
      // custom property re-parses the mask image, so doing it on every frame of
      // a still cursor would repaint the field for no reason.
      if (glow && (Math.abs(light.x - hot.x) > 0.004 || Math.abs(light.y - hot.y) > 0.004)) {
        hot.x = light.x;
        hot.y = light.y;
        glow.style.setProperty("--gx", (light.x * 100).toFixed(2) + "%");
        glow.style.setProperty("--gy", (light.y * 100).toFixed(2) + "%");
      }
    }

    var settled =
      Math.abs(target.x - shown.x) < 0.0015 && Math.abs(target.y - shown.y) < 0.0015 &&
      Math.abs(aim.x - light.x) < 0.0015 && Math.abs(aim.y - light.y) < 0.0015;
    if (settled) {
      running = false;
      return;
    }
    requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    requestAnimationFrame(draw);
  }

  function measure() {
    var rect = hero.getBoundingClientRect();
    box.width = rect.width;
    box.height = rect.height;
    box.left = rect.left;
    box.top = rect.top;
    return rect;
  }

  hero.addEventListener("pointermove", function (event) {
    var rect = measure();
    if (!rect.width || !rect.height) return;
    target.x = (event.clientX - rect.left) / rect.width - 0.5;
    target.y = (event.clientY - rect.top) / rect.height - 0.5;
    aim.x = (event.clientX - rect.left) / rect.width;
    aim.y = (event.clientY - rect.top) / rect.height;
    if (glow) glow.classList.add("aiming");
    start();
  });
  // Leaving the hero lets every layer ease back to rest rather than freezing
  // wherever the pointer happened to exit, and takes the light with it.
  hero.addEventListener("pointerleave", function () {
    target.x = 0;
    target.y = 0;
    if (glow) glow.classList.remove("aiming");
    start();
  });
})();

// Arrival.
//
// Blocks marked `data-reveal` are faded up once, when they first come into
// view. The classes that do the hiding are added here rather than written in the
// markup, so a reader whose script never loads — or who has asked for reduced
// motion — gets the whole page composed and visible. There is no entrance worth
// shipping that can leave content invisible.
//
// Once the transition has run, both classes come off again. That matters more
// than it sounds: `.reveal-in` carries a 720ms transition, and leaving it on a
// card would slow every hover lift on the card's own children to a crawl.
(function arrival() {
  var blocks = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!blocks.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  blocks.forEach(function (block) {
    var siblings = Array.prototype.filter.call(block.parentNode.children, function (node) {
      return node.hasAttribute && node.hasAttribute("data-reveal");
    });
    var delay = Math.min(siblings.indexOf(block), 3) * 80;
    block.style.setProperty("--reveal-delay", delay + "ms");
    block.classList.add("reveal");
  });

  var pending = blocks.slice();

  function show(block) {
    var delay = parseInt(block.style.getPropertyValue("--reveal-delay"), 10) || 0;
    block.classList.add("reveal-in");
    window.setTimeout(function () {
      block.classList.remove("reveal", "reveal-in");
      block.style.removeProperty("--reveal-delay");
    }, 760 + delay);
  }

  // An element counts as arrived once its top has crossed 88% of the viewport,
  // which is late enough that it has genuinely been seen coming and early
  // enough that nothing is still mid-fade as the reader reaches it.
  function arrived(block) {
    var rect = block.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.88 && rect.bottom > 0;
  }

  // A sweep on scroll, rather than an IntersectionObserver.
  //
  // The observer would be the tidier instrument and it is what this started as,
  // but the entrance it drives is load-bearing: an observer that does not report
  // — which is not hypothetical, it is what this page did in the environment it
  // was built in — leaves every section below the fold at `opacity: 0` forever.
  // Fifteen elements read once per frame while scrolling, and not at all after
  // the last one has arrived, is a price worth paying for an entrance that
  // cannot swallow the page it is decorating.
  function sweep() {
    pending = pending.filter(function (block) {
      if (!arrived(block)) return true;
      show(block);
      return false;
    });
    if (pending.length) return;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }

  // Straight from the event, with no `requestAnimationFrame` in between: the
  // browser already coalesces scroll to one event per frame, and a rAF queue on
  // top of it only adds a way for the sweep to be skipped — which is exactly
  // what happened the first time this ran somewhere that throttles callbacks.
  function onScroll() {
    sweep();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  // Once at the end of the script, for anything already on screen — a reader who
  // arrives mid-page from a back navigation, or a landscape phone — and once more
  // when the layout is final, since fonts and images can move the blocks after
  // the first pass has already decided they were not there.
  sweep();
  window.addEventListener("load", sweep);
  window.setTimeout(sweep, 1200);
})();

// One FAQ answer open at a time. `details[name]` does this natively in current
// browsers; this keeps the same behaviour where it is not supported yet.
var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
var supportsNameGroups = "name" in document.createElement("details");
if (!supportsNameGroups) {
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });
}
