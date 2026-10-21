// Progressive enhancement for the site layout: skip link, mobile menu and the header contact button.
// The site works without it; nothing here changes page content.
(function () {
  var d = document;
  function ready(fn) { d.readyState !== 'loading' ? fn() : d.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    // Theme (dark / light). The initial value is set by a tiny inline script in <head> to avoid a flash.
    var root = d.documentElement;
    var COLORS = { dark: '#0A111D', light: '#F6F8FB' };
    var meta = d.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = d.createElement('meta');
      meta.name = 'theme-color';
      d.head.appendChild(meta);
    }
    function currentTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
    function applyTheme(t, save) {
      root.setAttribute('data-theme', t);
      meta.content = COLORS[t];
      if (save) { try { localStorage.setItem('dynasec-theme', t); } catch (e) { /* private mode */ } }
      var b = d.querySelector('.theme-toggle');
      if (b) {
        var th = t === 'light' ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง';
        var en = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        var label = root.lang === 'en' ? en : th;
        b.setAttribute('aria-label', label);
        b.setAttribute('title', label);
      }
    }
    applyTheme(currentTheme(), false);
    // Follow the system setting until the visitor makes a choice.
    var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
    var hasChoice = function () { try { var v = localStorage.getItem('dynasec-theme'); return v === 'light' || v === 'dark'; } catch (e) { return false; } };
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', function (e) { if (!hasChoice()) applyTheme(e.matches ? 'light' : 'dark', false); });
    }

    var header = d.querySelector('header');
    if (!header) return;

    // Skip to content (keyboard and screen reader users)
    var target = d.querySelector('main') || header.nextElementSibling;
    if (target) {
      if (!target.id) target.id = 'content';
      var skip = d.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + target.id;
      skip.innerHTML = '<span class="t-th">ข้ามไปยังเนื้อหา</span><span class="t-en">Skip to content</span>';
      d.body.insertBefore(skip, d.body.firstChild);
    }

    var links = header.querySelector('nav.links');
    var anchor = header.querySelector('.nav-right') || header.querySelector('.lang-toggle');
    if (!links || !anchor || !anchor.parentNode) return;

    var cta = d.createElement('a');
    cta.className = 'nav-cta';
    cta.href = '/#contact';
    cta.innerHTML = '<span class="t-th">ติดต่อเรา</span><span class="t-en">Contact us</span>';
    anchor.parentNode.insertBefore(cta, anchor);

    var tt = d.createElement('button');
    tt.type = 'button';
    tt.className = 'theme-toggle';
    tt.innerHTML = '<svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    tt.addEventListener('click', function () { applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true); });
    anchor.parentNode.insertBefore(tt, anchor);
    applyTheme(currentTheme(), false);

    var btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-toggle';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);

    var setOpen = function (open) {
      header.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function () { setOpen(!header.classList.contains('menu-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) setOpen(false); });
    // Keep the toggle label in the page language when the TH/EN switch is used.
    if (window.MutationObserver) {
      new MutationObserver(function () { applyTheme(currentTheme(), false); }).observe(root, { attributes: true, attributeFilter: ['lang'] });
    }
  });
})();
