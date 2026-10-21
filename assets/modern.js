// Progressive enhancement for the modern look: header state, mobile menu, contact button,
// and gentle scroll reveal. The site works without it; nothing here changes page content.
(function () {
  var d = document;
  function ready(fn) { d.readyState !== 'loading' ? fn() : d.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var header = d.querySelector('header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      var links = header.querySelector('nav.links');
      var anchor = header.querySelector('.nav-right') || header.querySelector('.lang-toggle');
      if (links && anchor && anchor.parentNode) {
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
      }
    }

    // Scroll reveal on whole blocks (so content injected later, such as news cards, is covered too).
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.section-head,.readout,.diagram,.about-grid,.services-grid,.case-grid,.latest-grid,.news-grid,' +
      '.cert-row,.contact-grid,.solutions-grid,.cta-box,.post-grid,.steps3,.road,.article-body>.infographic';
    var targets = d.querySelectorAll(sel);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) return; // already on screen: leave visible, no flash
      el.classList.add('reveal');
      io.observe(el);
    });
    // Safety net: never leave anything hidden if observers fail to fire.
    setTimeout(function () {
      d.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.5) el.classList.add('in');
      });
    }, 3500);
  });
})();
