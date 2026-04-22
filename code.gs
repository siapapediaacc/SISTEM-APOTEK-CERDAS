/**
 * @OnlyCurrentDoc
 * File utama untuk backend Aplikasi Apotek.
 * Menangani logika server, interaksi database (Google Sheets), dan otentasi.
 */
// ▼▼▼ BATAS AWAL MODIFIKASI 1 ▼▼▼
// ======================= TEMPLATE REGULER =======================
const LICENSE_SERVER_URL = 'https://script.google.com/macros/s/AKfycbyihZuiy5CaOW0bUSD2lI8-JnKO5bd1d8rv9QKfPt9BoL5MDnvex3H_BuUAyGjjTtwF/exec';
// Kunci prefix untuk cache produk dan manifestnya
const PRODUCT_CACHE_KEY_PREFIX = 'PRODUCT_CHUNK_';
const PRODUCT_CACHE_MANIFEST_KEY = 'PRODUCT_CACHE_MANIFEST';

const TEMPLATE_REGULER_HTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f2f5;
            padding: 20px;
            margin: 0;
        }
        .page-container {
            background-color: white;
            margin: 20px auto;
            padding: 15mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            overflow: hidden;
            box-sizing: border-box;
        }
        /* Ukuran untuk Template Reguler: Portrait, misal 1/3 F4 */
        .reguler-page {
            width: 105mm; /* Lebar setengah HVS */
            min-height: 201mm; /* Panjang HVS */
        }
        h1, h2 {
            text-align: center;
        }
        h2 {
            border-bottom: 2px solid #ccc;
            padding-bottom: 10px;
            margin-top: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        th, td {
            border: 1px solid black;
            padding: 5px;
            text-align: left;
            word-wrap: break-word;
        }
        .header-table, .header-table td, .no-border, .no-border td {
            border: none;
            vertical-align: top;
        }
        
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .signature-space { height: 60px; }
        .header-table td:first-child img {
            max-width: 40px;   /* Atur lebar maksimum gambar. Ubah ini untuk mendapatkan ukuran "pas". */
            height: 40px;      /* Penting: Pertahankan rasio aspek agar logo tidak gepeng. */
            display: block;    /* Membantu penempatan dan margin */
            /* max-height dihapus untuk fleksibilitas rasio aspek */
        }
    </style>
</head>
<body>

    
    <div class="page-container reguler-page">
        <table class="header-table" style="width: 100%;">
            <tr>
                <td style="width: 100%; vertical-align: top;">
                    <table class="no-border">
                        <tr>
                            <td style="width: 25%; padding-right: 5px; vertical-align: top;">{{logo}}</td>
                            <td style="width: 75%; vertical-align: top;">
                                <div style="font-size: 8pt; font-weight: bold;">APOTEK</div>
                                <div style="font-size: 8pt; font-weight: bold;">{{nama_apotek}}</div>
                                <div style="font-size: 4pt;">{{alamat_apotek}}</div>
                                <div style="font-size: 4pt;">No. SIA : {{nomor_sia}}</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 55%; vertical-align: top; text-align: left; font-size: 8pt;">
    Kepada Yth,<br>
    <strong>{{nama_supplier}}</strong>
</td>
            </tr>
        </table>
        <div style="text-align: center; margin-top: 25px; margin-bottom: 25px;">
            <span style="font-size: 16pt; font-weight: bold; text-decoration: underline;">SURAT PESANAN</span><br>
            <span>Nomor : {{nomor_surat}}</span>
        </div>
        <p style="font-size: 8pt;">Harap diberikan pada pembawa surat ini / dikirim pada kami barang barang berikut :</p>
        <table style="width: 100%; table-layout: fixed;">
            <thead>
                <tr>
                    <th class="text-center" style="width: 8%;">No</th>
                    <th style="width: 52%;">Nama Barang</th>
                    <th class="text-center" style="width: 20%;">Jumlah</th>
                    <th style="width: 20%;">Satuan</th>
                </tr>
            </thead>
            <tbody>
                {{#setiap_obat}}
                <tr>
                    <td class="text-center">{{nomor_urut_obat}}</td>
                    <td>{{nama_obat}}</td>
                    <td class="text-center">{{jumlah_obat}}</td>
                    <td>{{satuan_obat}}</td>
                </tr>
                {{/setiap_obat}}
            </tbody>
        </table>
        <div style="margin-top: 20px; width: 80%; float: right;">
    <div style="text-align: center; font-size: 9pt;"> 
        {{alamat_apotek}}, {{tanggal_surat}} 
    </div>

    <div class="signature-space"></div>
    <div style="font-weight: bold; text-decoration: underline; text-align: center; font-size: 9pt;">
        {{nama_apoteker}}
    </div>
    <div style="text-align: center; font-size: 9pt;">No. SIPA: {{nomor_sipa}}</div>
</div>
    </div>

</body>
</html>`;
// ======================= TEMPLATE PREKURSOR =======================
const TEMPLATE_PREKURSOR_HTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f2f5;
            padding: 20px;
            margin: 0;
        }
        .page-container {
            background-color: white;
            margin: 20px auto;
            padding: 15mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            overflow: hidden;
            box-sizing: border-box;
        }
        /* Ukuran untuk Template Prekursor: A4 Landscape */
        .prekursor-page {
            width: 250mm;
            min-height: 155mm;
        }
        h1, h2 {
            text-align: center;
        }
        h2 {
            border-bottom: 2px solid #ccc;
            padding-bottom: 10px;
            margin-top: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
        }
        th, td {
            border: 1px solid black;
            padding: 5px;
            text-align: left;
            word-wrap: break-word;
        }
        .header-table, .header-table td, .no-border, .no-border td {
            border: none;
            vertical-align: top;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .signature-space { height: 60px; }
    </style>
</head>
<body>

    

    <div class="page-container prekursor-page">
        <div class="text-center font-bold" style="font-size: 14pt; text-decoration: underline;">SURAT PESANAN OBAT MENGANDUNG PREKURSOR FARMASI</div>
        <div class="text-center">NO. {{nomor_surat}}</div><br><br>
        <p>Yang bertanda tangan di bawah ini:</p>
        <table class="no-border" style="margin-left: 20px;">
            <tr><td style="width: 150px;">Nama</td><td>: {{nama_apoteker}}</td></tr>
            <tr><td>Jabatan</td><td>: Apoteker Penanggung Jawab</td></tr>
            <tr><td>No. SIPA</td><td>: {{nomor_sipa}}</td></tr>
        </table><br>
        <p>Mengajukan pesanan Prekursor (PRE) Farmasi kepada:</p>
        <table class="no-border" style="margin-left: 20px;">
            <tr><td style="width: 150px;">Nama PBF</td><td>: {{nama_supplier}}</td></tr>
            <tr><td>Alamat</td><td>: {{alamat_supplier}}</td></tr>
            <tr><td>Telp./Fax.</td><td>: {{telp_supplier}}</td></tr>
        </table><br>
        <p>Obat Mengandung Prekursor Farmasi yang dipesan adalah:</p>
        <table>
            <thead>
                <tr>
                    <th class="text-center">No</th><th>Nama Obat</th><th>Zat Aktif Prekursor Farmasi</th><th>Bentuk & Kekuatan Sediaan</th><th>Satuan</th><th class="text-center">Jumlah</th><th>Ket</th>
                </tr>
            </thead>
            <tbody>
                {{#setiap_obat}}
                <tr>
                    <td class="text-center">{{nomor_urut_obat}}</td><td>{{nama_obat}}</td><td>{{zat_aktif}}</td><td>{{bentuk_sediaan}}</td><td>{{satuan_obat}}</td><td class="text-center">{{jumlah_obat}}</td><td>{{keterangan}}</td>
                </tr>
                {{/setiap_obat}}
            </tbody>
        </table><br>
        <p>Obat Mengandung Prekursor Farmasi tersebut akan digunakan untuk:</p>
        <table class="no-border" style="margin-left: 20px;">
            <tr><td style="width: 150px;">Nama Sarana</td><td>: Apotek {{nama_apotek}}</td></tr>
            <tr><td>Alamat Sarana</td><td>: {{alamat_apotek}}</td></tr>
        </table>
        <div style="margin-top: 20px; width: 40%; float: right; text-align: center;">
            Yukum Jaya, {{tanggal_surat}}
            <div class="signature-space"></div>
            <div style="font-weight: bold; text-decoration: underline;">( {{nama_apoteker}} )</div>
            <div>No. SIPA: {{nomor_sipa}}</div>
        </div>
    </div>

</body>
</html>`;
// KONFIGURASI APLIKASI
const CONFIG = {
  // Kunci untuk menyimpan ID Spreadsheet di UserProperties
  SPREADSHEET_ID_KEY: 'USER_SPREADSHEET_ID',
  
  // Definisi struktur sheet dan kolom yang wajib ada
  REQUIRED_SHEETS: {
    'Pengguna': ['Username', 'Password', 'Role'],
    'Stok': ['Kode Barang', 'Nama Barang', 'Harga Beli', 'Harga Jual', 'Minimal Stok'],
    'Batch Stok': ['Kode Barang', 'No Batch', 'Jumlah', 'Tanggal ED'],
    'Penjualan': ['ID Transaksi', 'Tanggal', 'Kode Barang', 'Nama Barang', 'No Batch', 'Harga Jual', 'Harga Beli', 'Jumlah', 'Diskon', 'Total Bayar', 'Laba Kotor', 'Kasir'],
    'Pembelian': ['ID Transaksi', 'Tanggal', 'Kode Barang', 'Nama Barang', 'No Batch', 'Harga Beli', 'Jumlah', 'Tanggal ED', 'Supplier'],
    'Operasional': ['ID', 'Tanggal', 'Nama Biaya', 'Jumlah Bayar'],
    'Barang Dicari': ['ID', 'Tanggal Input', 'Nama Barang', 'Jumlah Cari', 'Status', 'User'],
    'Order': ['ID Order', 'Tanggal Order', 'Nama Barang', 'Jumlah', 'Satuan', 'Supplier', 'Status', 'No Surat'],
    'Pengaturan': ['Kunci', 'Nilai'],
    // Tambahan sheet untuk Laporan Laba Rugi yang akurat
    'Kerugian': ['Tanggal', 'Kode Barang', 'Nama Barang', 'No Batch', 'Jumlah', 'Harga Beli', 'Total Kerugian', 'Alasan'],
    'HakAksesKasir': ['Username', 'FiturID', 'Diizinkan'] 
  }
};

/**
 * Fungsi Utama doPost: BERTINDAK SEBAGAI ROUTER API.
 * Menerima permintaan HTTP POST dari aplikasi klien (Android) dan mengarahkan ke fungsi GAS yang sesuai.
 */
function doPost(e) {
  const jsonOutput = ContentService.createTextOutput();
  jsonOutput.setMimeType(ContentService.MimeType.JSON);
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload || {};
    const userInfo = requestData.userInfo || null;
    let responseData = { success: false, message: "Aksi tidak dikenal" };

    switch (action) {
      // --- SETUP & AUTENTIKASI ---
      case 'checkSetup': responseData = checkSetup(); break;
      case 'saveSpreadsheetId': responseData = saveSpreadsheetId(payload.spreadsheetId); break;
      case 'login': responseData = login(payload.username, payload.password); break;
      case 'changeOwnPassword': responseData = changeOwnPassword(payload.newPassword, userInfo); break;
      
      // === BAGIAN BARU UNTUK LISENSI ===
      case 'activateLicenseOnServer': 
        if (userInfo && userInfo.role === 'Admin') {
          responseData = activateLicenseOnServer(payload.serialNumber);
        } else {
          responseData = { success: false, message: "Akses ditolak." };
        }
        break;
      // === AKHIR BAGIAN BARU ===
      
      // ... (SEMUA CASE LAIN DARI doPOST ASLI ANDA TETAP DI SINI) ...
      // --- DASHBOARD / POS (Penjualan) ---
      case 'getDashboardData': responseData = { success: true, data: getDashboardData() }; break;
      case 'cariProduk': responseData = { success: true, data: cariProduk(payload.query, payload.mode) }; break;
      // ...dan seterusnya...
    }
    return jsonOutput.setContent(JSON.stringify({ status: "success", data: responseData }));
  } catch (error) {
    Logger.log(`CRITICAL ERROR in doPost Router: ${error.toString()} \nStack: ${error.stack}`);
    return jsonOutput.setContent(JSON.stringify({ status: "error", message: "Kesalahan Server GAS: " + error.message }));
  }
}

/**
 * Fungsi utama yang dijalankan saat aplikasi web diakses.
 * @param {Object} e Event parameter.
 * @returns {HtmlOutput} Halaman web aplikasi.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Sistem Apotek Cerdas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Memeriksa apakah pengguna sudah melakukan setup Spreadsheet ID.
 * Dipanggil dari sisi klien saat aplikasi pertama kali dimuat.
 * @returns {Object} Objek berisi status setup, contoh: { isSetup: true }
 */
function checkSetup() {
  const userProperties = PropertiesService.getUserProperties();
  const spreadsheetId = userProperties.getProperty(CONFIG.SPREADSHEET_ID_KEY);
  return { isSetup: !!spreadsheetId };
}

/**
 * Menyimpan Spreadsheet ID yang diinput oleh pengguna ke UserProperties.
 * @param {string} spreadsheetId ID dari Google Sheet yang akan digunakan.
 * @returns {Object} Objek status keberhasilan, contoh: { success: true }
 */
function saveSpreadsheetId(spreadsheetId) {
  if (!spreadsheetId) {
    return { success: false, message: 'ID Spreadsheet tidak boleh kosong.' };
  }
  
  try {
    // Validasi dengan mencoba membuka Spreadsheet
    SpreadsheetApp.openById(spreadsheetId);
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(CONFIG.SPREADSHEET_ID_KEY, spreadsheetId);
    
    // Setelah ID tersimpan, langsung jalankan proses inisialisasi
    ensureInitialSetup();
    
    return { success: true, message: 'ID Spreadsheet berhasil disimpan. Silakan login.' };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'ID Spreadsheet tidak valid atau Anda tidak memiliki akses. Pastikan ID benar dan Anda memiliki hak edit.' };
  }
}

/**
 * Melakukan proses login pengguna.
 * @param {string} username Username yang diinput.
 * @param {string} password Password yang diinput.
 * @returns {Object} Objek berisi hasil login dan data pengguna jika berhasil.
 */
function login(username, password) {
  const ss = getSpreadsheetForCurrentUser();
  if (!ss) return { success: false, message: 'Spreadsheet belum diatur.' };
  
  const userSheet = ss.getSheetByName('Pengguna');
  if (!userSheet) return { success: false, message: 'Sheet "Pengguna" tidak ditemukan.' };
  
  const data = userSheet.getDataRange().getValues();
  const headers = data.shift();
  const usernameIndex = headers.indexOf('Username');
  const passwordIndex = headers.indexOf('Password');
  const roleIndex = headers.indexOf('Role');
  
  for (const row of data) {
    if (row[usernameIndex].toString().toLowerCase() === username.toLowerCase() && row[passwordIndex].toString() === password) {
      const userRole = row[roleIndex];
      let licenseInfo = { status: 'VALID', message: 'Lisensi tidak diperlukan untuk Kasir.' }; // Default untuk Kasir

      // === PERUBAHAN UTAMA: PANGGIL SKRIP PUSAT JIKA ADMIN ===
      if (userRole === 'Admin') {
        try {
          const adminEmail = Session.getEffectiveUser().getEmail();
          const spreadsheetId = PropertiesService.getUserProperties().getProperty(CONFIG.SPREADSHEET_ID_KEY);

          const requestPayload = {
            action: 'validate',
            payload: {
              userEmail: adminEmail,
              spreadsheetId: spreadsheetId
            }
          };

          const options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify(requestPayload)
          };

          const response = UrlFetchApp.fetch(LICENSE_SERVER_URL, options);
          licenseInfo = JSON.parse(response.getContentText());

        } catch (e) {
          Logger.log("LICENSE CHECK FAILED: " + e.toString());
          licenseInfo = { status: 'ERROR', message: 'Gagal terhubung ke server lisensi. Periksa koneksi internet.' };
        }
      }
      
      return {
        success: true,
        user: {
          username: row[usernameIndex],
          role: userRole,
          permissions: {} 
        },
        license: licenseInfo // Kirim informasi lisensi dari Skrip Pusat ke frontend
      };
    }
  }
  
  return { success: false, message: 'Username atau password salah.' };
}

// --- FUNGSI UTAMA DAN HELPER ---

/**
 * Mendapatkan objek Spreadsheet yang terhubung dengan pengguna saat ini.
 * Ini adalah fungsi inti untuk arsitektur multi-pengguna.
 * @returns {Spreadsheet|null} Objek Spreadsheet atau null jika belum di-setup.
 */
function getSpreadsheetForCurrentUser() {
  const userProperties = PropertiesService.getUserProperties();
  const spreadsheetId = userProperties.getProperty(CONFIG.SPREADSHEET_ID_KEY);
  
  if (!spreadsheetId) {
    return null;
  }
  
  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (e) {
    // Jika spreadsheet tidak bisa diakses (misal: dihapus), hapus ID yang tersimpan
    userProperties.deleteProperty(CONFIG.SPREADSHEET_ID_KEY);
    Logger.log('Error opening spreadsheet, ID removed: ' + e.toString());
    // Melempar error agar bisa ditangkap di client-side jika perlu
    throw new Error('ID Spreadsheet tidak valid. ID tersimpan telah dihapus, silakan refresh dan atur ulang.');
  }
}

/**
 * Memastikan semua sheet dan kolom yang diperlukan ada di Spreadsheet pengguna.
 * Jika tidak ada, fungsi ini akan membuatnya secara otomatis.
 */
function ensureInitialSetup() {
  const ss = getSpreadsheetForCurrentUser();
  if (!ss) return;

  const sheetNames = Object.keys(CONFIG.REQUIRED_SHEETS);
  
  sheetNames.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Sheet "${sheetName}" berhasil dibuat.`);
      // Jika sheet baru dibuat, langsung tulis header-nya
      const headers = CONFIG.REQUIRED_SHEETS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      Logger.log(`Header untuk sheet "${sheetName}" berhasil ditulis.`);
    } else {
      // Jika sheet sudah ada, periksa apakah semua kolom yang dibutuhkan ada
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const requiredHeaders = CONFIG.REQUIRED_SHEETS[sheetName];
      const missingHeaders = requiredHeaders.filter(h => !existingHeaders.includes(h));
      
      if (missingHeaders.length > 0) {
        const nextColumn = sheet.getLastColumn() + 1;
        sheet.getRange(1, nextColumn, 1, missingHeaders.length).setValues([missingHeaders]);
        Logger.log(`Kolom yang hilang: [${missingHeaders.join(', ')}] telah ditambahkan ke sheet "${sheetName}".`);
      }
    }
  });

  // Buat pengguna admin default jika sheet Pengguna kosong
  const userSheet = ss.getSheetByName('Pengguna');
  if (userSheet.getLastRow() < 2) {
    userSheet.appendRow(['admin', 'admin', 'Admin']);
    Logger.log('Pengguna default "admin" berhasil dibuat.');
  }

  // Buat pengaturan default
  const settingSheet = ss.getSheetByName('Pengaturan');
  if (settingSheet.getLastRow() < 2) {
    settingSheet.appendRow(['Target Harian', '0']);
    settingSheet.appendRow(['Nama Bisnis', 'Apotek Anda']);
    settingSheet.appendRow(['Alamat Bisnis', 'Jalan Sehat No. 1']);
    settingSheet.appendRow(['Tema', 'Light']);
    Logger.log('Pengaturan default berhasil dibuat.');
  }
}

/**
 * Mengambil dan menghitung data untuk dashboard dengan logika Skor Bisnis JANGKA PANJANG.
 * @returns {Object} Data untuk ditampilkan di dashboard.
 */
function getDashboardData() {
  const ss = getSpreadsheetForCurrentUser();
  if (!ss) throw new Error("Spreadsheet tidak ditemukan.");

  // Inisialisasi variabel
  let totalBusinessScore = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- KUMPULKAN DATA DASAR ---
  const penjualanSheet = ss.getSheetByName('Penjualan');
  const penjualanData = (penjualanSheet.getLastRow() > 1) ?
    penjualanSheet.getRange(2, 1, penjualanSheet.getLastRow() - 1, penjualanSheet.getLastColumn()).getValues() : [];
  const penjualanHeaders = penjualanSheet.getRange(1, 1, 1, penjualanSheet.getLastColumn()).getValues()[0];
  const pTglIndex = penjualanHeaders.indexOf('Tanggal');
  const pTotalIndex = penjualanHeaders.indexOf('Total Bayar');
  const pJumlahIndex = penjualanHeaders.indexOf('Jumlah');
  const pHargaBeliIndex = penjualanHeaders.indexOf('Harga Beli');

  // --- 1. KINERJA PENJUALAN JANGKA PANJANG (BOBOT: 40 POIN) ---
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const oneEightyDaysAgo = new Date(today);
  oneEightyDaysAgo.setDate(today.getDate() - 180);

  let recentSales = { total: 0, count: 0, days: new Set() };
  let previousSales = { total: 0, count: 0, days: new Set() };
  let allTimeHPP = 0;
  let allTimeRevenue = 0;

  penjualanData.forEach(row => {
    const saleDate = new Date(row[pTglIndex]);
    saleDate.setHours(0, 0, 0, 0);
    const totalBayar = parseFloat(row[pTotalIndex]) || 0;
    
    // Akumulasi untuk profitabilitas & efisiensi
    allTimeRevenue += totalBayar;
    allTimeHPP += (parseFloat(row[pHargaBeliIndex]) || 0) * (parseInt(row[pJumlahIndex]) || 0);

    if (saleDate >= ninetyDaysAgo) {
      recentSales.total += totalBayar;
      recentSales.days.add(saleDate.getTime());
    } else if (saleDate >= oneEightyDaysAgo) {
      previousSales.total += totalBayar;
      previousSales.days.add(saleDate.getTime());
    }
  });

  const avgRecentSales = recentSales.days.size > 0 ? recentSales.total / recentSales.days.size : 0;
  const avgPreviousSales = previousSales.days.size > 0 ? previousSales.total / previousSales.days.size : 0;

  if (avgPreviousSales > 0) {
    const growthRatio = avgRecentSales / avgPreviousSales;
    if (growthRatio > 1.1) totalBusinessScore += 40; // Pertumbuhan > 10%
    else if (growthRatio >= 1.0) totalBusinessScore += 30; // Stabil atau bertumbuh
    else if (growthRatio >= 0.9) totalBusinessScore += 15; // Penurunan < 10%
    else totalBusinessScore += 5; // Penurunan signifikan
  } else if (avgRecentSales > 0) {
    totalBusinessScore += 30; // Ada penjualan baru dalam 90 hari terakhir
  } else {
    totalBusinessScore += 5; // Tidak ada penjualan dalam 180 hari
  }

  // --- 2. PROFITABILITAS JANGKA PANJANG (BOBOT: 30 POIN) ---
  const allTimeGrossProfit = allTimeRevenue - allTimeHPP;
  const allTimeMargin = allTimeRevenue > 0 ? (allTimeGrossProfit / allTimeRevenue) * 100 : 0;
  
  if (allTimeMargin > 30) totalBusinessScore += 30;
  else if (allTimeMargin > 20) totalBusinessScore += 20;
  else if (allTimeMargin > 10) totalBusinessScore += 10;
  else if (allTimeRevenue > 0) totalBusinessScore += 5;
  
  // --- 3. KESEHATAN STOK MENYELURUH (BOBOT: 15 POIN) ---
  let skorStok = 15;
  const batchSheet = ss.getSheetByName('Batch Stok');
  let barangSudahED = [];
  let barangAkanED30 = [];
  let barangAkanED90 = [];

  if (batchSheet.getLastRow() > 1) {
    const batchData = batchSheet.getRange(2, 1, batchSheet.getLastRow() - 1, batchSheet.getLastColumn()).getValues();
    const edIndex = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0].indexOf('Tanggal ED');
    const jmlIndex = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0].indexOf('Jumlah');

    batchData.forEach(row => {
      if (parseInt(row[jmlIndex]) > 0) {
        const edDate = new Date(row[edIndex]);
        const timeDiff = edDate.getTime() - today.getTime();
        const sisaHari = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (sisaHari < 0) barangSudahED.push(row);
        else if (sisaHari <= 30) barangAkanED30.push(row);
        else if (sisaHari <= 90) barangAkanED90.push(row);
      }
    });
    
    // Penalti bertingkat
    if (barangSudahED.length > 0) skorStok -= 10; // Penalti tertinggi
    if (barangAkanED30.length > 3) skorStok -= 5; // Penalti sedang
    if (barangAkanED90.length > 10) skorStok -= 2; // Penalti kecil
  }
  totalBusinessScore += skorStok > 0 ? skorStok : 0;

  // --- 4. EFISIENSI OPERASIONAL JANGKA PANJANG (BOBOT: 15 POIN) ---
  let totalOperationalCost = 0;
  const opSheet = ss.getSheetByName('Operasional');
  if (opSheet.getLastRow() > 1) {
    const opData = opSheet.getRange(2, 1, opSheet.getLastRow() - 1, opSheet.getLastColumn()).getValues();
    const opJmlIndex = opSheet.getRange(1, 1, 1, opSheet.getLastColumn()).getValues()[0].indexOf('Jumlah Bayar');
    opData.forEach(row => {
      totalOperationalCost += parseFloat(row[opJmlIndex]) || 0;
    });
  }

  const netProfitability = allTimeGrossProfit - totalOperationalCost;
  if (netProfitability > 0) {
    totalBusinessScore += 15; // Bisnis profit secara keseluruhan
  } else if (allTimeRevenue > 0) {
    totalBusinessScore += 5; // Bisnis rugi secara keseluruhan
  }

  // --- FINALISASI SKOR BISNIS ---
  let skorBisnis;
  if (totalBusinessScore >= 85) skorBisnis = 'Sangat Sehat';
  else if (totalBusinessScore >= 65) skorBisnis = 'Sehat';
  else if (totalBusinessScore >= 40) skorBisnis = 'Cukup Sehat';
  else if (totalBusinessScore >= 20) skorBisnis = 'Kurang Sehat';
  else skorBisnis = 'Perlu Perhatian';

  // --- Data lain untuk dashboard (tetap harian) ---
  const stokSheet = ss.getSheetByName('Stok');
  const stokMap = {};
  if (stokSheet.getLastRow() > 1) {
    stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 5).getValues().forEach(row => {
      stokMap[row[0]] = { nama: row[1] };
    });
  }
  let penjualanHariIni = { nilai: 0, item: 0 };
  let penjualanKemarin = { nilai: 0, item: 0 };
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  penjualanData.forEach(row => {
    const saleDate = new Date(row[pTglIndex]);
    saleDate.setHours(0,0,0,0);
    if(saleDate.getTime() === today.getTime()){
        penjualanHariIni.nilai += parseFloat(row[pTotalIndex]) || 0;
        penjualanHariIni.item += parseInt(row[pJumlahIndex]) || 0;
    } else if (saleDate.getTime() === yesterday.getTime()){
        penjualanKemarin.nilai += parseFloat(row[pTotalIndex]) || 0;
        penjualanKemarin.item += parseInt(row[pJumlahIndex]) || 0;
    }
  });

  const barangEDList = barangAkanED30.map(row => ({
      nama: stokMap[row[0]]?.nama || 'N/A',
      batch: row[1],
      sisaHari: Math.ceil((new Date(row[3]).getTime() - today.getTime()) / (1000 * 3600 * 24))
  })).sort((a, b) => a.sisaHari - b.sisaHari);
  
  let barangDicari = [];
  const dicariSheet = ss.getSheetByName('Barang Dicari');
  if (dicariSheet.getLastRow() > 1) {
    const dicariData = dicariSheet.getRange(2, 1, dicariSheet.getLastRow() - 1, dicariSheet.getLastColumn()).getValues();
    const headers = dicariSheet.getRange(1, 1, 1, dicariSheet.getLastColumn()).getValues()[0];
    barangDicari = dicariData.filter(row => row[headers.indexOf('Status')] === 'on dashboard').map(row => ({
      id: row[headers.indexOf('ID')],
      nama: row[headers.indexOf('Nama Barang')],
      jumlahCari: row[headers.indexOf('Jumlah Cari')]
    }));
  }

  return {
    penjualanHariIni,
    penjualanKemarin,
    skorBisnis,
    barangED: barangEDList,
    barangDicari
  };
}
/**
 * Menambahkan item baru ke sheet 'Barang Dicari' atau meminta konfirmasi jika sudah ada.
 * @param {string} namaBarang Nama barang yang dicari.
 * @param {string} username Nama pengguna yang menambahkan.
 * @returns {Object} Hasil operasi.
 */
function addBarangDicari(namaBarang, username) {
  if (!namaBarang || !username) {
    return { success: false, message: 'Nama barang tidak boleh kosong.' };
  }
  
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('ID');
  const namaIndex = headers.indexOf('Nama Barang');
  const statusIndex = headers.indexOf('Status');
  
  const data = sheet.getDataRange().getValues();
  // Loop dari baris kedua (indeks 1) karena baris pertama adalah header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Periksa apakah item sudah ada
    if (row[namaIndex].toString().toLowerCase() === namaBarang.toLowerCase()) {
      const status = row[statusIndex];
      const id = row[idIndex];
      
      if (status === 'on dashboard') {
        // Jika status 'on dashboard', langsung tambah jumlahnya
        const currentJml = parseInt(sheet.getRange(i + 1, headers.indexOf('Jumlah Cari') + 1).getValue()) || 0;
        sheet.getRange(i + 1, headers.indexOf('Jumlah Cari') + 1).setValue(currentJml + 1);
        const updatedData = getDashboardData().barangDicari;
        return { success: true, updatedData };
      } else if (status === 'harus dipesan') {
        // Jika status 'harus dipesan', minta konfirmasi dari pengguna
        return { 
          success: false, 
          confirmationNeeded: true, 
          id: id,
          message: `"${namaBarang}" sudah ada dalam daftar pesanan. Apakah ingin menambah jumlah pesanan?` 
        };
      }
    }
  }

  // Jika item benar-benar baru, tambahkan
  const newId = 'BD-' + new Date().getTime();
  sheet.appendRow([newId, new Date(), namaBarang, 1, 'on dashboard', username]);
  
  // Ambil data terbaru untuk dikirim kembali ke UI
  const updatedData = getDashboardData().barangDicari;
  return { success: true, updatedData };
}

/**
 * Menambah jumlah cari untuk item yang sudah ada di daftar pesanan.
 * @param {string} id ID barang yang jumlahnya akan ditambah.
 * @returns {Object} Hasil operasi.
 */
function incrementExistingOrder(id) {
  if (!id) return { success: false, message: 'ID tidak valid.' };

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idIndex = headers.indexOf('ID');
  const jumlahIndex = headers.indexOf('Jumlah Cari');

  for (let i = 0; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      const currentJml = parseInt(data[i][jumlahIndex]) || 0;
      sheet.getRange(i + 2, jumlahIndex + 1).setValue(currentJml + 1);
      return { success: true, message: 'Jumlah pesanan berhasil ditambahkan.' };
    }
  }

  return { success: false, message: 'Item tidak ditemukan.' };
}

/**
 * Mengubah status barang dicari menjadi 'harus dipesan'.
 * @param {string} id ID barang yang akan diubah statusnya.
 * @returns {Object} Hasil operasi dengan data terbaru.
 */
function pesanBarangDicari(id) {
  if (!id) return { success: false, message: 'ID tidak valid.' };
  
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idIndex = headers.indexOf('ID');
  const statusIndex = headers.indexOf('Status');

  for (let i = 0; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.getRange(i + 2, statusIndex + 1).setValue('harus dipesan');
      break;
    }
  }

  const updatedData = getDashboardData().barangDicari;
  return { success: true, updatedData };
}

/**
 * Menghapus barang dari daftar barang dicari.
 * @param {string} id ID barang yang akan dihapus.
 * @returns {Object} Hasil operasi dengan data terbaru.
 */
function hapusBarangDicari(id) {
  if (!id) return { success: false, message: 'ID tidak valid.' };
  
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idIndex = headers.indexOf('ID');

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 2);
      break;
    }
  }

  const updatedData = getDashboardData().barangDicari;
  return { success: true, updatedData };
}

/**
 * Mencari produk (VERSI OPTIMIZED DENGAN SERVER-SIDE CACHING).
 * @param {string} query Teks pencarian (kode, nama, atau no batch).
 * @param {string} mode 'penjualan' atau 'pembelian'.
 * @returns {Array} Daftar produk yang cocok.
 */
function cariProduk(query, mode = 'penjualan') {
  // Hentikan jika query tidak valid
  if (!query || query.length < 2) return [];

  // --- LOGIKA UNTUK PEMBELIAN (TIDAK MENGGUNAKAN CACHE) ---
  // Mode pembelian memerlukan daftar semua produk master, jadi tetap membaca sheet Stok secara langsung.
  // Ini jarang digunakan dibandingkan penjualan, jadi dampaknya ke performa tidak signifikan.
  if (mode === 'pembelian') {
    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    if (stokSheet.getLastRow() <= 1) return [];
    const stokData = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 4).getValues();
    
    const searchQuery = query.toLowerCase();
    return stokData
      .filter(row => row[0].toLowerCase().includes(searchQuery) || row[1].toLowerCase().includes(searchQuery))
      .map(row => ({
        kodeBarang: row[0],
        namaBarang: row[1],
        hargaBeli: row[2]
      }))
      .slice(0, 10);
  }

  // --- LOGIKA PENCARIAN PENJUALAN (MENGGUNAKAN CACHE) ---
  try {
    // 1. Ambil semua produk yang tersedia dari cache (atau sheet jika cache kosong)
    // Ini adalah satu-satunya sumber data kita sekarang, sangat cepat!
    const availableProducts = _getProductsFromCacheOrSheet();
    const searchQuery = query.toLowerCase();

    // 2. Filter data yang sudah ada di memori server berdasarkan query pengguna
    let results = availableProducts.filter(p => 
      p.kodeBarang.toLowerCase().includes(searchQuery) ||
      p.namaBarang.toLowerCase().includes(searchQuery) ||
      p.noBatch.toLowerCase().includes(searchQuery) ||
      `${p.kodeBarang}-${p.noBatch}`.toLowerCase().includes(searchQuery)
    );
    
    // 3. Batasi hasil menjadi 15 item teratas dan kembalikan ke frontend
    return results.slice(0, 15);
    
  } catch (e) {
    // Jika terjadi error saat memproses cache, catat di log dan kembalikan array kosong
    Logger.log(`Error di cariProduk (cached version): ${e.message}`);
    return [];
  }
}
/**
 * Memproses dan menyimpan transaksi penjualan.
 * @param {Object} data Transaksi { cart: Array, total: number, bayar: number, kasir: string }.
 * @returns {Object} Hasil operasi.
 */
function selesaikanTransaksi(data) {
  const { cart, total, bayar, kasir } = data;
  if (!cart || cart.length === 0 || !kasir) {
    return { success: false, message: 'Data transaksi tidak lengkap.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const penjualanSheet = ss.getSheetByName('Penjualan');
  const batchSheet = ss.getSheetByName('Batch Stok');
  
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); 

  try {
    const batchData = batchSheet.getRange(2, 1, batchSheet.getLastRow(), batchSheet.getLastColumn()).getValues();
    const batchHeaders = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0];
    const kodeIndex = batchHeaders.indexOf('Kode Barang');
    const batchIndex = batchHeaders.indexOf('No Batch');
    const jumlahIndex = batchHeaders.indexOf('Jumlah');

    // Validasi stok
    for (const item of cart) {
      const batchRow = batchData.find(row => row[kodeIndex] === item.kodeBarang && row[batchIndex] === item.noBatch);
      if (!batchRow || batchRow[jumlahIndex] < item.jumlah) {
        return { success: false, message: `Stok untuk ${item.namaBarang} (${item.noBatch}) tidak mencukupi.` };
      }
    }

    // Jika semua stok valid, proses transaksi
    const idTransaksi = 'TRX-' + new Date().getTime();
    const tanggal = new Date();
    
    cart.forEach(item => {
      // Kurangi stok
      for (let i = 0; i < batchData.length; i++) {
        if (batchData[i][kodeIndex] === item.kodeBarang && batchData[i][batchIndex] === item.noBatch) {
          const sisaStok = batchData[i][jumlahIndex] - item.jumlah;
          batchSheet.getRange(i + 2, jumlahIndex + 1).setValue(sisaStok);
          batchData[i][jumlahIndex] = sisaStok; // Update local data to prevent double counting
          break;
        }
      }
      
      // Hitung Laba Kotor
      const hargaBeliTotal = (item.hargaBeli || 0) * item.jumlah;
      const labaKotor = item.subtotal - hargaBeliTotal;

      // Catat penjualan
      penjualanSheet.appendRow([
        idTransaksi,
        tanggal,
        item.kodeBarang,
        item.namaBarang,
        item.noBatch,
        item.harga, // Harga Jual Satuan
        item.hargaBeli || 0, // Harga Beli Satuan
        item.jumlah,
        item.diskon,
        item.subtotal, // Total Bayar per item
        labaKotor, // Laba Kotor per item
        kasir
      ]);
    });
    _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
    Logger.log('Transaksi penjualan berhasil, cache produk diinvalidasi.');

    return { success: true, message: `Transaksi ${idTransaksi} berhasil! Kembalian: ${Utilities.formatString('Rp%,.0f', bayar - total)}` };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Terjadi kesalahan internal: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Mengambil semua data produk yang siap dijual (memiliki stok > 0)
 * untuk di-cache di sisi klien (frontend).
 * @returns {Array<Object>} Daftar produk yang siap dijual.
 */
function getProdukUntukPenjualan() {
  try {
    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    if (stokSheet.getLastRow() <= 1) return [];

    const stokData = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 4).getValues();
    const stokMap = stokData.reduce((map, row) => {
      map[row[0]] = { nama: row[1], hargaJual: row[3], hargaBeli: row[2] };
      return map;
    }, {});

    const batchSheet = ss.getSheetByName('Batch Stok');
    if (batchSheet.getLastRow() <= 1) return [];

    const batchData = batchSheet.getRange(2, 1, batchSheet.getLastRow() - 1, batchSheet.getLastColumn()).getValues();
    const batchHeaders = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0];
    const kodeIndex = batchHeaders.indexOf('Kode Barang');
    const batchIndex = batchHeaders.indexOf('No Batch');
    const jumlahIndex = batchHeaders.indexOf('Jumlah');
    const edIndex = batchHeaders.indexOf('Tanggal ED');


    const availableProducts = batchData
      .filter(row => (parseInt(row[jumlahIndex]) || 0) > 0)
      .map(row => {
        const kodeBarang = row[kodeIndex];
        const detailStok = stokMap[kodeBarang];
        if (!detailStok) return null;
        return {
          kodeBarang: kodeBarang,
          namaBarang: detailStok.nama,
          noBatch: row[batchIndex],
          hargaJual: detailStok.hargaJual,
          hargaBeli: detailStok.hargaBeli,
          stokTersedia: parseInt(row[jumlahIndex]),
          tanggalED: Utilities.formatDate(new Date(row[edIndex]), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd')
        };
      })
      .filter(Boolean); // Menghapus item null jika ada produk di batch tanpa master stok

    return availableProducts;
  } catch(e) {
    Logger.log("Error di getProdukUntukPenjualan: " + e.message);
    return [];
  }
}
/**
 * Menghasilkan No Batch unik dengan panjang adaptif (otomatis bertambah jika kombinasi habis).
 * Selalu mengandung huruf dan angka, tanpa huruf mirip angka (I, O, L, G, B) dan tanpa angka 0.
 * @param {Sheet} batchSheet Objek sheet 'Batch Stok'.
 * @returns {string} No Batch unik.
 */
const generateUniqueBatchNumber = (batchSheet) => {
  // Ambil semua batch yang sudah ada di kolom B (No Batch)
  let existingBatches = new Set();
  if (batchSheet.getLastRow() > 1) {
    const values = batchSheet
      .getRange(2, 2, batchSheet.getLastRow() - 1, 1)
      .getValues()
      .flat();
    existingBatches = new Set(values);
  }

  const letters = 'ABCDEFHJKMNPQRSTUVWXYZ'; // Hindari huruf mirip angka
  const numbers = '123456789';              // Hindari angka 0
  const allChars = `${letters}${numbers}`;  // Gabungan huruf + angka

  // Tentukan panjang awal batch
  let length = 4;
  const maxComb = Math.pow(allChars.length, length);

  // Jika kombinasi sudah hampir habis (>=95%), tambahkan panjang
  if (existingBatches.size >= maxComb * 0.95) {
    length++;
  }

  let newBatch = '';

  do {
    let hasLetter = false;
    let hasNumber = false;
    newBatch = '';

    // Buat batch baru sepanjang "length"
    for (let i = 0; i < length; i++) {
      const ch = allChars.charAt(Math.floor(Math.random() * allChars.length));
      newBatch += ch;
      if (letters.includes(ch)) hasLetter = true;
      if (numbers.includes(ch)) hasNumber = true;
    }

    // Ulangi sampai memenuhi semua syarat
  } while (
    !/[A-Z]/.test(newBatch) ||             // Harus ada huruf
    !/[0-9]/.test(newBatch) ||             // Harus ada angka
    existingBatches.has(newBatch)          // Tidak boleh duplikat
  );

  return newBatch;
};


/**
 * Memproses dan menyimpan transaksi pembelian.
 * @param {Object} data Pembelian { cart: Array, supplier: string }.
 * @returns {Object} Hasil operasi.
 */
function selesaikanPembelian(data) {
    const { cart, supplier } = data;
    if (!cart || cart.length === 0) {
        return { success: false, message: 'Keranjang pembelian kosong.' };
    }

    const ss = getSpreadsheetForCurrentUser();
    const pembelianSheet = ss.getSheetByName('Pembelian');
    const batchSheet = ss.getSheetByName('Batch Stok');
    const stokSheet = ss.getSheetByName('Stok');

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
        const idTransaksi = 'PMB-' + new Date().getTime();
        const tanggal = new Date();
        const batchData = batchSheet.getDataRange().getValues();
        const batchHeaders = batchData.shift();
        const kodeIndex = batchHeaders.indexOf('Kode Barang');
        const batchIndex = batchHeaders.indexOf('No Batch');
        const edIndex = batchHeaders.indexOf('Tanggal ED');
        const jumlahIndex = batchHeaders.indexOf('Jumlah');

        const stokData = stokSheet.getDataRange().getValues();
        const stokHeaders = stokData.shift();
        const kodeStokIndex = stokHeaders.indexOf('Kode Barang');
        const hargaBeliIndex = stokHeaders.indexOf('Harga Beli');

        for (const item of cart) {
            if (!item.tanggalED) {
              throw new Error(`Tanggal ED untuk ${item.namaBarang} belum diisi.`);
            }
            const edDate = new Date(item.tanggalED);
            edDate.setHours(0,0,0,0);
            const edDateString = edDate.toISOString().slice(0, 10);

            let existingBatchRow = -1;
            // Cari batch yang ada
            for (let i = 0; i < batchData.length; i++) {
                const rowED = new Date(batchData[i][edIndex]);
                rowED.setHours(0,0,0,0);
                if (batchData[i][kodeIndex] === item.kodeBarang && rowED.toISOString().slice(0, 10) === edDateString) {
                    existingBatchRow = i;
                    break;
                }
            }

            let noBatch;
            if (existingBatchRow !== -1) {
                // Batch sudah ada, update jumlah
                const currentRow = existingBatchRow + 2; // +2 karena header dan 1-based index
                const currentJumlah = parseInt(batchSheet.getRange(currentRow, jumlahIndex + 1).getValue()) || 0;
                batchSheet.getRange(currentRow, jumlahIndex + 1).setValue(currentJumlah + item.jumlah);
                noBatch = batchSheet.getRange(currentRow, batchIndex + 1).getValue();
            } else {
                // Batch baru, buat baris baru
                noBatch = generateUniqueBatchNumber(batchSheet);
                batchSheet.appendRow([item.kodeBarang, noBatch, item.jumlah, edDate]);
                // Tambahkan baris baru ke data lokal untuk iterasi selanjutnya
                batchData.push([item.kodeBarang, noBatch, item.jumlah, edDate]);
            }
            
            // Update harga beli di sheet Stok jika berubah
            for(let i=0; i < stokData.length; i++){
              if(stokData[i][kodeStokIndex] === item.kodeBarang){
                stokSheet.getRange(i+2, hargaBeliIndex + 1).setValue(item.hargaBeli);
                break;
              }
            }

            // Catat di sheet Pembelian
            pembelianSheet.appendRow([idTransaksi, tanggal, item.kodeBarang, item.namaBarang, noBatch, item.hargaBeli, item.jumlah, edDate, supplier]);
        }
         // --- Tambahan: Blok untuk Update Status Order ---
  const orderIdsToUpdate = cart.map(item => item.idOrder).filter(Boolean); // Ambil semua idOrder
  if (orderIdsToUpdate.length > 0) {
    const orderSheet = ss.getSheetByName('Order');
    const orderData = orderSheet.getDataRange().getValues();
    const orderHeaders = orderData.shift();
    const orderIdIndex = orderHeaders.indexOf('ID Order');
    const orderStatusIndex = orderHeaders.indexOf('Status');

    for (let i = 0; i < orderData.length; i++) {
      if (orderIdsToUpdate.includes(orderData[i][orderIdIndex])) {
        // Update status di kolom yang sesuai untuk baris ini
        orderSheet.getRange(i + 2, orderStatusIndex + 1).setValue('selesai');
      }
    }
  }
  // --- Akhir Blok Tambahan ---
  _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
  Logger.log('Transaksi pembelian berhasil, cache produk diinvalidasi.');
        return { success: true, message: `Pembelian ${idTransaksi} berhasil disimpan.` };

    } catch (e) {
        Logger.log(e);
        return { success: false, message: 'Terjadi kesalahan: ' + e.message };
    } finally {
        lock.releaseLock();
    }
}

// --- FUNGSI UNTUK MENU STOK ---

/**
 * Mengambil semua data master produk beserta total stoknya.
 * @returns {Array} Daftar produk.
 */
function getStokData() {
    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    const batchSheet = ss.getSheetByName('Batch Stok');
    
    if (stokSheet.getLastRow() <= 1) return [];

    const stokData = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, stokSheet.getLastColumn()).getValues();
    const batchData = (batchSheet.getLastRow() > 1) ? batchSheet.getRange(2, 1, batchSheet.getLastRow() - 1, batchSheet.getLastColumn()).getValues() : [];
    
    const batchHeaders = (batchSheet.getLastRow() > 0) ? batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0] : [];
    const kodeIndex = batchHeaders.indexOf('Kode Barang');
    const jumlahIndex = batchHeaders.indexOf('Jumlah');

    const totalStokMap = batchData.reduce((map, row) => {
        const kode = row[kodeIndex];
        const jumlah = parseInt(row[jumlahIndex]) || 0;
        map[kode] = (map[kode] || 0) + jumlah;
        return map;
    }, {});
    
    const stokHeaders = stokSheet.getRange(1, 1, 1, stokSheet.getLastColumn()).getValues()[0];

    return stokData.map(row => {
        const kodeBarang = row[stokHeaders.indexOf('Kode Barang')];
        let produk = {};
        stokHeaders.forEach((header, index) => {
          produk[header.replace(/\s+/g, '')] = row[index]; // 'Kode Barang' -> 'KodeBarang'
        });
        produk.TotalStok = totalStokMap[kodeBarang] || 0;
        return produk;
    });
}

/**
 * Menambah produk baru ke sheet Stok.
 * @param {Object} produkData Data produk baru.
 * @returns {Object} Hasil operasi.
 */
function tambahProdukBaru(produkData) {
    const { KodeBarang, NamaBarang, HargaBeli, HargaJual, MinimalStok } = produkData;
    if (!KodeBarang || !NamaBarang) {
        return { success: false, message: "Kode dan Nama Barang wajib diisi." };
    }

    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
        const kodeColumn = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 1).getValues().flat();
        if (kodeColumn.some(kode => kode.toString().toLowerCase() === KodeBarang.toLowerCase())) {
            return { success: false, message: `Kode Barang "${KodeBarang}" sudah ada.` };
        }

        stokSheet.appendRow([KodeBarang, NamaBarang, HargaBeli, HargaJual, MinimalStok]);
        return { success: true, message: `Produk "${NamaBarang}" berhasil ditambahkan.` };
    } catch (e) {
        return { success: false, message: "Gagal menambahkan produk: " + e.message };
    } finally {
        lock.releaseLock();
    }
}

/**
 * Mengupdate data produk yang ada di sheet Stok.
 * @param {Object} produkData Data produk yang akan diupdate.
 * @returns {Object} Hasil operasi.
 */
function updateProduk(produkData) {
    const { KodeBarang, NamaBarang, HargaBeli, HargaJual, MinimalStok } = produkData;
     if (!KodeBarang || !NamaBarang) {
        return { success: false, message: "Kode dan Nama Barang wajib diisi." };
    }

    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    
    try {
        const data = stokSheet.getDataRange().getValues();
        const headers = data.shift();
        const kodeIndex = headers.indexOf('Kode Barang');

        for (let i = 0; i < data.length; i++) {
            if (data[i][kodeIndex].toString().toLowerCase() === KodeBarang.toLowerCase()) {
                stokSheet.getRange(i + 2, 1, 1, headers.length).setValues([[
                    KodeBarang, NamaBarang, HargaBeli, HargaJual, MinimalStok
                ]]);
                return { success: true, message: `Produk "${NamaBarang}" berhasil diperbarui.` };
            }
        }
        return { success: false, message: "Produk tidak ditemukan untuk diupdate." };
    } catch (e) {
        return { success: false, message: "Gagal mengupdate produk: " + e.message };
    } finally {
        lock.releaseLock();
    }
}


/**
 * Menghapus produk dari sheet Stok.
 * @param {string} kodeBarang Kode produk yang akan dihapus.
 * @returns {Object} Hasil operasi.
 */
function hapusProduk(kodeBarang) {
    if (!kodeBarang) return { success: false, message: "Kode Barang tidak valid."};

    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    
    try {
        const data = stokSheet.getRange(2, 1, stokSheet.getLastRow(), 1).getValues();
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i][0].toString().toLowerCase() === kodeBarang.toLowerCase()) {
                stokSheet.deleteRow(i + 2);
                return { success: true, message: `Produk dengan kode "${kodeBarang}" berhasil dihapus.` };
            }
        }
        return { success: false, message: "Produk tidak ditemukan." };
    } catch(e) {
        return { success: false, message: "Gagal menghapus produk: " + e.message };
    } finally {
        lock.releaseLock();
    }
}

/**
 * Mengambil daftar batch untuk produk tertentu.
 * @param {string} kodeBarang Kode produk.
 * @returns {Array} Daftar batch.
 */
function getBatchesForProduk(kodeBarang) {
  if (!kodeBarang) return [];
  const ss = getSpreadsheetForCurrentUser();
  const batchSheet = ss.getSheetByName('Batch Stok');
  if (batchSheet.getLastRow() <= 1) return [];

  const timezone = ss.getSpreadsheetTimeZone();
  const data = batchSheet.getDataRange().getValues();
  const headers = data.shift();
  const kodeIndex = headers.indexOf('Kode Barang');
  const batchIndex = headers.indexOf('No Batch');
  const jumlahIndex = headers.indexOf('Jumlah');
  const edIndex = headers.indexOf('Tanggal ED');

  const batches = data
    .filter(row => row[kodeIndex] === kodeBarang && (parseInt(row[jumlahIndex]) || 0) > 0)
    .map(row => ({
      noBatch: row[batchIndex],
      jumlah: row[jumlahIndex],
      tanggalED: Utilities.formatDate(new Date(row[edIndex]), timezone, 'yyyy-MM-dd')
    }));
  
  return batches;
}


/**
 * Mengatur jumlah stok batch tertentu menjadi 0 (karena expired) dan mencatat kerugian.
 * @param {string} noBatch Nomor batch yang akan dihapus stoknya.
 * @returns {Object} Hasil operasi.
 */
function hapusStokBatch(noBatch) {
    if (!noBatch) return { success: false, message: "No Batch tidak valid."};

    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const stokSheet = ss.getSheetByName('Stok');
    
    // PERBAIKAN: Cek dan buat sheet 'Kerugian' jika belum ada
    let kerugianSheet = ss.getSheetByName('Kerugian');
    if (!kerugianSheet) {
      kerugianSheet = ss.insertSheet('Kerugian');
      kerugianSheet.appendRow(['Tanggal', 'Kode Barang', 'Nama Barang', 'No Batch', 'Jumlah', 'Harga Beli', 'Total Kerugian', 'Alasan']);
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    
    try {
        const batchData = batchSheet.getDataRange().getValues();
        const batchHeaders = batchData.shift();
        const batchIndex = batchHeaders.indexOf('No Batch');
        const jumlahIndex = batchHeaders.indexOf('Jumlah');
        const kodeIndex = batchHeaders.indexOf('Kode Barang');

        const stokData = stokSheet.getDataRange().getValues();
        const stokHeaders = stokData.shift();
        const stokKodeIndex = stokHeaders.indexOf('Kode Barang');
        const stokNamaIndex = stokHeaders.indexOf('Nama Barang');
        const stokHargaBeliIndex = stokHeaders.indexOf('Harga Beli');
        
        for (let i = 0; i < batchData.length; i++) {
            if (batchData[i][batchIndex] === noBatch) {
                const jumlahDihapus = parseInt(batchData[i][jumlahIndex]) || 0;
                
                if (jumlahDihapus > 0) {
                    const kodeBarang = batchData[i][kodeIndex];
                    const produkInfo = stokData.find(row => row[stokKodeIndex] === kodeBarang);
                    
                    if (produkInfo) {
                        const namaBarang = produkInfo[stokNamaIndex];
                        const hargaBeli = parseFloat(produkInfo[stokHargaBeliIndex]) || 0;
                        const totalKerugian = jumlahDihapus * hargaBeli;

                        kerugianSheet.appendRow([
                            new Date(),
                            kodeBarang,
                            namaBarang,
                            noBatch,
                            jumlahDihapus,
                            hargaBeli,
                            totalKerugian,
                            'Expired/Musnah'
                        ]);
                    }
                }

                batchSheet.getRange(i + 2, jumlahIndex + 1).setValue(0);
                _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
                Logger.log(`Stok batch ${noBatch} dihapus, cache produk diinvalidasi.`);

                
                return { success: true, message: `Stok untuk batch "${noBatch}" telah dihapus dan kerugian dicatat.` };
            }
        }
        return { success: false, message: `Batch "${noBatch}" tidak ditemukan.` };
    } catch(e) {
        return { success: false, message: "Gagal menghapus stok batch: " + e.message };
    } finally {
        lock.releaseLock();
    }
}

/**
 * Mengambil data laporan penjualan berdasarkan rentang tanggal.
 * @param {string} startDateString Tanggal awal dalam format ISO (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir dalam format ISO (YYYY-MM-DD).
 * @returns {Object} Objek berisi ringkasan dan detail transaksi.
 */
function getLaporanPenjualan(startDateString, endDateString) {
  try {
    if (!startDateString || !endDateString) {
      throw new Error("Tanggal awal dan akhir harus diisi.");
    }
    
    const startDate = new Date(startDateString + 'T00:00:00');
    const endDate = new Date(endDateString + 'T23:59:59');

    const ss = getSpreadsheetForCurrentUser();
    const sheet = ss.getSheetByName('Penjualan');
    if (sheet.getLastRow() <= 1) {
      return { summary: { totalNilai: 0, totalItem: 0, totalLabaKotor: 0 }, details: [] };
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const idTransaksiIndex = headers.indexOf('ID Transaksi');
    const tglIndex = headers.indexOf('Tanggal');
    const namaIndex = headers.indexOf('Nama Barang');
    const batchIndex = headers.indexOf('No Batch');
    const hargaIndex = headers.indexOf('Harga Jual');
    const hargaBeliIndex = headers.indexOf('Harga Beli');
    const jmlIndex = headers.indexOf('Jumlah');
    const totalIndex = headers.indexOf('Total Bayar');
    const labaKotorIndex = headers.indexOf('Laba Kotor');
    const kasirIndex = headers.indexOf('Kasir');

    let totalNilai = 0;
    let totalItem = 0;
    let totalLabaKotor = 0;
    const details = [];

    data.forEach(row => {
      const tglTransaksi = new Date(row[tglIndex]);
      if (tglTransaksi >= startDate && tglTransaksi <= endDate) {
        const totalBayar = parseFloat(row[totalIndex]) || 0;
        const jumlahItem = parseInt(row[jmlIndex]) || 0;
        const labaKotor = parseFloat(row[labaKotorIndex]) || 0;
        
        totalNilai += totalBayar;
        totalItem += jumlahItem;
        totalLabaKotor += labaKotor;

        details.push({
          idTransaksi: row[idTransaksiIndex],
          tanggal: tglTransaksi.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          namaBarang: row[namaIndex],
          noBatch: row[batchIndex],
          harga: parseFloat(row[hargaIndex]) || 0,
          hargaBeli: parseFloat(row[hargaBeliIndex]) || 0,
          jumlah: jumlahItem,
          total: totalBayar,
          labaKotor: labaKotor,
          kasir: row[kasirIndex]
        });
      }
    });

    return { 
      summary: { 
        totalNilai: totalNilai, 
        totalItem: totalItem,
        totalLabaKotor: totalLabaKotor
      }, 
      details: details 
    };

  } catch (e) {
    Logger.log(e);
    return { error: e.message };
  }
}

/**
 * Mengambil dan mengagregasi data penjualan bulanan per hari.
 * @param {string} monthString Bulan dan tahun dalam format 'YYYY-MM'.
 * @returns {Object} Objek berisi ringkasan bulanan dan detail harian.
 */
function getLaporanBulanan(monthString) {
  try {
    if (!monthString) {
      throw new Error("Bulan dan tahun harus dipilih.");
    }
    
    const [year, month] = monthString.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    const ss = getSpreadsheetForCurrentUser();
    const sheet = ss.getSheetByName('Penjualan');
    if (sheet.getLastRow() <= 1) {
      return { summary: { totalNilai: 0, totalItem: 0, totalHPP: 0, totalLabaKotor: 0 }, details: [] };
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const tglIndex = headers.indexOf('Tanggal');
    const jmlIndex = headers.indexOf('Jumlah');
    const totalIndex = headers.indexOf('Total Bayar');
    const labaKotorIndex = headers.indexOf('Laba Kotor');
    const hargaBeliIndex = headers.indexOf('Harga Beli');

    const dailyData = {};
    
    data.forEach(row => {
      const tglTransaksi = new Date(row[tglIndex]);
      if (tglTransaksi >= startDate && tglTransaksi <= endDate) {
        const dayKey = tglTransaksi.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = {
            tanggal: dayKey,
            totalNilai: 0,
            totalItem: 0,
            totalHPP: 0,
            totalLabaKotor: 0
          };
        }
        
        const jumlahItem = parseInt(row[jmlIndex]) || 0;
        const hargaBeli = parseFloat(row[hargaBeliIndex]) || 0;
        dailyData[dayKey].totalNilai += parseFloat(row[totalIndex]) || 0;
        dailyData[dayKey].totalItem += jumlahItem;
        dailyData[dayKey].totalHPP += hargaBeli * jumlahItem;
        dailyData[dayKey].totalLabaKotor += parseFloat(row[labaKotorIndex]) || 0;
      }
    });

    const details = Object.values(dailyData).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    const summary = details.reduce((acc, day) => {
        acc.totalNilai += day.totalNilai;
        acc.totalItem += day.totalItem;
        acc.totalHPP += day.totalHPP;
        acc.totalLabaKotor += day.totalLabaKotor;
        return acc;
    }, { totalNilai: 0, totalItem: 0, totalHPP: 0, totalLabaKotor: 0 });

    return { summary, details };

  } catch (e) {
    Logger.log(e);
    return { error: e.message };
  }
}

/**
 * Membuat file Google Sheets baru dari laporan penjualan bulanan dan mengembalikan URL-nya.
 * @param {string} monthString Bulan dan tahun dalam format 'YYYY-MM'.
 * @returns {Object} Objek berisi URL spreadsheet atau pesan error.
 */
function exportLaporanBulanan(monthString) {
  try {
    const dataLaporan = getLaporanBulanan(monthString);
    if (dataLaporan.error || dataLaporan.details.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diekspor.' };
    }

    const newSpreadsheet = SpreadsheetApp.create(`Laporan Penjualan Bulanan ${monthString}`);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Bulanan');

    const headers = ['Tanggal', 'Total Penjualan', 'Total Item', 'Total Harga Beli (HPP)', 'Total Laba Kotor'];
    const dataRows = dataLaporan.details.map(item => [
      new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      item.totalNilai,
      item.totalItem,
      item.totalHPP,
      item.totalLabaKotor
    ]);

    // Tulis ringkasan di atas
    sheet.appendRow([`Ringkasan Laporan Bulan ${monthString}`]);
    sheet.getRange('A1').setFontWeight('bold');
    sheet.appendRow(['Total Penjualan', dataLaporan.summary.totalNilai]);
    sheet.appendRow(['Total Item Terjual', dataLaporan.summary.totalItem]);
    sheet.appendRow(['Total Harga Beli (HPP)', dataLaporan.summary.totalHPP]);
    sheet.appendRow(['Total Laba Kotor', dataLaporan.summary.totalLabaKotor]);
    sheet.getRange('B2:B5').setNumberFormat("Rp #,##0");
    
    sheet.appendRow(['']); 

    // Tulis detail data
    sheet.appendRow(headers);
    const headerRowIndex = sheet.getLastRow();
    sheet.getRange(headerRowIndex, 1, 1, headers.length).setFontWeight('bold');
    
    if (dataRows.length > 0) {
      sheet.getRange(headerRowIndex + 1, 1, dataRows.length, headers.length).setValues(dataRows);
      sheet.getRange(headerRowIndex + 1, 2, dataRows.length, 1).setNumberFormat("Rp #,##0");
      sheet.getRange(headerRowIndex + 1, 4, dataRows.length, 2).setNumberFormat("Rp #,##0");
    }
    
    sheet.autoResizeColumns(1, headers.length);
    SpreadsheetApp.flush(); 

    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export: ' + e.message };
  }
}

/**
 * Membuat file Google Sheets baru dari laporan penjualan dan mengembalikan URL-nya untuk diunduh.
 * @param {string} startDateString Tanggal awal dalam format ISO (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir dalam format ISO (YYYY-MM-DD).
 * @returns {Object} Objek berisi URL spreadsheet atau pesan error.
 */
function exportLaporanPenjualan(startDateString, endDateString) {
  try {
    const dataLaporan = getLaporanPenjualan(startDateString, endDateString);
    if (dataLaporan.error || dataLaporan.details.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diekspor.' };
    }

    // Buat spreadsheet baru di root Drive pengguna
    const newSpreadsheet = SpreadsheetApp.create(`Laporan Penjualan ${startDateString} sampai ${endDateString}`);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Penjualan');

    // Siapkan header dan data
    const headers = ['Tanggal', 'Nama Barang', 'No Batch', 'Harga Jual', 'Harga Beli', 'Jumlah', 'Total', 'Laba Kotor', 'Kasir'];
    const dataRows = dataLaporan.details.map(item => [
      item.tanggal,
      item.namaBarang,
      item.noBatch,
      item.harga,
      item.hargaBeli,
      item.jumlah,
      item.total,
      item.labaKotor,
      item.kasir
    ]);

    // Tulis data ke sheet
    sheet.appendRow(headers);
    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
    }
    
    // Formatting
    sheet.getRange("D:E").setNumberFormat("Rp #,##0");
    sheet.getRange("G:H").setNumberFormat("Rp #,##0");
    sheet.autoResizeColumns(1, headers.length);
    sheet.getRange("A1:I1").setFontWeight("bold");
    sheet.setFrozenRows(1);
    
    SpreadsheetApp.flush(); 

    // Menggunakan format URL unduh XLSX langsung
    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export: ' + e.message };
  }
}

/**
 * Mengambil semua item dalam satu transaksi.
 * @param {string} transactionId ID transaksi yang akan dicari.
 * @returns {Array} Daftar item dalam transaksi.
 */
function getTransaksiDetail(transactionId) {
  try {
    if (!transactionId) {
      return { success: false, message: "ID Transaksi tidak valid." };
    }

    const ss = getSpreadsheetForCurrentUser();
    if (!ss) {
      return { success: false, message: "Spreadsheet tidak ditemukan atau tidak terkonfigurasi." };
    }
    
    const sheet = ss.getSheetByName('Penjualan');
    if (!sheet) {
      return { success: false, message: "Sheet 'Penjualan' tidak ditemukan." };
    }
    
    if (sheet.getLastRow() < 2) {
      return { success: true, details: [] };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    
    if (!headers || headers.length === 0) {
      return { success: true, details: [] }; 
    }
    
    const idIndex = headers.indexOf('ID Transaksi');
    if (idIndex === -1) {
      return { success: false, message: "Kolom 'ID Transaksi' tidak ditemukan di sheet Penjualan." };
    }

    const details = data
      .filter(row => String(row[idIndex]).trim() === String(transactionId).trim())
      .map((row) => {
        let item = {}; 
        headers.forEach((header, i) => {
          const key = header.replace(/\s+/g, ''); 
          if(key) { 
             let value = row[i];
             // PERBAIKAN: Konversi objek Tanggal ke string ISO untuk mencegah error serialisasi
             if (value instanceof Date) {
               item[key] = value.toISOString();
             } else {
               item[key] = value;
             }
          }
        });
        return item;
      });

    return { success: true, details: details };
  } catch(e) {
    Logger.log(`CRITICAL ERROR in getTransaksiDetail: ${e.toString()} \nStack: ${e.stack}`);
    return { success: false, message: `Terjadi kesalahan kritis di server: ${e.message}` };
  }
}


/**
 * Menghapus seluruh item dari sebuah transaksi dan mengembalikan stoknya.
 * @param {string} transactionId ID transaksi yang akan dihapus.
 * @returns {Object} Hasil operasi.
 */
function hapusTransaksi(transactionId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const ss = getSpreadsheetForCurrentUser();
    const penjualanSheet = ss.getSheetByName('Penjualan');
    const batchSheet = ss.getSheetByName('Batch Stok');

    const penjualanData = penjualanSheet.getDataRange().getValues();
    const pHeaders = penjualanData.shift();
    const pIdIndex = pHeaders.indexOf('ID Transaksi');
    const pKodeIndex = pHeaders.indexOf('Kode Barang');
    const pBatchIndex = pHeaders.indexOf('No Batch');
    const pJumlahIndex = pHeaders.indexOf('Jumlah');

    const batchData = batchSheet.getDataRange().getValues();
    const bHeaders = batchData.shift();
    const bKodeIndex = bHeaders.indexOf('Kode Barang');
    const bBatchIndex = bHeaders.indexOf('No Batch');
    const bJumlahIndex = bHeaders.indexOf('Jumlah');

    const rowsToDelete = [];
    const stokToRestore = {}; // { 'kode-batch': jumlah }

    // Cari item yang akan dihapus dan kumpulkan info stok
    penjualanData.forEach((row, index) => {
      if (row[pIdIndex] === transactionId) {
        rowsToDelete.push(index + 2);
        const key = `${row[pKodeIndex]}|||${row[pBatchIndex]}`;
        const jumlah = parseInt(row[pJumlahIndex]) || 0;
        stokToRestore[key] = (stokToRestore[key] || 0) + jumlah;
      }
    });

    if (rowsToDelete.length === 0) {
      return { success: false, message: "Transaksi tidak ditemukan." };
    }

    // Kembalikan stok
    for (const key in stokToRestore) {
      const [kode, batch] = key.split('|||');
      const jumlah = stokToRestore[key];
      
      for (let i = 0; i < batchData.length; i++) {
        if (batchData[i][bKodeIndex] === kode && batchData[i][bBatchIndex] === batch) {
          const currentStok = parseInt(batchData[i][bJumlahIndex]) || 0;
          batchSheet.getRange(i + 2, bJumlahIndex + 1).setValue(currentStok + jumlah);
          break;
        }
      }
    }

    // Hapus baris dari sheet penjualan (dari bawah ke atas)
    rowsToDelete.reverse().forEach(rowIndex => {
      penjualanSheet.deleteRow(rowIndex);
    });
     _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
    Logger.log(`Transaksi ${transactionId} dihapus, cache produk diinvalidasi.`);


    return { success: true, message: `Transaksi ${transactionId} berhasil dihapus.` };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal menghapus transaksi: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengupdate transaksi yang ada dengan validasi stok yang lebih aman.
 * VERSI PERBAIKAN FINAL untuk menangani perbedaan properti (case-insensitive) dan logika stok.
 * @param {Object} data Objek berisi { transactionId, updatedCart, originalCart, kasir }.
 * @returns {Object} Hasil operasi.
 */
function updateTransaksi(data) {
  const { transactionId, updatedCart, originalCart, kasir } = data;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const penjualanSheet = ss.getSheetByName('Penjualan');

    // 1. Dapatkan stok saat ini dari semua item yang terlibat
    const allItemsForStokCheck = [];
    originalCart.forEach(item => allItemsForStokCheck.push({ kodeBarang: item.KodeBarang, noBatch: item.NoBatch }));
    updatedCart.forEach(item => allItemsForStokCheck.push({ kodeBarang: item.kodeBarang, noBatch: item.noBatch }));
    const currentStokMap = getBatchStokDetails(allItemsForStokCheck);

    // 2. Validasi Stok (dengan penanganan case-insensitive)
    const requiredStokMap = {};
    updatedCart.forEach(item => {
      const key = `${item.kodeBarang}|||${item.noBatch}`;
      requiredStokMap[key] = (requiredStokMap[key] || 0) + item.jumlah;
    });

    for (const key in requiredStokMap) {
      const [kode, batch] = key.split('|||');
      const originalItem = originalCart.find(item => item.KodeBarang === kode && item.NoBatch === batch);
      const originalQty = originalItem ? (parseInt(originalItem.Jumlah) || 0) : 0;
      
      const currentSheetStock = currentStokMap[key] || 0;
      const totalAvailableStock = currentSheetStock + originalQty;
      
      if (requiredStokMap[key] > totalAvailableStock) {
        const itemInfo = updatedCart.find(item => item.kodeBarang === kode && item.noBatch === batch) || originalCart.find(item => item.KodeBarang === kode && item.NoBatch === batch);
        const itemName = itemInfo ? (itemInfo.namaBarang || itemInfo.NamaBarang) : kode;
        
        return { success: false, message: `Stok untuk ${itemName} (${batch}) tidak mencukupi. Sisa stok: ${totalAvailableStock}.` };
      }
    }

    // 3. Hitung selisih stok untuk diupdate (stok_lama - stok_baru)
    const stokDiff = {}; 
    originalCart.forEach(item => {
      const key = `${item.KodeBarang}|||${item.NoBatch}`;
      stokDiff[key] = (stokDiff[key] || 0) + (parseInt(item.Jumlah) || 0);
    });

    updatedCart.forEach(item => {
      // ▼▼▼ PERBAIKAN KRUSIAL ADA DI SINI ▼▼▼
      // Menggunakan properti camelCase (kodeBarang, noBatch) yang benar untuk updatedCart
      const key = `${item.kodeBarang}|||${item.noBatch}`;
      stokDiff[key] = (stokDiff[key] || 0) - item.jumlah;
    });

    // 4. Update Stok di Sheet
    const allBatchData = batchSheet.getDataRange().getValues();
    const bHeaders = allBatchData.shift();
    const bKodeIndex = bHeaders.indexOf('Kode Barang');
    const bBatchIndex = bHeaders.indexOf('No Batch');
    const bJumlahIndex = bHeaders.indexOf('Jumlah');

    for (const key in stokDiff) {
      if (stokDiff[key] === 0) continue;
      const [kode, batch] = key.split('|||');
      let found = false;
      for (let i = 0; i < allBatchData.length; i++) {
        if (allBatchData[i][bKodeIndex] === kode && allBatchData[i][bBatchIndex] === batch) {
          const currentStok = parseInt(allBatchData[i][bJumlahIndex]) || 0;
          // Logika yang benar: stok_baru = stok_sekarang + (jumlah_lama - jumlah_baru)
          batchSheet.getRange(i + 2, bJumlahIndex + 1).setValue(currentStok + stokDiff[key]);
          found = true;
          break;
        }
      }
       // Jika batch baru ditambahkan selama edit
      if (!found && stokDiff[key] < 0) {
          const newItem = updatedCart.find(item => `${item.kodeBarang}|||${item.noBatch}` === key);
          if (newItem) {
              const edDate = new Date(); // Asumsi ED-nya jauh karena ini anomali
              batchSheet.appendRow([newItem.kodeBarang, newItem.noBatch, (stokDiff[key] * -1), edDate]);
          }
      }
    }

    // 5. Hapus dan Tulis Ulang Data Penjualan
    const penjualanData = penjualanSheet.getDataRange().getValues();
    const pIdIndex = penjualanData[0].indexOf('ID Transaksi');
    const rowsToDelete = [];
    penjualanData.forEach((row, index) => {
      if (index > 0 && row[pIdIndex] === transactionId) {
        rowsToDelete.push(index + 1);
      }
    });
    rowsToDelete.reverse().forEach(rowIndex => penjualanSheet.deleteRow(rowIndex));

    const tanggal = new Date(originalCart[0].Tanggal);
    updatedCart.forEach(item => {
      const hargaBeliTotal = (item.hargaBeli || 0) * item.jumlah;
      const labaKotor = item.subtotal - hargaBeliTotal;
      penjualanSheet.appendRow([
        transactionId, tanggal, item.kodeBarang, item.namaBarang, item.noBatch,
        item.harga, item.hargaBeli || 0, item.jumlah, item.diskon,
        item.subtotal, labaKotor, kasir
      ]);
    });

    _invalidateProductCache(); // Invalidasi cache setelah stok berubah
    Logger.log(`Transaksi ${transactionId} diupdate, cache produk diinvalidasi.`);

    return { success: true, message: `Transaksi ${transactionId} berhasil diperbarui.` };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal mengupdate transaksi: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}
/**
 * Mengambil data laporan pembelian berdasarkan rentang tanggal.
 * @param {string} startDateString Tanggal awal dalam format ISO (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir dalam format ISO (YYYY-MM-DD).
 * @returns {Object} Objek berisi ringkasan dan detail transaksi.
 */
function getLaporanPembelian(startDateString, endDateString) {
  try {
    if (!startDateString || !endDateString) {
      throw new Error("Tanggal awal dan akhir harus diisi.");
    }
    
    const startDate = new Date(startDateString + 'T00:00:00');
    const endDate = new Date(endDateString + 'T23:59:59');

    const ss = getSpreadsheetForCurrentUser();
    const sheet = ss.getSheetByName('Pembelian');
    if (sheet.getLastRow() <= 1) {
      return { summary: { totalNilai: 0, totalItem: 0 }, details: [] };
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const idTransaksiIndex = headers.indexOf('ID Transaksi');
    const tglIndex = headers.indexOf('Tanggal');
    const namaIndex = headers.indexOf('Nama Barang');
    const batchIndex = headers.indexOf('No Batch');
    const hargaBeliIndex = headers.indexOf('Harga Beli');
    const jmlIndex = headers.indexOf('Jumlah');
    const supplierIndex = headers.indexOf('Supplier');

    let totalNilai = 0;
    let totalItem = 0;
    const details = [];

    data.forEach(row => {
      const tglTransaksi = new Date(row[tglIndex]);
      if (tglTransaksi >= startDate && tglTransaksi <= endDate) {
        const hargaBeli = parseFloat(row[hargaBeliIndex]) || 0;
        const jumlahItem = parseInt(row[jmlIndex]) || 0;
        const subtotal = hargaBeli * jumlahItem;
        
        totalNilai += subtotal;
        totalItem += jumlahItem;

        details.push({
          idTransaksi: row[idTransaksiIndex],
          tanggal: tglTransaksi.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          namaBarang: row[namaIndex],
          noBatch: row[batchIndex],
          hargaBeli: hargaBeli,
          jumlah: jumlahItem,
          subtotal: subtotal,
          supplier: row[supplierIndex]
        });
      }
    });

    return { 
      summary: { 
        totalNilai: totalNilai, 
        totalItem: totalItem
      }, 
      details: details 
    };

  } catch (e) {
    Logger.log(e);
    return { error: e.message };
  }
}

/**
 * Membuat file Google Sheets baru dari laporan pembelian dan mengembalikan URL-nya.
 * @param {string} startDateString Tanggal awal dalam format ISO (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir dalam format ISO (YYYY-MM-DD).
 * @returns {Object} Objek berisi URL spreadsheet atau pesan error.
 */
function exportLaporanPembelian(startDateString, endDateString) {
  try {
    const dataLaporan = getLaporanPembelian(startDateString, endDateString);
    if (dataLaporan.error || dataLaporan.details.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diekspor.' };
    }

    const newSpreadsheet = SpreadsheetApp.create(`Laporan Pembelian ${startDateString} s-d ${endDateString}`);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Pembelian');

    const headers = ['Tanggal', 'Nama Barang', 'No Batch', 'Harga Beli', 'Jumlah', 'Subtotal', 'Supplier'];
    const dataRows = dataLaporan.details.map(item => [
      item.tanggal,
      item.namaBarang,
      item.noBatch,
      item.hargaBeli,
      item.jumlah,
      item.subtotal,
      item.supplier
    ]);

    // Tulis ringkasan di atas
    sheet.appendRow([`Ringkasan Laporan Pembelian ${startDateString} s/d ${endDateString}`]);
    sheet.getRange('A1').setFontWeight('bold');
    sheet.appendRow(['Total Nilai Pembelian', dataLaporan.summary.totalNilai]);
    sheet.appendRow(['Total Item Dibeli', dataLaporan.summary.totalItem]);
    sheet.getRange('B2').setNumberFormat("Rp #,##0");
    
    sheet.appendRow(['']); // Baris kosong sebagai pemisah

    // Tulis detail data
    sheet.appendRow(headers);
    const headerRowIndex = sheet.getLastRow();
    sheet.getRange(headerRowIndex, 1, 1, headers.length).setFontWeight('bold');
    
    if (dataRows.length > 0) {
      sheet.getRange(headerRowIndex + 1, 1, dataRows.length, headers.length).setValues(dataRows);
      sheet.getRange(headerRowIndex + 1, 4, dataRows.length, 1).setNumberFormat("Rp #,##0");
      sheet.getRange(headerRowIndex + 1, 6, dataRows.length, 1).setNumberFormat("Rp #,##0");
    }
    
    sheet.autoResizeColumns(1, headers.length);
    SpreadsheetApp.flush(); 

    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export: ' + e.message };
  }
}

/**
 * Mengambil data riwayat pembelian berdasarkan rentang tanggal.
 * @param {string} startDateString Tanggal awal dalam format ISO (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir dalam format ISO (YYYY-MM-DD).
 * @returns {Object} Objek berisi daftar transaksi yang sudah dikelompokkan.
 */
function getRiwayatPembelian(startDateString, endDateString) {
  try {
    const laporanData = getLaporanPembelian(startDateString, endDateString);
    if (laporanData.error) {
      throw new Error(laporanData.error);
    }

    const groupedByTransaksi = laporanData.details.reduce((acc, item) => {
        if (!acc[item.idTransaksi]) {
            acc[item.idTransaksi] = { 
              idTransaksi: item.idTransaksi,
              tanggal: item.tanggal, 
              items: [], 
              total: 0,
              supplier: item.supplier
            };
        }
        acc[item.idTransaksi].items.push(`${item.namaBarang} (x${item.jumlah})`);
        acc[item.idTransaksi].total += item.subtotal;
        return acc;
    }, {});
    
    const uniqueTransactions = Object.values(groupedByTransaksi).sort((a,b) => {
      // Perlu konversi tanggal string 'DD Mon YYYY' ke objek Date untuk sorting yang benar
      const dateA = new Date(a.tanggal.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1, $3'));
      const dateB = new Date(b.tanggal.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1, $3'));
      return dateB - dateA;
    });
    
    return { success: true, details: uniqueTransactions };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: e.message };
  }
}

/**
 * Mengambil detail item dari sebuah transaksi pembelian dan memeriksa apakah item sudah pernah terjual.
 * @param {string} transactionId ID transaksi pembelian.
 * @returns {Object} Hasil operasi dengan detail item, supplier, dan status penjualan.
 */
function getTransaksiPembelianDetail(transactionId) {
  try {
    if (!transactionId) {
      return { success: false, message: "ID Transaksi tidak valid." };
    }

    const ss = getSpreadsheetForCurrentUser();
    const pembelianSheet = ss.getSheetByName('Pembelian');
    const penjualanSheet = ss.getSheetByName('Penjualan');
    
    if (pembelianSheet.getLastRow() < 2) {
      return { success: true, details: [], supplier: '' };
    }

    // Ambil data penjualan untuk pengecekan
    const penjualanData = (penjualanSheet.getLastRow() > 1) ? penjualanSheet.getDataRange().getValues() : [];
    const pHeaders = (penjualanData.length > 0) ? penjualanData.shift() : [];
    const pKodeIndex = pHeaders.indexOf('Kode Barang');
    const pBatchIndex = pHeaders.indexOf('No Batch');

    const data = pembelianSheet.getDataRange().getValues();
    const headers = data.shift();
    const idIndex = headers.indexOf('ID Transaksi');
    const kodeIndex = headers.indexOf('Kode Barang');
    const batchIndex = headers.indexOf('No Batch');
    const supplierIndex = headers.indexOf('Supplier');

    let supplier = '';
    const details = [];

    data.forEach(row => {
      if (String(row[idIndex]).trim() === String(transactionId).trim()) {
        if (!supplier) supplier = row[supplierIndex]; // Ambil supplier dari baris pertama

       let item = {};
      headers.forEach((header, i) => {
        const key = header.replace(/\s+/g, '');
        if (key) {
          let value = row[i];

          // ▼▼▼ MODIFIKASI FINAL: MENIRU KODE QR CODE YANG BERHASIL ▼▼▼
          // Cek apakah kolom ini adalah kolom tanggal dan memiliki nilai
          if ((key === 'TanggalED' || key === 'Tanggal') && value) {
            // Bungkus 'value' dengan new Date() untuk menstandarkan objeknya
            // sebelum diformat. Inilah kunci perbaikannya.
            try {
              item[key] = Utilities.formatDate(new Date(value), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
            } catch (e) {
              item[key] = value; // Jika gagal, kembalikan nilai asli
            }
          } else {
            // Untuk semua kolom lain yang bukan tanggal, langsung masukkan nilainya.
            item[key] = value;
          }
          // ▲▲▲ AKHIR MODIFIKASI FINAL ▲▲▲
        }
      });

        // Cek apakah batch ini ada di riwayat penjualan
        const hasBeenSold = penjualanData.some(
          saleRow => saleRow[pKodeIndex] === item.KodeBarang && saleRow[pBatchIndex] === item.NoBatch
        );
        item.hasBeenSold = hasBeenSold;

        details.push(item);
      }
    });

    return { success: true, details: details, supplier: supplier };
  } catch(e) {
    Logger.log(`ERROR in getTransaksiPembelianDetail: ${e.toString()}`);
    return { success: false, message: `Terjadi kesalahan server: ${e.message}` };
  }
}

/**
 * Menghapus transaksi pembelian dan menyesuaikan (mengurangi) stok.
 * DENGAN NOTIFIKASI BARU.
 * @param {string} transactionId ID transaksi pembelian yang akan dihapus.
 * @returns {Object} Hasil operasi.
 */
function hapusTransaksiPembelian(transactionId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const ss = getSpreadsheetForCurrentUser();
    const pembelianSheet = ss.getSheetByName('Pembelian');
    const batchSheet = ss.getSheetByName('Batch Stok');

    const pembelianData = pembelianSheet.getDataRange().getValues();
    const pHeaders = pembelianData.shift();
    const pIdIndex = pHeaders.indexOf('ID Transaksi');
    const pKodeIndex = pHeaders.indexOf('Kode Barang');
    const pBatchIndex = pHeaders.indexOf('No Batch');
    const pJumlahIndex = pHeaders.indexOf('Jumlah');

    const batchData = batchSheet.getDataRange().getValues();
    const bHeaders = batchData.shift();
    const bKodeIndex = bHeaders.indexOf('Kode Barang');
    const bBatchIndex = bHeaders.indexOf('No Batch');
    const bJumlahIndex = bHeaders.indexOf('Jumlah');

    const rowsToDelete = [];
    const stokToRemove = {}; // { 'kode-batch': jumlah }

    pembelianData.forEach((row, index) => {
      if (row[pIdIndex] === transactionId) {
        rowsToDelete.push(index + 2);
        const key = `${row[pKodeIndex]}|||${row[pBatchIndex]}`;
        const jumlah = parseInt(row[pJumlahIndex]) || 0;
        stokToRemove[key] = (stokToRemove[key] || 0) + jumlah;
      }
    });

    if (rowsToDelete.length === 0) {
      return { success: false, message: "Transaksi pembelian tidak ditemukan." };
    }

    // Validasi sebelum mengurangi stok
    for (const key in stokToRemove) {
      const [kode, batch] = key.split('|||');
      const jumlah = stokToRemove[key];
      const batchRow = batchData.find(row => row[bKodeIndex] === kode && row[bBatchIndex] === batch);
      
      // ▼▼▼ INILAH PERUBAHANNYA ▼▼▼
      if (!batchRow || (parseInt(batchRow[bJumlahIndex]) || 0) < jumlah) {
        return { success: false, message: "Item pada Batch ini sudah terjual tidak dapat di hapus lagi silahkan edit untuk melakukan penyesuaian stok" };
      }
    }

    // Kurangi stok
    for (const key in stokToRemove) {
      const [kode, batch] = key.split('|||');
      const jumlah = stokToRemove[key];
      for (let i = 0; i < batchData.length; i++) {
        if (batchData[i][bKodeIndex] === kode && batchData[i][bBatchIndex] === batch) {
          const currentStok = parseInt(batchData[i][bJumlahIndex]) || 0;
          batchSheet.getRange(i + 2, bJumlahIndex + 1).setValue(currentStok - jumlah);
          break;
        }
      }
    }

    // Hapus baris dari sheet pembelian
    rowsToDelete.reverse().forEach(rowIndex => {
      pembelianSheet.deleteRow(rowIndex);
    });
    _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
    Logger.log(`Transaksi pembelian ${transactionId} dihapus, cache produk diinvalidasi.`);


    return { success: true, message: `Transaksi pembelian ${transactionId} berhasil dihapus.` };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal menghapus transaksi pembelian: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengupdate transaksi pembelian yang sudah ada dengan logika penyesuaian (adjustment).
 * VERSI FINAL DENGAN PERBAIKAN DELIMITER UNTUK KODE BARANG YANG MENGANDUNG STRIP (-).
 * @param {Object} data Objek berisi { transactionId, updatedCart, originalCart, supplier }.
 * @returns {Object} Hasil operasi.
 */
function updateTransaksiPembelian(data) {
  const { transactionId, updatedCart, originalCart, supplier } = data;
  const lock = LockService.getScriptLock();
  lock.waitLock(3000);

  try {
    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const pembelianSheet = ss.getSheetByName('Pembelian');

    const stokDiff = {}; // Format: { 'KODE|||BATCH': JmlPerubahan }
    const DELIMITER = '|||'; // Menggunakan delimiter yang aman

    originalCart.forEach(item => {
      // ▼▼▼ PERUBAIKAN 1 ▼▼▼
      const key = `${item.KodeBarang}${DELIMITER}${item.NoBatch}`;
      stokDiff[key] = (stokDiff[key] || 0) - (parseInt(item.Jumlah) || 0);
    });

    updatedCart.forEach(item => {
      // ▼▼▼ PERUBAIKAN 2 ▼▼▼
      const key = `${item.kodeBarang}${DELIMITER}${item.noBatch}`;
      stokDiff[key] = (stokDiff[key] || 0) + (parseInt(item.jumlah) || 0);
    });
    
    const allBatchData = batchSheet.getDataRange().getValues();
    const bHeaders = allBatchData.shift();
    const batchData = allBatchData;
    const bKodeIndex = bHeaders.indexOf('Kode Barang');
    const bBatchIndex = bHeaders.indexOf('No Batch');
    const bJumlahIndex = bHeaders.indexOf('Jumlah');

    for (const key in stokDiff) {
      // ▼▼▼ PERUBAIKAN 3 ▼▼▼
      const [kode, batch] = key.split(DELIMITER);
      const batchRow = batchData.find(row => String(row[bKodeIndex]) === kode && String(row[bBatchIndex]) === batch);
      const currentStok = batchRow ? (parseInt(batchRow[bJumlahIndex]) || 0) : 0;
      
      if ((currentStok + stokDiff[key]) < 0) {
         throw new Error(`Stok untuk ${kode} (${batch}) tidak mencukupi. Sisa stok saat ini: ${currentStok}, Anda mencoba mengurangi sehingga hasilnya akan minus.`);
      }
    }

    // Terapkan Perubahan Stok
    for (const key in stokDiff) {
        if (stokDiff[key] === 0) continue; 
        const [kode, batch] = key.split(DELIMITER); // Menggunakan delimiter yang aman
        let batchUpdated = false;
        for (let i = 0; i < batchData.length; i++) {
            if (String(batchData[i][bKodeIndex]) === kode && String(batchData[i][bBatchIndex]) === batch) {
                const currentStok = parseInt(batchData[i][bJumlahIndex]) || 0;
                batchSheet.getRange(i + 2, bJumlahIndex + 1).setValue(currentStok + stokDiff[key]);
                batchUpdated = true;
                break;
            }
        }
        if (!batchUpdated && stokDiff[key] > 0) {
             const newItem = updatedCart.find(item => `${item.kodeBarang}${DELIMITER}${item.noBatch}` === key);
             if(newItem){
                const edDate = new Date(newItem.tanggalED);
                edDate.setHours(0, 0, 0, 0); 
                batchSheet.appendRow([newItem.kodeBarang, newItem.noBatch, newItem.jumlah, edDate]);
             }
        }
    }

    // Hapus baris transaksi pembelian lama
    const pembelianData = pembelianSheet.getDataRange().getValues();
    const pIdIndex = pembelianData[0].indexOf('ID Transaksi');
    const rowsToDelete = [];
    pembelianData.forEach((row, index) => {
      if (index > 0 && row[pIdIndex] === transactionId) {
        rowsToDelete.push(index + 1);
      }
    });
    rowsToDelete.reverse().forEach(rowIndex => pembelianSheet.deleteRow(rowIndex));

    // Tambahkan baris transaksi pembelian baru dari updatedCart
    const tanggal = new Date(originalCart[0].Tanggal);
    updatedCart.forEach(item => {
      const edDate = new Date(item.tanggalED);
      edDate.setHours(0, 0, 0, 0);
      pembelianSheet.appendRow([
        transactionId,
        tanggal,
        item.kodeBarang,
        item.namaBarang,
        item.noBatch,
        item.hargaBeli,
        item.jumlah,
        edDate,
        supplier
      ]);
    });
    _invalidateProductCache(); // <-- TAMBAHKAN BARIS INI
    Logger.log(`Transaksi pembelian ${transactionId} diupdate, cache produk diinvalidasi.`);


    return { success: true, message: `Transaksi pembelian ${transactionId} berhasil diperbarui.` };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal mengupdate transaksi: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

// --- FUNGSI UNTUK MENU ORDER ---

/**
 * Mengambil data barang yang berstatus 'harus dipesan' dari sheet 'Barang Dicari'.
 * @returns {Array} Daftar barang untuk tab Draft.
 */
function getBarangDicariForOrder() {
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  if (sheet.getLastRow() <= 1) return [];

  const stokSheet = ss.getSheetByName('Stok');
  const stokMap = (stokSheet.getLastRow() > 1) ? stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 2).getValues().reduce((map, row) => {
    map[row[1].toLowerCase()] = row[0]; // Map Nama Barang -> Kode Barang
    return map;
  }, {}) : {};

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idIndex = headers.indexOf('ID');
  const namaIndex = headers.indexOf('Nama Barang');
  const jumlahIndex = headers.indexOf('Jumlah Cari');
  const statusIndex = headers.indexOf('Status');

  return data
    .filter(row => row[statusIndex] === 'harus dipesan')
    .map(row => {
      const namaBarang = row[namaIndex];
      return {
        id: row[idIndex],
        kodeBarang: stokMap[namaBarang.toLowerCase()] || '',
        namaBarang: namaBarang,
        jumlah: row[jumlahIndex],
        status: row[statusIndex]
      };
    });
}
/**
 * Mengambil semua data order yang relevan untuk pembuatan surat pesanan.
 * (status: sudah datang, diproses, selesai)
 * @returns {Array} Daftar data order.
 */
function getDataForSuratPesanan() {
  const ss = getSpreadsheetForCurrentUser();
  const orderSheet = ss.getSheetByName('Order'); 
  if (orderSheet.getLastRow() <= 1) return []; 

  const statusesToFetch = ['sudah datang', 'diproses', 'selesai'];
  const data = orderSheet.getDataRange().getValues();
  const headers = data.shift();
  const statusIndex = headers.indexOf('Status'); 
  const noSuratIndex = headers.indexOf('No Surat'); // Tambahan: Ambil indeks kolom No Surat

  return data
    // Tambahan: Tambahkan kondisi '&& !row[noSuratIndex]' untuk filter
    .filter(row => statusesToFetch.includes(row[statusIndex]) && !row[noSuratIndex]) 
    .map(row => {
        let item = {};
        headers.forEach((header, i) => {
          const key = header.replace(/\s+/g, '');
          let value = row[i];
          if (value instanceof Date) {
            item[key] = value.toISOString();
          } else {
            item[key] = value;
          }
        });
        return item;
    });
}

/**
 * Mengupdate kolom jumlah pada sheet Order berdasarkan ID Order.
 * @param {string} orderId ID dari order yang akan diupdate.
 * @param {number} newJumlah Jumlah baru.
 * @returns {Object} Hasil operasi.
 */
function updateOrderJumlah(orderId, newJumlah) {
  if (!orderId || newJumlah === null || newJumlah < 0) {
    return { success: false, message: 'Data tidak valid.' };
  }
  
  const ss = getSpreadsheetForCurrentUser();
  const orderSheet = ss.getSheetByName('Order');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, orderSheet.getLastColumn()).getValues();
    const headers = orderSheet.getRange(1, 1, 1, orderSheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('ID Order');
    const jumlahIndex = headers.indexOf('Jumlah');

    for (let i = 0; i < data.length; i++) {
      if (data[i][idIndex] === orderId) {
        const row = i + 2;
        orderSheet.getRange(row, jumlahIndex + 1).setValue(newJumlah);
        return { success: true, message: 'Jumlah berhasil diperbarui.' };
      }
    }
    return { success: false, message: 'ID Order tidak ditemukan.' };
  } catch(e) {
    Logger.log(e);
    return { success: false, message: 'Gagal memperbarui jumlah: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menambahkan item baru secara manual ke 'Barang Dicari' dengan status 'harus dipesan'.
 * @param {Object} produkData Objek berisi detail produk yang dipilih dari stok.
 * @param {string} username Nama pengguna yang menambahkan.
 * @returns {Object} Hasil operasi dengan data draft terbaru.
 */
function addManualDraftOrder(produkData, username) {
  if (!produkData || !produkData.namaBarang) {
    return { success: false, message: 'Data produk tidak valid.' };
  }
  
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Barang Dicari');
  
  try {
    const newId = 'BD-' + new Date().getTime();
    // Format: ID, Tanggal Input, Nama Barang, Jumlah Cari, Status, User
    sheet.appendRow([newId, new Date(), produkData.namaBarang, 1, 'harus dipesan', username]);
    
    // Ambil data terbaru untuk dikirim kembali ke UI
    const updatedData = getBarangDicariForOrder();
    return { success: true, updatedData: updatedData };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal menambahkan item draft: ' + e.message };
  }
}


/**
 * Memindahkan item yang dipilih dari 'Barang Dicari' ke 'Order' dan MENGHAPUS baris aslinya.
 * @param {Array<string>} selectedIds Array berisi ID barang yang dipilih dari 'Barang Dicari'.
 * @returns {Object} Hasil operasi.
 */
function processItemsToOrder(selectedIds) {
  if (!selectedIds || selectedIds.length === 0) {
    return { success: false, message: 'Tidak ada item yang dipilih.' };
  }
  const ss = getSpreadsheetForCurrentUser();
  const barangDicariSheet = ss.getSheetByName('Barang Dicari');
  const orderSheet = ss.getSheetByName('Order');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const data = barangDicariSheet.getDataRange().getValues();
    const headers = data.shift();
    const idIndex = headers.indexOf('ID');
    const namaIndex = headers.indexOf('Nama Barang');
    const jumlahIndex = headers.indexOf('Jumlah Cari');

    const itemsToMove = [];
    const rowsToDelete = [];

    data.forEach((row, index) => {
      const id = row[idIndex];
      if (selectedIds.includes(id)) {
        itemsToMove.push({
          namaBarang: row[namaIndex],
          jumlah: row[jumlahIndex]
        });
        rowsToDelete.push(index + 2); // Baris di sheet (1-based + header)
      }
    });

    if (itemsToMove.length === 0) {
      return { success: false, message: 'Item yang dipilih tidak ditemukan.' };
    }

    // 1. Tambahkan item ke sheet 'Order'
    const tglOrder = new Date();
    itemsToMove.forEach(item => {
      const newId = 'ORD-' + new Date().getTime() + Math.random().toString(36).substr(2, 5);
      orderSheet.appendRow([newId, tglOrder, item.namaBarang, item.jumlah, '', '', 'dipesan', '']);
    });
    
    // 2. Hapus baris dari sheet 'Barang Dicari'
    // Hapus dari bawah ke atas agar indeks baris tidak bergeser
    rowsToDelete.reverse().forEach(rowIndex => {
      barangDicariSheet.deleteRow(rowIndex);
    });

    return { success: true, message: `${itemsToMove.length} item berhasil dipesan.` };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Terjadi kesalahan: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil data dari sheet 'Order' berdasarkan status.
 * @param {string} status Status yang akan difilter ('dipesan', 'sudah datang', 'diproses', 'selesai').
 * @returns {Array} Daftar data order.
 */
function getOrderData(status) {
  const ss = getSpreadsheetForCurrentUser();
  const orderSheet = ss.getSheetByName('Order');
  if (orderSheet.getLastRow() <= 1) return [];

  const data = orderSheet.getDataRange().getValues();
  const headers = data.shift();
  const statusIndex = headers.indexOf('Status');
  
  const stokSheet = ss.getSheetByName('Stok');
  const stokMap = (stokSheet.getLastRow() > 1) ? stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 2).getValues().reduce((map, row) => {
    map[row[1].toLowerCase()] = row[0]; // Map Nama Barang -> Kode Barang
    return map;
  }, {}) : {};


  return data
    .filter(row => row[statusIndex] === status)
    .map(row => {
        let item = {};
        headers.forEach((header, i) => {
          const key = header.replace(/\s+/g, '');
          let value = row[i];
          if (value instanceof Date) {
            item[key] = value.toISOString();
          } else {
            item[key] = value;
          }
        });
        // Tambahkan kode barang jika ada
        item['KodeBarang'] = stokMap[item.NamaBarang.toLowerCase()] || '';
        return item;
    });
}

/**
 * Mengambil harga beli untuk beberapa item berdasarkan kode barang.
 * @param {Array<string>} kodeBarangArray Array berisi kode barang.
 * @returns {Object} Objek pemetaan { kodeBarang: hargaBeli, ... }.
 */
function getHargaBeliForItems(kodeBarangArray) {
  if (!kodeBarangArray || kodeBarangArray.length === 0) {
    return {};
  }
  const ss = getSpreadsheetForCurrentUser();
  const stokSheet = ss.getSheetByName('Stok');
  if (stokSheet.getLastRow() <= 1) return {};

  const stokData = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 3).getValues(); // Kode, Nama, Harga Beli
  const hargaBeliMap = {};

  stokData.forEach(row => {
    const kodeBarang = row[0];
    if (kodeBarangArray.includes(kodeBarang)) {
      hargaBeliMap[kodeBarang] = parseFloat(row[2]) || 0;
    }
  });
  return hargaBeliMap;
}

/**
 * Mengupdate status atau data lain untuk order yang dipilih.
 * @param {Array<string>} orderIds ID dari order yang akan diupdate.
 * @param {string} newStatus Status baru untuk order.
 * @param {Object} [dataToUpdate] Data tambahan untuk diupdate (misal: { Satuan: 'Box', Supplier: 'PT ABC' }).
 * @returns {Object} Hasil operasi.
 */
function updateOrderData(orderIds, newStatus, dataToUpdate = {}) {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, message: 'Tidak ada order yang dipilih.' };
  }
  const ss = getSpreadsheetForCurrentUser();
  const orderSheet = ss.getSheetByName('Order');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const data = orderSheet.getDataRange().getValues();
    const headers = data.shift();
    const idIndex = headers.indexOf('ID Order');
    const statusIndex = headers.indexOf('Status');
    
    // Buat pemetaan header ke index untuk update dinamis
    const headerMap = {};
    headers.forEach((h, i) => headerMap[h] = i);
    
    // Tambahkan 'Tanggal Datang' jika statusnya 'sudah datang'
    if (newStatus === 'sudah datang' && !headers.includes('Tanggal Datang')) {
        orderSheet.getRange(1, headers.length + 1).setValue('Tanggal Datang');
        headers.push('Tanggal Datang');
        headerMap['Tanggal Datang'] = headers.length - 1;
    }

    for (let i = 0; i < data.length; i++) {
      if (orderIds.includes(data[i][idIndex])) {
        const row = i + 2;
        // Update status
        orderSheet.getRange(row, statusIndex + 1).setValue(newStatus);

        // Update Tanggal Datang
        if (newStatus === 'sudah datang') {
            const tglDatangIndex = headerMap['Tanggal Datang'];
            if(tglDatangIndex !== undefined) {
               orderSheet.getRange(row, tglDatangIndex + 1).setValue(new Date());
            }
        }
        
        // Update data lain jika ada
        for (const key in dataToUpdate) {
          if (headerMap.hasOwnProperty(key)) {
            const colIndex = headerMap[key];
            // Khusus untuk data yang di-pass per-ID
            const specificData = dataToUpdate[key][data[i][idIndex]];
            if (specificData !== undefined) {
               orderSheet.getRange(row, colIndex + 1).setValue(specificData);
            }
          }
        }
      }
    }
    return { success: true, message: `Status berhasil diubah menjadi "${newStatus}".` };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal mengupdate order: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil dan mengolah data untuk laporan stok.
 * @returns {Object} Objek berisi data laporan stok atau pesan error.
 */
function getLaporanStok() {
  try {
    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    const batchSheet = ss.getSheetByName('Batch Stok');
    const penjualanSheet = ss.getSheetByName('Penjualan');
    
    // 1. Ambil data dasar & buat pemetaan untuk efisiensi
    const stokData = (stokSheet.getLastRow() > 1) ? stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, stokSheet.getLastColumn()).getValues() : [];
    const stokMap = stokData.reduce((map, row) => {
      map[row[0]] = { // row[0] = Kode Barang
        nama: row[1],
        hargaBeli: parseFloat(row[2]) || 0,
        minStok: parseInt(row[4]) || 0
      };
      return map;
    }, {});

    const batchData = (batchSheet.getLastRow() > 1) ? batchSheet.getRange(2, 1, batchSheet.getLastRow() - 1, batchSheet.getLastColumn()).getValues() : [];
    const batchHeaders = (batchSheet.getLastRow() > 0) ? batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0] : [];
    const bKodeIndex = batchHeaders.indexOf('Kode Barang');
    const bBatchIndex = batchHeaders.indexOf('No Batch');
    const bJmlIndex = batchHeaders.indexOf('Jumlah');
    const bEdIndex = batchHeaders.indexOf('Tanggal ED');
    
    // 2. Analisis riwayat penjualan untuk kecepatan terjual
    const penjualanData = (penjualanSheet.getLastRow() > 1) ? penjualanSheet.getRange(2, 1, penjualanSheet.getLastRow() - 1, penjualanSheet.getLastColumn()).getValues() : [];
    const pHeaders = (penjualanSheet.getLastRow() > 0) ? penjualanSheet.getRange(1, 1, 1, penjualanSheet.getLastColumn()).getValues()[0] : [];
    const pKodeIndex = pHeaders.indexOf('Kode Barang');
    const pTglIndex = pHeaders.indexOf('Tanggal');
    
    const penjualanPerProduk = {};
    penjualanData.forEach(row => {
      const kode = row[pKodeIndex];
      if (!penjualanPerProduk[kode]) {
        penjualanPerProduk[kode] = [];
      }
      penjualanPerProduk[kode].push(new Date(row[pTglIndex]));
    });

    // 3. Proses setiap produk dari data master
    const laporan = stokData.map(stokRow => {
      const kodeBarang = stokRow[0];
      const detailProduk = stokMap[kodeBarang];
      
      const batchProdukIni = batchData.filter(b => b[bKodeIndex] === kodeBarang);
      
      const totalStok = batchProdukIni.reduce((sum, b) => sum + (parseInt(b[bJmlIndex]) || 0), 0);
      
      const detailBatchString = totalStok > 0 ? batchProdukIni
        .filter(b => (parseInt(b[bJmlIndex]) || 0) > 0)
        .map(b => `${b[bBatchIndex]} (${b[bJmlIndex]}) ED: ${Utilities.formatDate(new Date(b[bEdIndex]), Session.getScriptTimeZone(), 'dd/MM/yy')}`)
        .join('; ') : '';
        
      let statusStok = 'Aman';
      if (totalStok === 0) {
        statusStok = 'Habis';
      } else if (totalStok <= detailProduk.minStok) {
        statusStok = 'Stok Rendah';
      }
      
      const nilaiStok = totalStok * detailProduk.hargaBeli;
      
      // Logika Kecepatan Terjual
      let kecepatanJual = 'Belum Terjual';
      let kecepatanValue = 9999; // Untuk sorting
      const riwayatJual = penjualanPerProduk[kodeBarang];
      if (riwayatJual && riwayatJual.length >= 2) {
        riwayatJual.sort((a, b) => b - a); // Urutkan dari terbaru ke terlama
        const penjualanTerakhir = riwayatJual[0];
        const penjualanSebelumnya = riwayatJual[1];
        const intervalHari = (penjualanTerakhir - penjualanSebelumnya) / (1000 * 60 * 60 * 24);
        
        if (intervalHari <= 7) { kecepatanJual = 'Sangat Baik'; kecepatanValue = 1; }
        else if (intervalHari <= 14) { kecepatanJual = 'Baik'; kecepatanValue = 2; }
        else if (intervalHari <= 30) { kecepatanJual = 'Cukup Baik'; kecepatanValue = 3; }
        else { kecepatanJual = 'Buruk'; kecepatanValue = 4; }

      } else if (riwayatJual && riwayatJual.length === 1) {
          const terakhirJual = riwayatJual[0];
          const hariSejakJual = (new Date() - terakhirJual) / (1000 * 60 * 60 * 24);
          if(hariSejakJual > 60) {
            kecepatanJual = 'Hati-hati'; kecepatanValue = 5;
          } else {
            kecepatanJual = 'Cukup Baik'; kecepatanValue = 3;
          }
      }

      return {
        KodeBarang: kodeBarang,
        NamaBarang: detailProduk.nama,
        TotalStok: totalStok,
        detailBatch: detailBatchString,
        MinimalStok: detailProduk.minStok,
        statusStok: statusStok,
        nilaiStok: nilaiStok,
        hargaBeli: detailProduk.hargaBeli,
        kecepatanJual: kecepatanJual,
        kecepatanValue: kecepatanValue
      };
    });
    const totalNilaiStok = laporan.reduce((sum, item) => sum + item.nilaiStok, 0);

    return { success: true, data: laporan, summary: { totalNilaiStok: totalNilaiStok } };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal memuat laporan stok: ' + e.message };
  }
}

/**
 * Mengarsipkan batch yang stoknya sudah habis.
 * @returns {Object} Hasil operasi.
 */
function archiveEmptyBatches() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const arsipSheetName = 'Arsip Batch Stok';
    let arsipSheet = ss.getSheetByName(arsipSheetName);

    // Buat sheet arsip jika belum ada
    if (!arsipSheet) {
      arsipSheet = ss.insertSheet(arsipSheetName);
      const headers = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues();
      arsipSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
    }

    if (batchSheet.getLastRow() <= 1) {
      return { success: true, message: 'Tidak ada data batch untuk dicek.' };
    }

    const data = batchSheet.getDataRange().getValues();
    const headers = data.shift();
    const jumlahIndex = headers.indexOf('Jumlah');
    const rowsToArchive = [];
    const rowNumbersToDelete = [];
    
    data.forEach((row, index) => {
      if (parseInt(row[jumlahIndex]) === 0) {
        rowsToArchive.push(row);
        rowNumbersToDelete.push(index + 2); // +2 karena 1-based index dan header
      }
    });

    if (rowsToArchive.length > 0) {
      // Salin ke arsip
      arsipSheet.getRange(arsipSheet.getLastRow() + 1, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
      
      // Hapus dari batch utama (dari bawah ke atas agar tidak merusak indeks)
      rowNumbersToDelete.reverse().forEach(rowNum => {
        batchSheet.deleteRow(rowNum);
      });

      return { success: true, message: `${rowsToArchive.length} batch kosong berhasil diarsipkan.` };
    } else {
      return { success: true, message: 'Tidak ada batch kosong yang perlu diarsipkan.' };
    }

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'Gagal mengarsipkan: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Membuat file Google Sheets baru dari laporan stok dan mengembalikan URL-nya.
 * @returns {Object} Objek berisi URL spreadsheet atau pesan error.
 */
function exportLaporanStok() {
  try {
    const laporanData = getLaporanStok();
    if (!laporanData.success || laporanData.data.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diekspor.' };
    }

    const newSpreadsheet = SpreadsheetApp.create(`Laporan Stok ${new Date().toLocaleDateString('id-ID')}`);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Stok');
    
    const headers = ['Kode Barang', 'Nama Barang', 'Total Stok', 'Detail Batch', 'Stok Minimal', 'Status', 'Nilai Stok (Rp)', 'Kecepatan Terjual'];
    sheet.appendRow(headers);
    sheet.getRange("A1:H1").setFontWeight("bold");

    const dataRows = laporanData.data.map(item => [
      item.KodeBarang,
      item.NamaBarang,
      item.TotalStok,
      item.detailBatch,
      item.MinimalStok,
      item.statusStok,
      item.nilaiStok,
      item.kecepatanJual
    ]);

    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
      sheet.getRange(2, 7, dataRows.length, 1).setNumberFormat("Rp #,##0");
    }

    sheet.autoResizeColumns(1, headers.length);
    SpreadsheetApp.flush();

    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };

  } catch(e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export: ' + e.message };
  }
}

/**
 * Mengambil data laporan biaya operasional berdasarkan rentang tanggal.
 * @param {string} startDateString Tanggal awal (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir (YYYY-MM-DD).
 * @returns {Object} Objek laporan.
 */
function getLaporanOperasional(startDateString, endDateString) {
  try {
    const startDate = new Date(startDateString + 'T00:00:00');
    const endDate = new Date(endDateString + 'T23:59:59');
    
    const ss = getSpreadsheetForCurrentUser();
    const sheet = ss.getSheetByName('Operasional');
    
    if (sheet.getLastRow() <= 1) {
      return { success: true, summary: { totalBiaya: 0, jumlahTransaksi: 0 }, details: [] };
    }
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('ID');
    const tglIndex = headers.indexOf('Tanggal');
    const namaIndex = headers.indexOf('Nama Biaya');
    const jumlahIndex = headers.indexOf('Jumlah Bayar');
    
    let totalBiaya = 0;
    const details = [];

    data.forEach(row => {
      const tglBiaya = new Date(row[tglIndex]);
      if (tglBiaya >= startDate && tglBiaya <= endDate) {
        const jumlahBayar = parseFloat(row[jumlahIndex]) || 0;
        totalBiaya += jumlahBayar;
        details.push({
          id: row[idIndex],
          tanggal: tglBiaya.toISOString().slice(0, 10), // Format YYYY-MM-DD
          namaBiaya: row[namaIndex],
          jumlahBayar: jumlahBayar
        });
      }
    });

    return { 
      success: true, 
      summary: { totalBiaya, jumlahTransaksi: details.length }, 
      details: details.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)) // Urutkan terbaru di atas
    };
  } catch(e) {
    Logger.log(e);
    return { success: false, message: "Gagal memuat laporan operasional: " + e.message };
  }
}

/**
 * Menyimpan (menambah atau mengedit) data biaya operasional.
 * @param {Object} dataBiaya Data biaya dari form.
 * @returns {Object} Hasil operasi.
 */
function simpanBiayaOperasional(dataBiaya) {
  const { id, tanggal, namaBiaya, jumlahBayar } = dataBiaya;
  if (!tanggal || !namaBiaya || !jumlahBayar) {
    return { success: false, message: "Semua field wajib diisi." };
  }

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Operasional');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (id) {
      // Mode Edit
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      const idIndex = headers.indexOf('ID');
      for (let i = 0; i < data.length; i++) {
        if (data[i][idIndex] == id) {
          sheet.getRange(i + 2, 2, 1, 3).setValues([[new Date(tanggal), namaBiaya, jumlahBayar]]);
          return { success: true, message: "Biaya berhasil diperbarui." };
        }
      }
      return { success: false, message: "ID Biaya tidak ditemukan." };
    } else {
      // Mode Tambah
      const newId = 'OP-' + new Date().getTime();
      sheet.appendRow([newId, new Date(tanggal), namaBiaya, jumlahBayar]);
      return { success: true, message: "Biaya baru berhasil ditambahkan." };
    }
  } catch(e) {
    Logger.log(e);
    return { success: false, message: "Gagal menyimpan biaya: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus data biaya operasional berdasarkan ID.
 * @param {string} id ID biaya yang akan dihapus.
 * @returns {Object} Hasil operasi.
 */
function hapusBiayaOperasional(id) {
  if (!id) return { success: false, message: "ID tidak valid." };

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Operasional');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = sheet.getRange(2, 1, sheet.getLastRow(), 1).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "Biaya berhasil dihapus." };
      }
    }
    return { success: false, message: "Biaya tidak ditemukan." };
  } catch(e) {
    Logger.log(e);
    return { success: false, message: "Gagal menghapus biaya: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil data barang yang akan atau sudah kedaluwarsa.
 * @param {string} filter 'akan-ed' atau 'sudah-ed'.
 * @returns {Object} Objek berisi data laporan.
 */
function getLaporanBarangED(filter) {
  try {
    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const stokSheet = ss.getSheetByName('Stok');
    
    if (batchSheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }

    // Buat pemetaan Kode Barang -> Nama Barang
    const stokMap = (stokSheet.getLastRow() > 1) 
      ? stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 2).getValues()
          .reduce((map, row) => {
            map[row[0]] = row[1];
            return map;
          }, {})
      : {};

    const data = batchSheet.getDataRange().getValues();
    const headers = data.shift();
    const kodeIndex = headers.indexOf('Kode Barang');
    const batchIndex = headers.indexOf('No Batch');
    const jumlahIndex = headers.indexOf('Jumlah');
    const edIndex = headers.indexOf('Tanggal ED');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date();
    limitDate.setDate(today.getDate() + 90);
    
    const filteredData = data.filter(row => {
      const jumlah = parseInt(row[jumlahIndex]) || 0;
      if (jumlah <= 0) return false;
      
      const edDate = new Date(row[edIndex]);
      edDate.setHours(0, 0, 0, 0);

      if (filter === 'akan-ed') {
        return edDate >= today && edDate <= limitDate;
      } else { // sudah-ed
        return edDate < today;
      }
    });

    const results = filteredData.map(row => {
      const edDate = new Date(row[edIndex]);
      const timeDiff = edDate.getTime() - today.getTime();
      const sisaHari = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let status = '';
      if (sisaHari < 0) {
        status = `ED ${Math.abs(sisaHari)} hari lalu`;
      } else {
        status = `Sisa ${sisaHari} hari`;
      }
      
      return {
        namaBarang: stokMap[row[kodeIndex]] || row[kodeIndex],
        noBatch: row[batchIndex],
        tanggalED: Utilities.formatDate(edDate, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
        jumlahStok: row[jumlahIndex],
        status: status
      };
    });

    // Urutkan berdasarkan tanggal ED terdekat
    results.sort((a,b) => new Date(a.tanggalED) - new Date(b.tanggalED));

    return { success: true, data: results };

  } catch(e) {
    Logger.log(e);
    return { success: false, message: 'Gagal memuat laporan barang ED: ' + e.message };
  }
}

/**
 * Menandai barang ED sebagai musnah dengan set jumlah stoknya ke 0.
 * @param {string} noBatch Nomor batch yang akan dimusnahkan.
 * @returns {Object} Hasil operasi.
 */
function tandaiBarangEDMusnah(noBatch) {
  // Fungsi ini identik dengan hapusStokBatch, kita bisa panggil fungsi itu saja.
  return hapusStokBatch(noBatch);
}

/**
 * Membuat file spreadsheet dari Laporan Barang ED dan mengembalikan URL-nya.
 * @param {string} filter Filter yang sedang aktif ('akan-ed' atau 'sudah-ed').
 * @returns {Object} Hasil operasi dengan URL file.
 */
function exportLaporanBarangED(filter) {
  try {
    const laporanData = getLaporanBarangED(filter);
    if (!laporanData.success || laporanData.data.length === 0) {
      return { success: false, message: 'Tidak ada data untuk diekspor.' };
    }

    let title = 'Laporan Barang ED';
    if(filter === 'akan-ed') title = 'Laporan Barang Akan ED (90 Hari)';
    if(filter === 'sudah-ed') title = 'Laporan Barang Sudah ED';

    const newSpreadsheet = SpreadsheetApp.create(title);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Barang ED');
    
    const headers = ['Nama Barang', 'No Batch', 'Tanggal ED', 'Jumlah Stok', 'Status'];
    sheet.appendRow(headers);
    sheet.getRange("A1:E1").setFontWeight("bold");

    const dataRows = laporanData.data.map(item => [
      item.namaBarang,
      item.noBatch,
      new Date(item.tanggalED),
      item.jumlahStok,
      item.status
    ]);

    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
      sheet.getRange(2, 3, dataRows.length, 1).setNumberFormat("dd-mm-yyyy");
    }

    sheet.autoResizeColumns(1, headers.length);
    SpreadsheetApp.flush();

    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };

  } catch(e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export: ' + e.message };
  }
}

/**
 * Menghitung dan mengembalikan data untuk Laporan Laba Rugi.
 * @param {string} startDateString Tanggal awal (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir (YYYY-MM-DD).
 * @returns {Object} Objek berisi semua komponen Laba Rugi.
 */
function getLaporanLabaRugi(startDateString, endDateString) {
  try {
    if (!startDateString || !endDateString) {
      throw new Error("Tanggal awal dan akhir harus diisi.");
    }
    
    const startDate = new Date(startDateString + 'T00:00:00');
    const endDate = new Date(endDateString + 'T23:59:59');

    const ss = getSpreadsheetForCurrentUser();
    const penjualanSheet = ss.getSheetByName('Penjualan');
    const operasionalSheet = ss.getSheetByName('Operasional');
    const kerugianSheet = ss.getSheetByName('Kerugian');

    let totalPendapatan = 0;
    let totalHPP = 0;
    let totalBiayaOperasional = 0;
    let totalKerugian = 0;

    // 1. Hitung Pendapatan & HPP dari sheet Penjualan
    if (penjualanSheet && penjualanSheet.getLastRow() > 1) {
      const pData = penjualanSheet.getRange(2, 1, penjualanSheet.getLastRow() - 1, penjualanSheet.getLastColumn()).getValues();
      const pHeaders = penjualanSheet.getRange(1, 1, 1, penjualanSheet.getLastColumn()).getValues()[0];
      const pTglIndex = pHeaders.indexOf('Tanggal');
      const pTotalIndex = pHeaders.indexOf('Total Bayar');
      const pJumlahIndex = pHeaders.indexOf('Jumlah');
      const pHargaBeliIndex = pHeaders.indexOf('Harga Beli');

      pData.forEach(row => {
        const tgl = new Date(row[pTglIndex]);
        if (tgl >= startDate && tgl <= endDate) {
          const jumlah = parseInt(row[pJumlahIndex]) || 0;
          const hargaBeli = parseFloat(row[pHargaBeliIndex]) || 0;
          totalPendapatan += parseFloat(row[pTotalIndex]) || 0;
          totalHPP += jumlah * hargaBeli;
        }
      });
    }
    
    const labaKotor = totalPendapatan - totalHPP;

    // 2. Hitung Biaya Operasional
    if (operasionalSheet && operasionalSheet.getLastRow() > 1) {
      const oData = operasionalSheet.getRange(2, 1, operasionalSheet.getLastRow() - 1, operasionalSheet.getLastColumn()).getValues();
      const oHeaders = operasionalSheet.getRange(1, 1, 1, operasionalSheet.getLastColumn()).getValues()[0];
      const oTglIndex = oHeaders.indexOf('Tanggal');
      const oJumlahIndex = oHeaders.indexOf('Jumlah Bayar');
      
      oData.forEach(row => {
        const tgl = new Date(row[oTglIndex]);
        if (tgl >= startDate && tgl <= endDate) {
          totalBiayaOperasional += parseFloat(row[oJumlahIndex]) || 0;
        }
      });
    }

    // 3. Hitung Kerugian Barang ED
    if (kerugianSheet && kerugianSheet.getLastRow() > 1) {
      const kData = kerugianSheet.getRange(2, 1, kerugianSheet.getLastRow() - 1, kerugianSheet.getLastColumn()).getValues();
      const kHeaders = kerugianSheet.getRange(1, 1, 1, kerugianSheet.getLastColumn()).getValues()[0];
      const kTglIndex = kHeaders.indexOf('Tanggal');
      const kTotalIndex = kHeaders.indexOf('Total Kerugian');

      kData.forEach(row => {
        const tgl = new Date(row[kTglIndex]);
        if (tgl >= startDate && tgl <= endDate) {
          totalKerugian += parseFloat(row[kTotalIndex]) || 0;
        }
      });
    }

    // 4. Hitung Laba Bersih
    const labaBersih = labaKotor - totalBiayaOperasional - totalKerugian;

    return {
      success: true,
      data: {
        totalPendapatan,
        totalHPP,
        labaKotor,
        totalBiayaOperasional,
        totalKerugian,
        labaBersih
      }
    };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: `Gagal menghitung Laba Rugi: ${e.message}` };
  }
}

/**
 * Membuat file spreadsheet dari Laporan Laba Rugi dan mengembalikan URL-nya.
 * @param {string} startDateString Tanggal awal (YYYY-MM-DD).
 * @param {string} endDateString Tanggal akhir (YYYY-MM-DD).
 * @returns {Object} Hasil operasi dengan URL file.
 */
function exportLaporanLabaRugi(startDateString, endDateString) {
  try {
    const laporanData = getLaporanLabaRugi(startDateString, endDateString);
    if (!laporanData.success) {
      throw new Error(laporanData.message);
    }
    const data = laporanData.data;

    const title = `Laporan Laba Rugi ${startDateString} s-d ${endDateString}`;
    const newSpreadsheet = SpreadsheetApp.create(title);
    const sheet = newSpreadsheet.getSheets()[0];
    sheet.setName('Laporan Laba Rugi');
    
    const rows = [
      ['Keterangan', 'Jumlah'],
      ['Pendapatan dari Penjualan', data.totalPendapatan],
      ['Harga Pokok Penjualan (HPP)', -data.totalHPP],
      ['Laba Kotor', data.labaKotor],
      ['Biaya Operasional', -data.totalBiayaOperasional],
      ['Kerugian Barang ED/Musnah', -data.totalKerugian],
      ['LABA BERSIH', data.labaBersih]
    ];

    sheet.getRange("A1:B1").setFontWeight("bold");
    sheet.getRange("A4:B4").setFontWeight("bold");
    sheet.getRange("A7:B7").setFontWeight("bold").setFontSize(12);

    sheet.getRange(1, 1, rows.length, 2).setValues(rows);
    sheet.getRange(2, 2, 6, 1).setNumberFormat("Rp #,##0");
    
    sheet.autoResizeColumns(1, 2);
    SpreadsheetApp.flush();

    const spreadsheetId = newSpreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    return { success: true, url: url };
  } catch(e) {
    Logger.log(e);
    return { success: false, message: 'Gagal membuat file export Laba Rugi: ' + e.message };
  }
}


// --- FUNGSI UNTUK MENU PENGATURAN ---

function getSettings() {
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Pengaturan');
  // Pastikan sheet tidak kosong dan memiliki data
  if (!sheet || sheet.getLastRow() < 2) return {};
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const settings = {};
  data.forEach(row => {
    if (row[0]) {
      settings[row[0]] = row[1];
    }
  });
   // ▼▼▼ TAMBAHKAN DUA BARIS INI ▼▼▼
  const userProperties = PropertiesService.getUserProperties();
  settings['spreadsheetId'] = userProperties.getProperty(CONFIG.SPREADSHEET_ID_KEY);
  // ▲▲▲ AKHIR DARI TAMBAHAN ▲▲▲

  return settings;
}

function saveSettings(settings) {
  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Pengaturan');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = sheet.getDataRange().getValues();
    const existingSettings = {};
    data.forEach((row, index) => {
      if (index > 0) {
        existingSettings[row[0]] = { value: row[1], row: index + 1 };
      }
    });
    for (const key in settings) {
      const value = settings[key];
      if (existingSettings.hasOwnProperty(key)) {
        const rowNum = existingSettings[key].row;
        sheet.getRange(rowNum, 2).setValue(value);
      } else {
        sheet.appendRow([key, value]);
      }
    }
    return { success: true, message: "Pengaturan berhasil disimpan." };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: "Gagal menyimpan pengaturan: " + e.message };
  } finally {
    lock.releaseLock();
  }
}


// --- FUNGSI UNTUK MENU PENGATURAN & KELOLA AKUN ---


/**
 * Menghitung jumlah pengguna dengan peran 'Admin'.
 * @param {Sheet} userSheet Objek sheet 'Pengguna'.
 * @returns {number} Jumlah admin.
 */
function countAdmins(userSheet) {
  if (userSheet.getLastRow() < 2) return 0;
  const data = userSheet.getDataRange().getValues();
  const headers = data.shift();
  const roleIndex = headers.indexOf('Role');

  let adminCount = 0;
  data.forEach(row => {
    if (row[roleIndex] === 'Admin') {
      adminCount++;
    }
  });
  return adminCount;
}
/**
 * Mengambil daftar semua pengguna.
 * @returns {Array<Object>} Daftar pengguna dengan {username, role}.
 */
function getUsers() {
  const ss = getSpreadsheetForCurrentUser();
  const userSheet = ss.getSheetByName('Pengguna');
  if (userSheet.getLastRow() <= 1) return [];

  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 3).getValues();
  const headers = userSheet.getRange(1, 1, 1, 3).getValues()[0];
  const usernameIndex = headers.indexOf('Username');
  const roleIndex = headers.indexOf('Role');

  return data.map(row => ({
    username: row[usernameIndex],
    role: row[roleIndex]
  }));
}

/**
 * Menambah pengguna baru.
 * @param {string} username Username baru.
 * @param {string} password Password baru.
 * @param {string} role Role baru.
 * @returns {Object} Hasil operasi.
 */
function addUser(username, password, role) {
  if (!username || !password || !role) {
    return { success: false, message: 'Semua kolom wajib diisi.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const userSheet = ss.getSheetByName('Pengguna');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const usernameColumn = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1).getValues().flat();
    if (usernameColumn.some(u => u.toString().toLowerCase() === username.toLowerCase())) {
      return { success: false, message: `Username "${username}" sudah ada.` };
    }
    userSheet.appendRow([username, password, role]);
    return { success: true, message: `Pengguna "${username}" berhasil ditambahkan.` };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengedit password pengguna.
 * @param {string} username Username yang akan diedit.
 * @param {string} newPassword Password baru.
 * @returns {Object} Hasil operasi.
 */
function editUser(username, newPassword) {
  if (!username || !newPassword) {
    return { success: false, message: 'Username dan password baru wajib diisi.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const userSheet = ss.getSheetByName('Pengguna');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = userSheet.getDataRange().getValues();
    const headers = data.shift();
    const usernameIndex = headers.indexOf('Username');
    const passwordIndex = headers.indexOf('Password');

    for (let i = 0; i < data.length; i++) {
      if (data[i][usernameIndex].toString().toLowerCase() === username.toLowerCase()) {
        userSheet.getRange(i + 2, passwordIndex + 1).setValue(newPassword);
        return { success: true, message: `Password untuk "${username}" berhasil diubah.` };
      }
    }
    return { success: false, message: 'Pengguna tidak ditemukan.' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus pengguna dan semua hak aksesnya.
 * @param {string} username Username yang akan dihapus.
 * @returns {Object} Hasil operasi.
 */
function deleteUser(username) {
  if (!username) {
    return { success: false, message: 'Username tidak valid.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const userSheet = ss.getSheetByName('Pengguna');
  const accessSheet = ss.getSheetByName('HakAksesKasir');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    // Hapus dari sheet Pengguna
    const userData = userSheet.getRange(2, 1, userSheet.getLastRow(), 1).getValues();
    let userDeleted = false;
    for (let i = userData.length - 1; i >= 0; i--) {
      if (userData[i][0].toString().toLowerCase() === username.toLowerCase()) {
        userSheet.deleteRow(i + 2);
        userDeleted = true;
        break;
      }
    }

    if (!userDeleted) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    // Hapus hak aksesnya
    if (accessSheet.getLastRow() > 1) {
      const accessData = accessSheet.getDataRange().getValues();
      const accessHeaders = accessData.shift();
      const usernameIndex = accessHeaders.indexOf('Username');
      const rowsToDelete = [];
      
      accessData.forEach((row, index) => {
        if (row[usernameIndex].toString().toLowerCase() === username.toLowerCase()) {
          rowsToDelete.push(index + 2);
        }
      });
      
      rowsToDelete.reverse().forEach(rowIndex => {
        accessSheet.deleteRow(rowIndex);
      });
    }

    return { success: true, message: `Pengguna "${username}" dan semua hak aksesnya berhasil dihapus.` };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil hak akses spesifik untuk seorang kasir.
 * @param {string} username Username kasir.
 * @returns {Object} Objek hak akses, contoh: { menu_laporan: true, tombol_hapus: false }.
 */
function getKasirPermissions(username) {
  const ss = getSpreadsheetForCurrentUser();
  const accessSheet = ss.getSheetByName('HakAksesKasir');
  const permissions = {};
  
  if (accessSheet.getLastRow() <= 1) return permissions;

  const data = accessSheet.getRange(2, 1, accessSheet.getLastRow() - 1, 3).getValues();
  data.forEach(row => {
    // row[0]=Username, row[1]=FiturID, row[2]=Diizinkan (TRUE/FALSE)
    if (row[0].toString().toLowerCase() === username.toLowerCase()) {
      permissions[row[1]] = row[2]; 
    }
  });

  return permissions;
}

/**
 * Menyimpan hak akses untuk seorang kasir.
 * @param {string} username Username kasir.
 * @param {Object} permissions Objek hak akses baru.
 * @returns {Object} Hasil operasi.
 */
function saveKasirPermissions(username, permissions) {
  if (!username || !permissions) {
    return { success: false, message: 'Data tidak lengkap.' };
  }
  
  const ss = getSpreadsheetForCurrentUser();
  const accessSheet = ss.getSheetByName('HakAksesKasir');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    // Hapus semua hak akses lama untuk pengguna ini terlebih dahulu
    if (accessSheet.getLastRow() > 1) {
      const data = accessSheet.getDataRange().getValues();
      const headers = data.shift();
      const usernameIndex = headers.indexOf('Username');
      const rowsToDelete = [];
      
      data.forEach((row, index) => {
        if (row[usernameIndex].toString().toLowerCase() === username.toLowerCase()) {
          rowsToDelete.push(index + 2); // +2 karena 1-based index dan header
        }
      });

      rowsToDelete.reverse().forEach(rowIndex => {
        accessSheet.deleteRow(rowIndex);
      });
    }

    // Tambahkan baris baru untuk setiap hak akses yang diberikan
    const newRows = [];
    for (const featureId in permissions) {
      if (permissions[featureId] === true) { // Hanya simpan yang diizinkan (TRUE)
        newRows.push([username, featureId, true]);
      }
    }

    if (newRows.length > 0) {
      accessSheet.getRange(accessSheet.getLastRow() + 1, 1, newRows.length, 3).setValues(newRows);
    }
    
    return { success: true, message: `Hak akses untuk "${username}" berhasil disimpan.` };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil daftar nama template surat yang sudah tersimpan.
 * @returns {Array<string>} Array berisi nama-nama template, contoh: ["Reguler", "Psikotropika"].
 */


/**
 * Merakit template surat pesanan dengan data asli.
 * @param {string} templateString - Teks template dari pengaturan.
 * @param {Object} data - Objek berisi data untuk placeholder sederhana.
 * @param {Array<Object>} items - Array objek barang yang akan dimasukkan ke tabel.
 * @returns {string} HTML yang sudah jadi.
 */
// ▼▼▼ BATAS AWAL MODIFIKASI 2 ▼▼▼
function renderTemplate(templateString, data, items) {
  let renderedHtml = templateString;

  for (const key in data) {
    renderedHtml = renderedHtml.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
  }

  const loopRegex = /{{#setiap_obat}}([\s\S]*?){{\/setiap_obat}}/;
  const match = renderedHtml.match(loopRegex);

  if (match) {
    const rowTemplate = match[1];
    let allRowsHtml = '';
    items.forEach((item, index) => {
      let rowHtml = rowTemplate;
      rowHtml = rowHtml.replace(/{{nomor_urut_obat}}/g, index + 1);
      rowHtml = rowHtml.replace(/{{nama_obat}}/g, item.NamaBarang || '');
      rowHtml = rowHtml.replace(/{{jumlah_obat}}/g, item.Jumlah || '');
      rowHtml = rowHtml.replace(/{{satuan_obat}}/g, item.Satuan || '');
      rowHtml = rowHtml.replace(/{{zat_aktif}}/g, item.precursorInfo ? item.precursorInfo.activeSubstance : '');
      rowHtml = rowHtml.replace(/{{bentuk_sediaan}}/g, item.precursorInfo ? item.precursorInfo.formStrength : '');
      rowHtml = rowHtml.replace(/{{keterangan}}/g, '');
      allRowsHtml += rowHtml;
    });
    renderedHtml = renderedHtml.replace(loopRegex, allRowsHtml);
  }

  return renderedHtml;
}

function generateNewSuratNumber(settings, jenis) {
  const format = settings[`Format Nomor ${jenis}`] || '[Nomor Urut]/SP/[Bulan-Romawi]/[Tahun-4]';
  
  let lastNumKey = `Nomor Urut Terakhir ${jenis}`;
  let lastDateKey = `Tanggal Urut Terakhir ${jenis}`;
  let lastNum = parseInt(settings[lastNumKey]) || 0;
  let lastDate = settings[lastDateKey] ? new Date(settings[lastDateKey]) : null;
  const today = new Date();
  
  if (!lastDate || lastDate.getMonth() !== today.getMonth() || lastDate.getFullYear() !== today.getFullYear()) {
    lastNum = 0;
  }
  
  const newNum = lastNum + 1;
  const paddedNum = newNum.toString().padStart(3, '0');

  const settingsToSave = {};
  settingsToSave[lastNumKey] = newNum;
  settingsToSave[lastDateKey] = today.toISOString().slice(0, 10);
  saveSettings(settingsToSave);

  const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  let finalNumber = format;
  finalNumber = finalNumber.replace(/\[Nomor Urut\]/g, paddedNum);
  finalNumber = finalNumber.replace(/\[Tahun-4\]/g, today.getFullYear());
  finalNumber = finalNumber.replace(/\[Tahun-2\]/g, today.getFullYear().toString().slice(-2));
  finalNumber = finalNumber.replace(/\[Bulan-Angka\]/g, (today.getMonth() + 1).toString().padStart(2, '0'));
  finalNumber = finalNumber.replace(/\[Bulan-Romawi\]/g, romanMonths[today.getMonth()]);
  finalNumber = finalNumber.replace(/\[Tanggal-Angka\]/g, today.getDate().toString().padStart(2, '0'));
  
  return finalNumber;
}

function generateSuratPesananPdf(selectedOrderIds, jenisSurat) {
  try {
    const ss = getSpreadsheetForCurrentUser();
    const orderSheet = ss.getSheetByName('Order');
    const settings = getSettings();
    const stokSheet = ss.getSheetByName('Stok');
    const supplierSheet = ss.getSheetByName('DataSupplier');

    const precursorMap = {};
    if (stokSheet.getLastRow() > 1) {
      const stokData = stokSheet.getDataRange().getValues();
      const stokHeaders = stokData.shift();
      const kodeIndex = stokHeaders.indexOf('Kode Barang');
      const zatAktifIndex = stokHeaders.indexOf('Zat Aktif Prekursor Farmasi'); 
      const bentukSediaanIndex = stokHeaders.indexOf('Bentuk dan Kekuatan Sediaan');
      stokData.forEach(row => {
        precursorMap[row[kodeIndex]] = {
          activeSubstance: (zatAktifIndex > -1) ? row[zatAktifIndex] : '',
          formStrength: (bentukSediaanIndex > -1) ? row[bentukSediaanIndex] : ''
        };
      });
    }

    const supplierMap = {};
     if (supplierSheet && supplierSheet.getLastRow() > 1) {
        const supplierData = supplierSheet.getDataRange().getValues();
        supplierData.shift();
        supplierData.forEach(row => {
            supplierMap[row[0]] = { address: row[1], phone: row[2] };
        });
    }

    const allOrderData = orderSheet.getDataRange().getValues();
    const orderHeaders = allOrderData.shift();
    const idIndex = orderHeaders.indexOf('ID Order');
    const kodeBarangIndex = orderHeaders.indexOf('Kode Barang');
    
    const selectedItems = [];
    allOrderData.forEach(row => {
        if (selectedOrderIds.includes(row[idIndex])) {
            let item = {};
            orderHeaders.forEach((h, i) => item[h.replace(/\s+/g, '')] = row[i]);
            const kodeBarang = row[kodeBarangIndex] || item.KodeBarang;
            item.precursorInfo = precursorMap[kodeBarang] || { activeSubstance: '', formStrength: '' };
            selectedItems.push(item);
        }
    });

    if (selectedItems.length === 0) throw new Error("Tidak ada barang yang dipilih.");

    const nomorSurat = generateNewSuratNumber(settings, jenisSurat);
    const supplierName = selectedItems[0].Supplier;
    const supplierDetails = supplierMap[supplierName] || { address: '', phone: '' };

    let logoHtml = '';
    if (settings['URL Logo']) {
      try {
        const imageBlob = UrlFetchApp.fetch(settings['URL Logo']).getBlob();
        const base64Image = Utilities.base64Encode(imageBlob.getBytes());
        const embeddedImageSrc = `data:${imageBlob.getContentType()};base64,${base64Image}`;
        logoHtml = `<img src="${embeddedImageSrc}" style="max-width:150px; max-height:75px;">`;
      } catch (e) {
        Logger.log("Gagal mengambil URL logo: " + e.message);
      }
    }

    const templateData = {
          'nama_apotek': settings['Nama Toko'] || '',
          'alamat_apotek': settings['Alamat Toko'] || '',
          'nomor_sia': settings['Nomor SIA'] || '',
          'nama_apoteker': settings['Nama Apoteker'] || '',
          'nomor_sipa': settings['No SIPA'] || '',
          'logo': logoHtml, // Menggunakan variabel yang sudah diproses
          'nomor_surat': nomorSurat,
          'tanggal_surat': new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
          'nama_supplier': supplierName,
          'alamat_supplier': supplierDetails.address,
          'telp_supplier': supplierDetails.phone
    };
    
    const templateString = jenisSurat === 'Reguler' ? TEMPLATE_REGULER_HTML : TEMPLATE_PREKURSOR_HTML;
    const finalHtml = renderTemplate(templateString, templateData, selectedItems);

    const pdfBlob = Utilities.newBlob(finalHtml, MimeType.HTML).getAs(MimeType.PDF).setName(`${nomorSurat.replace(/\//g, '-')}.pdf`);
    const pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());

    const noSuratIndex = orderHeaders.indexOf('No Surat');
    allOrderData.forEach((row, index) => {
        if (selectedOrderIds.includes(row[idIndex])) {
            orderSheet.getRange(index + 2, noSuratIndex + 1).setValue(nomorSurat);
        }
    });
    
    return { success: true, pdfData: pdfBase64, fileName: `${nomorSurat.replace(/\//g, '-')}.pdf` };

  } catch (e) {
    Logger.log(e);
    return { success: false, message: e.message };
  }
}

function generateSuratPesananPreviewHtml(currentSettings) {
    try {
        const jenis = currentSettings.jenis;
        
        const sampleItems = [
            { NamaBarang: "Amoxicillin 500mg Kapsul", Jumlah: 2, Satuan: "Box", precursorInfo: { activeSubstance: 'N/A', formStrength: 'Kapsul 500mg' } },
            { NamaBarang: "Actifed Sirup", Jumlah: 5, Satuan: "Botol", precursorInfo: { activeSubstance: 'Pseudoephedrine', formStrength: 'Sirup' } }
        ];

        const sampleData = {
            'nama_apotek': currentSettings['Nama Toko'] || 'Nama Apotek Anda',
            'alamat_apotek': currentSettings['Alamat Toko'] || 'Alamat Apotek Anda',
            'nomor_sia': currentSettings['Nomor SIA'] || '123/SIA/2024',
            'nama_apoteker': currentSettings['Nama Apoteker'] || 'Nama Apoteker',
            'nomor_sipa': currentSettings['No SIPA'] || '123/SIPA/2025',
            'logo': currentSettings['URL Logo'] ? `<img src="${currentSettings['URL Logo']}" style="max-width:150px; max-height:75px;">` : '(Logo Apotek)',
            'nomor_surat': (currentSettings[`Format Nomor ${jenis}`] || '[...]/SP').replace(/\[.*?\]/g, 'XXX'),
            'tanggal_surat': new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            'nama_supplier': 'PT. Supplier Sejahtera',
            'alamat_supplier': 'Jl. Farmasi No. 123',
            'telp_supplier': '021-1234567'
        };

        const templateString = jenis === 'Reguler' ? TEMPLATE_REGULER_HTML : TEMPLATE_PREKURSOR_HTML;
        const renderedContent = renderTemplate(templateString, sampleData, sampleItems);
        
        const finalHtml = `
          <!DOCTYPE html><html><head><title>Pratinjau Surat Pesanan</title>
          <style>body{font-family:sans-serif;margin:20px}table{border-collapse:collapse;width:100%}</style>
          </head><body>${renderedContent}</body></html>`;
        
        return { success: true, html: finalHtml };
    } catch(e) {
        Logger.log(e);
        return { success: false, message: e.message };
    }
}


 
 /** * Mengambil semua data batch yang memiliki stok untuk ditampilkan di halaman cetak QR Code. 
 * @returns {Array} Daftar objek produk yang berisi Kode, Nama, Batch, dan Tanggal ED. 
 */ 
function getDataForQRCode() { 
  try { 
    const ss = getSpreadsheetForCurrentUser(); 
    const stokSheet = ss.getSheetByName('Stok'); 
    const batchSheet = ss.getSheetByName('Batch Stok'); 

    // Buat pemetaan Kode Barang -> Nama Barang untuk efisiensi 
    const stokMap = {}; 
    if (stokSheet.getLastRow() > 1) { 
      stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 2).getValues().forEach(row => { 
        stokMap[row[0]] = row[1]; // {KODE: NAMA} 
      }); 
    } 

    if (batchSheet.getLastRow() <= 1) return []; 

    const batchData = batchSheet.getDataRange().getValues(); 
    const headers = batchData.shift(); 
    const kodeIndex = headers.indexOf('Kode Barang'); 
    const batchIndex = headers.indexOf('No Batch'); 
    const jumlahIndex = headers.indexOf('Jumlah'); 
    const edIndex = headers.indexOf('Tanggal ED'); 

    const results = []; 
    batchData.forEach(row => { 
      const jumlah = parseInt(row[jumlahIndex]) || 0; 
      if (jumlah > 0) { // Hanya ambil item yang masih ada stok 
        const kodeBarang = row[kodeIndex]; 
        results.push({ 
          kodeBarang: kodeBarang, 
          namaBarang: stokMap[kodeBarang] || 'N/A', 
          noBatch: row[batchIndex], 
          tanggalED: Utilities.formatDate(new Date(row[edIndex]), Session.getScriptTimeZone(), 'dd-MM-yyyy') 
        }); 
      } 
    }); 
    return results.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang)); // Urutkan berdasarkan nama 
  } catch (e) { 
    Logger.log(e); 
    return []; 
  } 
} 

/**
 * Membuat file PDF berisi label QR Code dari daftar item yang diberikan.
 * @param {Array<Object>} itemsToPrint Daftar item yang akan dicetak.
 * @returns {Object} Objek berisi data PDF dalam format base64.
 */
function generateQRCodePdf(itemsToPrint) {
  try {
    if (!itemsToPrint || itemsToPrint.length === 0) {
      throw new Error("Tidak ada item yang dipilih untuk dicetak.");
    }

    // Membangun string HTML untuk semua label
    let labelsHtml = '';
    itemsToPrint.forEach(item => {
      const qrData = `${item.kodeBarang}-${item.noBatch}`; // Data yang akan disimpan di dalam QR Code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

      // --- PERUBAHAN UTAMA ADA DI SINI ---
      
      // 1. Ambil data gambar dari URL menggunakan UrlFetchApp
      const imageBlob = UrlFetchApp.fetch(qrUrl).getBlob();
      
      // 2. Ubah data gambar menjadi format Base64
      const base64Image = Utilities.base64Encode(imageBlob.getBytes());
      
      // 3. Buat Data URI untuk disematkan di HTML (format: data:[tipe_mime];base64,[data_base64])
      const embeddedImageSrc = `data:${imageBlob.getContentType()};base64,${base64Image}`;
      
      // 4. Gunakan Data URI di dalam tag <img>, bukan URL eksternal
      labelsHtml += `
  <div class="label">
    <div class="top-info">
      <span class="batch">${item.noBatch}</span>
      <span class="ed">ED: ${item.tanggalED}</span>
    </div>
    <img src="${embeddedImageSrc}" />
    <div class="nama-barang">${item.namaBarang}</div>
  </div>
`;
    });

    // Membuat HTML lengkap dengan styling untuk PDF
    const finalHtml = `
      <html>
        <head>
         <style>
  @page { 
    size: A4;
    margin: 0.5cm; 
  }
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }
  body {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start; 
  }
  .label {
    width: 3.8cm;
    height: 3.2cm; /* Tinggi sedikit ditambah untuk nama barang */
    border: 1px solid #ccc;
    text-align: center;
    margin: 2px;
    display: flex;
    flex-direction: column;
    /* Renggangkan konten secara vertikal */
    justify-content: space-between; 
    align-items: center;
    box-sizing: border-box;
    overflow: hidden;
    padding: 1.5mm; /* Beri sedikit padding dalam */
  }
  /* BARU: Style untuk baris atas (Batch & ED) */
  .top-info {
    display: flex;
    justify-content: space-between; /* Buat bersebelahan */
    width: 100%;
  }
  .label .batch { 
    font-size: 7pt; 
    font-weight: bold;
    text-align: left;
  }
  .label .ed { 
    font-size: 7pt; 
    text-align: right;
  }
  .label img { 
    width: 1.8cm; /* Sedikit perkecil gambar */
    height: 1.8cm;
    margin: 1mm 0;
  }
  /* BARU: Style untuk nama barang agar bisa wrap */
  .nama-barang {
    font-size: 6.5pt;
    font-weight: bold;
    line-height: 1.2;
    /* Perintah ajaib untuk memotong kata panjang */
    overflow-wrap: break-word; 
    word-wrap: break-word;
    hyphens: auto;
  }
</style>
        </head>
        <body>
          ${labelsHtml}
        </body>
      </html>
    `;

    const pdfBlob = Utilities.newBlob(finalHtml, MimeType.HTML).getAs(MimeType.PDF).setName('QR_Codes.pdf');
    const pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());

    return { success: true, pdfData: pdfBase64, fileName: 'QR_Codes.pdf' };
  } catch (e) {
    Logger.log(e);
    return { success: false, message: e.message };
  }
}


// ▼▼▼ FUNGSI BARU UNTUK KELOLA AKUN ▼▼▼

/**
 * Mengambil daftar semua pengguna. Hanya bisa diakses oleh Admin.
 * @param {Object} userInfo Objek berisi info pengguna yang login {username, role}.
 * @returns {Array} Daftar pengguna tanpa password.
 */
function getUsers(userInfo) {
  if (userInfo.role !== 'Admin') {
    throw new Error('Akses ditolak. Anda bukan Admin.');
  }
  const ss = getSpreadsheetForCurrentUser();
  const userSheet = ss.getSheetByName('Pengguna');
  if (userSheet.getLastRow() <= 1) return [];

  const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 3).getValues();
  // Mengembalikan data tanpa kolom password untuk keamanan
  return data.map(row => ({ username: row[0], role: row[2] }));
}

/**
 * Menyimpan (menambah atau mengedit) data pengguna. Hanya bisa diakses oleh Admin.
 * @param {Object} userData Data pengguna { originalUsername, newUsername, password, role }.
 * @param {Object} adminInfo Info admin yang melakukan aksi {username, role}.
 * @returns {Object} Hasil operasi.
 */
function saveUser(userData, adminInfo) {
  if (adminInfo.role !== 'Admin') {
    return { success: false, message: 'Akses ditolak.' };
  }

  const { originalUsername, newUsername, password, role } = userData;
  if (!newUsername || !role) {
    return { success: false, message: 'Username dan Role wajib diisi.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Pengguna');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const usernameIndex = headers.indexOf('Username');
    const roleIndex = headers.indexOf('Role'); // Kita butuh index role

    // Cek duplikasi username jika username diubah atau saat menambah user baru
    if (originalUsername !== newUsername) {
      const usernameExists = data.some(row => row[usernameIndex].toString().toLowerCase() === newUsername.toLowerCase());
      if (usernameExists) {
        return { success: false, message: `Username "${newUsername}" sudah digunakan.` };
      }
    }

    // Mode Edit
    if (originalUsername) {
      for (let i = 0; i < data.length; i++) {
        if (data[i][usernameIndex].toString().toLowerCase() === originalUsername.toLowerCase()) {
           const isLastAdmin = (data[i][roleIndex] === 'Admin') && (countAdmins(sheet) <= 1);
          if (isLastAdmin && role !== 'Admin') {
            return { success: false, message: "Gagal. Tidak dapat mengubah role dari Admin terakhir." };
          }
          const rowValues = [newUsername, data[i][1], role]; // [Username, Password, Role]
          if (password) { // Hanya update password jika diisi
            rowValues[1] = password;
          }
          sheet.getRange(i + 2, 1, 1, 3).setValues([rowValues]);
          return { success: true, message: `Pengguna ${newUsername} berhasil diperbarui.` };
        }
      }
      return { success: false, message: `Pengguna ${originalUsername} tidak ditemukan.` };
    } 
    // Mode Tambah
    else {
      if (!password) return { success: false, message: 'Password wajib diisi untuk pengguna baru.' };
      sheet.appendRow([newUsername, password, role]);
      return { success: true, message: `Pengguna ${newUsername} berhasil ditambahkan.` };
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus pengguna. Hanya bisa diakses oleh Admin.
 * @param {string} usernameToDelete Username yang akan dihapus.
 * @param {Object} adminInfo Info admin yang melakukan aksi {username, role}.
 * @returns {Object} Hasil operasi.
 */
function deleteUser(usernameToDelete, adminInfo) {
  if (adminInfo.role !== 'Admin') {
    return { success: false, message: 'Akses ditolak.' };
  }
  if (usernameToDelete.toLowerCase() === adminInfo.username.toLowerCase()) {
    return { success: false, message: 'Anda tidak bisa menghapus akun Anda sendiri.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Pengguna');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // ▼▼▼ PERUBAHAN 1: Ambil semua data untuk bisa cek role ▼▼▼
    const dataWithHeaders = sheet.getDataRange().getValues();
    const headers = dataWithHeaders.shift(); // Ambil baris header
    const usernameIndex = headers.indexOf('Username');
    const roleIndex = headers.indexOf('Role');
    // ▲▲▲ AKHIR PERUBAHAN 1 ▲▲▲


    // ▼▼▼ PERUBAHAN 2: Logika pengecekan Admin terakhir ▼▼▼
    const userToDeleteData = dataWithHeaders.find(row => row[usernameIndex].toString().toLowerCase() === usernameToDelete.toLowerCase());
    if (userToDeleteData && userToDeleteData[roleIndex] === 'Admin' && countAdmins(sheet) <= 1) {
      return { success: false, message: "Gagal. Tidak dapat menghapus Admin terakhir." };
    }
    // ▲▲▲ AKHIR PERUBAHAN 2 ▲▲▲


    // Logika penghapusan baris tetap sama
    const dataRowsOnly = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = dataRowsOnly.length - 1; i >= 0; i--) {
      if (dataRowsOnly[i][0].toString().toLowerCase() === usernameToDelete.toLowerCase()) {
        sheet.deleteRow(i + 2);
        return { success: true, message: `Pengguna ${usernameToDelete} berhasil dihapus.` };
      }
    }
    return { success: false, message: 'Pengguna tidak ditemukan.' };
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengganti password untuk pengguna yang sedang login.
 * @param {string} newPassword Password baru.
 * @param {Object} userInfo Info pengguna yang login {username, role}.
 * @returns {Object} Hasil operasi.
 */
function changeOwnPassword(newPassword, userInfo) {
  if (!newPassword) {
    return { success: false, message: 'Password baru tidak boleh kosong.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  const sheet = ss.getSheetByName('Pengguna');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const usernameIndex = headers.indexOf('Username');
    const passwordIndex = headers.indexOf('Password');

    for (let i = 0; i < data.length; i++) {
      if (data[i][usernameIndex].toString().toLowerCase() === userInfo.username.toLowerCase()) {
        sheet.getRange(i + 2, passwordIndex + 1).setValue(newPassword);
        return { success: true, message: 'Password berhasil diubah.' };
      }
    }
    return { success: false, message: 'Terjadi kesalahan, pengguna tidak ditemukan.' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Meneruskan permintaan aktivasi lisensi dari klien ke Server Lisensi Pusat.
 * @param {string} serialNumber Nomor seri yang diinput pengguna.
 * @returns {object} Respons JSON dari server lisensi.
 */
function activateLicenseOnServer(serialNumber) {
  try {
    const adminEmail = Session.getEffectiveUser().getEmail();
    const spreadsheetId = PropertiesService.getUserProperties().getProperty(CONFIG.SPREADSHEET_ID_KEY);
    
    if (!adminEmail || !spreadsheetId) {
      return { success: false, message: "Informasi pengguna tidak ditemukan." };
    }

    const requestPayload = {
      action: 'activate',
      payload: {
        serialNumber: serialNumber,
        userEmail: adminEmail,
        spreadsheetId: spreadsheetId
      }
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(requestPayload)
    };

    const response = UrlFetchApp.fetch(LICENSE_SERVER_URL, options);
    const result = JSON.parse(response.getContentText());
    
    // Jika aktivasi di server berhasil, simpan nomor seri di Pengaturan klien.
    if (result.status === 'SUCCESS') {
      saveSettings({ 'License Key': serialNumber });
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message };
    }

  } catch (e) {
    Logger.log("LICENSE ACTIVATION FAILED: " + e.toString());
    return { success: false, message: 'Gagal terhubung ke server lisensi. Periksa koneksi dan coba lagi.' };
  }
}

/**
 * Mengambil data real-time (stok & harga jual) untuk satu item spesifik.
 * @param {string} kodeBarang Kode barang yang akan dicek.
 * @param {string} noBatch Nomor batch yang akan dicek.
 * @returns {object} Objek berisi status, stok, dan harga jual terbaru.
 */
function getRealtimeItemData(kodeBarang, noBatch) {
  try {
    const ss = getSpreadsheetForCurrentUser();
    const batchSheet = ss.getSheetByName('Batch Stok');
    const stokSheet = ss.getSheetByName('Stok');

    // 1. Cek Stok di 'Batch Stok'
    const batchData = batchSheet.getDataRange().getValues();
    const batchHeaders = batchData.shift();
    const bKodeIndex = batchHeaders.indexOf('Kode Barang');
    const bBatchIndex = batchHeaders.indexOf('No Batch');
    const bJumlahIndex = batchHeaders.indexOf('Jumlah');
    const itemRow = batchData.find(row => row[bKodeIndex] === kodeBarang && row[bBatchIndex] === noBatch);

    const currentStock = (itemRow) ? parseInt(itemRow[bJumlahIndex]) || 0 : 0;

    // Jika stok habis, langsung kembalikan hasilnya
    if (currentStock <= 0) {
      return { success: false, stock: 0 };
    }

    // 2. Jika stok ada, cari Harga Jual terbaru di sheet 'Stok'
    const stokData = stokSheet.getDataRange().getValues();
    const stokHeaders = stokData.shift();
    const sKodeIndex = stokHeaders.indexOf('Kode Barang');
    const sHargaJualIndex = stokHeaders.indexOf('Harga Jual');
    const masterProduk = stokData.find(row => row[sKodeIndex] === kodeBarang);
    
    const currentHarga = (masterProduk) ? parseFloat(masterProduk[sHargaJualIndex]) || 0 : 0;

    // 3. Kembalikan semua data terbaru
    return { success: true, stock: currentStock, hargaJual: currentHarga };

  } catch (e) {
    Logger.log(e);
    return { success: false, stock: 0, message: e.message };
  }
}




/**
 * Helper internal untuk MENGHAPUS/MENGINVALIDASI cache produk.
 * Fungsi ini akan dipanggil setiap kali ada perubahan stok.
 */
function _invalidateProductCache() {
  try {
    const cache = CacheService.getScriptCache();
    const manifestJson = cache.get(PRODUCT_CACHE_MANIFEST_KEY);

    if (manifestJson) {
      const chunkKeys = JSON.parse(manifestJson);
      // Hapus semua chunk data beserta manifestnya
      cache.removeAll([...chunkKeys, PRODUCT_CACHE_MANIFEST_KEY]);
      Logger.log(`Cache produk berhasil diinvalidasi. Menghapus kunci: ${[...chunkKeys, PRODUCT_CACHE_MANIFEST_KEY].join(', ')}`);
    }
  } catch (e) {
    Logger.log(`Gagal menginvalidasi cache: ${e.message}`);
  }
}

/**
 * Helper internal untuk mengambil SEMUA produk yang siap jual dari Google Sheet.
 * Logika ini diekstrak dari fungsi getProdukUntukPenjualan().
 * @returns {Array<Object>} Array berisi semua produk yang memiliki stok.
 */
function _getAllSellableProducts() {
    const ss = getSpreadsheetForCurrentUser();
    const stokSheet = ss.getSheetByName('Stok');
    if (stokSheet.getLastRow() <= 1) return [];

    const stokData = stokSheet.getRange(2, 1, stokSheet.getLastRow() - 1, 4).getValues();
    const stokMap = stokData.reduce((map, row) => {
      map[row[0]] = { nama: row[1], hargaJual: row[3], hargaBeli: row[2] };
      return map;
    }, {});

    const batchSheet = ss.getSheetByName('Batch Stok');
    if (batchSheet.getLastRow() <= 1) return [];

    const batchData = batchSheet.getRange(2, 1, batchSheet.getLastRow() - 1, batchSheet.getLastColumn()).getValues();
    const batchHeaders = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0];
    const kodeIndex = batchHeaders.indexOf('Kode Barang');
    const batchIndex = batchHeaders.indexOf('No Batch');
    const jumlahIndex = batchHeaders.indexOf('Jumlah');

    const availableProducts = batchData
      .filter(row => (parseInt(row[jumlahIndex]) || 0) > 0)
      .map(row => {
        const kodeBarang = row[kodeIndex];
        const detailStok = stokMap[kodeBarang];
        if (!detailStok) return null;
        return {
          kodeBarang: kodeBarang,
          namaBarang: detailStok.nama,
          noBatch: row[batchIndex],
          hargaJual: detailStok.hargaJual,
          hargaBeli: detailStok.hargaBeli,
          stokTersedia: parseInt(row[jumlahIndex])
        };
      })
      .filter(Boolean);
      
    return availableProducts;
}


/**
 * Fungsi inti baru: Mengambil data produk dari cache server jika ada, 
 * atau dari sheet jika cache kosong/kedaluwarsa, lalu menyimpannya ke cache.
 * Menangani data besar dengan memecahnya menjadi beberapa bagian (chunking).
 * @returns {Array<Object>} Array berisi semua produk yang siap jual.
 */
function _getProductsFromCacheOrSheet() {
  const cache = CacheService.getScriptCache();
  const manifestJson = cache.get(PRODUCT_CACHE_MANIFEST_KEY);

  // 1. JIKA CACHE ADA (Manifest ditemukan)
  if (manifestJson) {
    Logger.log("Mengambil produk dari CACHE.");
    const chunkKeys = JSON.parse(manifestJson);
    const cachedChunks = cache.getAll(chunkKeys);
    let combinedJson = '';
    
    // Gabungkan kembali semua potongan JSON
    for (const key of chunkKeys) {
        if (cachedChunks[key]) {
            combinedJson += cachedChunks[key];
        }
    }
    return JSON.parse(combinedJson);
  }

  // 2. JIKA CACHE KOSONG (Baca dari Sheet dan simpan ke cache)
  Logger.log("Mengambil produk dari SHEET dan menyimpan ke cache.");
  const allProducts = _getAllSellableProducts();
  const allProductsJson = JSON.stringify(allProducts);

  const MAX_CHUNK_SIZE = 90 * 1024; // 90 KB untuk keamanan (batasnya 100KB)
  const totalSize = allProductsJson.length;
  const numChunks = Math.ceil(totalSize / MAX_CHUNK_SIZE);
  
  const puts = {};
  const chunkKeys = [];

  for (let i = 0; i < numChunks; i++) {
    const chunkKey = `${PRODUCT_CACHE_KEY_PREFIX}${i}`;
    chunkKeys.push(chunkKey);
    const chunk = allProductsJson.substring(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
    puts[chunkKey] = chunk;
  }
  
  // Simpan daftar semua kunci chunk ke dalam manifest
  puts[PRODUCT_CACHE_MANIFEST_KEY] = JSON.stringify(chunkKeys);

  // Simpan semua ke cache dengan durasi 10 menit (600 detik)
  cache.putAll(puts, 600);
  
  return allProducts;
}

/**
 * Mengambil detail stok (jumlah) untuk beberapa batch sekaligus.
 * @param {Array<Object>} items Array berisi objek {kodeBarang, noBatch}.
 * @returns {Object} Objek pemetaan 'kode|||batch' -> jumlah stok.
 */
function getBatchStokDetails(items) {
  if (!items || items.length === 0) return {};
  const ss = getSpreadsheetForCurrentUser();
  const batchSheet = ss.getSheetByName('Batch Stok');
  if (batchSheet.getLastRow() <= 1) return {};

  const batchData = batchSheet.getDataRange().getValues();
  const headers = batchData.shift();
  const bKodeIndex = headers.indexOf('Kode Barang');
  const bBatchIndex = headers.indexOf('No Batch');
  const bJumlahIndex = headers.indexOf('Jumlah');

  const stokMap = {};
  items.forEach(item => {
    // Menangani properti PascalCase (dari originalCart) dan camelCase (dari updatedCart)
    const kode = item.kodeBarang || item.KodeBarang;
    const batch = item.noBatch || item.NoBatch;
    const key = `${kode}|||${batch}`;
    stokMap[key] = 0; // Inisialisasi dengan 0
  });

  batchData.forEach(row => {
    const key = `${row[bKodeIndex]}|||${row[bBatchIndex]}`;
    if (stokMap.hasOwnProperty(key)) {
      stokMap[key] = parseInt(row[bJumlahIndex]) || 0;
    }
  });

  return stokMap;
}

/**
 * Menghitung dan mengembalikan persentase penggunaan sel Spreadsheet.
 * Batas Keras Google Sheets adalah 10,000,000 sel.
 * @returns {Object} {success: boolean, data: {usedCells: number, percentage: number, limitStatus: string, warningLevel: string}}
 */
function getSpreadsheetUsage() {
  const HARD_LIMIT = 5000000; // Batas Keras Google Sheets
  // VVV PERBAIKAN DILAKUKAN DI SINI VVV
  const ss = getSpreadsheetForCurrentUser(); 
  // ^^^ GUNAKAN FUNGSI INI KARENA KODE DIJALANKAN DARI WEB APP ^^^

  // Jika kode Anda menggunakan 'getActiveSpreadsheet' di atas, gantilah.
  if (!ss) {
    return { success: false, message: "Gagal terhubung ke Spreadsheet." };
  }

  const allSheets = ss.getSheets();
  let totalUsedCells = 0;
  let totalRowsUsed = 0;

  // Loop melalui semua sheet untuk menghitung total sel dan total baris
  allSheets.forEach(sheet => {
    const maxCols = sheet.getLastColumn();
    const maxRows = sheet.getLastRow();
    
    totalUsedCells += maxCols * maxRows; 
    totalRowsUsed += maxRows;
  });
  
  // Hitung persentase penggunaan
  const usagePercentage = (totalUsedCells / HARD_LIMIT) * 100;
  
  // Ambil nilai baris maksimum di sheet-sheet kritis
  const penjualanSheet = ss.getSheetByName('Penjualan');
  const pembelianSheet = ss.getSheetByName('Pembelian');
  const batchStokSheet = ss.getSheetByName('Batch Stok');
  
  // Menyiapkan string indikator kinerja (limitStatus)
  const penjualanRows = penjualanSheet ? penjualanSheet.getLastRow().toLocaleString() : 0;
  const pembelianRows = pembelianSheet ? pembelianSheet.getLastRow().toLocaleString() : 0;
  const batchRows = batchStokSheet ? batchStokSheet.getLastRow().toLocaleString() : 0;
  
  return {
    success: true,
    data: {
      usedCells: totalUsedCells,
      percentage: parseFloat(usagePercentage.toFixed(2)),
      limitStatus: `Total Rows: ${totalRowsUsed.toLocaleString()} | Pjln: ${penjualanRows} | Beli: ${pembelianRows} | Batch: ${batchRows}`,
      warningLevel: usagePercentage > 50 ? 'HIGH' : usagePercentage > 10 ? 'MEDIUM' : 'LOW'
    }
  };
}


/**
 * Menghapus item dari sheet 'Barang Dicari' berdasarkan ID.
 * Biasanya dipanggil dari tombol hapus di tab Draft Order.
 * @param {string} id ID barang yang akan dihapus dari 'Barang Dicari'.
 * @returns {Object} Hasil operasi { success: boolean, message: string }.
 */
function hapusDraftOrderItem(id) {
  if (!id) {
    return { success: false, message: 'ID item tidak valid.' };
  }

  const ss = getSpreadsheetForCurrentUser();
  if (!ss) return { success: false, message: 'Spreadsheet tidak ditemukan.'}; // Tambahkan cek Spreadsheet

  const sheet = ss.getSheetByName('Barang Dicari');
  if (!sheet) return { success: false, message: 'Sheet "Barang Dicari" tidak ditemukan.'}; // Tambahkan cek Sheet

  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // Tunggu hingga 15 detik jika ada proses lain

  try {
    // Periksa apakah sheet memiliki data (minimal header)
    if (sheet.getLastRow() < 2) {
         return { success: false, message: 'Item tidak ditemukan (sheet kosong).' };
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues(); // Mulai dari baris 2
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('ID');

    if (idIndex === -1) {
         return { success: false, message: 'Kolom "ID" tidak ditemukan di sheet "Barang Dicari".' };
    }

    for (let i = data.length - 1; i >= 0; i--) { // Loop dari bawah ke atas
      if (data[i][idIndex] === id) {
        sheet.deleteRow(i + 2); // +2 karena index 0-based dan ada header
        Logger.log(`Item draft dengan ID ${id} berhasil dihapus.`);
        return { success: true, message: 'Item berhasil dihapus dari draft.' };
      }
    }

    // Jika loop selesai tanpa menemukan ID
    return { success: false, message: 'Item tidak ditemukan untuk dihapus.' };

  } catch (e) {
    Logger.log(`Error saat menghapus item draft (ID: ${id}): ${e.toString()}`);
    return { success: false, message: 'Terjadi kesalahan saat menghapus: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}
