# FlashQuiz ⚡ - Mobile-First Flashcard & Quiz Web App

Aplikasi web modern, cepat, dan responsif untuk belajar menggunakan **Flashcard interaktif** dan **Kuis pilihan ganda**, dioptimalkan khusus untuk penggunaan di smartphone (HP) maupun desktop.

---

## 📱 Fitur Utama

- 🃏 **Flashcard Interaktif (3D Flip Animation)**:
  - Ketuk kartu untuk membalik (Pertanyaan ⇄ Jawaban).
  - Gesture swipe kiri/kanan di layar sentuh HP.
  - Penilaian cepat: **Belum Paham** (merah) vs **Sudah Paham** (hijau).
  - Text-to-Speech (TTS) bawaan untuk melafalkan kosakata dalam bahasa Inggris/Indonesia.
  - Petunjuk (Hint) accordion.
  - Opsi tukar sisi (belajar Jawaban lebih dulu atau Pertanyaan lebih dulu).
  - Fitur acak kartu (Shuffle).

- 🎯 **Mode Kuis Pilihan Ganda (Interactive Quiz)**:
  - 4 pilihan jawaban yang dihasilkan secara otomatis dan acak dari kartu dalam dek.
  - Efek suara real-time (chime untuk benar, buzzer untuk salah menggunakan Web Audio API tanpa lag).
  - Indikator **Streak Bonus** (🔥 3 Streak!) untuk menjaga motivasi belajar.
  - Halaman hasil kuis lengkap dengan persentase skor & selebrasi konfeti 🎊.
  - Fitur cerdas: **Ulangi Soal yang Salah Saja** untuk fokus menambal kelemahan.

- 🗂️ **Manajemen Dek Materi**:
  - Dek bawaan siap pakai (Daily English Vocab, Web Dev, Git Pro, Sains & Trivia).
  - Buat dek baru dengan tema warna gradien menarik.
  - Tambah, edit, dan hapus kartu kapan saja.
  - Fitur **Salin-Tempel Massal (CSV/ChatGPT)**: cukup tempel baris `Pertanyaan;Jawaban` untuk memasukkan puluhan kartu sekaligus!

- 💾 **Penyimpanan Lokal & Portabilitas**:
  - 100% tersimpan di `localStorage` perangkat (tanpa perlu login / server database).
  - Fitur **Ekspor / Impor JSON** untuk mencadangkan materi atau memindahkan data ke HP lain.

- 📲 **PWA & Akses Cepat di HP**:
  - Dilengkapi manifest & meta tags viewport khusus smartphone.
  - Bisa langsung dijadikan aplikasi di layar utama HP (**Add to Home Screen**) di Safari (iOS) maupun Google Chrome (Android).

---

## Latihan menulis

Pilih **Impor JSON → Contoh Menulis → Impor & Buat Dek Otomatis**, lalu buka **Latihan menulis** pada dek. Contoh siap impor tersedia di `public/examples/handwriting-zh-TW.json`.

- Setiap kartu menulis menggunakan `"type": "handwriting"`, `front` (pertanyaan), `back` (jawaban), serta `hint` dan `explanation` opsional.
- `back` dapat berisi satu karakter, kata, atau kalimat. Konten tidak diterjemahkan atau dikonversi.
- `language` opsional di tingkat dek. `"language": "zh-TW"` memilih konteks tampilan Mandarin tradisional Taiwan. Tanpa field ini, tampilan tetap netral. Bahasa lain juga dapat digunakan.
- Tulis dengan jari, stylus, atau mouse. Urungkan goresan atau hapus semua sebelum membuka jawaban.
- Tekan **Lihat jawaban**, bandingkan dengan tulisan yang masih terlihat, lalu pilih **Benar** atau **Salah**. Tidak ada AI, OCR, atau pemeriksaan urutan goresan.
- Nilai dan progres tersimpan di perangkat. Goresan hanya berlaku untuk soal aktif dan tidak disimpan setelah berpindah soal atau memuat ulang halaman.
- Latihan menulis mendukung satu kartu, ringkasan hasil, dan pengulangan soal salah. Kartu menulis juga tampil sesuai urutan dalam Mode Gabungan; kuis pilihan ganda mengecualikannya.

## 🚀 Menjalankan di Komputer Lokal

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka URL yang tampil di terminal (biasanya `http://localhost:5173`).

3. **Build untuk produksi:**
   ```bash
   npm run build
   ```

---

## 🌐 Cara Deploy ke Vercel (Go Live)

Aplikasi ini sudah dilengkapi file konfigurasi `vercel.json` dan siap dideploy secara instan:

### Opsi 1: Otomatis via GitHub (Sangat Disarankan)
1. Push kode ke repository GitHub:
   ```bash
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com).
3. Klik tombol **"Add New..."** ➔ **"Project"**.
4. Hubungkan akun GitHub dan pilih repositori `flashcard`.
5. Vercel akan otomatis mendeteksi framework **Vite** dengan Build Command `npm run build` dan Output Directory `dist`.
6. Klik **"Deploy"**. Dalam ~30 detik web kamu sudah go live dengan domain gratis (contoh: `flashcard-xxx.vercel.app`)!

### Opsi 2: Deploy Cepat via Vercel CLI
Jalankan perintah ini di terminal:
```bash
vercel
```
Ikuti petunjuk di terminal untuk login dan deploy langsung.

---

## 📲 Cara Pasang di HP (Seperti Aplikasi Native)

Setelah web live di Vercel:
1. Buka link web di browser HP kamu.
2. **Pengguna iPhone (Safari):**
   - Ketuk tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah).
   - Pilih **"Add to Home Screen"** (Tambah ke Layar Utama).
3. **Pengguna Android (Chrome):**
   - Ketuk menu titik tiga (⋮) di pojok kanan atas.
   - Pilih **"Install app"** atau **"Add to Home screen"**.
4. Ikon **FlashQuiz** akan muncul di home screen smartphone kamu dan dapat dibuka layar penuh tanpa bilah URL browser!
