/* app.js — BonusKartka UA
 * Extracted from inline <script> to allow strict Content-Security-Policy
 * (removes need for 'unsafe-inline' in script-src)
 */
(function () {
  'use strict';

  var btn = document.getElementById('back-to-top');

  if (!btn) { return; }

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
}());
