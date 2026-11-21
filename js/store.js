/* =========================================================
   GHAZY AUTO — Store, Formatters & Real-Time Cross-Tab Sync
   ========================================================= */

(function () {
  const KEYS = {
    CARS: 'ghazy_auto_cars_v1',
    SETTINGS: 'ghazy_auto_settings_v1',
    INQUIRIES: 'ghazy_auto_inquiries_v1',
  };

  const labels = {
    bodyType: {
      sedan: 'سيدان',
      suv: 'SUV',
      hatchback: 'هاتشباك',
      coupe: 'كوبيه',
      pickup: 'بيك أب',
    },
    condition: {
      used: 'مستعملة',
      new: 'زيرو',
    },
    transmission: {
      automatic: 'أوتوماتيك',
      manual: 'مانيوال',
    },
    fuel: {
      petrol: 'بنزين',
      diesel: 'ديزل',
      hybrid: 'هايبرد',
      electric: 'كهرباء',
    },
    status: {
      available: 'متاحة',
      reserved: 'محجوزة',
      sold: 'مباعة',
    },
    kind: {
      question: 'عندي سؤال',
      testDrive: 'تجربة قيادة',
      sellCar: 'بيع عربية',
      other: 'أخرى',
    },
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function ensureInitialized() {
    if (!localStorage.getItem(KEYS.CARS)) {
      localStorage.setItem(KEYS.CARS, JSON.stringify(clone(window.GHAZY_DEFAULTS.cars)));
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(clone(window.GHAZY_DEFAULTS.settings)));
    }
    if (!localStorage.getItem(KEYS.INQUIRIES)) {
      localStorage.setItem(KEYS.INQUIRIES, JSON.stringify([]));
    }
  }

  function getCars() {
    ensureInitialized();
    try {
      return JSON.parse(localStorage.getItem(KEYS.CARS)) || [];
    } catch {
      return clone(window.GHAZY_DEFAULTS.cars);
    }
  }

  function saveCars(cars) {
    localStorage.setItem(KEYS.CARS, JSON.stringify(cars));
    window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type: 'cars' } }));
  }

  function getCarBySlug(slug) {
    const cars = getCars();
    if (!slug) return cars[0] || null;
    return cars.find((c) => c.slug === slug) || null;
  }

  function getSettings() {
    ensureInitialized();
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || {};
      return Object.assign({}, window.GHAZY_DEFAULTS.settings, saved);
    } catch {
      return clone(window.GHAZY_DEFAULTS.settings);
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type: 'settings' } }));
  }

  function getInquiries() {
    ensureInitialized();
    try {
      return JSON.parse(localStorage.getItem(KEYS.INQUIRIES)) || [];
    } catch {
      return [];
    }
  }

  function saveInquiries(list) {
    localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type: 'inquiries' } }));
  }

  function addInquiry(data) {
    const list = getInquiries();
    const item = {
      id: 'inq-' + Date.now(),
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      kind: data.kind || 'question',
      carId: data.carId || '',
      carName: data.carName || '',
      preferredTime: (data.preferredTime || '').trim(),
      message: (data.message || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    saveInquiries(list);
    return item;
  }

  function resetAllData() {
    localStorage.setItem(KEYS.CARS, JSON.stringify(clone(window.GHAZY_DEFAULTS.cars)));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(clone(window.GHAZY_DEFAULTS.settings)));
    localStorage.setItem(KEYS.INQUIRIES, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type: 'reset' } }));
  }

  function formatPrice(n) {
    if (n == null || isNaN(Number(n))) return '—';
    return new Intl.NumberFormat('ar-EG').format(Number(n));
  }

  function formatKm(n) {
    if (n == null || n === '' || isNaN(Number(n))) return null;
    return `${new Intl.NumberFormat('ar-EG').format(Number(n))} كم`;
  }

  function whatsappLink(number, text) {
    const clean = String(number || '201012345678').replace(/[^0-9]/g, '');
    const msg = text ? `?text=${encodeURIComponent(text)}` : '';
    return `https://wa.me/${clean}${msg}`;
  }

  function slugify(str) {
    return (
      String(str || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w؀-ۿ\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || 'car-' + Date.now()
    );
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.addEventListener('storage', function (e) {
    if (e.key === KEYS.CARS || e.key === KEYS.SETTINGS || e.key === KEYS.INQUIRIES) {
      window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type: 'storage' } }));
    }
  });

  window.GhazyStore = {
    KEYS,
    labels,
    getCars,
    saveCars,
    getCarBySlug,
    getSettings,
    saveSettings,
    getInquiries,
    saveInquiries,
    addInquiry,
    resetAllData,
    formatPrice,
    formatKm,
    whatsappLink,
    slugify,
    escapeHtml,
  };
})();
