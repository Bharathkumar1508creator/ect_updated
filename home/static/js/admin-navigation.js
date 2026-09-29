(function () {
  'use strict';

  var navigationSelector = [
    '#nav-sidebar a[href]',
    'body.dashboard #content-main .module a[href]',
    'body.app-index #content-main .module a[href]'
  ].join(', ');
  var activeRequest = null;

  function isEligibleLink(link, event) {
    if (!link || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target || link.hasAttribute('download')) return false;
    var url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin && url.pathname.indexOf('/admin/') === 0;
  }

  function addMissingStyles(parsed) {
    parsed.querySelectorAll('link[rel="stylesheet"][href]').forEach(function (link) {
      var href = new URL(link.href, window.location.href).href;
      if (!document.querySelector('link[rel="stylesheet"][href="' + CSS.escape(href) + '"]')) {
        var copy = document.createElement('link');
        copy.rel = 'stylesheet';
        copy.href = href;
        document.head.appendChild(copy);
      }
    });
  }

  async function loadMissingScripts(parsed) {
    var loaded = new Set(Array.from(document.scripts).filter(function (script) {
      return script.src;
    }).map(function (script) {
      return script.src;
    }));
    var sources = Array.from(parsed.head.querySelectorAll('script[src]')).map(function (script) {
      return new URL(script.src, window.location.href).href;
    });
    for (var index = 0; index < sources.length; index += 1) {
      var source = sources[index];
      if (loaded.has(source)) continue;
      await new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      loaded.add(source);
    }
  }

  function activateContentScripts(container) {
    container.querySelectorAll('script').forEach(function (oldScript) {
      var script = document.createElement('script');
      Array.from(oldScript.attributes).forEach(function (attribute) {
        script.setAttribute(attribute.name, attribute.value);
      });
      script.textContent = oldScript.textContent;
      oldScript.replaceWith(script);
    });
  }

  async function copyPageState(parsed) {
    var incomingContent = parsed.querySelector('#content');
    var currentContent = document.querySelector('#content');
    if (!incomingContent || !currentContent) return false;
    currentContent.replaceWith(incomingContent);

    var currentBreadcrumbs = document.querySelector('div.breadcrumbs');
    var incomingBreadcrumbs = parsed.querySelector('div.breadcrumbs');
    if (currentBreadcrumbs && incomingBreadcrumbs) currentBreadcrumbs.replaceWith(incomingBreadcrumbs);
    else if (currentBreadcrumbs && !incomingBreadcrumbs) currentBreadcrumbs.remove();

    var currentSidebar = document.querySelector('#nav-sidebar');
    var incomingSidebar = parsed.querySelector('#nav-sidebar');
    if (currentSidebar && incomingSidebar) currentSidebar.replaceWith(incomingSidebar);

    document.title = parsed.title;
    document.body.className = parsed.body.className;
    addMissingStyles(parsed);
    await loadMissingScripts(parsed);
    activateContentScripts(document.querySelector('#content'));
    document.dispatchEvent(new CustomEvent('ect:admin-page-updated'));
    return true;
  }

  async function navigate(url, addHistory) {
    if (activeRequest) activeRequest.abort();
    activeRequest = new AbortController();
    document.body.setAttribute('aria-busy', 'true');
    try {
      var response = await fetch(url, {
        credentials: 'same-origin',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        signal: activeRequest.signal
      });
      if (!response.ok) throw new Error('Admin navigation failed');
      var parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (!(await copyPageState(parsed))) throw new Error('Admin page structure changed');
      var finalUrl = response.url || url;
      if (addHistory) window.history.pushState({adminPartial: true}, '', finalUrl);
      window.scrollTo({top: 0, behavior: 'auto'});
    } catch (error) {
      if (error.name !== 'AbortError') window.location.assign(url);
    } finally {
      activeRequest = null;
      document.body.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest(navigationSelector);
    if (!isEligibleLink(link, event)) return;
    event.preventDefault();
    navigate(link.href, true);
  });

  window.addEventListener('popstate', function () {
    navigate(window.location.href, false);
  });
})();
