# AI Tools Studio — Dokumentasi Lengkap

**134 tools AI · Zero cost · Gemini Canvas**

---

## Cara Kerja (Konsep Utama)

```
Developer buat app → simpan kode di GitHub (tersembunyi) → share link Canvas ke user

User buka Canvas → input email → verifikasi whitelist → langsung pakai 134 tools
                                                          TANPA API key
                                                          TANPA biaya apapun
```

**Kenapa zero cost?**
Gemini Canvas otomatis menyediakan akses ke Gemini AI dan Imagen. Aplikasi tinggal memanggil endpoint-nya — tidak perlu API key, tidak ada tagihan.

**Kenapa kode disembunyikan?**
Kalau kode ada di dalam Canvas, siapapun bisa buka tab "Kode" → copy → jual ulang. Dengan menyimpan kode di GitHub dan hanya menaruh 2 baris entry point di Canvas, kode asli tidak terlihat.

---

## Arsitektur

```
Canvas Gemini (yang dibagikan ke user)
│
└── canvas-entry.html (hanya 2 baris — yang terlihat user)
    │
    └── js/app.js (di GitHub, di-load via jsDelivr CDN)
        ├── js/auth.js     → validasi email via Apps Script
        ├── js/api.js      → generate text + image via Gemini
        ├── js/renderer.js → build form dinamis dari tools.json
        ├── css/style.css  → tampilan UI
        └── tools.json     → definisi 134 tools
```

**Yang terjadi saat user Generate:**
```
User isi form → klik Generate
    ↓
fetch() → Gemini API (text) atau Imagen API (image)
    ↓ TANPA API KEY — Canvas inject auth otomatis
    ↓
Hasil tampil di layar
```

---

## Struktur File

```
REPO/
├── canvas-entry.html      ← Paste di Gemini Canvas (2 baris)
├── canvas-entry-prod.html ← Versi production (setelah obfuscate)
├── tools.json             ← Data 134 tools
├── apps-script.gs         ← Paste di Google Apps Script
├── obfuscate.sh           ← Script untuk sembunyikan kode
├── js/
│   ├── app.js             ← Orchestrator utama
│   ├── auth.js            ← Validasi whitelist
│   ├── api.js             ← Gemini + Imagen API calls
│   └── renderer.js        ← Form builder dinamis
└── css/
    └── style.css          ← UI dark premium
```

---

## LANGKAH DEPLOY — Dari Nol Sampai Live

### STEP 1 — Siapkan GitHub Repo

```
1. Buka github.com → New repository
2. Nama repo: bebas (contoh: ai-tools-studio)
3. Visibility: PRIVATE ← wajib! agar kode tidak bisa diakses langsung
4. Klik Create repository
5. Upload semua file sesuai struktur di atas
```

**Wajib ganti di file-file ini sebelum upload:**

Di `js/app.js` — baris paling atas:
```javascript
const CDN = 'https://cdn.jsdelivr.net/gh/USERNAME/REPO@main';
//                                         ↑ ganti ini
```
Contoh: `https://cdn.jsdelivr.net/gh/johndoe/ai-tools-studio@main`

Di `js/auth.js`:
```javascript
const APPS_SCRIPT_URL = 'GANTI_URL_APPS_SCRIPT';
// ← isi nanti setelah Step 2
```

Di `js/app.js` — bagian login (2 tempat):
```javascript
href="https://forms.gle/LINK_FORM_ANDA"
// ← isi link Google Form pendaftaran Anda
```

Di `canvas-entry.html`:
```html
<script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/js/app.js">
//                                         ↑ ganti ini
```

---

### STEP 2 — Setup Google Spreadsheet & Apps Script

```
1. Buka Google Spreadsheet baru (sheets.google.com)
2. Rename Sheet1 menjadi: Whitelist
3. Cell A1 ketik: email  (header)
4. A2 dan seterusnya: isi email yang boleh akses
   Contoh:
   A2: budi@gmail.com
   A3: siti@gmail.com
   A4: anda@gmail.com

5. Klik menu: Extensions → Apps Script
6. Hapus semua kode default yang ada
7. Paste seluruh isi file apps-script.gs
8. Klik Save (ikon disket atau Ctrl+S)
9. Klik Deploy → New Deployment
10. Klik ikon ⚙️ di sebelah "Select type" → pilih "Web App"
11. Isi konfigurasi:
    - Description   : AI Tools Studio Auth
    - Execute as    : Me
    - Who has access: Anyone
12. Klik Deploy
13. Klik "Authorize access" → pilih akun Google Anda → Allow
14. COPY URL yang muncul (panjang, dimulai dengan https://script.google.com/...)
15. Paste URL tersebut ke APPS_SCRIPT_URL di js/auth.js
16. Push/upload ulang js/auth.js ke GitHub
```

---

### STEP 3 — Obfuskasi Kode (Lindungi dari Pencurian)

```
Di komputer Anda (butuh Node.js):

1. Buka terminal di folder project
2. Jalankan: bash obfuscate.sh
3. Tunggu proses selesai
4. Upload file hasil (js/*.min.js dan canvas-entry-prod.html) ke GitHub
```

Jika tidak punya Node.js, skip step ini dulu — bisa dilakukan nanti.

---

### STEP 4 — Setup Gemini Canvas

```
1. Buka gemini.google.com
2. Klik ikon Canvas di bawah kotak chat (atau ketik "buat canvas baru")
3. Di tab Kode — hapus semua kode yang ada
4. Paste isi file canvas-entry-prod.html (atau canvas-entry.html jika belum obfuskasi)
5. Klik Pratinjau — aplikasi seharusnya mulai loading
6. Klik Share (ikon berbagi di pojok kanan atas Canvas)
7. Copy link yang dibagikan → kirim ke user Anda
```

---

### STEP 5 — Test Sebelum Share

```
□ Buka link Canvas Anda sendiri
□ Coba login dengan email yang ADA di Whitelist → harus masuk ke dashboard
□ Coba login dengan email yang TIDAK ada → harus muncul pesan "tidak terdaftar"
□ Buka satu tool teks (misal: Caption Generator) → isi form → Generate → cek output
□ Buka satu tool image (misal: Foto Produk Affiliate) → Generate → cek gambar muncul
□ Cek sheet AccessLog di Spreadsheet → harus ada catatan login
```

---

## Manajemen User (Whitelist)

### Tambah user baru
Cukup tambah email di sheet **Whitelist**, kolom A, baris baru.
Berlaku **langsung** — tidak perlu update kode apapun.

### Hapus akses user
Hapus atau kosongkan baris email yang bersangkutan.
User akan ditolak di login berikutnya.

### Lihat log akses
Buka sheet **AccessLog** — berisi:
| Kolom | Isi |
|---|---|
| Timestamp | Waktu akses |
| Email | Email yang mencoba login |
| Status | ALLOWED / DENIED / REJECTED_INVALID |
| User-Agent | Info browser |
| Referer | Dari mana asalnya |

---

## Menambah Tool Baru

Edit file `tools.json`, tambahkan entry di dalam array `tools` kategori yang sesuai:

```json
{
  "id": "nama-tool-baru",
  "name": "Nama Tool",
  "description": "Deskripsi singkat tool ini.",
  "outputType": "text",
  "outputAction": ["copy"],
  "inputs": [
    {
      "id": "nama_produk",
      "label": "Nama Produk",
      "type": "text",
      "required": true
    },
    {
      "id": "platform",
      "label": "Platform Target",
      "type": "select",
      "options": ["Instagram", "TikTok", "Shopee"]
    },
    {
      "id": "jumlah",
      "label": "Jumlah Generate",
      "type": "range",
      "min": 1,
      "max": 5,
      "default": 1
    }
  ],
  "promptTemplate": "Kamu adalah asisten AI profesional.\nTugas: buat konten untuk {{nama_produk}}.\nPlatform: {{platform}}.\nJumlah: {{jumlah}} variasi.\nHasilkan output berkualitas tinggi dalam Bahasa Indonesia."
}
```

**Tidak perlu ubah kode apapun** — `renderer.js` otomatis build form dari JSON.

---

## Tipe Input yang Tersedia

| type | Tampilan |
|---|---|
| `text` | Input teks satu baris |
| `textarea` | Input teks multi baris |
| `select` | Dropdown pilihan (`options: ["A","B","C"]`) |
| `file` | Upload file dengan preview |
| `range` | Slider angka (min/max/default) |
| `number` | Input angka |

## Tipe Output yang Tersedia

| outputType | Yang Dihasilkan |
|---|---|
| `text` | Teks dengan tombol Copy |
| `image` | 1-4 gambar dengan tombol Download |
| `image_text` | Teks + gambar sekaligus |
| `sound` | Script teks untuk voice over |

---

## Troubleshooting

**App tidak muncul / loading terus**
- Cek apakah USERNAME/REPO di app.js sudah benar
- Pastikan file sudah ter-upload ke GitHub
- Coba buka tab Kode di Canvas, lihat apakah ada error

**Login selalu ditolak**
- Pastikan APPS_SCRIPT_URL di auth.js sudah diisi URL deploy
- Pastikan Apps Script di-deploy dengan setting "Anyone"
- Cek apakah email sudah ada di sheet Whitelist (perhatikan spasi)

**Generate gagal / error**
- Pastikan sedang membuka Canvas melalui gemini.google.com
- Canvas wajib dalam mode Pratinjau (bukan hanya Kode)
- Jika error "quota exceeded" — tunggu beberapa menit dan coba lagi

**Gambar tidak muncul**
- Endpoint Imagen hanya bekerja di dalam Canvas Gemini
- Tidak bisa ditest di browser biasa / localhost

---

## Catatan Keamanan

- ✅ Email whitelist tidak pernah dikirim ke browser
- ✅ Browser hanya menerima `{allowed: true/false}` dari server
- ✅ Kode JS di-obfuskasi agar sulit dibaca dan dicopy
- ✅ Repo GitHub di-set private — kode tidak bisa diakses langsung
- ✅ Setiap akses tercatat di AccessLog untuk monitoring
- ✅ Tidak ada API key yang perlu dikelola

---

*Dibuat dengan ❤️ — AI Tools Studio v1.0*
