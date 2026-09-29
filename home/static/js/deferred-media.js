/* Load decorative videos only when they are close to the viewport.
   Posters remain visible until loading starts, and autoplay resumes without
   requiring a click. This avoids downloading off-screen videos at page load. */
(function () {
  'use strict';

  var videos = document.querySelectorAll('video[data-deferred-video]');
  if (!videos.length) return;

  function loadVideo(video) {
    if (video.dataset.mediaLoaded === 'true') return;

    video.querySelectorAll('source[data-src]').forEach(function (source) {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });

    if (video.dataset.src) {
      video.src = video.dataset.src;
      video.removeAttribute('data-src');
    }

    video.dataset.mediaLoaded = 'true';
    video.load();

    if (video.dataset.autoplay === 'true') {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          /* Browsers may defer autoplay in power-saving modes. */
        });
      }
    }
  }

  if (!('IntersectionObserver' in window)) {
    videos.forEach(loadVideo);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '400px 0px', threshold: 0.01 });

  videos.forEach(function (video) {
    observer.observe(video);
  });
})();
