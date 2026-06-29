/* =========================================
   CREDITXA — JavaScript Principal
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Particles ---- */
  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const opacity = Math.random() * 0.4 + 0.1;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${left}%;
        bottom:-10px;
        opacity:${opacity};
        animation-duration:${duration}s;
        animation-delay:${delay}s;
      `;
      container.appendChild(p);
    }
  }
  createParticles();

  /* ---- Header Scroll ---- */
  const header = document.querySelector('.header');
  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add('header--scrolled');
      header.classList.remove('header--transparent');
    } else {
      header.classList.remove('header--scrolled');
      header.classList.add('header--transparent');
    }
    // Scroll Top visibility
    const scrollTop = document.querySelector('.scroll-top');
    if (scrollTop) {
      scrollTop.classList.toggle('visible', window.scrollY > 400);
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  header.classList.add('header--transparent');

  /* ---- Mobile Menu ---- */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Loan Calculator ---- */
  const amountRange  = document.getElementById('loanAmount');
  const termRange    = document.getElementById('loanTerm');
  const amountVal    = document.getElementById('amountVal');
  const termVal      = document.getElementById('termVal');
  const monthlyOut   = document.getElementById('monthlyPayment');
  const totalOut     = document.getElementById('totalPayment');
  const interestOut  = document.getElementById('totalInterest');
  const calcTabs     = document.querySelectorAll('.calc-tab');

  let annualRate = 0.0799; // 7.99%

  const RATES = {
    'pessoal': 0.0799,
    'habitacao': 0.0349,
    'automovel': 0.0599
  };

  function calcLoan() {
    if (!amountRange || !termRange) return;
    const P = parseFloat(amountRange.value);
    const months = parseFloat(termRange.value);
    const r = annualRate / 12;
    let monthly, total, interest;
    if (r === 0) {
      monthly = P / months;
    } else {
      monthly = P * r * Math.pow(1+r, months) / (Math.pow(1+r, months) - 1);
    }
    total    = monthly * months;
    interest = total - P;

    if (amountVal) amountVal.textContent = formatCurrency(P);
    if (termVal) termVal.textContent = months + ' meses';
    if (monthlyOut) animateValue(monthlyOut, parseFloat(monthlyOut.dataset.prev || 0), monthly, 400);
    if (totalOut) totalOut.textContent = formatCurrency(total);
    if (interestOut) interestOut.textContent = formatCurrency(interest);

    if (monthlyOut) monthlyOut.dataset.prev = monthly;

    // Update range background
    updateRangeStyle(amountRange);
    updateRangeStyle(termRange);
  }

  function formatCurrency(val) {
    return val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
  }

  function animateValue(el, from, to, duration) {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * ease;
      el.textContent = formatCurrency(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function updateRangeStyle(input) {
    if (!input) return;
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const val = parseFloat(input.value);
    const pct = ((val - min) / (max - min) * 100).toFixed(1);
    input.style.setProperty('--val', pct + '%');
  }

  if (amountRange) {
    amountRange.addEventListener('input', calcLoan);
    termRange.addEventListener('input', calcLoan);
    calcLoan();
  }

  calcTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      calcTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      annualRate = RATES[tab.dataset.type] || 0.0799;
      // Update ranges based on loan type
      if (tab.dataset.type === 'habitacao') {
        amountRange.min = 50000; amountRange.max = 500000; amountRange.value = 150000;
        termRange.min = 60; termRange.max = 360; termRange.value = 240;
      } else if (tab.dataset.type === 'automovel') {
        amountRange.min = 5000; amountRange.max = 80000; amountRange.value = 20000;
        termRange.min = 12; termRange.max = 84; termRange.value = 48;
      } else {
        amountRange.min = 1000; amountRange.max = 75000; amountRange.value = 10000;
        termRange.min = 12; termRange.max = 84; termRange.value = 36;
      }
      calcLoan();
    });
  });

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Testimonials Slider ---- */
  const track = document.querySelector('.testimonials-track');
  const dots  = document.querySelectorAll('.dot');
  let current = 0;
  let autoplayInterval;

  function getVisible() {
    return window.innerWidth < 768 ? 1 : window.innerWidth < 900 ? 2 : 3;
  }
  function goTo(idx) {
    if (!track) return;
    const cards = track.querySelectorAll('.testimonial-card');
    const visible = getVisible();
    const max = Math.max(0, cards.length - visible);
    current = Math.min(Math.max(idx, 0), max);
    const cardW = track.querySelector('.testimonial-card')?.offsetWidth || 0;
    const gap = 24;
    track.style.transform = `translateX(-${current * (cardW + gap)}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAutoplay(); }));

  function autoplay() { goTo(current + 1 >= (document.querySelectorAll('.testimonial-card').length - getVisible() + 1) ? 0 : current + 1); }
  function resetAutoplay() { clearInterval(autoplayInterval); autoplayInterval = setInterval(autoplay, 4500); }
  autoplayInterval = setInterval(autoplay, 4500);

  // Touch/swipe
  if (track) {
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAutoplay(); }
    });
  }

  /* ---- Counter Animation ---- */
  const counters = document.querySelectorAll('.counter');
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(current).toLocaleString('pt-PT') : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  /* ---- Scroll Reveal ---- */
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  /* ---- Scroll to Top ---- */
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---- FAB Chat ---- */
  const fab = document.querySelector('.fab-btn');
  const bubble = document.querySelector('.fab-chat__bubble');
  if (fab) {
    fab.addEventListener('click', () => {
      showToast('✅ A ligar ao suporte... Um momento!');
    });
    setTimeout(() => {
      if (bubble) { bubble.style.opacity = '0'; bubble.style.transition = 'opacity 0.5s'; setTimeout(() => bubble.style.display = 'none', 500); }
    }, 5000);
  }

  /* ---- Toast Notification ---- */
  function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }
  window.showToast = showToast;

  /* ---- Apply Button ---- */
  document.querySelectorAll('[data-apply]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.innerHTML = '<span class="spinner"></span> A processar...';
      btn.querySelector('.spinner').style.display = 'block';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '✓ Pedido Enviado';
        btn.style.background = '#2E7D32';
        showToast('🎉 Pedido recebido! Entraremos em contacto em breve.');
        setTimeout(() => {
          btn.innerHTML = btn.dataset.apply;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1800);
    });
  });

  /* ---- Smooth anchor scrolling ---- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    });
  });

  /* ---- Nav active highlighting on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  sections.forEach(s => sectionObserver.observe(s));

  /* ---- Form validation for newsletter ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value;
      if (email) {
        showToast('✅ Subscrito com sucesso! Bem-vindo à Creditxa.');
        newsletterForm.reset();
      }
    });
  }

});
