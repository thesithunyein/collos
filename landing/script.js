// Landing page behaviour. No dependencies, and every enhancement degrades to a
// working page: the anchors work without JavaScript, and <details> opens on its
// own, so nothing here is load-bearing.

// Smooth scrolling for in-page links, respecting a reduced-motion preference.
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (event) {
    var target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: smoothOrInstant() });
    closeMenu();
  });
});

function smoothOrInstant() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

// The frosted nav is translucent, which reads beautifully over white and badly
// over the dark product-tour band. Firm it up as soon as the page moves.
var navBar = document.querySelector(".glass-nav");
if (navBar) {
  var syncNav = function () {
    navBar.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });
}

// Mobile navigation: the pill nav cannot hold four links on a phone, so they
// live in a disclosure panel under it.
var toggle = document.querySelector(".nav-toggle");
var menu = document.getElementById("nav-links");

function closeMenu() {
  if (!toggle || !menu) return;
  menu.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
}

if (toggle && menu) {
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    menu.classList.toggle("is-open", !open);
    toggle.setAttribute("aria-expanded", String(!open));
  });

  document.addEventListener("click", function (event) {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  // A resize past the breakpoint restores the desktop nav; drop the state so
  // the panel cannot reappear already-open.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 780) closeMenu();
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
