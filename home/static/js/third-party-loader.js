(function () {
  'use strict';

  var STORAGE_KEY = 'ect_optional_cookie_consent';
  var banner = document.getElementById('ectConsent');
  var settingsButton = document.querySelector('[data-consent-settings]');
  var optionalLoaded = false;
  var salesIqLoaded = false;

  function syncConsentSpace() {
    if (!banner || banner.hidden) {
      document.documentElement.style.removeProperty('--ect-consent-space');
      document.body.classList.remove('ect-consent-open');
      return;
    }
    document.body.classList.add('ect-consent-open');
    document.documentElement.style.setProperty(
      '--ect-consent-space',
      Math.ceil(banner.getBoundingClientRect().height + 32) + 'px'
    );
  }

  function placeSettingsInFooter() {
    if (!settingsButton) return;
    var bottomBar = document.querySelector('.ect-bottom-bar');
    if (!bottomBar || settingsButton.parentElement === bottomBar) return;
    bottomBar.appendChild(settingsButton);
    settingsButton.classList.add('ect-cookie-settings--in-footer');
  }

  function readChoice() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch (error) { return null; }
  }

  function saveChoice(choice) {
    try { window.localStorage.setItem(STORAGE_KEY, choice); }
    catch (error) { /* The choice still applies for this page view. */ }
  }

  function setBanner(open) {
    if (!banner) return;
    banner.hidden = !open;
    banner.classList.toggle('is-visible', open);
    if (settingsButton) settingsButton.hidden = open;
    window.requestAnimationFrame(syncConsentSpace);
  }

  function loadSalesIq() {
    if (salesIqLoaded || document.getElementById('zsiqscript')) return;
    if (window.ectThirdPartyConfig && window.ectThirdPartyConfig.salesIqUrl) {
      salesIqLoaded = true;
      window.$zoho = window.$zoho || {};
      window.$zoho.salesiq = window.$zoho.salesiq || { ready: function () {} };
      var salesIqScript = document.createElement('script');
      salesIqScript.id = 'zsiqscript';
      salesIqScript.defer = true;
      salesIqScript.src = window.ectThirdPartyConfig.salesIqUrl;
      document.body.appendChild(salesIqScript);
    }
  }

  function loadOptionalServices() {
    if (optionalLoaded) return;
    optionalLoaded = true;

    if (typeof window.gtag === 'function' && window.ectGoogleTagId) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date());
      window.gtag('config', window.ectGoogleTagId);
      var googleScript = document.createElement('script');
      googleScript.async = true;
      googleScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(window.ectGoogleTagId);
      document.head.appendChild(googleScript);
    }

  }

  function choose(choice) {
    saveChoice(choice);
    setBanner(false);
    if (settingsButton) {
      placeSettingsInFooter();
      settingsButton.hidden = false;
    }
    if (choice === 'granted') loadOptionalServices();
  }

  if (banner) {
    banner.querySelector('[data-consent-accept]').addEventListener('click', function () { choose('granted'); });
    banner.querySelector('[data-consent-essential]').addEventListener('click', function () { choose('denied'); });
  }
  if (settingsButton) settingsButton.addEventListener('click', function () { setBanner(true); });

  loadSalesIq();

  var choice = readChoice();
  if (choice === 'granted') {
    loadOptionalServices();
    if (settingsButton) {
      placeSettingsInFooter();
      settingsButton.hidden = false;
    }
  } else if (choice === 'denied') {
    if (settingsButton) {
      placeSettingsInFooter();
      settingsButton.hidden = false;
    }
  } else {
    setBanner(true);
  }

  window.addEventListener('resize', syncConsentSpace);

  var biginScript = document.getElementById('wf_script');
  var biginForm = document.querySelector('.ect-bigin-form');
  function loadBigin() {
    if (!biginScript || biginScript.src || !biginScript.dataset.src) return;
    biginScript.src = biginScript.dataset.src;
    biginScript.removeAttribute('data-src');
  }
  if (biginForm) {
    biginForm.addEventListener('focusin', loadBigin, { once: true });
    biginForm.addEventListener('pointerdown', loadBigin, { once: true });
  }
})();
