import axios from "axios";

export const parseQrError = (err, fallback) =>
  err.response?.data?.error || err.message || fallback;

export const fetchSumurQrCode = async (apiBase, id, fallbackName) => {
  const res = await axios.get(`${apiBase}/sumur-minyak/get/qrcode/${id}`);
  const data = res.data || {};

  if (!data.qrCode) {
    throw new Error(data.error || "Gagal generate QR Code");
  }

  return {
    objectUrl: data.qrCode,
    fileName: data.fileName || fallbackName,
    kode: data.kode || "",
    path: data.path || (data.kode ? `/qr-sumur/${data.kode}` : ""),
    url: data.url || "",
  };
};

export const downloadObjectUrl = (objectUrl, fileName) => {
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
