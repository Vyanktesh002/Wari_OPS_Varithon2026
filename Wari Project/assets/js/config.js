/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — deployment configuration

   The one place the frontend is told where its backend lives. Loaded
   before app.js, which reads window.WCI_BACKEND_URL.

   ── Local development ──────────────────────────────────────────────
   Nothing to change. Served from localhost, this points at the Flask
   backend on 127.0.0.1:5050 exactly as it always has.

   ── Deploying ──────────────────────────────────────────────────────
   Set BACKEND_URL below to the public URL of the Flask backend, with
   no trailing slash:

       var BACKEND_URL = 'https://wari-backend.onrender.com';

   Leave it empty only if the SAME host serves both this page and the
   backend — then same-origin requests are used automatically.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ↓↓↓ SET THIS AT DEPLOY TIME ↓↓↓ */
  var BACKEND_URL = '';
  /* ↑↑↑ SET THIS AT DEPLOY TIME ↑↑↑ */

  function isLocalHost(host) {
    return !host || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  }

  var url = (BACKEND_URL || '').trim();

  if (!url) {
    /* No explicit URL. Opened locally (or from a file:// path) the backend
       is the usual dev server; anywhere else, assume this page and the API
       are served by the same origin. */
    url = isLocalHost(window.location.hostname)
      ? 'http://127.0.0.1:5050'
      : window.location.origin;
  }

  /* A trailing slash here would produce '//api/...' on every call. */
  window.WCI_BACKEND_URL = url.replace(/\/+$/, '');
})();
