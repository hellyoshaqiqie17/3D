# Panduan Deployment Sistem 3D CAD Web

Dokumen ini berisi panduan lengkap deployment aplikasi **HomeCraft 3D CAD** ke server VPS/Ubuntu beserta arsitektur database dan file storage CAD.

---

## ⚠️ Peringatan Kritis: Bahaya Menghapus Disk Sampai 0 (`Wipe Disk`)

> [!CAUTION]
> **JANGAN PERNAH** menjalankan perintah penghapusan disk total (seperti `rm -rf /*` atau `dd if=/dev/zero of=/dev/sda`) pada sistem operasi Linux yang sedang berjalan!
>
> **Dampaknya:**
> 1. Kernel Linux, SSH daemon (`sshd`), dan utilitas sistem akan langsung terhapus.
> 2. Koneksi SSH Anda akan terputus seketika.
> 3. Server akan **rusak permanen (bricked / unbootable)** dan tidak akan bisa diakses sama sekali melalui SSH maupun jaringan.

### Cara Resmi dan Aman Jika Ingin Server 100% Bersih (Fresh Install)
Jika Anda ingin server benar-benar bersih 100% tanpa sisa file lama:
1. Buka web dashboard penyedia VPS Anda (misalnya Contabo, DigitalOcean, Linode, AWS, Hetzner, dll).
2. Cari menu **"Reinstall OS"** atau **"Rebuild"**.
3. Pilih **Ubuntu 22.04 LTS** atau **Ubuntu 24.04 LTS**.
4. Proses reinstall akan memformat ulang disk secara resmi dan menyediakan OS baru yang bersih dalam waktu 1-2 menit.

---

## 🗄️ Arsitektur Database & Penyimpanan File CAD

Sistem kini telah dilengkapi dengan modul database dan file storage persisten tanpa perlu konfigurasi multi-role yang rumit:

1. **Database Metadata & Konfigurasi (`/app/data`)**:
   - Menyimpan seluruh data project (ID, nama, klien, deskripsi, daftar zona material, preset kamera, timestamp).
   - Menyimpan konfigurasi material yang disimpan user (`configurations.json`).
   - Disimpan secara persisten melalui Docker Volume (`./data:/app/data`), aman dari restart server.

2. **Penyimpanan File CAD 3D (`/app/public/uploads/models`)**:
   - File CAD (`.glb`, `.gltf`, `.obj`, dll) berukuran besar **tidak disimpan sebagai BLOB di database** (agar database tidak lemot/jebol memori).
   - File diunggah melalui endpoint `/api/upload` dan disimpan di direktori volume persisten (`./public/uploads:/app/public/uploads`).
   - Setiap file CAD diberi path unik dan diserve langsung oleh web server secara cepat.

---

## 🚀 Langkah Deployment ke Server (`70.153.138.242`)

### Langkah 1: Hubungkan ke Server via SSH
Buka terminal Anda di komputer lokal (PowerShell atau Bash):

```bash
ssh iyos@70.153.138.242
```
*(Masukkan password Anda: `Hellyoskiki123`)*

---

### Langkah 2: Bersihkan Direktori Web Lama (Aman)
Jika di server ada folder aplikasi atau container Docker lama yang ingin dibersihkan tanpa merusak sistem operasi:

```bash
# Hentikan semua container lama jika ada
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Bersihkan sisa docker image lama
docker system prune -af --volumes || true

# Hapus folder project lama jika ada di home directory
rm -rf ~/3dCADWEB
```

---

### Langkah 3: Transfer Source Code ke Server
Anda dapat mentransfer source code dari komputer lokal ke server menggunakan `scp` atau `rsync`.

**Jalankan perintah ini dari terminal komputer lokal Anda** (di direktori `d:\3dCADWEB`):

```powershell
# Menggunakan SCP dari Windows PowerShell:
scp -r d:\3dCADWEB iyos@70.153.138.242:~/3dCADWEB
```
*(Atau jika project Anda di-push ke GitHub/GitLab, Anda cukup menjalankan `git clone <URL_REPO> ~/3dCADWEB` di server)*.

---

### Langkah 4: Jalankan Script Deploy Otomatis
Setelah source code berada di server, masuk ke folder project dan jalankan script deploy:

```bash
# Di terminal SSH server:
cd ~/3dCADWEB

# Berikan izin eksekusi
chmod +x deploy.sh

# Jalankan deploy
./deploy.sh
```

### Apa yang Dilakukan oleh `deploy.sh`?
1. Menginstal Docker Engine dan Docker Compose secara otomatis jika belum terpasang.
2. Menyiapkan folder database persisten (`./data`) dan storage upload CAD (`./public/uploads/models`).
3. Membangun image container produksi Next.js (standalone).
4. Menjalankan aplikasi di port **80** (HTTP default) secara background dengan fitur auto-restart.

---

### Langkah 5: Akses Aplikasi di Browser
Buka browser Anda dan kunjungi IP server:
```
http://70.153.138.242
```

Aplikasi 3D CAD Web siap digunakan secara penuh dengan database dan upload file 3D yang aktif!
