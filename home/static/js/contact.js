document.addEventListener('DOMContentLoaded', () => {
  const HQ = [77.01441, 11.09304];
  const mapContainer = document.getElementById('ectMap');
  if (!mapContainer || !window.maplibregl) return;

  const map = new maplibregl.Map({
    container: 'ectMap',
    style: {
      version: 8,
      sources: {
        carto: {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_2u21_1_c390fd4e755910721d43df49',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_2u21_1_c390fd4e755910721d43df49',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_2u21_1_c390fd4e755910721d43df49'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
      },
      layers: [{ id: 'carto-layer', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 22 }]
    },
    center: HQ,
    zoom: 16.5,
    pitch: 0,
    bearing: 0,
    scrollZoom: false,
    dragRotate: false,
    attributionControl: false
  });

  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  // Toggle card via the pin — click/tap (mobile) or hover (desktop, handled in CSS)
  const pin = document.getElementById('ectMapPin');
  const card = document.getElementById('ectMapCard');

  if (!pin || !card) return;

  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    card.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!pin.contains(e.target) && !card.contains(e.target)) {
      card.classList.remove('open');
    }
  });
});






// FAQ SECTION

document.addEventListener('DOMContentLoaded', function () {

  // ----- Accordion -----
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');

    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all others (accordion mode)
      items.forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ----- Scroll reveal with stagger -----
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (item) { item.classList.add('faq-in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var delay = entry.target.dataset.delay || 0;
        entry.target.style.animationDelay = delay + 'ms';
        entry.target.classList.add('faq-in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (item, i) {
    item.dataset.delay = (i % 2 === 0) ? (i * 60) : (i * 60 + 40);
    observer.observe(item);
  });

});

