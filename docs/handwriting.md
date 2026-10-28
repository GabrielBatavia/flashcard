# Latihan menulis: keputusan dan verifikasi

Pengguna menyetujui kartu `handwriting` dengan penilaian mandiri, jawaban satu karakter hingga kalimat, dan metadata bahasa opsional pada dek. `zh-TW` hanya berlaku bila diberikan dalam JSON. Jawaban tidak dikonversi otomatis.

Implementasi memakai area SVG dengan pointer capture, koordinat relatif, dan touch-action none pada area menulis saja. Goresan tersimpan sementara pada komponen aktif, dapat diurungkan/dihapus sebelum membuka jawaban, lalu dikunci agar perbandingan tetap utuh. Tidak ada layanan AI, OCR, atau upload tulisan.

HandwritingCard memegang goresan dan status jawaban. HandwritingViewer memegang urutan soal, skor manual, pengulangan soal salah, serta pembaruan progres. Komponen kartu juga dipakai dalam alur gabungan. Mode pilihan ganda mengecualikan kartu menulis.

Format impor, backup multi-dek, dan editor mempertahankan metadata language. Dek lama tetap kompatibel. Contoh dan panduan tersedia dalam dialog Impor JSON dan public/examples/handwriting-zh-TW.json.

Arah visual mengikuti DESIGN.md: permukaan membaca yang tenang, aksen biru untuk tindakan utama, ENERGY 1 / RHYTHM 2 / MOTION 2. Area menulis menjadi fokus; garis membantu penempatan kata pada beberapa baris. Fitur ini tidak menambahkan animasi baru.

Verifikasi: npm run build, npm run lint, node scripts/test-handwriting.mjs, git diff --check, serta pengujian interaksi browser. Audit setelah implementasi disimpan di anti-slop/audit-001-2026-10-28.md.
