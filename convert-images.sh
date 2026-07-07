#!/bin/bash

# ============================================================
# ORIGINGFX - AUTO CONVERT & RESIZE GAMBAR KE WebP (SUPPORT SUBFOLDER)
# ============================================================

# KONFIGURASI
# ============================================================
QUALITY=80                 # Kualitas WebP (0-100)
MAX_WIDTH=1920             # Maksimal lebar (piksel)
MAX_HEIGHT=1080            # Maksimal tinggi (piksel)
DELETE_ORIGINAL=false      # true = hapus file asli, false = tetap simpan

# FOLDER GAMBAR (akan diproses rekursif sampai ke subfolder)
# ============================================================
ARTWORKS_DIR="src/assets/images/artworks"
ARTISTS_DIR="src/assets/images/artists"
BLOG_DIR="src/assets/images/blog"

# ============================================================
# MULAI PROSES
# ============================================================

echo "=========================================="
echo "🔧 ORIGINGFX - Konversi Gambar ke WebP"
echo "   (Support Subfolder)"
echo "=========================================="
echo ""

# Fungsi untuk convert satu folder (rekursif)
convert_folder() {
    local folder=$1
    local label=$2
    
    if [ ! -d "$folder" ]; then
        echo "⚠️  Folder $label tidak ditemukan: $folder"
        echo "   (Lewati)"
        return
    fi
    
    echo "📁 Memproses $label: $folder (termasuk subfolder)"
    echo ""
    
    # Cari semua file JPG/PNG (rekursif)
    total_files=$(find "$folder" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
    
    if [ "$total_files" -eq 0 ]; then
        echo "   Tidak ada file JPG/PNG di folder ini (termasuk subfolder)."
        echo ""
        return
    fi
    
    echo "   Ditemukan $total_files file gambar"
    echo ""
    
    processed=0
    failed=0
    skipped=0
    
    # Proses setiap file (rekursif)
    find "$folder" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
        
        dir=$(dirname "$file")
        filename=$(basename "$file")
        extension="${filename##*.}"
        name_without_ext="${filename%.*}"
        output_file="$dir/$name_without_ext.webp"
        
        # Cek apakah output sudah ada
        if [ -f "$output_file" ]; then
            echo "   ⏭️  $filename → sudah ada WebP-nya, lewati"
            ((skipped++))
            continue
        fi
        
        echo "   🔄 $filename → $name_without_ext.webp"
        
        # Resize + Convert ke WebP
        if convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality "$QUALITY" "$output_file" 2>/dev/null; then
            echo "   ✅ Berhasil: $name_without_ext.webp"
            
            # Tampilkan ukuran
            original_size=$(du -h "$file" | cut -f1)
            new_size=$(du -h "$output_file" | cut -f1)
            echo "      📊 $original_size → $new_size"
            
            # Hapus file asli kalau di-set
            if [ "$DELETE_ORIGINAL" = true ]; then
                rm "$file"
                echo "      🗑️  File asli dihapus"
            fi
            
            ((processed++))
        else
            echo "   ❌ Gagal convert: $filename"
            ((failed++))
        fi
        
        echo ""
    done
    
    # Karena while dijalankan di subshell, kita tidak bisa langsung update variabel.
    # Tapi kita tampilkan pesan selesai.
    echo "   📊 Selesai memproses $label"
    echo ""
}

# ============================================================
# EKSEKUSI
# ============================================================

echo "🔍 Cek ketersediaan ImageMagick..."
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick tidak terinstall!"
    echo ""
    echo "Install dulu dengan perintah:"
    echo "   sudo apt install imagemagick -y"
    echo ""
    exit 1
fi
echo "✅ ImageMagick tersedia"
echo ""

echo "⚙️  Konfigurasi:"
echo "   Kualitas: $QUALITY"
echo "   Max Size: ${MAX_WIDTH}x${MAX_HEIGHT}"
echo "   Hapus asli: $DELETE_ORIGINAL"
echo "   Mode: Rekursif (masuk ke subfolder)"
echo ""

read -p "Lanjutkan? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Dibatalkan."
    exit 1
fi

echo ""
echo "=========================================="
echo "🚀 Memulai konversi (rekursif)..."
echo "=========================================="
echo ""

# Convert tiap folder
convert_folder "$ARTWORKS_DIR" "Artworks"
convert_folder "$ARTISTS_DIR" "Artists"
convert_folder "$BLOG_DIR" "Blog"

echo "=========================================="
echo "✅ Selesai!"
echo "=========================================="
echo ""
echo "📌 Catatan:"
echo "   - Semua file .webp berada di folder yang sama dengan file asli"
echo "   - Subfolder tetap terjaga strukturnya"
if [ "$DELETE_ORIGINAL" = false ]; then
    echo "   - File asli (.jpg/.png) masih tersimpan"
    echo "   - Kalau mau hapus file asli, set DELETE_ORIGINAL=true di skrip"
else
    echo "   - File asli (.jpg/.png) sudah dihapus"
fi
echo ""