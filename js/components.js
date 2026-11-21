/* =========================================================
   GHAZY AUTO — Shared UI Components (Secured & Firebase-Ready)
   ========================================================= */

(function () {
  const { labels, formatPrice, formatKm, whatsappLink, escapeHtml, sanitizeUrl, getSettings, addInquiry } = window.GhazyStore;

  function carSilhouetteSvg({ className = '', beam = false, body = '#14161a', accent = '#9a7339' } = {}) {
    const gradId = 'beam-g-' + Math.random().toString(36).slice(2, 7);
    const wheel = (cx) => `
      <g>
        <circle cx="${cx}" cy="52" r="14" fill="#101215" />
        <g class="wheel-spin">
          <circle cx="${cx}" cy="52" r="8" fill="#d8d4cb" />
          <path d="M${cx} 45v14M${cx - 7} 52h14M${cx - 5} 47l10 10M${cx + 5} 47l-10 10" stroke="#14161a" stroke-width="1.6" />
        </g>
        <circle cx="${cx}" cy="52" r="2.4" fill="#14161a" />
      </g>
    `;
    return `
      <svg viewBox="-110 0 330 70" class="${className}" aria-hidden="true">
        <defs>
          <linearGradient id="${gradId}" x1="1" x2="0">
            <stop offset="0" stop-color="#f6d27a" stop-opacity=".75" />
            <stop offset="1" stop-color="#f6d27a" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${beam ? `<path class="beam" d="M10 40 L-110 14 L-110 66 Z" fill="url(#${gradId})" />` : ''}
        <path d="M6 46V38q0-6 10-8l46-3 26-17h54q18 2 32 18l30 4q10 2 10 10v8H6Z" fill="${body}" />
        <path d="M68 28 90 13h26v15Zm34 0V13h36q12 2 22 15Z" fill="#d6dde3" opacity=".85" />
        <rect x="6" y="38" width="9" height="5" rx="2" fill="#f6d27a" />
        <rect x="206" y="37" width="8" height="5" rx="2" fill="${accent}" />
        ${wheel(55)}
        ${wheel(165)}
      </svg>
    `;
  }

  function plateHtml(value, { unit = 'ج.م', size = 'md', className = '' } = {}) {
    const s = size === 'lg' ? 'text-4xl md:text-5xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
    return `
      <span class="inline-flex items-stretch overflow-hidden rounded-[7px] border-[3px] border-ink bg-[#f3efe6] shadow-[0_6px_14px_-6px_rgba(20,22,26,.55),inset_0_0_0_2px_#f3efe6,inset_0_0_0_3px_rgba(20,22,26,.35)] ${className}">
        <span class="grid w-7 place-items-center bg-olive px-1 text-[9px] font-extrabold leading-tight text-paper [writing-mode:vertical-rl] rotate-180">
          غازي أوتو
        </span>
        <span class="flex items-baseline gap-1.5 px-3 py-1 font-display font-extrabold leading-tight text-ink ${s}">
          ${value}
          <span class="text-[0.5em] font-extrabold text-clay">${escapeHtml(unit)}</span>
        </span>
      </span>
    `;
  }

  function carCardHtml(car) {
    const sold = car.status === 'sold';
    const km = formatKm(car.mileage);
    const safeImg = sanitizeUrl(car.imageUrl, true);
    const gaugeIcon = `<svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 17a8 8 0 1 1 16 0" /><path d="m12 17 4-5" /></svg>`;
    const gearIcon = `<svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="19" r="2" /><path d="M6 7v4h12V7M12 11v6" /></svg>`;
    const arrowIcon = `<svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>`;

    return `
      <a href="car.html?slug=${encodeURIComponent(car.slug)}" class="group block transition-transform duration-300 hover:-translate-y-1.5">
        <div class="headlight relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand shadow-[0_18px_30px_-22px_rgba(20,22,26,.7)]">
          ${
            safeImg
              ? `<img src="${escapeHtml(safeImg)}" alt="${escapeHtml(car.imageAlt || car.name)}" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-110 ${sold ? 'grayscale' : ''}" />`
              : ''
          }
          <span class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/55 to-transparent"></span>
          ${
            car.status !== 'available'
              ? `<span class="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-sm font-bold text-paper">${escapeHtml(labels.status[car.status] || car.status)}</span>`
              : ''
          }
          <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-0.5 font-display text-sm font-extrabold text-olive">${escapeHtml(car.brand)}</span>
          ${plateHtml(formatPrice(car.price), { size: 'sm', className: 'absolute bottom-3 left-3 -rotate-2 transition-transform group-hover:rotate-0' })}
        </div>
        <div class="px-1 pt-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-display text-xl font-extrabold transition-colors group-hover:text-clay">${escapeHtml(car.name)}</h3>
            <span class="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink/20 transition group-hover:rotate-[-45deg] group-hover:border-clay group-hover:bg-clay group-hover:text-paper" aria-hidden="true">
              ${arrowIcon}
            </span>
          </div>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-ink/70">
            <li class="rounded bg-sand px-2 py-0.5 font-display font-bold text-ink">${escapeHtml(car.year)}</li>
            ${km ? `<li class="flex items-center gap-1.5">${gaugeIcon}${escapeHtml(km)}</li>` : ''}
            ${car.transmission ? `<li class="flex items-center gap-1.5">${gearIcon}${escapeHtml(labels.transmission[car.transmission] || car.transmission)}</li>` : ''}
          </ul>
        </div>
      </a>
    `;
  }

  function roadDividerHtml() {
    return `
      <div class="reveal my-10">
        <div dir="ltr" class="relative mx-auto h-16 max-w-6xl overflow-hidden px-5" aria-hidden="true">
          <div class="asphalt absolute inset-x-5 bottom-2 h-3 rounded-full"></div>
          <div class="road-dash absolute inset-x-5 bottom-[13px] h-[2px] [background-image:repeating-linear-gradient(90deg,#d9b977_0_24px,transparent_24px_48px)]"></div>
          <div class="drive-across absolute bottom-[14px] w-32">
            ${carSilhouetteSvg({ beam: true, className: 'h-auto w-full' })}
          </div>
        </div>
      </div>
    `;
  }

  function odometerHtml(value, unit = 'كم') {
    const D = '٠١٢٣٤٥٦٧٨٩';
    const chars = new Intl.NumberFormat('ar-EG').format(Number(value)).split('');
    const digitsHtml = chars
      .map((c, k) => {
        const idx = D.indexOf(c);
        if (idx < 0) {
          return `<span class="self-end pb-1 font-display text-xl font-extrabold text-paper/50">${c}</span>`;
        }
        return `
          <span class="relative block h-10 w-7 overflow-hidden rounded bg-gradient-to-b from-[#23262c] via-[#30343b] to-[#23262c] font-display text-2xl font-extrabold text-paper">
            <span
              data-odometer-strip
              data-target-idx="${idx}"
              data-delay="${k * 90}"
              class="absolute inset-x-0 top-0 flex flex-col items-center transition-transform duration-[1600ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)]"
              style="transform: translateY(0px)"
            >
              ${D.split('').map((d) => `<span class="grid h-10 place-items-center">${d}</span>`).join('')}
            </span>
          </span>
        `;
      })
      .join('');

    return `
      <div data-odometer class="inline-flex items-center gap-2" dir="ltr" aria-label="${escapeHtml(value)} ${escapeHtml(unit)}" role="img">
        <div class="flex gap-1 rounded-lg bg-[#0b0c0f] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,.9)]">
          ${digitsHtml}
        </div>
        <span class="font-display text-sm font-bold text-ink/60" dir="rtl">${escapeHtml(unit)}</span>
      </div>
    `;
  }

  function initOdometers(root = document) {
    const elms = root.querySelectorAll('[data-odometer]');
    if (!elms.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('[data-odometer-strip]').forEach((strip) => {
            const idx = Number(strip.getAttribute('data-target-idx') || 0);
            const delay = Number(strip.getAttribute('data-delay') || 0);
            strip.style.transitionDelay = `${delay}ms`;
            strip.style.transform = `translateY(${-idx * 40}px)`;
          });
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    elms.forEach((el) => io.observe(el));
  }

  function initReveals(root = document) {
    const items = root.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  function renderHeader(activePage) {
    const container = document.getElementById('site-header');
    if (!container) return;
    const settings = getSettings();
    const cleanTel = String(settings.phone || '').replace(/[^0-9+]/g, '');
    const navLinks = [
      { id: 'home', href: 'index.html', label: 'الرئيسية' },
      { id: 'cars', href: 'cars.html', label: 'السيارات' },
      { id: 'sell', href: 'sell.html', label: 'بيع عربيتك' },
      { id: 'contact', href: 'contact.html', label: 'تواصل معنا' },
    ];

    const desktopLinks = navLinks
      .map((l) => {
        const active = l.id === activePage;
        return `
          <a href="${l.href}" class="nav-link relative py-1.5 font-display text-[17px] font-bold transition-colors ${active ? 'text-clay' : 'text-ink hover:text-clay'}">
            ${l.label}
            <span class="lane absolute inset-x-0 -bottom-1 h-[3px] rounded-full ${active ? 'opacity-100' : 'opacity-0'}"></span>
          </a>
        `;
      })
      .join('');

    const mobileLinks = navLinks
      .map((l) => {
        const active = l.id === activePage;
        return `
          <a href="${l.href}" class="block rounded-2xl px-4 py-3 font-display text-lg font-extrabold transition ${active ? 'bg-olive text-paper' : 'hover:bg-sand/70'}">
            ${l.label}
          </a>
        `;
      })
      .join('');

    container.innerHTML = `
      <header class="sticky top-0 z-40 border-b border-ink/10 bg-paper">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="index.html" class="group flex items-center gap-3" aria-label="غازي أوتو، الرئيسية">
            <span class="relative grid size-11 place-items-center rounded-full bg-olive font-display text-xl font-extrabold text-paper shadow-[0_0_0_3px_var(--color-paper),0_0_0_5px_var(--color-olive)]">
              <span class="absolute inset-[5px] rounded-full border-2 border-dashed border-paper/40 transition-transform duration-700 group-hover:rotate-180"></span>
              <span class="relative">غ</span>
            </span>
            <span class="font-display text-xl font-extrabold leading-none">
              غازي أوتو
              <span class="mt-1 block text-xs font-semibold tracking-wide text-ink/60">كفر الشيخ</span>
            </span>
          </a>

          <nav class="hidden items-center gap-8 md:flex" aria-label="التنقل الرئيسي">
            ${desktopLinks}
          </nav>

          <a
            href="tel:${escapeHtml(cleanTel)}"
            class="start-btn relative hidden items-center gap-2 rounded-full bg-olive px-5 py-2 font-bold text-paper transition hover:bg-clay md:inline-flex"
            dir="ltr"
          >
            <span class="size-2 rounded-full bg-honey" aria-hidden="true"></span>
            ${escapeHtml(settings.phone)}
          </a>

          <button
            type="button"
            id="mobile-menu-btn"
            aria-label="افتح القائمة"
            aria-expanded="false"
            class="grid size-11 place-items-center rounded-full border-2 border-ink/15 md:hidden"
          >
            <svg viewBox="0 0 24 24" class="size-6 fill-none stroke-current" stroke-width="2.2" stroke-linecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <div id="mobile-menu-panel" class="hidden border-t border-ink/10 bg-paper px-5 pb-6 pt-4 md:hidden">
          <nav class="space-y-1.5" aria-label="قائمة الجوال">
            ${mobileLinks}
          </nav>
          <a
            href="tel:${escapeHtml(cleanTel)}"
            dir="ltr"
            class="mt-4 flex items-center justify-center gap-2 rounded-full bg-olive px-5 py-3 font-bold text-paper"
          >
            <span class="size-2 rounded-full bg-honey"></span>
            ${escapeHtml(settings.phone)}
          </a>
        </div>

        <div class="road-progress-track" aria-hidden="true">
          <div id="road-progress-fill" class="road-progress-fill"></div>
        </div>
      </header>
    `;

    const btn = document.getElementById('mobile-menu-btn');
    const panel = document.getElementById('mobile-menu-panel');
    if (btn && panel) {
      btn.addEventListener('click', () => {
        const open = !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', open);
        btn.setAttribute('aria-expanded', String(!open));
      });
    }

    const updateProgress = () => {
      const fill = document.getElementById('road-progress-fill');
      if (!fill) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      fill.style.width = `${pct}%`;
    };
    window.removeEventListener('scroll', window._ghazyScrollHandler);
    window._ghazyScrollHandler = updateProgress;
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  function renderFooter() {
    const container = document.getElementById('site-footer');
    if (!container) return;
    const settings = getSettings();
    const cleanTel = String(settings.phone || '').replace(/[^0-9+]/g, '');
    const safeMapUrl = sanitizeUrl(settings.mapUrl, false);
    const safeFb = sanitizeUrl(settings.facebook, false);
    const safeIg = sanitizeUrl(settings.instagram, false);

    container.innerHTML = `
      <footer class="relative mt-28 bg-olive-deep text-paper">
        <div dir="ltr" class="absolute inset-x-0 -top-10 h-10 overflow-hidden" aria-hidden="true">
          <div class="absolute inset-x-0 bottom-0 h-3 bg-[#14161a]"></div>
          <div class="road-dash absolute inset-x-0 bottom-[5px] h-[2px] [background-image:repeating-linear-gradient(90deg,#d9b977_0_26px,transparent_26px_52px)]"></div>
          <div class="road-car absolute bottom-[6px] left-[12%] w-28">
            ${carSilhouetteSvg({ className: 'h-auto w-full' })}
          </div>
        </div>
        <div class="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
          <div>
            <div class="font-display text-4xl font-extrabold">غازي أوتو</div>
            <p class="mt-3 max-w-xs text-paper/70">
              معرض سيارات في كفر الشيخ. بنبيع العربية زي ما هي، وبنقولك كل حاجة قبل ما تدفع.
            </p>
            <div class="mt-5 flex items-center gap-2 font-hand text-xl text-honey">
              <span class="size-2.5 rounded-full bg-clay shadow-[0_0_10px_3px_rgba(154,115,57,.7)]" aria-hidden="true"></span>
              رحلة سعيدة وسلامة دايماً
            </div>
          </div>
          <div>
            <h3 class="mb-3 font-display text-lg font-bold text-honey">تعالى زورنا</h3>
            <p class="whitespace-pre-line text-paper/80">${escapeHtml(settings.address)}</p>
            <p class="mt-2 text-paper/80">${escapeHtml(settings.hours)}</p>
            ${
              safeMapUrl
                ? `<a href="${escapeHtml(safeMapUrl)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-block font-bold underline decoration-honey underline-offset-4">افتح الخريطة</a>`
                : ''
            }
          </div>
          <div>
            <h3 class="mb-3 font-display text-lg font-bold text-honey">كلمنا</h3>
            <a href="tel:${escapeHtml(cleanTel)}" dir="ltr" class="block text-right text-2xl font-bold">
              ${escapeHtml(settings.phone)}
            </a>
            <ul class="mt-4 space-y-1 text-paper/80">
              <li><a href="cars.html" class="hover:text-honey">كل السيارات</a></li>
              <li><a href="sell.html" class="hover:text-honey">بيع عربيتك</a></li>
              <li><a href="contact.html" class="hover:text-honey">ابعتلنا رسالة</a></li>
              ${safeFb ? `<li><a href="${escapeHtml(safeFb)}" target="_blank" rel="noopener noreferrer" class="hover:text-honey">فيسبوك</a></li>` : ''}
              ${safeIg ? `<li><a href="${escapeHtml(safeIg)}" target="_blank" rel="noopener noreferrer" class="hover:text-honey">انستجرام</a></li>` : ''}
            </ul>
          </div>
        </div>
        <div class="border-t border-paper/10 py-5 text-center text-sm text-paper/50">
          © ${new Date().getFullYear()} غازي أوتو، كفر الشيخ
        </div>
      </footer>
    `;
  }

  function renderWhatsAppButton() {
    const container = document.getElementById('whatsapp-float');
    if (!container) return;
    const settings = getSettings();
    container.innerHTML = `
      <a
        href="${whatsappLink(settings.whatsapp, 'السلام عليكم، عايز أسأل عن عربية في غازي أوتو')}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل واتساب"
        class="fixed bottom-5 left-5 z-40 flex items-center gap-2.5 rounded-full bg-[#1f8f4d] px-5 py-3.5 font-display font-extrabold text-white shadow-[0_14px_28px_-10px_rgba(31,143,77,.85)] transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" class="size-6 fill-current" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.13.58.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.27.1 1.69.8 1.98.94.29.14.48.22.55.34.07.12.07.69-.17 1.37" />
        </svg>
        <span class="hidden sm:inline">واتساب</span>
      </a>
    `;
  }

  function mountInquiryForm(container, {
    defaultKind = 'question',
    kinds = null,
    carId = '',
    carName = '',
    messageLabel = 'رسالتك (اختياري)',
    submitLabel = 'ابعت الطلب',
  } = {}) {
    if (!container) return;
    const allOptions = [
      { value: 'question', label: 'عندي سؤال' },
      { value: 'testDrive', label: 'عايز أجرب العربية' },
      { value: 'sellCar', label: 'عايز أبيع عربيتي' },
      { value: 'other', label: 'حاجة تانية' },
    ];
    const options = allOptions.filter((o) => !kinds || kinds.includes(o.value));
    let currentKind = defaultKind;
    const fieldClass = 'mt-1 w-full rounded-xl border-2 border-ink/15 bg-paper/70 px-4 py-3 outline-none transition focus:border-olive';

    function render() {
      const msgLabel = currentKind === 'sellCar'
        ? 'بيانات عربيتك (الماركة، الموديل، السنة، الكيلومترات)'
        : messageLabel;

      container.innerHTML = `
        <form data-inquiry-form class="space-y-4">
          ${carName ? `<p class="rounded-xl bg-sand px-4 py-2 text-sm">بخصوص: <b>${escapeHtml(carName)}</b></p>` : ''}
          ${
            options.length > 1
              ? `
                <fieldset>
                  <legend class="font-bold">محتاج إيه؟</legend>
                  <div class="mt-2 flex flex-wrap gap-2">
                    ${options
                      .map(
                        (o) => `
                          <button
                            type="button"
                            data-kind-btn="${o.value}"
                            aria-pressed="${currentKind === o.value}"
                            class="rounded-full border-2 px-4 py-1.5 text-[15px] font-medium transition ${
                              currentKind === o.value ? 'border-olive bg-olive text-paper' : 'border-ink/20 hover:border-olive'
                            }"
                          >
                            ${o.label}
                          </button>
                        `
                      )
                      .join('')}
                  </div>
                </fieldset>
              `
              : ''
          }
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="font-bold">اسمك</span>
              <input name="name" required maxlength="80" autocomplete="name" class="${fieldClass}" />
            </label>
            <label class="block">
              <span class="font-bold">رقم الموبايل</span>
              <input name="phone" type="tel" dir="ltr" required autocomplete="tel" placeholder="01xxxxxxxxx" class="${fieldClass} text-right" />
            </label>
          </div>
          ${
            currentKind === 'testDrive'
              ? `
                <label class="block">
                  <span class="font-bold">يوم وميعاد يناسبك</span>
                  <input name="preferredTime" maxLength="80" placeholder="مثلاً: السبت بعد العصر" class="${fieldClass}" />
                </label>
              `
              : ''
          }
          <label class="block">
            <span class="font-bold">${escapeHtml(msgLabel)}</span>
            <textarea name="message" rows="4" maxlength="1500" class="${fieldClass}"></textarea>
          </label>
          <input name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 opacity-0" />
          <p data-form-error role="alert" class="hidden font-bold text-clay"></p>
          <button type="submit" data-submit-btn class="w-full rounded-full bg-clay px-8 py-3.5 font-display text-lg font-extrabold text-paper transition hover:bg-olive disabled:opacity-50 sm:w-auto">
            ${escapeHtml(submitLabel)}
          </button>
        </form>
      `;

      container.querySelectorAll('[data-kind-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentKind = btn.getAttribute('data-kind-btn');
          render();
        });
      });

      const form = container.querySelector('[data-inquiry-form]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        if (String(fd.get('website') || '').trim()) return;
        const name = String(fd.get('name') || '').trim();
        const phone = String(fd.get('phone') || '').trim();
        const errEl = form.querySelector('[data-form-error]');
        const submitBtn = form.querySelector('[data-submit-btn]');

        if (name.length < 2) {
          errEl.textContent = 'اكتب اسمك بشكل صحيح.';
          errEl.classList.remove('hidden');
          return;
        }
        if (phone.replace(/\D/g, '').length < 8) {
          errEl.textContent = 'اكتب رقم موبايل صحيح.';
          errEl.classList.remove('hidden');
          return;
        }

        errEl.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        try {
          await addInquiry({
            name,
            phone,
            kind: currentKind,
            carId,
            carName,
            preferredTime: String(fd.get('preferredTime') || ''),
            message: String(fd.get('message') || ''),
          });

          container.innerHTML = `
            <div class="rounded-3xl border-2 border-olive/30 bg-olive/10 p-8 text-center">
              <p class="font-hand text-3xl text-olive">وصلنا طلبك، شكرًا ليك</p>
              <p class="mt-2 text-ink/75">هنكلمك على الموبايل في أقرب وقت، غالبًا خلال ساعات.</p>
            </div>
          `;
        } catch (err) {
          console.error('Inquiry submit error:', err);
          errEl.textContent = 'حصل خطأ أثناء إرسال الطلب، حاول تاني أو كلمنا واتساب.';
          errEl.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      });
    }

    render();
  }

  window.GhazyUI = {
    carSilhouetteSvg,
    plateHtml,
    carCardHtml,
    roadDividerHtml,
    odometerHtml,
    initOdometers,
    initReveals,
    renderHeader,
    renderFooter,
    renderWhatsAppButton,
    mountInquiryForm,
  };
})();