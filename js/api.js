// api.js — Gemini Canvas API
// PENTING: File ini TIDAK boleh di-minify/mangle
// Canvas mengenali pola "const apiKey = ''" dan inject credentials
// Jika di-mangle menjadi "const a = ''" Canvas tidak inject

const _TXT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const _IMG = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';
const _REF = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

async function aiText(prompt) {
  const apiKey = "";
  const r = await fetch(`${_TXT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 4096 }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Gagal generate teks.');
  }
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function aiImage(prompt, count) {
  const apiKey = "";
  count = Math.min(parseInt(count) || 1, 4);
  const r = await fetch(`${_IMG}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: count }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Gagal generate gambar.');
  }
  const d = await r.json();
  const preds = d?.predictions || [];
  if (!preds.length) throw new Error('Tidak ada gambar dihasilkan.');
  return preds.map(p => b64toUrl(p.bytesBase64Encoded, p.mimeType || 'image/png'));
}

async function aiImageFromRef(prompt, fileInput) {
  const apiKey = "";
  const base64 = await fileToBase64(fileInput);
  const mime = fileInput.type || 'image/jpeg';
  const payload = {
    contents: [{
      parts: [
        { text: `Gunakan referensi gambar ini dan buat gambar baru berdasarkan deskripsi berikut: ${prompt}` },
        { inlineData: { mimeType: mime, data: base64 } }
      ]
    }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
  };
  const r = await fetch(`${_REF}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    console.warn('image-to-image gagal:', e?.error?.message);
    return await aiImage(prompt, 1);
  }
  const d = await r.json();
  const parts = d?.candidates?.[0]?.content?.parts || [];
  const imgs = parts.filter(p => p.inlineData);
  if (!imgs.length) return await aiImage(prompt, 1);
  return imgs.map(p => b64toUrl(p.inlineData.data, p.inlineData.mimeType || 'image/png'));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function b64toUrl(b64, mime) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}
