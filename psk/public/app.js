// POORS public story: menu, reveal, core, skill filter, full-screen frame viewer.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  // Mobile menu
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  const setMenu = open => { menuBtn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });

  // Reveal on scroll (no scroll locking; content is visible without JS)
  const revealables = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(el => io.observe(el));
  } else revealables.forEach(el => el.classList.add('in'));

  // Core: subtle pointer/touch tilt, paused when hidden or reduced motion
  const core = $('#core');
  if (core && !reduced.matches) {
    let raf = 0, x = 0, y = 0;
    const apply = () => { raf = 0; core.style.setProperty('--tx', x.toFixed(3)); core.style.setProperty('--ty', y.toFixed(3)); };
    const hero = core.closest('section');
    hero.addEventListener('pointermove', e => {
      const r = core.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width));
      y = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height));
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { x = y = 0; if (!raf) raf = requestAnimationFrame(apply); });
  }

  // Skill examples filter
  const filter = $('#skillFilter'), list = $('#skillList'), count = $('#skillCount');
  if (filter && list) {
    const norm = s => s.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌\s-]+/g, ' ').trim();
    const items = $$('li', list).map(li => ({ li, text: norm(li.textContent) }));
    const base = count.textContent;
    filter.addEventListener('input', () => {
      const q = norm(filter.value); let shown = 0;
      for (const it of items) { const ok = !q || it.text.includes(q); it.li.hidden = !ok; if (ok) shown++; }
      count.textContent = q ? (shown ? `${fa(shown)} نمونه پیدا شد.` : 'در این نمونه‌ها چیزی نبود؛ در کنسول موتور کل ۳۰۰۰ مهارت را جست‌وجو کن.') : base;
    });
  }

  // "Try in console" buttons: prefill the engine input only (engine UI owns the rest)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-try]'); if (!b) return;
    const input = $('#engineInput'), lab = $('#engineLab');
    if (input) input.value = b.dataset.try;
    lab?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    input?.focus({ preventScroll: true });
  });

  // Full-screen viewer (narrative order = gallery order)
  const dlg = $('#viewer');
  const seq = $$('[data-seq] .thumb').map(b => ({ file: b.dataset.open, alt: $('img', b).alt, caption: b.dataset.caption }));
  if (!dlg || !seq.length) return;
  const img = $('#viewerImg'), cap = $('#viewerCaption'), cnt = $('#viewerCount'), stage = $('#viewerStage'), zoomBtn = $('#viewerZoom');
  let i = 0, opener = null;
  const src = f => 'assets/' + f;
  const setZoom = on => { stage.classList.toggle('zoomed', on); zoomBtn.setAttribute('aria-pressed', String(on)); zoomBtn.textContent = on ? 'اندازهٔ عادی' : 'بزرگ‌نمایی'; };
  const show = n => {
    i = (n + seq.length) % seq.length;
    const f = seq[i];
    img.src = src(f.file); img.alt = f.alt;
    cap.textContent = f.caption;
    cnt.textContent = `فریم ${fa(i + 1)} از ${fa(seq.length)}`;
    setZoom(false); stage.scrollTo(0, 0);
    for (const k of [i + 1, i - 1]) { const p = new Image(); p.src = src(seq[(k + seq.length) % seq.length].file); }
  };
  const open = file => {
    opener = document.activeElement;
    const n = Math.max(0, seq.findIndex(f => f.file === file));
    show(n);
    if (!dlg.open) { dlg.showModal(); document.documentElement.classList.add('locked'); }
    $('#viewerClose').focus();
  };
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('locked'); setZoom(false); opener?.focus?.({ preventScroll: true }); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); open(b.dataset.open); } });
  $('#viewerClose').addEventListener('click', () => dlg.close());
  $('#viewerNext').addEventListener('click', () => show(i + 1));
  $('#viewerPrev').addEventListener('click', () => show(i - 1));
  zoomBtn.addEventListener('click', () => setZoom(!stage.classList.contains('zoomed')));
  img.addEventListener('click', () => setZoom(!stage.classList.contains('zoomed')));
  dlg.addEventListener('keydown', e => {
    // RTL: the next frame lies to the left
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(i + 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(seq.length - 1); }
  });
  let sx = null, sy = 0;
  stage.addEventListener('touchstart', e => { if (e.touches.length === 1 && !stage.classList.contains('zoomed')) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } else sx = null; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx === null) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(i + (dx > 0 ? 1 : -1));
  }, { passive: true });
})();
