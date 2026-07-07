/**
 * Utility functions untuk format rupiah
 * Digunakan untuk menampilkan dan mem-parse input uang dalam format rupiah
 */

/**
 * Format angka menjadi format rupiah Indonesia
 * @param {number|string} value - Nilai yang akan diformat
 * @returns {string} String dalam format rupiah (contoh: "Rp 1.000.000")
 */
export const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "" || isNaN(value))
    return "";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numValue);
};

/**
 * Parse string format rupiah menjadi angka
 * @param {string} str - String yang akan di-parse (contoh: "Rp 1.000.000" atau "1000000")
 * @returns {number} Angka yang sudah di-parse (contoh: 1000000)
 */
export const parseRupiah = (str) => {
  if (!str || str === "") return 0;
  // Hapus semua karakter selain angka
  const onlyDigits = str.toString().replace(/[^0-9]/g, "");
  return onlyDigits ? parseInt(onlyDigits, 10) : 0;
};
