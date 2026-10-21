// Progressive enhancement for the site layout: skip link, mobile menu and the header contact button.
// The site works without it; nothing here changes page content.
(function () {
  var d = document;
  function ready(fn) { d.readyState !== 'loading' ? fn() : d.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    // Browser UI color on mobile
    if (!d.querySelector('meta[name="theme-color"]')) {
      var m = d.createElement('meta');
      m.name = 'theme-color';
      m.content = '#0A111D';
      d.head.appendChild(m);
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
  });
})();
