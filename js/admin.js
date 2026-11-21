/* =========================================================
   GHAZY AUTO — Standalone External Admin Panel (CMS)
   Connected to the public storefront via shared storage
   ========================================================= */

(function () {
  const {
    getCars,
    saveCars,
    getSettings,
    saveSettings,
    getInquiries,
    saveInquiries,
    resetAllData,
    labels,
    formatPrice,
    whatsappLink,
    slugify,
    escapeHtml,
  } = window.GhazyStore;

  const SESSION_KEY = 'ghazy_admin_authenticated_v1';
  let activeTab = 'cars';
  let editingCarId = null;
  let inquiryFilter = 'all';

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 2800);
  }

  function renderLogin() {
    const app = document.getElementById('admin-app');
    app.innerHTML = `
      <div class="grid min-h-screen place-items-center bg-olive-deep px-5 py-12 text-paper">
        <div class="w-full max-w-md rounded-3xl border border-paper/10 bg-olive p-8 shadow-[0_30px_70px_-20px_rgba(0,0,0,.85)]">
          <div class="flex items-center gap-3">
            <span class="grid size-12 place-items-center rounded-full bg-clay font-display text-2xl font-extrabold text-paper">غ</span>
            <div>
              <h1 class="font-display text-2xl font-extrabold">لوحة إدارة غازي أوتو</h1>
              <p class="text-xs text-honey">بوابة التحكم الخاصة بالمعرض</p>
            </div>
          </div>

          <p class="mt-6 text-sm text-paper/75">أدخل رمز الدخول للتحكم في السيارات المعروضة، الأسعار، بيانات التواصل، وطلبات العملاء.</p>

          <form id="admin-login-form" class="mt-6 space-y-4">
            <label class="block">
              <span class="text-sm font-bold text-paper/90">رمز الدخول (PIN)</span>
              <input
                type="password"
                id="admin-pin-input"
                dir="ltr"
                required
                placeholder="••••"
                class="mt-1.5 w-full rounded-xl border-2 border-paper/15 bg-olive-deep px-4 py-3 text-center font-display text-xl font-extrabold tracking-widest text-honey outline-none focus:border-honey"
              />
            </label>
            <p id="admin-login-error" class="hidden text-sm font-bold text-honey"></p>
            <button type="submit" class="w-full rounded-full bg-clay px-6 py-3.5 font-display text-lg font-extrabold text-paper transition hover:bg-honey hover:text-ink">
              دخول للوحة التحكم
            </button>
          </form>

          <div class="mt-6 border-t border-paper/10 pt-4 text-center text-xs text-paper/45">
            الرمز الافتراضي للتجربة: <span dir="ltr" class="font-bold text-paper/75">2026</span> (يمكن تغييره من الإعدادات)
          </div>
        </div>
      </div>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('admin-pin-input').value.trim();
      const settings = getSettings();
      if (input === String(settings.adminPin || '2026')) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        renderDashboard();
      } else {
        const err = document.getElementById('admin-login-error');
        err.textContent = 'رمز الدخول غير صحيح، حاول مرة أخرى.';
        err.classList.remove('hidden');
      }
    });
  }

  function renderDashboard() {
    const app = document.getElementById('admin-app');
    const cars = getCars();
    const inquiries = getInquiries();
    const newInqCount = inquiries.filter((i) => i.status === 'new').length;
    const availableCount = cars.filter((c) => c.status === 'available').length;
    const reservedCount = cars.filter((c) => c.status === 'reserved').length;
    const soldCount = cars.filter((c) => c.status === 'sold').length;

    app.innerHTML = `
      <div class="min-h-screen bg-paper text-ink">
        <header class="sticky top-0 z-30 border-b border-ink/10 bg-olive-deep text-paper">
          <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5">
            <div class="flex items-center gap-3">
              <span class="grid size-10 place-items-center rounded-full bg-clay font-display text-xl font-extrabold text-paper">غ</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-display text-lg font-extrabold">غازي أوتو — لوحة الإدارة</span>
                  <span class="rounded-full bg-honey/20 px-2.5 py-0.5 text-xs font-bold text-honey">مرتبطة بالموقع</span>
                </div>
                <p class="text-xs text-paper/60">أي تعديل هنا يُحفظ ويظهر فوراً في صفحات الموقع</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <a href="index.html" target="_blank" rel="noreferrer" class="rounded-full border border-paper/25 px-4 py-1.5 text-sm font-bold text-paper transition hover:border-honey hover:text-honey">
                فتح الموقع ↗
              </a>
              <button type="button" id="btn-export-data-js" class="rounded-full bg-clay px-4 py-1.5 text-sm font-bold text-paper transition hover:bg-honey hover:text-ink">
                تصدير default-data.js
              </button>
              <button type="button" id="btn-admin-logout" class="rounded-full bg-paper/10 px-4 py-1.5 text-sm font-bold text-paper/80 transition hover:bg-paper/20">
                خروج
              </button>
            </div>
          </div>
        </header>

        <div class="mx-auto max-w-7xl px-5 py-8">
          <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl bg-[#fffefb] p-5 shadow-sm border border-ink/5">
              <p class="text-sm font-bold text-ink/60">إجمالي السيارات</p>
              <p class="mt-1 font-display text-3xl font-extrabold text-olive">${cars.length}</p>
              <p class="mt-1 text-xs text-ink/50">${availableCount} متاحة · ${reservedCount} محجوزة · ${soldCount} مباعة</p>
            </div>
            <div class="rounded-2xl bg-[#fffefb] p-5 shadow-sm border border-ink/5">
              <p class="text-sm font-bold text-ink/60">سيارات متاحة للبيع</p>
              <p class="mt-1 font-display text-3xl font-extrabold text-[#1f8f4d]">${availableCount}</p>
              <p class="mt-1 text-xs text-ink/50">معروضة حالياً للزوار</p>
            </div>
            <div class="rounded-2xl bg-[#fffefb] p-5 shadow-sm border border-ink/5">
              <p class="text-sm font-bold text-ink/60">طلبات ورسائل العملاء</p>
              <p class="mt-1 font-display text-3xl font-extrabold text-clay">${inquiries.length}</p>
              <p class="mt-1 text-xs text-ink/50">${newInqCount} طلب جديد بانتظار الرد</p>
            </div>
            <div class="rounded-2xl bg-[#fffefb] p-5 shadow-sm border border-ink/5">
              <p class="text-sm font-bold text-ink/60">المميزة في الرئيسية</p>
              <p class="mt-1 font-display text-3xl font-extrabold text-olive">${cars.filter((c) => c.featured).length}</p>
              <p class="mt-1 text-xs text-ink/50">تظهر في واجهة الموقع</p>
            </div>
          </div>

          <div class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
            <div class="flex flex-wrap gap-2">
              <button type="button" data-admin-tab="cars" class="rounded-full px-5 py-2 font-display font-bold transition ${activeTab === 'cars' ? 'bg-olive text-paper' : 'bg-sand/70 text-ink hover:bg-sand'}">
                السيارات (${cars.length})
              </button>
              <button type="button" data-admin-tab="inquiries" class="rounded-full px-5 py-2 font-display font-bold transition ${activeTab === 'inquiries' ? 'bg-olive text-paper' : 'bg-sand/70 text-ink hover:bg-sand'}">
                طلبات العملاء ${newInqCount ? `<span class="mr-1.5 rounded-full bg-clay px-2 py-0.5 text-xs text-paper">${newInqCount}</span>` : ''}
              </button>
              <button type="button" data-admin-tab="settings" class="rounded-full px-5 py-2 font-display font-bold transition ${activeTab === 'settings' ? 'bg-olive text-paper' : 'bg-sand/70 text-ink hover:bg-sand'}">
                إعدادات المعرض
              </button>
            </div>

            ${
              activeTab === 'cars'
                ? `<button type="button" id="btn-open-new-car" class="rounded-full bg-clay px-6 py-2.5 font-display font-extrabold text-paper shadow-md transition hover:bg-olive">+ إضافة عربية جديدة</button>`
                : ''
            }
          </div>

          <div id="admin-tab-content"></div>
        </div>
      </div>

      <div id="car-modal" class="fixed inset-0 z-50 hidden overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm">
        <div class="mx-auto my-8 max-w-3xl rounded-3xl bg-[#fffefb] p-6 shadow-2xl md:p-8">
          <div id="car-modal-body"></div>
        </div>
      </div>

      <div id="admin-toast" class="pointer-events-none fixed bottom-6 right-6 z-50 translate-y-4 rounded-2xl bg-olive-deep px-5 py-3 font-bold text-honey opacity-0 shadow-xl transition duration-300"></div>
    `;

    document.getElementById('btn-admin-logout').addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      renderLogin();
    });

    document.getElementById('btn-export-data-js').addEventListener('click', exportDefaultDataFile);

    app.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-admin-tab');
        renderDashboard();
      });
    });

    document.getElementById('btn-open-new-car')?.addEventListener('click', () => openCarModal(null));

    if (activeTab === 'cars') renderCarsTab();
    if (activeTab === 'inquiries') renderInquiriesTab();
    if (activeTab === 'settings') renderSettingsTab();
  }

  function renderCarsTab() {
    const mount = document.getElementById('admin-tab-content');
    const cars = getCars();

    if (!cars.length) {
      mount.innerHTML = `
        <div class="rounded-3xl border-2 border-dashed border-ink/20 p-12 text-center">
          <p class="font-display text-2xl font-bold">مفيش عربيات مضافة حالياً</p>
          <button type="button" id="empty-add-car" class="mt-4 rounded-full bg-clay px-6 py-2.5 font-bold text-paper">+ أضف أول عربية</button>
        </div>
      `;
      document.getElementById('empty-add-car').addEventListener('click', () => openCarModal(null));
      return;
    }

    mount.innerHTML = `
      <div class="overflow-x-auto rounded-3xl bg-[#fffefb] shadow-sm border border-ink/5">
        <table class="w-full text-right text-sm">
          <thead class="border-b border-ink/10 bg-sand/50 font-display text-ink/70">
            <tr>
              <th class="px-4 py-3.5">العربية</th>
              <th class="px-4 py-3.5">الموديل</th>
              <th class="px-4 py-3.5">السعر</th>
              <th class="px-4 py-3.5">الحالة</th>
              <th class="px-4 py-3.5">مميزة</th>
              <th class="px-4 py-3.5">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink/10">
            ${cars
              .map(
                (car) => `
                  <tr class="hover:bg-paper/60">
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-3">
                        <img src="${escapeHtml(car.imageUrl || '')}" alt="" class="h-14 w-20 shrink-0 rounded-xl bg-sand object-cover" />
                        <div>
                          <div class="font-display text-base font-extrabold text-ink">${escapeHtml(car.name)}</div>
                          <div class="text-xs text-ink/60">${escapeHtml(car.brand)} · ${escapeHtml(labels.bodyType[car.bodyType] || car.bodyType)}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3.5 font-display font-bold">${escapeHtml(car.year)}</td>
                    <td class="px-4 py-3.5 font-display font-extrabold text-clay">${formatPrice(car.price)} ج.م</td>
                    <td class="px-4 py-3.5">
                      <select data-car-status="${escapeHtml(car.id)}" class="rounded-full border border-ink/20 bg-paper px-3 py-1 font-bold text-xs">
                        <option value="available" ${car.status === 'available' ? 'selected' : ''}>متاحة</option>
                        <option value="reserved" ${car.status === 'reserved' ? 'selected' : ''}>محجوزة</option>
                        <option value="sold" ${car.status === 'sold' ? 'selected' : ''}>مباعة</option>
                      </select>
                    </td>
                    <td class="px-4 py-3.5">
                      <button type="button" data-car-featured="${escapeHtml(car.id)}" class="rounded-full px-3 py-1 text-xs font-bold transition ${car.featured ? 'bg-honey text-ink' : 'bg-sand/70 text-ink/50'}">
                        ${car.featured ? '★ مميزة' : '☆ عادية'}
                      </button>
                    </td>
                    <td class="px-4 py-3.5">
                      <div class="flex flex-wrap items-center gap-2">
                        <a href="car.html?slug=${encodeURIComponent(car.slug)}" target="_blank" rel="noreferrer" class="rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-bold hover:border-olive">معاينة ↗</a>
                        <button type="button" data-car-edit="${escapeHtml(car.id)}" class="rounded-lg bg-olive px-3 py-1 text-xs font-bold text-paper hover:bg-clay">تعديل</button>
                        <button type="button" data-car-delete="${escapeHtml(car.id)}" class="rounded-lg bg-red-600/10 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white">حذف</button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    mount.querySelectorAll('[data-car-status]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const id = sel.getAttribute('data-car-status');
        const list = getCars().map((c) => (c.id === id ? { ...c, status: sel.value } : c));
        saveCars(list);
        renderDashboard();
        showToast('تم تحديث حالة السيارة بنجاح');
      });
    });

    mount.querySelectorAll('[data-car-featured]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-car-featured');
        const list = getCars().map((c) => (c.id === id ? { ...c, featured: !c.featured } : c));
        saveCars(list);
        renderDashboard();
        showToast('تم تحديث ظهور السيارة في الرئيسية');
      });
    });

    mount.querySelectorAll('[data-car-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-car-edit');
        const car = getCars().find((c) => c.id === id) || null;
        openCarModal(car);
      });
    });

    mount.querySelectorAll('[data-car-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-car-delete');
        if (!confirm('متأكد إنك عايز تحذف العربية دي؟')) return;
        saveCars(getCars().filter((c) => c.id !== id));
        renderDashboard();
        showToast('تم حذف السيارة');
      });
    });
  }

  function openCarModal(car) {
    editingCarId = car ? car.id : null;
    const modal = document.getElementById('car-modal');
    const body = document.getElementById('car-modal-body');
    const c = car || {
      name: '',
      slug: '',
      brand: '',
      year: new Date().getFullYear(),
      price: '',
      negotiable: true,
      bodyType: 'sedan',
      condition: 'used',
      mileage: '',
      transmission: 'automatic',
      fuel: 'petrol',
      engineCc: '',
      color: '',
      status: 'available',
      featured: false,
      description: '',
      features: [],
      imageUrl: '',
      gallery: [],
    };

    const field = 'mt-1 w-full rounded-xl border-2 border-ink/15 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-olive';
    const featuresText = (c.features || []).map((f) => f.text).join('
');
    const galleryText = (c.gallery || []).map((g) => g.url).join('
');

    body.innerHTML = `
      <div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
        <h2 class="font-display text-2xl font-extrabold">${car ? `تعديل: ${escapeHtml(car.name)}` : 'إضافة عربية جديدة للمعرض'}</h2>
        <button type="button" id="close-car-modal" class="grid size-9 place-items-center rounded-full bg-sand font-bold hover:bg-ink hover:text-paper">✕</button>
      </div>

      <form id="car-editor-form" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-bold">اسم العربية *</span>
            <input name="name" required value="${escapeHtml(c.name)}" placeholder="مثلاً: مرسيدس C200 AMG" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">الماركة (Brand) *</span>
            <input name="brand" required value="${escapeHtml(c.brand)}" placeholder="مثلاً: Mercedes" class="${field}" />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-bold">سنة الصنع *</span>
            <input name="year" type="number" min="1990" max="2100" required value="${escapeHtml(c.year)}" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">السعر (بالجنيه) *</span>
            <input name="price" type="number" min="0" required value="${escapeHtml(c.price)}" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">الكيلومترات</span>
            <input name="mileage" type="number" min="0" value="${escapeHtml(c.mileage ?? '')}" class="${field}" />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-4">
          <label class="block">
            <span class="text-sm font-bold">الشكل</span>
            <select name="bodyType" class="${field}">
              <option value="sedan" ${c.bodyType === 'sedan' ? 'selected' : ''}>سيدان (Sedan)</option>
              <option value="suv" ${c.bodyType === 'suv' ? 'selected' : ''}>SUV</option>
              <option value="hatchback" ${c.bodyType === 'hatchback' ? 'selected' : ''}>هاتشباك</option>
              <option value="coupe" ${c.bodyType === 'coupe' ? 'selected' : ''}>كوبيه</option>
              <option value="pickup" ${c.bodyType === 'pickup' ? 'selected' : ''}>بيك أب</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-bold">الحالة</span>
            <select name="condition" class="${field}">
              <option value="used" ${c.condition === 'used' ? 'selected' : ''}>مستعملة</option>
              <option value="new" ${c.condition === 'new' ? 'selected' : ''}>زيرو</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-bold">الفتيس</span>
            <select name="transmission" class="${field}">
              <option value="automatic" ${c.transmission === 'automatic' ? 'selected' : ''}>أوتوماتيك</option>
              <option value="manual" ${c.transmission === 'manual' ? 'selected' : ''}>مانيوال</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-bold">الوقود</span>
            <select name="fuel" class="${field}">
              <option value="petrol" ${c.fuel === 'petrol' ? 'selected' : ''}>بنزين</option>
              <option value="diesel" ${c.fuel === 'diesel' ? 'selected' : ''}>ديزل</option>
              <option value="hybrid" ${c.fuel === 'hybrid' ? 'selected' : ''}>هايبرد</option>
              <option value="electric" ${c.fuel === 'electric' ? 'selected' : ''}>كهرباء</option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-bold">سعة الموتور (CC)</span>
            <input name="engineCc" type="number" min="0" value="${escapeHtml(c.engineCc ?? '')}" placeholder="1600" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">اللون</span>
            <input name="color" value="${escapeHtml(c.color || '')}" placeholder="أسود ميتاليك" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">حالة العرض</span>
            <select name="status" class="${field}">
              <option value="available" ${c.status === 'available' ? 'selected' : ''}>متاحة</option>
              <option value="reserved" ${c.status === 'reserved' ? 'selected' : ''}>محجوزة</option>
              <option value="sold" ${c.status === 'sold' ? 'selected' : ''}>مباعة</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap gap-6 rounded-2xl bg-sand/50 px-4 py-3">
          <label class="flex items-center gap-2 font-bold text-sm cursor-pointer">
            <input type="checkbox" name="negotiable" ${c.negotiable ? 'checked' : ''} class="size-4 accent-olive" />
            السعر قابل للتفاوض
          </label>
          <label class="flex items-center gap-2 font-bold text-sm cursor-pointer">
            <input type="checkbox" name="featured" ${c.featured ? 'checked' : ''} class="size-4 accent-clay" />
            عرض في الصفحة الرئيسية (مميزة)
          </label>
        </div>

        <div>
          <span class="text-sm font-bold">الصورة الرئيسية (رابط مباشر أو ارفع صورة من جهازك) *</span>
          <div class="mt-1 flex flex-wrap gap-2">
            <input name="imageUrl" id="car-main-image-url" dir="ltr" required value="${escapeHtml(c.imageUrl || '')}" placeholder="https://..." class="min-w-52 flex-1 rounded-xl border-2 border-ink/15 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-olive" />
            <label class="cursor-pointer rounded-xl bg-olive px-4 py-2.5 text-sm font-bold text-paper hover:bg-clay">
              رفع صورة
              <input type="file" id="car-main-image-file" accept="image/*" class="hidden" />
            </label>
          </div>
        </div>

        <label class="block">
          <span class="text-sm font-bold">صور إضافية للمعرض (كل رابط في سطر منفصل)</span>
          <textarea name="gallery" dir="ltr" rows="2" placeholder="https://..." class="${field}">${escapeHtml(galleryText)}</textarea>
        </label>

        <label class="block">
          <span class="text-sm font-bold">وصف العربية (حالة الفابريكا والصيانات)</span>
          <textarea name="description" rows="3" class="${field}">${escapeHtml(c.description || '')}</textarea>
        </label>

        <label class="block">
          <span class="text-sm font-bold">الكماليات والمميزات (كل ميزة في سطر منفصل)</span>
          <textarea name="features" rows="3" placeholder="فتحة سقف بانوراما&#10;كاميرا 360&#10;بصمة وتشغيل عن بعد" class="${field}">${escapeHtml(featuresText)}</textarea>
        </label>

        <div class="flex justify-end gap-3 border-t border-ink/10 pt-4">
          <button type="button" id="cancel-car-modal" class="rounded-full border-2 border-ink/20 px-6 py-2.5 font-bold">إلغاء</button>
          <button type="submit" class="rounded-full bg-clay px-8 py-2.5 font-display font-extrabold text-paper hover:bg-olive">حفظ العربية</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');

    const close = () => modal.classList.add('hidden');
    document.getElementById('close-car-modal').addEventListener('click', close);
    document.getElementById('cancel-car-modal').addEventListener('click', close);

    document.getElementById('car-main-image-file').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('car-main-image-url').value = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('car-editor-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get('name') || '').trim();
      const brand = String(fd.get('brand') || '').trim();
      const year = Number(fd.get('year'));
      const price = Number(fd.get('price'));
      const mileageRaw = String(fd.get('mileage') || '').trim();
      const engineRaw = String(fd.get('engineCc') || '').trim();

      const featuresList = String(fd.get('features') || '')
        .split(/?
/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ text }));

      const galleryList = String(fd.get('gallery') || '')
        .split(/?
/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((url) => ({ url, alt: name }));

      const record = {
        id: editingCarId || 'car-' + Date.now(),
        slug: c.slug || `${slugify(brand)}-${slugify(name)}-${year}`,
        name,
        brand,
        year,
        price,
        negotiable: fd.get('negotiable') === 'on',
        bodyType: String(fd.get('bodyType') || 'sedan'),
        condition: String(fd.get('condition') || 'used'),
        mileage: mileageRaw === '' ? null : Number(mileageRaw),
        transmission: String(fd.get('transmission') || 'automatic'),
        fuel: String(fd.get('fuel') || 'petrol'),
        engineCc: engineRaw === '' ? null : Number(engineRaw),
        color: String(fd.get('color') || '').trim(),
        status: String(fd.get('status') || 'available'),
        featured: fd.get('featured') === 'on',
        description: String(fd.get('description') || '').trim(),
        features: featuresList,
        imageUrl: String(fd.get('imageUrl') || '').trim(),
        imageAlt: name,
        gallery: galleryList,
      };

      const cars = getCars();
      if (editingCarId) {
        saveCars(cars.map((item) => (item.id === editingCarId ? record : item)));
        showToast('تم تعديل بيانات السيارة وحفظها');
      } else {
        saveCars([record, ...cars]);
        showToast('تمت إضافة السيارة للمعرض بنجاح');
      }

      close();
      renderDashboard();
    });
  }

  function renderInquiriesTab() {
    const mount = document.getElementById('admin-tab-content');
    const all = getInquiries();
    const list = inquiryFilter === 'all' ? all : all.filter((i) => i.kind === inquiryFilter);

    const chip = (active) =>
      `rounded-full border px-4 py-1.5 text-sm font-bold transition ${active ? 'border-olive bg-olive text-paper' : 'border-ink/20 hover:border-olive'}`;

    mount.innerHTML = `
      <div class="mb-5 flex flex-wrap gap-2">
        <button type="button" data-inq-filter="all" class="${chip(inquiryFilter === 'all')}">الكل (${all.length})</button>
        <button type="button" data-inq-filter="testDrive" class="${chip(inquiryFilter === 'testDrive')}">تجربة قيادة</button>
        <button type="button" data-inq-filter="sellCar" class="${chip(inquiryFilter === 'sellCar')}">بيع عربية</button>
        <button type="button" data-inq-filter="question" class="${chip(inquiryFilter === 'question')}">استفسار</button>
      </div>

      ${
        list.length
          ? `
            <div class="space-y-4">
              ${list
                .map((inq) => {
                  const dateStr = new Date(inq.createdAt).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });
                  return `
                    <div class="rounded-2xl bg-[#fffefb] p-6 shadow-sm border ${inq.status === 'new' ? 'border-clay/50' : 'border-ink/5'}">
                      <div class="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="font-display text-lg font-extrabold">${escapeHtml(inq.name)}</span>
                            <span class="rounded-full bg-sand px-3 py-0.5 text-xs font-bold text-olive">${escapeHtml(labels.kind[inq.kind] || inq.kind)}</span>
                            ${inq.status === 'new' ? '<span class="rounded-full bg-clay px-2.5 py-0.5 text-xs font-bold text-paper">جديد</span>' : '<span class="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-bold text-ink/60">تم التواصل</span>'}
                          </div>
                          <p class="mt-1 text-xs text-ink/50">${escapeHtml(dateStr)}</p>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          <a href="${whatsappLink('2' + inq.phone.replace(/^0+/, ''), `أهلاً أستاذ ${inq.name}، معاك معرض غازي أوتو بخصوص طلبك`)}" target="_blank" rel="noreferrer" class="rounded-full bg-[#1f8f4d] px-4 py-1.5 text-xs font-bold text-white">رد واتساب</a>
                          <button type="button" data-inq-toggle="${escapeHtml(inq.id)}" class="rounded-full border border-ink/20 px-3.5 py-1.5 text-xs font-bold hover:border-olive">
                            ${inq.status === 'new' ? 'تحديد كمقروء' : 'إعادة كجديد'}
                          </button>
                          <button type="button" data-inq-del="${escapeHtml(inq.id)}" class="rounded-full bg-red-600/10 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white">حذف</button>
                        </div>
                      </div>

                      <div class="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                        <div><span class="text-ink/55">الموبايل:</span> <a href="tel:${escapeHtml(inq.phone)}" dir="ltr" class="font-bold underline">${escapeHtml(inq.phone)}</a></div>
                        ${inq.carName ? `<div><span class="text-ink/55">السيارة:</span> <b>${escapeHtml(inq.carName)}</b></div>` : ''}
                        ${inq.preferredTime ? `<div><span class="text-ink/55">الميعاد المفضل:</span> <b>${escapeHtml(inq.preferredTime)}</b></div>` : ''}
                      </div>

                      ${inq.message ? `<p class="mt-3 rounded-xl bg-paper p-3.5 text-sm text-ink/85 whitespace-pre-line">${escapeHtml(inq.message)}</p>` : ''}
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
          : `
            <div class="rounded-3xl border-2 border-dashed border-ink/20 p-12 text-center">
              <p class="font-display text-xl font-bold text-ink/70">لا توجد طلبات في هذا القسم حالياً</p>
              <p class="mt-1 text-sm text-ink/50">أي عميل يملأ نموذج "عايز أجربها" أو "بيع عربيتك" أو "تواصل معنا" سيظهر طلبه هنا فوراً.</p>
            </div>
          `
      }
    `;

    mount.querySelectorAll('[data-inq-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        inquiryFilter = btn.getAttribute('data-inq-filter');
        renderInquiriesTab();
      });
    });

    mount.querySelectorAll('[data-inq-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inq-toggle');
        const updated = getInquiries().map((item) =>
          item.id === id ? { ...item, status: item.status === 'new' ? 'done' : 'new' } : item
        );
        saveInquiries(updated);
        renderDashboard();
      });
    });

    mount.querySelectorAll('[data-inq-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inq-del');
        if (!confirm('حذف هذا الطلب؟')) return;
        saveInquiries(getInquiries().filter((item) => item.id !== id));
        renderDashboard();
        showToast('تم حذف الطلب');
      });
    });
  }

  function renderSettingsTab() {
    const mount = document.getElementById('admin-tab-content');
    const s = getSettings();
    const field = 'mt-1 w-full rounded-xl border-2 border-ink/15 bg-paper px-4 py-3 outline-none focus:border-olive';

    mount.innerHTML = `
      <form id="settings-editor-form" class="max-w-3xl space-y-5 rounded-3xl bg-[#fffefb] p-7 shadow-sm border border-ink/5">
        <h2 class="font-display text-2xl font-extrabold">بيانات المعرض والتواصل</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-bold">رقم التليفون المعروض للزوار</span>
            <input name="phone" dir="ltr" required value="${escapeHtml(s.phone)}" class="${field} text-right" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">رقم الواتساب (بدون + مثل 201012345678)</span>
            <input name="whatsapp" dir="ltr" required value="${escapeHtml(s.whatsapp)}" class="${field} text-right" />
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-bold">عنوان المعرض</span>
          <textarea name="address" rows="2" required class="${field}">${escapeHtml(s.address)}</textarea>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-bold">مواعيد العمل</span>
            <input name="hours" required value="${escapeHtml(s.hours)}" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">رابط خرائط جوجل (Google Maps)</span>
            <input name="mapUrl" dir="ltr" value="${escapeHtml(s.mapUrl || '')}" class="${field}" />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-bold">رابط فيسبوك</span>
            <input name="facebook" dir="ltr" value="${escapeHtml(s.facebook || '')}" class="${field}" />
          </label>
          <label class="block">
            <span class="text-sm font-bold">رابط انستجرام</span>
            <input name="instagram" dir="ltr" value="${escapeHtml(s.instagram || '')}" class="${field}" />
          </label>
        </div>

        <hr class="border-ink/10" />
        <h3 class="font-display text-xl font-extrabold">كلمة صاحب المعرض في الرئيسية</h3>

        <label class="block">
          <span class="text-sm font-bold">اسم صاحب المعرض</span>
          <input name="ownerName" required value="${escapeHtml(s.ownerName)}" class="${field}" />
        </label>

        <label class="block">
          <span class="text-sm font-bold">الرسالة الترحيبية (تظهر بخط الرقعة)</span>
          <textarea name="ownerNote" rows="3" required class="${field}">${escapeHtml(s.ownerNote)}</textarea>
        </label>

        <hr class="border-ink/10" />
        <h3 class="font-display text-xl font-extrabold">أمان لوحة التحكم</h3>

        <label class="block max-w-xs">
          <span class="text-sm font-bold">رمز الدخول (PIN)</span>
          <input name="adminPin" dir="ltr" required value="${escapeHtml(s.adminPin || '2026')}" class="${field}" />
        </label>

        <div class="flex flex-wrap items-center justify-between gap-4 pt-4">
          <button type="submit" class="rounded-full bg-clay px-8 py-3 font-display text-lg font-extrabold text-paper hover:bg-olive">
            حفظ الإعدادات
          </button>

          <button type="button" id="btn-reset-defaults" class="rounded-full border border-red-600/30 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white">
            استعادة البيانات الافتراضية
          </button>
        </div>
      </form>
    `;

    document.getElementById('settings-editor-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      saveSettings({
        phone: String(fd.get('phone') || '').trim(),
        whatsapp: String(fd.get('whatsapp') || '').trim(),
        address: String(fd.get('address') || '').trim(),
        hours: String(fd.get('hours') || '').trim(),
        mapUrl: String(fd.get('mapUrl') || '').trim(),
        facebook: String(fd.get('facebook') || '').trim(),
        instagram: String(fd.get('instagram') || '').trim(),
        ownerName: String(fd.get('ownerName') || '').trim(),
        ownerNote: String(fd.get('ownerNote') || '').trim(),
        adminPin: String(fd.get('adminPin') || '2026').trim(),
      });
      showToast('تم حفظ إعدادات المعرض وتحديث الموقع');
    });

    document.getElementById('btn-reset-defaults').addEventListener('click', () => {
      if (!confirm('متأكد إنك عايز ترجع كل السيارات والإعدادات للحالة الافتراضية؟')) return;
      resetAllData();
      renderDashboard();
      showToast('تمت استعادة البيانات الافتراضية');
    });
  }

  function exportDefaultDataFile() {
    const payload = {
      settings: getSettings(),
      cars: getCars(),
    };
    const fileContent = `window.GHAZY_DEFAULTS = ${JSON.stringify(payload, null, 2)};
`;
    const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default-data.js';
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل default-data.js — استبدله في مجلد js للنشر الدائم');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
      renderDashboard();
    } else {
      renderLogin();
    }
  });
})();
