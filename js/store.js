/* =========================================================
   GHAZY AUTO — Firebase Firestore Store & Security Layer
   ========================================================= */

(function () {
  const CACHE_KEYS = {
    CARS: 'ghazy_cache_cars_v2',
    SETTINGS: 'ghazy_cache_settings_v2',
  };

  // Clean up legacy insecure localStorage keys if present
  try {
    localStorage.removeItem('ghazy_auto_inquiries_v1');
    localStorage.removeItem('ghazy_auto_admin_pin');
  } catch {}

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

  function sanitizeUrl(url, allowDataImage = false) {
    const val = String(url || '').trim();
    if (!val) return '';
    if (allowDataImage && /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(val)) {
      return val;
    }
    try {
      const parsed = new URL(val);
      return ['http:', 'https:'].includes(parsed.protocol) ? val : '';
    } catch {
      return '';
    }
  }

  function sanitizeCar(raw) {
    const car = Object.assign({}, raw);
    car.imageUrl = sanitizeUrl(car.imageUrl, true);
    if (Array.isArray(car.gallery)) {
      car.gallery = car.gallery
        .map((g) => ({
          url: sanitizeUrl(g && g.url ? g.url : g, true),
          alt: String((g && g.alt) || car.name || ''),
        }))
        .filter((g) => g.url);
    } else {
      car.gallery = [];
    }
    return car;
  }

  function sanitizeSettings(raw) {
    const s = Object.assign({}, window.GHAZY_DEFAULTS.settings, raw || {});
    delete s.adminPin;
    s.mapUrl = sanitizeUrl(s.mapUrl, false);
    s.facebook = sanitizeUrl(s.facebook, false);
    s.instagram = sanitizeUrl(s.instagram, false);
    return s;
  }

  function readCachedCars() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.CARS));
      if (Array.isArray(cached) && cached.length) return cached.map(sanitizeCar);
    } catch {}
    return clone(window.GHAZY_DEFAULTS.cars).map(sanitizeCar);
  }

  function readCachedSettings() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.SETTINGS));
      if (cached && typeof cached === 'object') return sanitizeSettings(cached);
    } catch {}
    return sanitizeSettings(window.GHAZY_DEFAULTS.settings);
  }

  const state = {
    cars: readCachedCars(),
    settings: readCachedSettings(),
    inquiries: [], // Stored in memory only when Admin is authenticated (never in localStorage)
    user: null,
    firebaseReady: false,
    authReady: false,
    db: null,
    auth: null,
    unsubInquiries: null,
    authListeners: [],
  };

  function emitChange(type) {
    window.dispatchEvent(new CustomEvent('ghazy:data-changed', { detail: { type } }));
  }

  function isFirebaseConfigured() {
    const cfg = window.GHAZY_FIREBASE_CONFIG;
    return Boolean(cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY' && cfg.projectId);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    if (!isFirebaseConfigured()) {
      console.warn('GhazyStore: Firebase config is missing. Running in local fallback mode.');
      state.authReady = true;
      notifyAuthListeners();
      return;
    }

    try {
      const base = 'https://www.gstatic.com/firebasejs/10.14.1';
      await loadScript(`${base}/firebase-app-compat.js`);
      await loadScript(`${base}/firebase-auth-compat.js`);
      await loadScript(`${base}/firebase-firestore-compat.js`);

      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.GHAZY_FIREBASE_CONFIG);
      }

      state.db = window.firebase.firestore();
      state.auth = window.firebase.auth();
      state.firebaseReady = true;

      // 1. Real-time Cars Listener (Public Read)
      state.db.collection('cars').onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((doc) => {
              list.push(sanitizeCar(Object.assign({ id: doc.id }, doc.data())));
            });
            list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
            state.cars = list;
            try {
              localStorage.setItem(CACHE_KEYS.CARS, JSON.stringify(list));
            } catch {}
            emitChange('cars');
          }
        },
        (err) => console.error('Cars snapshot error:', err)
      );

      // 2. Real-time Settings Listener (Public Read)
      state.db.collection('settings').doc('general').onSnapshot(
        (doc) => {
          if (doc.exists) {
            const clean = sanitizeSettings(doc.data());
            state.settings = clean;
            try {
              localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(clean));
            } catch {}
            emitChange('settings');
          }
        },
        (err) => console.error('Settings snapshot error:', err)
      );

      // 3. Auth State & Admin-Only Inquiries Listener
      state.auth.onAuthStateChanged((user) => {
        state.user = user || null;
        state.authReady = true;

        if (state.unsubInquiries) {
          state.unsubInquiries();
          state.unsubInquiries = null;
        }

        if (user) {
          state.unsubInquiries = state.db.collection('inquiries').onSnapshot(
            (snapshot) => {
              const list = [];
              snapshot.forEach((doc) => {
                list.push(Object.assign({ id: doc.id }, doc.data()));
              });
              list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
              state.inquiries = list;
              emitChange('inquiries');
            },
            (err) => console.error('Inquiries snapshot error:', err)
          );
        } else {
          state.inquiries = [];
          emitChange('inquiries');
        }

        notifyAuthListeners();
      });
    } catch (err) {
      console.error('Firebase initialization failed:', err);
      state.authReady = true;
      notifyAuthListeners();
    }
  }

  function notifyAuthListeners() {
    state.authListeners.forEach((cb) => {
      try {
        cb(state.user);
      } catch {}
    });
  }

  function onAuthChange(cb) {
    state.authListeners.push(cb);
    if (state.authReady) cb(state.user);
  }

  async function loginAdmin(email, password) {
    if (!state.firebaseReady) throw new Error('Firebase غير مُفعّل بعد في ملف firebase-config.js');
    return state.auth.signInWithEmailAndPassword(email.trim(), password);
  }

  async function logoutAdmin() {
    if (!state.firebaseReady) return;
    return state.auth.signOut();
  }

  async function resetAdminPassword(email) {
    if (!state.firebaseReady) throw new Error('Firebase غير مُفعّل بعد');
    return state.auth.sendPasswordResetEmail(email.trim());
  }

  function getCars() {
    return state.cars;
  }

  function getCarBySlug(slug) {
    const cars = getCars();
    if (!slug) return cars[0] || null;
    return cars.find((c) => c.slug === slug) || null;
  }

  async function upsertCar(carData) {
    const clean = sanitizeCar(Object.assign({}, carData));
    if (!clean.id) clean.id = 'car-' + Date.now();
    if (!clean.createdAt) clean.createdAt = new Date().toISOString();

    if (state.firebaseReady && state.user) {
      await state.db.collection('cars').doc(clean.id).set(clean);
    } else {
      const idx = state.cars.findIndex((c) => c.id === clean.id);
      if (idx !== -1) state.cars[idx] = clean;
      else state.cars.unshift(clean);
      localStorage.setItem(CACHE_KEYS.CARS, JSON.stringify(state.cars));
      emitChange('cars');
    }
    return clean;
  }

  async function deleteCar(carId) {
    if (state.firebaseReady && state.user) {
      await state.db.collection('cars').doc(carId).delete();
    } else {
      state.cars = state.cars.filter((c) => c.id !== carId);
      localStorage.setItem(CACHE_KEYS.CARS, JSON.stringify(state.cars));
      emitChange('cars');
    }
  }

  async function saveCars(cars) {
    const cleaned = cars.map(sanitizeCar);
    if (state.firebaseReady && state.user) {
      const batch = state.db.batch();
      cleaned.forEach((car) => {
        const ref = state.db.collection('cars').doc(car.id);
        batch.set(ref, car);
      });
      await batch.commit();
    } else {
      state.cars = cleaned;
      localStorage.setItem(CACHE_KEYS.CARS, JSON.stringify(cleaned));
      emitChange('cars');
    }
  }

  function getSettings() {
    return state.settings;
  }

  async function saveSettings(settings) {
    const clean = sanitizeSettings(settings);
    if (state.firebaseReady && state.user) {
      await state.db.collection('settings').doc('general').set(clean, { merge: true });
    } else {
      state.settings = clean;
      localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(clean));
      emitChange('settings');
    }
  }

  function getInquiries() {
    return state.inquiries;
  }

  async function addInquiry(data) {
    const allowedKinds = ['question', 'testDrive', 'sellCar', 'other'];
    const kind = allowedKinds.includes(data.kind) ? data.kind : 'question';

    const item = {
      name: String(data.name || '').trim().slice(0, 80),
      phone: String(data.phone || '').trim().slice(0, 25),
      kind,
      carId: String(data.carId || '').trim().slice(0, 60),
      carName: String(data.carName || '').trim().slice(0, 120),
      preferredTime: String(data.preferredTime || '').trim().slice(0, 80),
      message: String(data.message || '').trim().slice(0, 1500),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    if (state.firebaseReady) {
      const docRef = await state.db.collection('inquiries').add(item);
      return Object.assign({ id: docRef.id }, item);
    } else {
      const fallback = Object.assign({ id: 'inq-' + Date.now() }, item);
      state.inquiries.unshift(fallback);
      emitChange('inquiries');
      return fallback;
    }
  }

  async function updateInquiryStatus(id, status) {
    if (!['new', 'contacted', 'completed'].includes(status)) return;
    if (state.firebaseReady && state.user) {
      await state.db.collection('inquiries').doc(id).update({ status });
    }
  }

  async function deleteInquiry(id) {
    if (state.firebaseReady && state.user) {
      await state.db.collection('inquiries').doc(id).delete();
    }
  }

  async function seedDefaultsToFirebase() {
    if (!state.firebaseReady || !state.user) {
      throw new Error('يجب تسجيل الدخول كأدمن وتفعيل إعدادات Firebase أولاً');
    }
    const batch = state.db.batch();
    window.GHAZY_DEFAULTS.cars.forEach((car, index) => {
      const clean = sanitizeCar(Object.assign({}, car, {
        createdAt: new Date(Date.now() - index * 60000).toISOString(),
      }));
      batch.set(state.db.collection('cars').doc(clean.id), clean);
    });
    batch.set(
      state.db.collection('settings').doc('general'),
      sanitizeSettings(window.GHAZY_DEFAULTS.settings)
    );
    await batch.commit();
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

  initFirebase();

  window.GhazyStore = {
    labels,
    isFirebaseConfigured,
    onAuthChange,
    loginAdmin,
    logoutAdmin,
    resetAdminPassword,
    getCars,
    getCarBySlug,
    upsertCar,
    deleteCar,
    saveCars,
    getSettings,
    saveSettings,
    getInquiries,
    addInquiry,
    updateInquiryStatus,
    deleteInquiry,
    seedDefaultsToFirebase,
    sanitizeUrl,
    formatPrice,
    formatKm,
    whatsappLink,
    slugify,
    escapeHtml,
  };
})();