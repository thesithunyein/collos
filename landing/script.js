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
