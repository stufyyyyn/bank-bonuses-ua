/* app.js — BankBonuses UA */
(function () {
  'use strict';

  // 1. Back-to-top button
  var btn = document.getElementById('back-to-top');
  if (btn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 2. Anonymous visitor analytics (Kyiv time synced via API)
  try {
    var vid = localStorage.getItem('bb_vid');
    var isNew = 0;
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      localStorage.setItem('bb_vid', vid);
      isNew = 1;
    }

    // Record once per session to avoid inflation on simple refresh
    var sessionKey = 'bb_sess_active';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');

      var pingUrl = '/api/visit?is_new=' + isNew + '&vid=' + encodeURIComponent(vid);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(pingUrl);
      } else {
        fetch(pingUrl, { method: 'POST', keepalive: true }).catch(function () {});
      }
    }
  } catch (err) {
    // Fail silently without interrupting UI
  }
}());
