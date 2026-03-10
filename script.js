// FILE: /immomakler-berlin-preview/script.js
(() => {
  const lightbox = document.querySelector('[data-lightbox]');
  if (lightbox) lightbox.hidden = true;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // Scroll progress bar
  const progress = $('[data-progress]');
  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Mobile nav
  const nav = $('[data-nav]');
  const toggle = $('[data-nav-toggle]');
  const header = $('[data-header]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      toggle.setAttribute('aria-label', nav.classList.contains('is-open') ? 'Menü schließen' : 'Menü öffnen');
    });

    nav.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof HTMLAnchorElement) nav.classList.remove('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!header) return;
      if (!header.contains(e.target) && nav.classList.contains('is-open')) nav.classList.remove('is-open');
    });
  }

  // Reveal on scroll
  const revealEls = $$('.reveal');
  const revealIO = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-in');
          revealIO.unobserve(ent.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
  );
  revealEls.forEach((el) => revealIO.observe(el));

  // Count-up counters
  const countersRoot = $('[data-counters]');
  if (countersRoot) {
    const counterEls = $$('[data-count]', countersRoot);
    const animateCount = (el) => {
      const target = Number(el.getAttribute('data-count') || 0);
      const duration = 900;
      const start = performance.now();
      const from = 0;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(from + (target - from) * eased);
        el.textContent = String(val);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            counterEls.forEach(animateCount);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(countersRoot);
  }

  // Tilt effect (lightweight)
  const tiltEls = $$('.tilt');
  const supportsHover = window.matchMedia('(hover:hover)').matches;
  if (supportsHover) {
    tiltEls.forEach((el) => {
      let raf = 0;

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rx = (y - 0.5) * -10;
        const ry = (x - 0.5) * 10;

        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-1px)`;
        });
      };

      const onLeave = () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  // Magnetic buttons (subtle)
  const magneticEls = $$('.magnetic');
  if (supportsHover) {
    magneticEls.forEach((el) => {
      let raf = 0;
      const strength = 14;

      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx / strength}px, ${dy / strength}px)`;
        });
      };

      const onLeave = () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  // Gallery (Google-Profil Bilder lokal eintragen)
  const galleryGrid = $('[data-gallery-grid]');
  const galleryImages = [
    // TODO: Ersetze durch die echten Google-Profil-Foto-Dateien in /assets/gallery/
    'g1.jpg',
    'g2.jpg',
    'g3.jpg',
    'g4.jpg',
    'g5.jpg',
    'g6.jpg',
  ];

  const createGallery = () => {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    const classes = ['gitem--1', 'gitem--2', 'gitem--3', 'gitem--4', 'gitem--5', 'gitem--6'];

    galleryImages.forEach((name, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gitem ${classes[idx] || 'gitem--3'}`;
      btn.setAttribute('aria-label', `Bild ${idx + 1} öffnen`);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = `Galeriebild ${idx + 1}`;
      img.src = `./assets/gallery/${name}`;

      btn.appendChild(img);
      btn.addEventListener('click', () => openLightbox(idx));

      galleryGrid.appendChild(btn);
    });
  };

  // Lightbox
  const lightbox = $('[data-lightbox]');
  const lbImg = $('[data-lightbox-img]');
  // HARD FAILSAFE: Lightbox niemals beim Laden offen
  if (lightbox) {
    lightbox.hidden = true;                 // hidden erzwingen
    lightbox.classList.remove('is-open');   // falls du den is-open Fix testest
    lightbox.setAttribute('aria-hidden', 'true');
  }
document.body.style.overflow = '';
  const lbClose = $('[data-lightbox-close]');
  const lbPrev = $('[data-lightbox-prev]');
  const lbNext = $('[data-lightbox-next]');
  let lbIndex = 0;

  const setLightbox = (idx) => {
    lbIndex = (idx + galleryImages.length) % galleryImages.length;
    if (lbImg) lbImg.src = `./assets/gallery/${galleryImages[lbIndex]}`;
  };

  const openLightbox = (idx) => {
  if (!lightbox) return;
  setLightbox(idx);
  lightbox.classList.add('is-open');     // <- KEY FIX
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.remove('is-open');  // <- KEY FIX
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};
  
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => setLightbox(lbIndex - 1));
  if (lbNext) lbNext.addEventListener('click', () => setLightbox(lbIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') setLightbox(lbIndex - 1);
    if (e.key === 'ArrowRight') setLightbox(lbIndex + 1);
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  createGallery();

  // Slider (bewertungen)
  const slider = $('[data-slider]');
  const track = $('[data-slider-track]');
  const prev = $('[data-slider-prev]');
  const next = $('[data-slider-next]');
  if (slider && track && prev && next) {
    const scrollToCard = (dir) => {
      const w = track.clientWidth;
      track.scrollBy({ left: dir * w, behavior: 'smooth' });
    };
    prev.addEventListener('click', () => scrollToCard(-1));
    next.addEventListener('click', () => scrollToCard(1));
  }

  // Lead form (Preview mailto fallback)
  const form = $('[data-lead-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const phone = String(fd.get('phone') || '').trim();
      const topic = String(fd.get('topic') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const privacy = Boolean(fd.get('privacy'));

      const issues = [];
      if (name.length < 2) issues.push('Bitte Namen angeben.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push('Bitte gültige E-Mail angeben.');
      if (!topic) issues.push('Bitte Anliegen auswählen.');
      if (message.length < 10) issues.push('Bitte eine kurze Nachricht schreiben (mind. 10 Zeichen).');
      if (!privacy) issues.push('Bitte Datenschutzerklärung bestätigen.');

      if (issues.length) {
        alert(issues.join('\n'));
        return;
      }

      const subject = encodeURIComponent(`Anfrage (${topic}) – Website`);
      const body = encodeURIComponent(
        `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone}\nThema: ${topic}\n\nNachricht:\n${message}\n`
      );

      window.location.href = `mailto:info@beispiel.de?subject=${subject}&body=${body}`;
    });
  }

  // Cookie banner (minimal)
  const cookie = $('[data-cookie]');
  const accept = $('[data-cookie-accept]');
  const decline = $('[data-cookie-decline]');
  const key = 'cookie_consent_v1';

  const showCookie = () => { if (cookie) cookie.hidden = false; };
  const hideCookie = () => { if (cookie) cookie.hidden = true; };

  const existing = localStorage.getItem(key);
  if (!existing) showCookie();

  if (accept) {
    accept.addEventListener('click', () => {
      localStorage.setItem(key, 'accepted');
      hideCookie();
    });
  }
  if (decline) {
    decline.addEventListener('click', () => {
      localStorage.setItem(key, 'declined');
      hideCookie();
    });
  }
})();
if (lightbox) {
  lightbox.hidden = true;
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
}
