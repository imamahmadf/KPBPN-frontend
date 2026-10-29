import axios from "axios";

export const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatTanggal = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return String(value);
  return `${day}-${month}-${year}`;
};

export const formatJumlah = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
  }).format(number);
};

export const getFotoUrl = (filePath) => {
  if (!filePath) return null;
  const base = import.meta.env.VITE_REACT_APP_API_BASE_URL || "";
  return `${base}${filePath}`;
};

export const statusColor = (nama) => {
  if (nama === "Disetujui" || nama === "Selesai") return "green";
  if (nama === "Ditolak") return "red";
  if (nama === "Diproses") return "orange";
  if (nama === "Diajukan") return "blue";
  return "gray";
};

export const buatItemKosong = () => ({
  key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  id: null,
  nama: "",
  spesifikasi: "",
  jumlah: "",
  satuan: "unit",
  keterangan: "",
  estimasiHarga: "",
  barangJasaKpbpnId: null,
  foto: null,
  file: null,
  preview: null,
  hapusFoto: false,
});

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getDownloadFileName = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const utf8Name = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Name?.[1]) {
    try {
      return decodeURIComponent(utf8Name[1]);
    } catch {
      return utf8Name[1];
    }
  }
  const quotedName = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedName?.[1]) return quotedName[1];
  const plainName = contentDisposition.match(/filename=([^;]+)/i);
  return plainName?.[1]?.trim() || fallback;
};

export async function unduhDokumenPengajuan(id, format = "pdf", nomor) {
  const res = await axios.get(`${API_BASE}/pengajuan-barjas/cetak/${id}`, {
    params: { format },
    responseType: "blob",
  });

  const isDocx = format === "docx";
  const mime = isDocx
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";
  const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
  const link = document.createElement("a");
  const fallback = `pengajuan_${nomor || id}.${isDocx ? "docx" : "pdf"}`;
  link.href = url;
  link.setAttribute(
    "download",
    getDownloadFileName(res.headers?.["content-disposition"], fallback),
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function bacaErrorUnduhan(err) {
  if (err?.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      const parsed = JSON.parse(text);
      return parsed.error || "Gagal mengunduh dokumen pengajuan";
    } catch {
      return "Gagal mengunduh dokumen pengajuan";
    }
  }
  return err?.response?.data?.error || "Gagal mengunduh dokumen pengajuan";
}
