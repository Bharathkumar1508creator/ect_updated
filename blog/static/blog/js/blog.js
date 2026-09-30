document.addEventListener('DOMContentLoaded', () => {
    // Replace missing media with the configured ECT fallback. If the fallback
    // itself is unavailable, hide the broken element cleanly.
    document.addEventListener('error', event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement)) return;
        const container = image.closest('[data-blog-fallback-image]');
        const fallback = image.dataset.fallbackSrc || (container && container.dataset.blogFallbackImage);
        if (fallback && image.getAttribute('src') !== fallback && image.dataset.fallbackAttempted !== 'true') {
            image.dataset.fallbackAttempted = 'true';
            image.src = fallback;
        } else if (image.dataset.fallbackAttempted === 'true') {
            image.hidden = true;
            const figure = image.closest('figure');
            if (figure) figure.classList.add('has-missing-media');
        }
    }, true);

    // Sticky table of contents: smooth navigation, current-section highlight,
    // and a compact collapsible version for smaller screens.
    const toc = document.querySelector('.blog-toc');
    if (toc) {
        const toggle = toc.querySelector('.blog-toc__toggle');
        const tocLinks = Array.from(toc.querySelectorAll('a[href^="#"]'));
        const sectionLinks = tocLinks.filter(link => link.getAttribute('href') !== '#blogArticle');

        if (window.matchMedia('(max-width: 900px)').matches) {
            toc.classList.add('is-collapsed');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }

        if (toggle) {
            toggle.addEventListener('click', () => {
                const collapsed = toc.classList.toggle('is-collapsed');
                toggle.setAttribute('aria-expanded', String(!collapsed));
            });
        }

        tocLinks.forEach(link => {
            link.addEventListener('click', event => {
                const target = document.querySelector(link.getAttribute('href'));
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                    block: 'start'
                });
                history.replaceState(null, '', link.getAttribute('href'));
                if (window.matchMedia('(max-width: 900px)').matches) {
                    toc.classList.add('is-collapsed');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    sectionLinks.forEach(link => link.classList.toggle(
                        'active', link.getAttribute('href') === '#' + entry.target.id
                    ));
                });
            }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
            sectionLinks.forEach(link => {
                const section = document.querySelector(link.getAttribute('href'));
                if (section) observer.observe(section);
            });
        }
    }

    // Article diagrams and photos can be expanded without navigating away.
    const articleImages = Array.from(document.querySelectorAll('.blog-article-content figure img'));
    if (articleImages.length) {
        const viewer = document.createElement('div');
        viewer.className = 'article-image-lightbox';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', 'Expanded article image');
        viewer.innerHTML = '<button type="button" aria-label="Close expanded image">&times;</button><img alt="">';
        document.body.appendChild(viewer);
        const viewerImage = viewer.querySelector('img');
        const closeButton = viewer.querySelector('button');
        let lastTrigger = null;

        const closeViewer = () => {
            viewer.classList.remove('is-open');
            document.body.style.overflow = '';
            if (lastTrigger) lastTrigger.focus();
        };
        const openViewer = image => {
            lastTrigger = image;
            viewerImage.src = image.currentSrc || image.src;
            viewerImage.alt = image.alt;
            viewer.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            closeButton.focus();
        };

        articleImages.forEach(image => {
            image.tabIndex = 0;
            image.setAttribute('role', 'button');
            image.setAttribute('aria-label', (image.alt || 'Article image') + ' — open larger view');
            image.addEventListener('click', () => openViewer(image));
            image.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openViewer(image);
                }
            });
        });
        closeButton.addEventListener('click', closeViewer);
        viewer.addEventListener('click', event => {
            if (event.target === viewer) closeViewer();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && viewer.classList.contains('is-open')) closeViewer();
        });
    }

    // The dedicated article newsletter form submits without leaving the blog.
    const articleNewsletter = document.querySelector('.blog-newsletter-form');
    if (articleNewsletter) {
        articleNewsletter.addEventListener('submit', event => {
            event.preventDefault();
            const message = articleNewsletter.querySelector('.newsletter-message');
            fetch(articleNewsletter.action, {
                method: 'POST',
                body: new FormData(articleNewsletter),
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(async response => ({ ok: response.ok, data: await response.json() }))
                .then(result => {
                    message.textContent = result.data.message;
                    message.className = 'newsletter-message ' + (result.ok ? 'success' : 'error');
                    if (result.ok) articleNewsletter.reset();
                })
                .catch(() => {
                    message.textContent = 'Subscription could not be completed. Please try again.';
                    message.className = 'newsletter-message error';
                });
        });
    }
    
    // Lightbox Functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryLinks = document.querySelectorAll('.lightbox-link');

    if (lightbox && galleryLinks.length > 0) {
        galleryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                lightbox.style.display = 'block';
                lightboxImg.src = this.href;
                lightboxCaption.innerHTML = this.getAttribute('data-caption') || '';
            });
        });

        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });

        // Close on clicking outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.style.display = 'none';
            }
        });
    }

    // Messages Auto-hide (if you have django messages)
    const messages = document.querySelectorAll('.blog-messages .alert');
    if (messages.length > 0) {
        setTimeout(() => {
            messages.forEach(msg => {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 300);
            });
        }, 5000);
    }

    // ---- Blog list: category tabs + search filter in place, no full page
    // reload. Delegated on document because the buttons/input themselves get
    // replaced on every swap; #blogContainer's own node stays put across swaps.
    let blogRequestId = 0;

    function loadBlogList(url, pushState, options) {
        options = options || {};
        const container = document.getElementById('blogContainer');
        if (!container) return;

        const requestId = ++blogRequestId;

        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => {
                if (!res.ok) throw new Error('Request failed');
                return res.text();
            })
            .then(html => {
                // A newer request has since started (e.g. the user kept
                // typing) — discard this now-stale response.
                if (requestId !== blogRequestId) return;

                container.innerHTML = html;
                if (pushState) {
                    history.pushState({ blogAjax: true }, '', url);
                }

                if (options.refocusSearch) {
                    const input = container.querySelector('.search-input');
                    if (input) {
                        input.focus();
                        const pos = input.value.length;
                        input.setSelectionRange(pos, pos);
                    }
                }
            })
            .catch(() => {
                // Fall back to a normal navigation if the fetch fails.
                window.location.href = url;
            });
    }

    function updateBlogCounts(container) {
        const grid = container.querySelector('[data-blog-grid]');
        if (!grid) return;
        const visible = container.querySelector('[data-blog-visible-count]');
        const total = container.querySelector('[data-blog-total]');
        const count = grid.querySelectorAll('.card').length;
        if (visible) visible.textContent = count;
        if (total) total.textContent = grid.dataset.totalResults || count;
    }

    function loadMoreBlogs(link) {
        const container = document.getElementById('blogContainer');
        const grid = container && container.querySelector('[data-blog-grid]');
        if (!container || !grid) return;

        link.classList.add('is-loading');
        link.setAttribute('aria-disabled', 'true');
        const label = link.querySelector('[data-blog-load-more-label]');
        if (label) label.textContent = 'Loading…';

        fetch(link.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => {
                if (!res.ok) throw new Error('Request failed');
                return res.text();
            })
            .then(html => {
                const parsed = new DOMParser().parseFromString(html, 'text/html');
                const nextGrid = parsed.querySelector('[data-blog-grid]');
                if (!nextGrid) throw new Error('Blog grid missing');
                const cards = Array.from(nextGrid.querySelectorAll('.card'));
                cards.forEach(card => grid.appendChild(document.importNode(card, true)));

                const currentWrap = container.querySelector('[data-blog-load-more-wrap]');
                const nextWrap = parsed.querySelector('[data-blog-load-more-wrap]');
                if (currentWrap) {
                    if (nextWrap) currentWrap.replaceWith(document.importNode(nextWrap, true));
                    else currentWrap.remove();
                }
                updateBlogCounts(container);
                if (cards.length) cards[0].focus({ preventScroll: true });
            })
            .catch(() => { window.location.href = link.href; });
    }

    function buildSearchUrl(query) {
        const base = location.pathname;
        return query ? base + '?q=' + encodeURIComponent(query) : base;
    }

    document.addEventListener('click', (e) => {
        const loadMore = e.target.closest('[data-blog-load-more]');
        if (loadMore) {
            e.preventDefault();
            loadMoreBlogs(loadMore);
            return;
        }
        const link = e.target.closest('.category-filters .category-btn');
        if (!link) return;

        e.preventDefault();
        loadBlogList(link.href, true);
    });

    // Live search: filter as the user types, no click / Enter needed.
    let searchDebounceTimer = null;
    document.addEventListener('input', (e) => {
        const input = e.target.closest('.list-controls__right .search-input');
        if (!input) return;

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            loadBlogList(buildSearchUrl(input.value.trim()), true, { refocusSearch: true });
        }, 300);
    });

    // Pressing Enter or clicking the search icon runs immediately instead
    // of waiting for the debounce, and never causes a full page reload.
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('.list-controls__right form');
        if (!form) return;

        e.preventDefault();
        clearTimeout(searchDebounceTimer);
        const input = form.querySelector('.search-input');
        loadBlogList(buildSearchUrl(input ? input.value.trim() : ''), true, { refocusSearch: true });
    });

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.blogAjax) {
            loadBlogList(location.href, false);
        }
    });
});
