(function () {
  'use strict';

  var carousel = document.getElementById('insightsCarousel');
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-insight-index]'));
  if (!carousel || !dots.length) return;

  var cards = Array.prototype.slice.call(carousel.querySelectorAll('.insight-card'));
  var mobileQuery = window.matchMedia('(max-width: 640px)');
  var ticking = false;

  function setActive(index) {
    dots.forEach(function (dot, dotIndex) {
      var active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function nearestCard() {
    if (!mobileQuery.matches) return;
    var left = carousel.getBoundingClientRect().left;
    var nearest = 0;
    var distance = Infinity;
    cards.forEach(function (card, index) {
      var current = Math.abs(card.getBoundingClientRect().left - left);
      if (current < distance) {
        distance = current;
        nearest = index;
      }
    });
    setActive(nearest);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      if (!cards[index]) return;
      cards[index].scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'start'
      });
      setActive(index);
    });
  });

  carousel.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      nearestCard();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', nearestCard, { passive: true });
  nearestCard();
}());
