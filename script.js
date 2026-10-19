const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/Z4KTQ9RN9Q';

(() => {
  // ===== UTILS =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header
  const header = document.getElementById('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
  }));

  // ===== CALCULATOR =====
  const RATE = 130;
  const area = document.getElementById('calcArea');
  const range = document.getElementById('calcRange');
  const sum = document.getElementById('calcSum');
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const update = v => {
    const n = Math.max(0, Math.min(100000, parseInt(v, 10) || 0));
    if (sum) sum.textContent = fmt(n * RATE);
    return n;
  };
  area?.addEventListener('input', () => {
    const n = update(area.value);
    if (range) range.value = Math.min(n, 1000);
  });
  range?.addEventListener('input', () => {
    area.value = range.value;
    update(range.value);
  });

  // ===== FORM SUBMIT → CLOUDFLARE WORKER → TELEGRAM =====
  const form = document.getElementById('leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });

    // honeypot anti-bot
    if (payload._gotcha) return;

    if (!payload.name || (!payload.phone && !payload.contact)) {
      alert('Заполните имя и контактные данные');
      return;
    }

    // добавляем оценку из калькулятора, если пользователь им пользовался
    if (area && area.dataset.touched === '1') {
      payload.calc = area.value + ' м² ≈ ' + (parseInt(area.value, 10) * RATE) + ' ₽';
    }

    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена ✓';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });
  area?.addEventListener('input', () => { area.dataset.touched = '1'; });
  range?.addEventListener('input', () => { area.dataset.touched = '1'; });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Reveal on scroll
  const targets = document.querySelectorAll(
    '.adv__item, .svc, .aud, .step, .faq__item, .form, .hero__card, .calc__box, .price-row'
  );
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => io.observe(el));

  // Counters
  const counters = document.querySelectorAll('[data-target]');
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      if (Number.isNaN(target)) return;
      const dur = 1100, start = performance.now();
      const tick = t => {
        const p = Math.min(1, (t - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(el => countIO.observe(el));
})();
