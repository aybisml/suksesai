// auth.js — Validasi akses via Google Apps Script
// Browser hanya terima {allowed:true/false} — email list tidak pernah bocor

const APPS_SCRIPT_URL = 'GANTI_URL_APPS_SCRIPT';

async function checkAccess(email) {
  if (!email) return false;
  try {
    const p = new URLSearchParams({
      email: email.toLowerCase().trim(),
      ua: navigator.userAgent.slice(0, 100),
      ref: location.hostname
    });
    const r = await fetch(APPS_SCRIPT_URL + '?' + p, { cache: 'no-store' });
    if (!r.ok) return false;
    const d = await r.json();
    return d.allowed === true;
  } catch (e) {
    return false;
  }
}
