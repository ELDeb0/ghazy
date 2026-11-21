/* =========================================================
   GHAZY AUTO — Frontend Page Controllers
   ========================================================= */

(function () {
  const { getCars, getCarBySlug, getSettings, labels, formatPrice, formatKm, whatsappLink, escapeHtml } = window.GhazyStore;
  const {
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
  } = window.GhazyUI;

  const promises = [
    ['الفحص قدامك', 'بنفحص كل عربية في مركز تختاره إنت، ونديك التقرير كامل، حتى لو فيه عيب.'],
    ['السعر مكتوب', 'السعر على العربية هو السعر. مفيش مصاريف مستخبية ولا "هنتفاهم بعدين".'],
    ['الورق على المكشوف', 'الرخصة والعقود والصيانات بتتشاف قبل ما تقرر، مش بعد ما تدفع.'],
    ['جرّبها براحتك', 'خدها على الطريق اللي بتمشيه كل يوم، من غير ما حد يقف على راسك.'],
  ];

  // ---------------- HOME PAGE ----------------
  function initHomePage() {
    const root = document.getElementById('home-page');
    if (!root) return;

    const cars = getCars();
    const settings = getSettings();
    const featured = cars.filter((c) => c.featured && c.status !== 'sold');
    const shown = (featured.length ? featured : cars).slice(0, 6);
    const hero = shown[0];
    const brands = [...new Set(cars.map((c) => c.brand).filter(Boolean))];
    const marqueeList = (brands.length ? brands : ['Mercedes', 'BMW', 'Kia', 'Hyundai', 'Toyota', 'Jeep']);
    const repeatedBrands = [...marqueeList, ...marqueeList, ...marqueeList, ...marqueeList];

    const eyebrow = (txt) => `
      <p class="flex items-center gap-3 font-hand text-2xl text-clay">
        <span class="h-[3px] w-10 [background-image:repeating-linear-gradient(90deg,var(--color-clay)_0_8px,transparent_8px_13px)]" aria-hidden="true"></span>
        ${escapeHtml(txt)}
      </p>
    `;

    root.innerHTML = `
      <!-- HERO -->
      <section class="relative overflow-hidden">
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-32 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            ${eyebrow('من كفر الشيخ، لأهل كفر الشيخ')}
            <h1 class="mt-4 text-4xl font-extrabold leading-[1.35] md:text-6xl md:leading-[1.3]">
              عربيتك الجاية، تشتريها وإنت
              <span class="relative inline-block text-clay">
                مطمّن
                <svg viewBox="0 0 200 14" class="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 9 C 40 2, 70 13, 110 6 S 170 3, 198 8" fill="none" stroke="#d9b977" stroke-width="5" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="mt-6 max-w-xl text-xl text-ink/75">
              معرض غازي أوتو بيعرض عربيات اتفحصت واتراجعت، بأسعار مكتوبة وكلام واضح. اتفرج، جرّب، واسأل براحتك.
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a href="cars.html" class="group inline-flex items-center gap-3 rounded-full bg-olive px-8 py-3.5 font-display text-lg font-extrabold text-paper shadow-[0_14px_24px_-12px_rgba(14,16,19,.8)] transition hover:bg-clay">
                شوف العربيات
                <svg viewBox="0 0 24 24" class="size-5 fill-none stroke-current transition-transform group-hover:-translate-x-1.5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
              </a>
              <a
                href="${whatsappLink(settings.whatsapp, 'السلام عليكم، عايز أسأل على عربية')}"
                target="_blank"
                rel="noreferrer"
                class="font-bold underline decoration-clay decoration-2 underline-offset-8 hover:text-clay"
              >
                أو كلمنا واتساب
              </a>
            </div>
          </div>

          <div class="relative mx-auto w-full max-w-[460px]">
            ${
              hero && hero.imageUrl
                ? `
                  <span class="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] border-2 border-honey/70" aria-hidden="true"></span>
                  <a
                    href="car.html?slug=${encodeURIComponent(hero.slug)}"
                    class="group relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-ink shadow-[0_40px_70px_-35px_rgba(20,22,26,.9)]"
                  >
                    <img src="${escapeHtml(hero.imageUrl)}" alt="${escapeHtml(hero.imageAlt || hero.name)}" class="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                    <span class="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"></span>
                    <span class="absolute right-5 top-5 rounded-full bg-paper px-4 py-1 text-sm font-extrabold text-ink">
                      ${featured.length ? 'العربية المميزة' : 'وصلت جديد'}
                    </span>
                    <span class="absolute inset-x-0 bottom-0 p-6 text-paper">
                      <span class="block text-sm font-bold tracking-wide text-honey">${escapeHtml(hero.brand)} · ${escapeHtml(hero.year)}</span>
                      <span class="mt-1 block font-display text-3xl font-extrabold leading-tight">${escapeHtml(hero.name)}</span>
                      <span class="mt-4 flex items-end justify-between gap-4 border-t border-paper/20 pt-4">
                        <span class="text-sm text-paper/70">
                          ${[formatKm(hero.mileage), hero.transmission ? labels.transmission[hero.transmission] : null].filter(Boolean).join(' · ')}
                        </span>
                        <span class="font-display text-2xl font-extrabold text-honey">
                          ${formatPrice(hero.price)} <span class="text-sm text-paper/70">ج.م</span>
                        </span>
                      </span>
                    </span>
                  </a>
                `
                : carSilhouetteSvg({ className: 'w-full' })
            }
          </div>
        </div>

        <div dir="ltr" class="hero-road" aria-hidden="true">
          <div class="asphalt-strip"></div>
          <div class="road-dash absolute inset-x-0 bottom-[10px] h-[3px] [background-image:repeating-linear-gradient(90deg,#d9b977_0_30px,transparent_30px_60px)]"></div>
          <div class="absolute bottom-[14px] left-[14%] w-44 md:w-60">
            ${carSilhouetteSvg({ beam: true, className: 'hero-car h-auto w-full', accent: '#9a7339', body: '#9a7339' })}
          </div>
        </div>
      </section>

      <!-- MARQUEE -->
      <div class="tread overflow-hidden py-4 text-paper" dir="ltr" aria-hidden="true">
        <div class="marquee flex items-center gap-10 whitespace-nowrap font-display text-lg font-extrabold tracking-widest uppercase">
          ${repeatedBrands
            .map(
              (b) => `
                <span class="flex items-center gap-10">
                  <span>${escapeHtml(b)}</span>
                  <span class="size-2 rotate-45 bg-honey"></span>
                </span>
              `
            )
            .join('')}
        </div>
      </div>

      <!-- PROMISES (GEAR SHIFT) -->
      <section class="bg-sand/60 py-20">
        <div class="mx-auto max-w-6xl px-5">
          <div class="reveal mb-12">
            ${eyebrow('ليه تثق فينا')}
            <h2 class="mt-1 text-3xl font-extrabold md:text-5xl">أربع وعود، زي أربع غيارات</h2>
          </div>
          <div class="reveal" id="gear-shift-mount"></div>
        </div>
      </section>

      <!-- CARS -->
      <section class="mx-auto max-w-6xl px-5 py-24">
        <div class="reveal mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            ${eyebrow('وصلت جديد')}
            <h2 class="text-3xl font-extrabold md:text-5xl">عربيات عجبتنا</h2>
          </div>
          <a href="cars.html" class="font-bold underline decoration-clay decoration-2 underline-offset-8 hover:text-clay">
            كل السيارات (${cars.length})
          </a>
        </div>
        ${
          shown.length
            ? `
              <div class="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                ${shown
                  .map(
                    (c, i) => `
                      <div class="reveal ${i % 3 === 1 ? 'lg:translate-y-8' : ''}" style="transition-delay: ${(i % 3) * 120}ms">
                        ${carCardHtml(c)}
                      </div>
                    `
                  )
                  .join('')}
              </div>
            `
            : `<p class="rounded-3xl border-2 border-dashed border-ink/20 p-10 text-center">لسه بنجهز العربيات الجديدة، كلمنا نقولك اللي متاح.</p>`
        }
      </section>

      ${roadDividerHtml()}

      <!-- OWNER NOTE -->
      <section class="mx-auto max-w-4xl px-5 py-16">
        <figure class="reveal relative rounded-[10px] bg-[#fffefb] p-8 pt-14 shadow-[0_18px_40px_-20px_rgba(20,22,26,.45)] md:p-12 md:pt-16">
          <span class="absolute -top-5 right-12 grid size-12 place-items-center rounded-full border-[5px] border-honey bg-paper shadow-md" aria-hidden="true">
            <span class="size-3 rounded-full bg-ink/70"></span>
          </span>
          <span class="absolute -top-3 right-[4.2rem] h-10 w-1 bg-honey" aria-hidden="true"></span>
          <blockquote class="font-hand text-2xl leading-[2.1] text-ink md:text-3xl md:leading-[2.2]">${escapeHtml(settings.ownerNote)}</blockquote>
          <figcaption class="mt-6 font-display text-xl font-extrabold text-olive">— ${escapeHtml(settings.ownerName)}، غازي أوتو</figcaption>
        </figure>
      </section>

      <!-- SELL -->
      <section class="mx-auto max-w-6xl px-5 py-16">
        <div class="reveal">
          <div class="relative overflow-hidden rounded-3xl bg-olive px-8 pb-24 pt-12 text-paper md:px-14">
            <div class="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 class="text-3xl font-extrabold md:text-4xl">عايز تبيع عربيتك؟</h2>
                <p class="mt-3 max-w-lg text-lg text-paper/80">
                  ابعتلنا بياناتها، هنعاينها ونديك سعر عادل في نفس اليوم، من غير ما تفضل تستنى مشتري أسابيع.
                </p>
              </div>
              <a href="sell.html" class="justify-self-start rounded-full bg-honey px-8 py-3.5 text-center font-display text-lg font-extrabold text-ink transition hover:bg-paper md:justify-self-end">
                قيّم عربيتي
              </a>
            </div>
            <div dir="ltr" class="absolute inset-x-0 bottom-0 h-16" aria-hidden="true">
              <div class="absolute inset-x-0 bottom-0 h-8 bg-[#14161a]/70"></div>
              <div class="road-dash absolute inset-x-0 bottom-[14px] h-[3px] [background-image:repeating-linear-gradient(90deg,#f5f3ef_0_28px,transparent_28px_56px)]"></div>
              <div class="absolute bottom-[18px] left-[40%] w-36">
                ${carSilhouetteSvg({ beam: true, className: 'hero-car h-auto w-full', body: '#f5f3ef', accent: '#d9b977' })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VISIT -->
      <section class="mx-auto max-w-6xl px-5 pb-6 pt-8">
        <div class="grid gap-10 md:grid-cols-2">
          <div class="reveal">
            ${eyebrow('تعالى شوف بنفسك')}
            <h2 class="mt-1 text-3xl font-extrabold md:text-5xl">المعرض في كفر الشيخ</h2>
            <a href="contact.html" class="mt-8 inline-block rounded-full border-2 border-ink px-6 py-2 font-bold transition hover:bg-ink hover:text-paper">احجز ميعاد تجربة</a>
          </div>
          <div class="reveal" style="transition-delay: 150ms">
            <dl class="space-y-4 text-lg">
              <div class="rounded-2xl border-r-8 border-honey bg-sand/60 px-6 py-4">
                <dt class="font-display font-bold text-olive">العنوان</dt>
                <dd class="whitespace-pre-line">${escapeHtml(settings.address)}</dd>
              </div>
              <div class="rounded-2xl border-r-8 border-honey bg-sand/60 px-6 py-4">
                <dt class="font-display font-bold text-olive">المواعيد</dt>
                <dd>${escapeHtml(settings.hours)}</dd>
              </div>
              <div class="rounded-2xl border-r-8 border-honey bg-sand/60 px-6 py-4">
                <dt class="font-display font-bold text-olive">التليفون</dt>
                <dd><span dir="ltr" class="inline-block font-bold">${escapeHtml(settings.phone)}</span></dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    `;

    mountGearShift(document.getElementById('gear-shift-mount'), promises);
    initReveals(root);
  }

  function mountGearShift(container, items) {
    if (!container) return;
    const gears = ['P', 'R', 'N', 'D'];
    let idx = 0;

    function render() {
      const [title, text] = items[idx];
      container.innerHTML = `
        <div class="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-14">
          <div class="mx-auto w-full max-w-xs rounded-[28px] bg-ink p-5 text-paper shadow-[0_25px_45px_-25px_rgba(0,0,0,.8)]" dir="ltr">
            <div class="mb-4 flex justify-between rounded-lg bg-[#0b0c0f] px-4 py-2 font-display text-2xl font-extrabold tracking-[.35em]">
              ${gears
                .map(
                  (g, k) =>
                    `<span class="${k === idx ? 'text-honey [text-shadow:0_0_12px_#d9b977]' : 'text-paper/25'}">${g}</span>`
                )
                .join('')}
            </div>
            <div class="relative mx-auto h-56 w-24 rounded-full bg-[#0b0c0f] p-2 shadow-[inset_0_4px_14px_rgba(0,0,0,.9)]">
              <div class="absolute inset-y-6 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-paper/10"></div>
              <div
                class="absolute left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-b from-clay to-[#6f5429] font-display text-xl font-extrabold shadow-[0_8px_16px_rgba(0,0,0,.6),inset_0_2px_3px_rgba(255,255,255,.35)] transition-[top] duration-500 [transition-timing-function:cubic-bezier(.3,1.5,.5,1)]"
                style="top: calc(${idx} * (100% - 3.5rem - 1rem) / 3 + .5rem)"
                aria-hidden="true"
              >
                ${gears[idx]}
              </div>
              <div class="absolute inset-0 flex flex-col justify-between p-2">
                ${gears
                  .map(
                    (g, k) =>
                      `<button type="button" data-gear-idx="${k}" aria-label="${escapeHtml(items[k][0])}" aria-pressed="${k === idx}" class="h-14 w-full rounded-full cursor-pointer"></button>`
                  )
                  .join('')}
              </div>
            </div>
            <p class="mt-3 text-center text-xs text-paper/50">اضغط على الغيار</p>
          </div>
          <div class="gear-in">
            <span class="font-hand text-3xl text-clay">${['١', '٢', '٣', '٤'][idx]} من ٤</span>
            <h3 class="mt-1 font-display text-3xl font-extrabold md:text-5xl">${escapeHtml(title)}</h3>
            <p class="mt-4 max-w-xl text-xl text-ink/75">${escapeHtml(text)}</p>
            <div class="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="وعودنا">
              ${items
                .map(
                  ([t], k) => `
                    <button
                      type="button"
                      data-gear-idx="${k}"
                      class="rounded-full border-2 px-4 py-1 text-sm font-bold transition ${k === idx ? 'border-olive bg-olive text-paper' : 'border-ink/20 hover:border-olive'}"
                    >
                      ${escapeHtml(t)}
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('[data-gear-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          idx = Number(btn.getAttribute('data-gear-idx'));
          render();
        });
      });
    }

    render();
  }

  // ---------------- CARS BROWSER PAGE ----------------
  function initCarsPage() {
    const root = document.getElementById('cars-browser-mount');
    if (!root) return;

    let q = '';
    let body = 'all';
    let brand = 'all';
    let sort = 'new';

    function render() {
      const cars = getCars();
      const bodies = [...new Set(cars.map((c) => c.bodyType).filter(Boolean))];
      const brands = [...new Set(cars.map((c) => c.brand).filter(Boolean))].sort();

      const t = q.trim().toLowerCase();
      const list = cars.filter(
        (c) =>
          (body === 'all' || c.bodyType === body) &&
          (brand === 'all' || c.brand === brand) &&
          (!t || `${c.name} ${c.brand} ${c.year}`.toLowerCase().includes(t))
      );

      if (sort === 'low') list.sort((a, b) => a.price - b.price);
      if (sort === 'high') list.sort((a, b) => b.price - a.price);
      if (sort === 'year') list.sort((a, b) => b.year - a.year);

      const chip = (active) =>
        `rounded-full border-2 px-4 py-1.5 font-medium transition ${active ? 'border-olive bg-olive text-paper' : 'border-ink/20 hover:border-olive'}`;

      root.innerHTML = `
        <div class="mb-8 space-y-4 rounded-3xl bg-sand/70 p-5">
          <div class="flex flex-wrap gap-3">
            <input
              id="cars-search-input"
              value="${escapeHtml(q)}"
              placeholder="دوّر باسم العربية أو الماركة..."
              class="min-w-56 flex-1 rounded-full border-2 border-ink/15 bg-paper px-5 py-2.5 outline-none focus:border-olive"
            />
            <select id="cars-brand-select" class="rounded-full border-2 border-ink/15 bg-paper px-4 py-2.5" aria-label="الماركة">
              <option value="all" ${brand === 'all' ? 'selected' : ''}>كل الماركات</option>
              ${brands.map((b) => `<option value="${escapeHtml(b)}" ${brand === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
            </select>
            <select id="cars-sort-select" class="rounded-full border-2 border-ink/15 bg-paper px-4 py-2.5" aria-label="الترتيب">
              <option value="new" ${sort === 'new' ? 'selected' : ''}>الأحدث إضافة</option>
              <option value="low" ${sort === 'low' ? 'selected' : ''}>الأرخص أولاً</option>
              <option value="high" ${sort === 'high' ? 'selected' : ''}>الأغلى أولاً</option>
              <option value="year" ${sort === 'year' ? 'selected' : ''}>الأحدث موديل</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-body-btn="all" class="${chip(body === 'all')}">الكل</button>
            ${bodies
              .map(
                (b) =>
                  `<button type="button" data-body-btn="${escapeHtml(b)}" class="${chip(body === b)}">${escapeHtml(labels.bodyType[b] || b)}</button>`
              )
              .join('')}
          </div>
        </div>
        <p class="mb-5 font-bold text-ink/60" aria-live="polite">${list.length} سيارة</p>
        ${
          list.length
            ? `
              <div class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                ${list
                  .map(
                    (c, i) => `
                      <div class="card-in" style="animation-delay: ${Math.min(i, 8) * 70}ms">
                        ${carCardHtml(c)}
                      </div>
                    `
                  )
                  .join('')}
              </div>
            `
            : `
              <div class="rounded-3xl border-2 border-dashed border-ink/20 p-12 text-center">
                <p class="font-display text-2xl font-bold">مفيش عربية بالمواصفات دي دلوقتي</p>
                <p class="mt-2 text-ink/65">كلمنا وقولنا إنت عايز إيه، ساعات بتوصلنا عربيات قبل ما نعرضها.</p>
              </div>
            `
        }
      `;

      const searchEl = document.getElementById('cars-search-input');
      if (searchEl) {
        searchEl.addEventListener('input', (e) => {
          q = e.target.value;
          const pos = e.target.selectionStart;
          render();
          const nextInput = document.getElementById('cars-search-input');
          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(pos, pos);
          }
        });
      }

      document.getElementById('cars-brand-select')?.addEventListener('change', (e) => {
        brand = e.target.value;
        render();
      });

      document.getElementById('cars-sort-select')?.addEventListener('change', (e) => {
        sort = e.target.value;
        render();
      });

      root.querySelectorAll('[data-body-btn]').forEach((btn) => {
        btn.addEventListener('click', () => {
          body = btn.getAttribute('data-body-btn');
          render();
        });
      });
    }

    render();
  }

  // ---------------- SINGLE CAR DETAIL PAGE ----------------
  function initCarDetailPage() {
    const root = document.getElementById('car-detail-mount');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const car = getCarBySlug(slug);
    const settings = getSettings();
    const all = getCars();

    if (!car) {
      root.innerHTML = `
        <div class="mx-auto max-w-2xl px-5 py-24 text-center">
          <p class="font-hand text-3xl text-clay">مش لاقيين العربية دي</p>
          <h1 class="mt-2 text-4xl font-extrabold">ممكن تكون اتباعت أو الرابط اتغير</h1>
          <a href="cars.html" class="mt-8 inline-block rounded-full bg-olive px-8 py-3 font-display font-extrabold text-paper">شوف كل السيارات</a>
        </div>
      `;
      return;
    }

    document.title = `${car.name} ${car.year} | غازي أوتو`;

    const images = [
      ...(car.imageUrl ? [{ url: car.imageUrl, alt: car.imageAlt || car.name }] : []),
      ...(car.gallery || []).filter((g) => g && g.url).map((g) => ({ url: g.url, alt: g.alt || car.name })),
    ];

    const specs = [
      ['الماركة', car.brand],
      ['سنة الصنع', String(car.year)],
      ['الحالة', labels.condition[car.condition] || car.condition],
      ['ناقل الحركة', car.transmission ? labels.transmission[car.transmission] || car.transmission : null],
      ['الوقود', car.fuel ? labels.fuel[car.fuel] || car.fuel : null],
      ['سعة الموتور', car.engineCc ? `${car.engineCc} سي سي` : null],
      ['اللون', car.color],
      ['الشكل', labels.bodyType[car.bodyType] || car.bodyType],
    ].filter(([, v]) => v);

    const related = all.filter((c) => c.slug !== car.slug && c.status !== 'sold').slice(0, 3);
    const unavailable = car.status !== 'available';

    root.innerHTML = `
      <div class="mx-auto max-w-6xl px-5 py-10">
        <nav class="mb-6 text-ink/60" aria-label="مسار التنقل">
          <a href="index.html" class="hover:text-clay">الرئيسية</a> / <a href="cars.html" class="hover:text-clay">السيارات</a> / ${escapeHtml(car.name)}
        </nav>

        <div class="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div id="car-gallery-mount"></div>

            ${
              car.description
                ? `
                  <section class="mt-10">
                    <h2 class="mb-3 text-2xl font-extrabold">عن العربية</h2>
                    <p class="whitespace-pre-line text-lg text-ink/80">${escapeHtml(car.description)}</p>
                  </section>
                `
                : ''
            }

            ${
              car.features && car.features.length
                ? `
                  <section class="mt-8">
                    <h2 class="mb-3 text-2xl font-extrabold">فيها إيه؟</h2>
                    <ul class="grid gap-2 sm:grid-cols-2">
                      ${car.features
                        .map(
                          (f) => `
                            <li class="flex items-center gap-3 rounded-xl bg-sand/60 px-4 py-2">
                              <span class="size-2.5 rotate-45 rounded-[2px] bg-clay" aria-hidden="true"></span>
                              ${escapeHtml(f.text)}
                            </li>
                          `
                        )
                        .join('')}
                    </ul>
                  </section>
                `
                : ''
            }
          </div>

          <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="rounded-3xl bg-[#fffefb] p-7 shadow-[0_20px_40px_-24px_rgba(20,22,26,.5)]">
              ${
                unavailable
                  ? `<span class="mb-3 inline-block rounded-full bg-ink px-3 py-1 text-sm font-bold text-paper">${escapeHtml(labels.status[car.status] || car.status)}</span>`
                  : ''
              }
              <h1 class="text-3xl font-extrabold">${escapeHtml(car.name)}</h1>
              <p class="text-ink/60">موديل ${escapeHtml(car.year)}</p>
              <div class="mt-5">${plateHtml(formatPrice(car.price), { size: 'lg', unit: 'جنيه' })}</div>
              <p class="mt-2 text-sm text-ink/60">${car.negotiable ? 'السعر قابل للتفاوض في حدود المعقول' : 'السعر نهائي'}</p>

              ${
                car.mileage != null && car.mileage !== ''
                  ? `
                    <div class="mt-6">
                      <p class="mb-2 text-sm font-bold text-ink/60">عداد الكيلومترات</p>
                      ${odometerHtml(car.mileage)}
                    </div>
                  `
                  : ''
              }

              <dl class="mt-6 divide-y divide-ink/10 border-y border-ink/10">
                ${specs
                  .map(
                    ([k, v]) => `
                      <div class="flex justify-between py-2">
                        <dt class="text-ink/60">${escapeHtml(k)}</dt>
                        <dd class="font-bold">${escapeHtml(v)}</dd>
                      </div>
                    `
                  )
                  .join('')}
              </dl>

              <div class="mt-6 flex flex-wrap gap-3">
                <a
                  href="${whatsappLink(settings.whatsapp, `السلام عليكم، عايز أسأل عن ${car.name} ${car.year} (${formatPrice(car.price)} جنيه)`)}"
                  target="_blank"
                  rel="noreferrer"
                  class="flex-1 rounded-full bg-[#1f8f4d] px-5 py-3 text-center font-bold text-white transition hover:opacity-90"
                >
                  واتساب
                </a>
                <a href="tel:${escapeHtml(settings.phone.replace(/\s/g, ''))}" class="flex-1 rounded-full border-2 border-ink px-5 py-3 text-center font-bold transition hover:bg-ink hover:text-paper">
                  اتصل بينا
                </a>
              </div>
            </div>

            ${
              car.status !== 'sold'
                ? `
                  <div class="mt-6 rounded-3xl border-2 border-ink/10 p-6">
                    <h2 class="mb-4 text-xl font-extrabold">عايز تجربها؟ سيب بياناتك</h2>
                    <div id="car-inquiry-mount"></div>
                  </div>
                `
                : ''
            }
          </aside>
        </div>

        ${
          related.length
            ? `
              <section class="mt-16">
                ${roadDividerHtml()}
                <h2 class="mb-8 mt-6 text-3xl font-extrabold">ممكن تعجبك كمان</h2>
                <div class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  ${related
                    .map(
                      (c, i) => `
                        <div class="reveal" style="transition-delay: ${i * 120}ms">
                          ${carCardHtml(c)}
                        </div>
                      `
                    )
                    .join('')}
                </div>
              </section>
            `
            : ''
        }
      </div>
    `;

    mountGallery(document.getElementById('car-gallery-mount'), images, car.status === 'sold');
    if (car.status !== 'sold') {
      mountInquiryForm(document.getElementById('car-inquiry-mount'), {
        defaultKind: 'testDrive',
        kinds: ['testDrive', 'question'],
        carId: car.id,
        carName: `${car.name} ${car.year}`,
      });
    }
    initOdometers(root);
    initReveals(root);
  }

  function mountGallery(container, images, soldOut) {
    if (!container || !images.length) return;
    let currentIdx = 0;

    function render() {
      const current = images[currentIdx];
      container.innerHTML = `
        <div class="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand">
          <img src="${escapeHtml(current.url)}" alt="${escapeHtml(current.alt)}" class="h-full w-full object-cover ${soldOut ? 'grayscale' : ''}" />
          <span class="absolute bottom-3 right-3 rounded-md bg-ink/80 px-3 py-1 font-display text-sm font-bold text-paper tabular-nums">${currentIdx + 1} / ${images.length}</span>
        </div>
        ${
          images.length > 1
            ? `
              <div class="mt-3 flex gap-3 overflow-x-auto pb-1">
                ${images
                  .map(
                    (img, idx) => `
                      <button
                        type="button"
                        data-gallery-idx="${idx}"
                        aria-label="صورة ${idx + 1}"
                        class="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${idx === currentIdx ? 'border-clay' : 'border-transparent opacity-70 hover:opacity-100'}"
                      >
                        <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}" class="h-full w-full object-cover" />
                      </button>
                    `
                  )
                  .join('')}
              </div>
            `
            : ''
        }
      `;

      container.querySelectorAll('[data-gallery-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentIdx = Number(btn.getAttribute('data-gallery-idx'));
          render();
        });
      });
    }

    render();
  }

  // ---------------- SELL PAGE ----------------
  function initSellPage() {
    const mount = document.getElementById('sell-form-mount');
    if (!mount) return;
    mountInquiryForm(mount, {
      defaultKind: 'sellCar',
      kinds: ['sellCar'],
      submitLabel: 'ابعت بيانات العربية',
    });
  }

  // ---------------- CONTACT PAGE ----------------
  function initContactPage() {
    const infoMount = document.getElementById('contact-info-mount');
    const formMount = document.getElementById('contact-form-mount');
    if (!infoMount && !formMount) return;

    const s = getSettings();
    if (infoMount) {
      infoMount.innerHTML = `
        <p class="font-hand text-2xl text-clay">إحنا بنرد</p>
        <h1 class="text-4xl font-extrabold md:text-5xl">كلمنا، من غير حرج</h1>
        <p class="mt-4 text-lg text-ink/75">اسأل عن عربية، احجز تجربة، أو اتفرج عندنا في المعرض. مفيش سؤال سخيف.</p>
        <dl class="mt-8 space-y-5 text-lg">
          <div>
            <dt class="font-bold text-olive">التليفون</dt>
            <dd dir="ltr" class="text-right font-bold"><a href="tel:${escapeHtml(s.phone.replace(/\s/g, ''))}">${escapeHtml(s.phone)}</a></dd>
          </div>
          <div>
            <dt class="font-bold text-olive">العنوان</dt>
            <dd class="whitespace-pre-line">${escapeHtml(s.address)}</dd>
          </div>
          <div>
            <dt class="font-bold text-olive">المواعيد</dt>
            <dd>${escapeHtml(s.hours)}</dd>
          </div>
        </dl>
        <div class="mt-6 flex flex-wrap gap-3">
          <a href="${whatsappLink(s.whatsapp, 'السلام عليكم')}" target="_blank" rel="noreferrer" class="rounded-full bg-[#1f8f4d] px-6 py-2.5 font-bold text-white">واتساب</a>
          ${s.mapUrl ? `<a href="${escapeHtml(s.mapUrl)}" target="_blank" rel="noreferrer" class="rounded-full border-2 border-ink px-6 py-2.5 font-bold">الخريطة</a>` : ''}
        </div>
      `;
    }
    if (formMount) {
      mountInquiryForm(formMount);
    }
  }

  function boot() {
    const page = document.body.getAttribute('data-page') || 'home';
    renderHeader(page);
    renderFooter();
    renderWhatsAppButton();

    if (page === 'home') initHomePage();
    if (page === 'cars') initCarsPage();
    if (page === 'car') initCarDetailPage();
    if (page === 'sell') initSellPage();
    if (page === 'contact') initContactPage();
  }

  window.addEventListener('ghazy:data-changed', boot);
  document.addEventListener('DOMContentLoaded', boot);
})();
