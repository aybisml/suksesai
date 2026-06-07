// api.js — Gemini Canvas API (CONFIRMED: tidak perlu API key)
// Canvas otomatis inject auth — user tidak perlu input apapun
// Test 07/06/2026: Text ✅ Image ✅

const _TXT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const _IMG = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';

async function aiText(prompt) {
  const r = await fetch(_TXT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 4096 }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Gagal generate teks. Coba lagi.');
  }
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function aiImage(prompt, count) {
  count = Math.min(parseInt(count) || 1, 4);
  const r = await fetch(_IMG, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: count }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Gagal generate gambar. Coba lagi.');
  }
  const d = await r.json();
  const preds = d?.predictions || [];
  if (!preds.length) throw new Error('Tidak ada gambar yang dihasilkan.');
  return preds.map(p => {
    const mime = p.mimeType || 'image/png';
    const bin = atob(p.bytesBase64Encoded);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  });
}
