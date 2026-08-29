/* analytics.js — Vercel Web Analytics Integration
 * Initializes Vercel Web Analytics for the site
 */
(function () {
  'use strict';

  // Initialize the analytics queue
  if (!window.va) {
    window.va = function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
  }

  // Set mode based on environment
  window.vam = 'production';

  // Check if script is already loaded
  var scriptSrc = '/_vercel/insights/script.js';
  if (document.head.querySelector('script[src*="' + scriptSrc + '"]')) {
    return;
  }

  // Create and inject the analytics script
  var script = document.createElement('script');
  script.src = scriptSrc;
  script.defer = true;
  script.setAttribute('data-endpoint', '/_vercel/insights');
  
  script.onerror = function () {
    console.log(
      '[Vercel Web Analytics] Failed to load analytics script. ' +
      'Please ensure Web Analytics is enabled in your Vercel project settings.'
    );
  };

  // Append script to head
  document.head.appendChild(script);
}());
