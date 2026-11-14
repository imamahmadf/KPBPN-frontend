import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { selectRoleIds } from "../../Redux/Reducers/auth";
import {
  formatJumlah,
  formatRupiah,
  formatTanggal,
  getFotoUrl,
  statusColor,
  ambilDokumenPengajuan,
  unduhDokumenPengajuan,
  unduhBlobDokumen,
  bacaErrorUnduhan,
} from "../../lib/pengajuanBarjas";
import ModalPratinjauPengajuan from "./ModalPratinjauPengajuan";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const ROLE_PENGAJUAN = {
  SUPERVISOR: 6,
  GENERAL_AFFAIR: 7,
  GENERAL_MANAGER: 9,
};
const ROLE_PENGUBAH = [1, 2];
const ROLE_HARGA = [4, 7];
const ROLE_STATUS_ITEM = [1, 2, 4, 7];
const STATUS_BARCODE = ["Disetujui", "Diproses", "Selesai"];
const STATUS_SIAP_BELI = STATUS_BARCODE;

const Info = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1}>
      {label}
    </Text>
    <Text>{children || "-"}</Text>
  </Box>
);

function DetailPengajuan({ match }) {
  const pengajuanId = match.params.id;
  const history = useHistory();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const roleIds = (useSelector(selectRoleIds) || []).map(Number);
  const bolehMengubahData = roleIds.some((id) => ROLE_PENGUBAH.includes(id));
  const bolehMengetahui = roleIds.includes(ROLE_PENGAJUAN.SUPERVISOR);
  const bolehMenyetujui = roleIds.includes(ROLE_PENGAJUAN.GENERAL_MANAGER);
  const bolehStatus = roleIds.includes(ROLE_PENGAJUAN.GENERAL_AFFAIR);
  const [data, setData] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [statusId, setStatusId] = useState("");
  const [mengetahuiId, setMengetahuiId] = useState("");
  const [menyetujuiId, setMenyetujuiId] = useState("");
  const [alasan, setAlasan] = useState("");
  const [harga, setHarga] = useState({});
  const [estimasi, setEstimasi] = useState({});
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingMengetahui, setIsSavingMengetahui] = useState(false);
  const [isSavingMenyetujui, setIsSavingMenyetujui] = useState(false);
  const [isSavingHarga, setIsSavingHarga] = useState(false);
  const [isSavingEstimasi, setIsSavingEstimasi] = useState(false);
  const [menyimpanItemId, setMenyimpanItemId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [daftarItemId, setDaftarItemId] = useState(null);
  const [loadingCetak, setLoadingCetak] = useState({});
  const [previewPdf, setPreviewPdf] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const [loadingBarcode, setLoadingBarcode] = useState(false);

  const muat = async () => {
    const [detailRes, seedRes] = await Promise.all([
      axios.get(`${API_BASE}/pengajuan-barjas/detail/${pengajuanId}`),
      axios.get(`${API_BASE}/pengajuan-barjas/seed`),
    ]);
    const result = detailRes.data.result;
    setData(result);
    setStatusOptions(seedRes.data.status || []);
    setSupervisorOptions(seedRes.data.supervisor || []);
    setManagerOptions(seedRes.data.generalManager || []);
    setStatusId(String(result.statusPengajuanKpbpnId || ""));
    setMengetahuiId(result.mengetahuiId ? String(result.mengetahuiId) : "");
    setMenyetujuiId(result.menyetujuiId ? String(result.menyetujuiId) : "");
    setAlasan(result.alasanPenolakan || "");
    const nextHarga = {};
    const nextEstimasi = {};
    (result.itemPengajuanBarjasKpbpns || []).forEach((item) => {
      nextHarga[item.id] = item.hargaAktual ?? "";
      nextEstimasi[item.id] = item.estimasiHarga ?? "";
    });
    setHarga(nextHarga);
    setEstimasi(nextEstimasi);
  };

  useEffect(() => {
    muat().catch((err) => {
      toast({
        title: "Gagal memuat pengajuan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    });
  }, [pengajuanId]);

  const statusNama = data?.statusPengajuanKpbpn?.nama;
  const barcodeAktif = STATUS_BARCODE.includes(statusNama);
  const siapBeli = STATUS_SIAP_BELI.includes(statusNama);
  const bolehHarga = siapBeli && roleIds.some((id) => ROLE_HARGA.includes(id));
  const bolehStatusItem =
    siapBeli && roleIds.some((id) => ROLE_STATUS_ITEM.includes(id));

  useEffect(() => {
    if (!barcodeAktif) {
      setBarcode(null);
      return undefined;
    }

    let batal = false;
    setLoadingBarcode(true);
    axios
      .get(`${API_BASE}/pengajuan-barjas/qrcode/${pengajuanId}`)
      .then((res) => {
        if (!batal) setBarcode(res.data);
      })
      .catch(() => {
        if (!batal) setBarcode(null);
      })
      .finally(() => {
        if (!batal) setLoadingBarcode(false);
      });

    return () => {
      batal = true;
    };
  }, [barcodeAktif, pengajuanId, statusNama]);

  const statusTerpilih = statusOptions.find(
    (status) => String(status.id) === String(statusId),
  );
  const items = data?.itemPengajuanBarjasKpbpns || [];
  const adaEstimasi = items.some(
    (item) => item.estimasiHarga != null && item.estimasiHarga !== "",
  );
  const totalEstimasi = items.reduce(
    (sum, item) => sum + Number(item.jumlah) * Number(item.estimasiHarga || 0),
    0,
  );
  const totalEstimasiInput = items.reduce((sum, item) => {
    const nilai = estimasi[item.id];
    if (nilai === "" || nilai == null) return sum;
    return (
      sum +
      Number(item.jumlah) *
        Number(String(nilai).replace(/[^\d]/g, "") || 0)
    );
  }, 0);
  const totalAktual = items.reduce((sum, item) => {
    const nilai = harga[item.id];
    if (nilai === "" || nilai == null) return sum;
    return sum + Number(item.jumlah) * Number(String(nilai).replace(/[^\d]/g, "") || 0);
  }, 0);

  const simpanPenandatangan = async (jenis) => {
    const adalahMengetahui = jenis === "mengetahui";
    const setLoading = adalahMengetahui ? setIsSavingMengetahui : setIsSavingMenyetujui;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/${jenis}/${pengajuanId}`,
        adalahMengetahui
          ? { mengetahuiId: mengetahuiId || null }
          : { menyetujuiId: menyetujuiId || null },
      );
      setData(res.data.result);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: adalahMengetahui ? "Gagal menyimpan mengetahui" : "Gagal menyimpan menyetujui",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const simpanStatus = async () => {
    setIsSavingStatus(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/status/${pengajuanId}`,
        {
          statusPengajuanKpbpnId: statusId,
          alasanPenolakan: alasan,
        },
      );
      setData(res.data.result);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal mengubah status",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const simpanEstimasi = async () => {
    setIsSavingEstimasi(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/estimasi/${pengajuanId}`,
        {
          items: items.map((item) => ({
            id: item.id,
            estimasiHarga: estimasi[item.id],
          })),
        },
      );
      setData(res.data.result);
      const nextEstimasi = {};
      (res.data.result?.itemPengajuanBarjasKpbpns || []).forEach((item) => {
        nextEstimasi[item.id] = item.estimasiHarga ?? "";
      });
      setEstimasi(nextEstimasi);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan estimasi",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingEstimasi(false);
    }
  };

  const simpanHarga = async () => {
    setIsSavingHarga(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/harga/${pengajuanId}`,
        {
          items: items.map((item) => ({
            id: item.id,
            hargaAktual: harga[item.id],
          })),
        },
      );
      setData(res.data.result);
      const nextHarga = {};
      (res.data.result?.itemPengajuanBarjasKpbpns || []).forEach((item) => {
        nextHarga[item.id] = item.hargaAktual ?? "";
      });
      setHarga(nextHarga);
      setStatusId(String(res.data.result?.statusPengajuanKpbpnId || ""));
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan harga",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingHarga(false);
    }
  };

  const ubahStatusItem = async (item, statusBeli) => {
    if (statusBeli === item.statusBeli) return;
    if (statusBeli === "dibeli" && (item.hargaAktual == null || item.hargaAktual === "")) {
      toast({
        title: "Harga aktual belum diisi",
        description: "Simpan harga aktual item ini sebelum menandai sudah dibeli.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setMenyimpanItemId(item.id);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/status-item/${pengajuanId}`,
        { itemId: item.id, statusBeli },
      );
      setData(res.data.result);
      setStatusId(String(res.data.result?.statusPengajuanKpbpnId || ""));
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal mengubah status item",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setMenyimpanItemId(null);
    }
  };

  const hapus = async () => {
    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/pengajuan-barjas/delete/${pengajuanId}`);
      toast({
        title: "Pengajuan dihapus",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      history.push("/pengajuan/daftar");
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const daftarkanItem = async (itemId) => {
    setDaftarItemId(itemId);
    try {
      const res = await axios.post(`${API_BASE}/pengajuan-barjas/barang-jasa/daftarkan`, {
        itemPengajuanId: itemId,
      });
      await muat();
      toast({
        title: "Item didaftarkan",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal mendaftarkan item",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDaftarItemId(null);
    }
  };

  const unduhBarcode = () => {
    if (!barcode?.qrCode) return;
    const link = document.createElement("a");
    link.href = barcode.qrCode;
    link.download = barcode.fileName || "barcode-pengajuan.png";
    link.click();
  };

  const cetak = async (format) => {
    setLoadingCetak((prev) => ({ ...prev, [format]: true }));
    try {
      await unduhDokumenPengajuan(pengajuanId, format, data?.nomor);
      toast({
        title: "Berhasil",
        description: `Dokumen pengajuan ${format === "docx" ? "Word" : "PDF"} berhasil diunduh`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal mengunduh",
        description: await bacaErrorUnduhan(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCetak((prev) => ({ ...prev, [format]: false }));
    }
  };

  const lihatPdf = async () => {
    setLoadingCetak((prev) => ({ ...prev, preview: true }));
    try {
      const { blob, fileName } = await ambilDokumenPengajuan(
        pengajuanId,
        "pdf",
        data?.nomor,
      );
      const url = window.URL.createObjectURL(blob);
      setPreviewPdf((prev) => {
        if (prev?.url) window.URL.revokeObjectURL(prev.url);
        return { url, blob, fileName };
      });
    } catch (err) {
      toast({
        title: "Gagal membuka PDF",
        description: await bacaErrorUnduhan(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCetak((prev) => ({ ...prev, preview: false }));
    }
  };

  const tutupPreview = () => {
    setPreviewPdf((prev) => {
      if (prev?.url) window.URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="6xl">
          <HStack justify="space-between" mb={6} align="start" wrap="wrap">
            <Box>
              <Heading size="lg">{data?.nomor || "Detail Pengajuan"}</Heading>
              <HStack mt={2} spacing={2}>
                <Badge colorScheme={data?.level === "urgent" ? "red" : "gray"}>
                  {data?.level === "urgent" ? "Urgent" : "Normal"}
                </Badge>
                <Badge colorScheme={statusColor(data?.statusPengajuanKpbpn?.nama)}>
                  {data?.statusPengajuanKpbpn?.nama || "-"}
                </Badge>
              </HStack>
            </Box>
            <HStack wrap="wrap">
              <Button variant="outline" onClick={() => history.push("/pengajuan/daftar")}>
                Kembali
              </Button>
              {data && (
                <>
                  <Button
                    variant="outline"
                    colorScheme="orange"
                    isLoading={loadingCetak.preview}
                    onClick={lihatPdf}
                  >
                    Lihat PDF
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="orange"
                    isLoading={loadingCetak.pdf}
                    onClick={() => cetak("pdf")}
                  >
                    Unduh PDF
                  </Button>
                  <Button
                    variant="outline"
                    isLoading={loadingCetak.docx}
                    onClick={() => cetak("docx")}
                  >
                    Unduh Word
                  </Button>
                  {bolehMengubahData && (
                    <Button
                      as={Link}
                      to={`/pengajuan/edit/${data.id}`}
                      colorScheme="orange"
                      variant="outline"
                    >
                      Ubah
                    </Button>
                  )}
                </>
              )}
              {bolehMengubahData && data?.statusPengajuanKpbpn?.nama === "Diajukan" && (
                <Button colorScheme="red" variant="outline" onClick={onOpen}>
                  Hapus
                </Button>
              )}
            </HStack>
          </HStack>

          {!data ? (
            <Text>Memuat data...</Text>
          ) : (
            <Stack spacing={4}>
              <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 3, md: 5 }}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                  <Info label="Tanggal">{formatTanggal(data.tanggal)}</Info>
                  <Info label="Tanggal dibutuhkan">
                    {formatTanggal(data.tanggalDibutuhkan)}
                  </Info>
                  <Info label="Jenis">
                    <Text textTransform="capitalize">{data.jenis}</Text>
                  </Info>
                  <Info label="Pemohon">{data.userKPBPN?.nama}</Info>
                  {bolehMengetahui ? (
                    <FormControl>
                      <FormLabel>Mengetahui</FormLabel>
                      <Select
                        value={mengetahuiId}
                        placeholder="Pilih supervisor"
                        onChange={(e) => setMengetahuiId(e.target.value)}
                      >
                        {supervisorOptions.map((pengguna) => (
                          <option key={pengguna.id} value={pengguna.id}>
                            {pengguna.nama}
                          </option>
                        ))}
                      </Select>
                      {!supervisorOptions.length && (
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Belum ada user dengan role Supervisor.
                        </Text>
                      )}
                      <Button
                        mt={2}
                        size="sm"
                        colorScheme="orange"
                        isLoading={isSavingMengetahui}
                        onClick={() => simpanPenandatangan("mengetahui")}
                      >
                        Simpan Mengetahui
                      </Button>
                    </FormControl>
                  ) : (
                    <Info label="Mengetahui">{data.mengetahui?.nama || "-"}</Info>
                  )}
                  {bolehMenyetujui ? (
                    <FormControl>
                      <FormLabel>Menyetujui</FormLabel>
                      <Select
                        value={menyetujuiId}
                        placeholder="Pilih general manager"
                        onChange={(e) => setMenyetujuiId(e.target.value)}
                      >
                        {managerOptions.map((pengguna) => (
                          <option key={pengguna.id} value={pengguna.id}>
                            {pengguna.nama}
                          </option>
                        ))}
                      </Select>
                      {!managerOptions.length && (
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Belum ada user dengan role General Manager.
                        </Text>
                      )}
                      <Button
                        mt={2}
                        size="sm"
                        colorScheme="orange"
                        isLoading={isSavingMenyetujui}
                        onClick={() => simpanPenandatangan("menyetujui")}
                      >
                        Simpan Menyetujui
                      </Button>
                    </FormControl>
                  ) : (
                    <Info label="Menyetujui">{data.menyetujui?.nama || "-"}</Info>
                  )}
                  <Info label="Lokasi penggunaan">{data.lokasi}</Info>
                  {data.statusPengajuanKpbpn?.nama === "Diajukan" && (
                    <Box gridColumn={{ md: "1 / -1" }}>
                      <Info label="Persetujuan">
                        {`Mengetahui ${
                          data.waktuSetujuMengetahui ? "sudah" : "belum"
                        } menyetujui. Menyetujui ${
                          data.waktuSetujuMenyetujui ? "sudah" : "belum"
                        } menyetujui. Status menjadi Disetujui setelah keduanya menyetujui.`}
                      </Info>
                    </Box>
                  )}
                  {data.jenis === "barang" &&
                    ["Disetujui", "Diproses", "Selesai"].includes(
                      data.statusPengajuanKpbpn?.nama,
                    ) && (
                      <Info label="Stok">
                        Barang pada pengajuan ini sudah masuk ke stok item.
                      </Info>
                    )}
                  <Info label="Total estimasi">
                    {adaEstimasi ? formatRupiah(totalEstimasi) : "-"}
                  </Info>
                  <Box gridColumn={{ md: "1 / -1" }}>
                    <Info label="Keperluan">{data.keperluan}</Info>
                  </Box>
                  <Box gridColumn={{ md: "1 / -1" }}>
                    <Info label="Catatan">{data.catatan}</Info>
                  </Box>
                  {data.alasanPenolakan && (
                    <Box gridColumn={{ md: "1 / -1" }}>
                      <Info label="Alasan penolakan">{data.alasanPenolakan}</Info>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>

              {barcodeAktif && (
                <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 3, md: 5 }}>
                  <Heading size="sm" mb={1}>
                    QR Code
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    QR Code dibuat saat pengajuan disetujui. Pindai untuk
                    memeriksa keaslian. Kode yang sama tercetak pada PDF dan
                    Word selama status Disetujui, Diproses, atau Selesai.
                  </Text>
                  {loadingBarcode ? (
                    <Spinner size="sm" />
                  ) : barcode?.qrCode ? (
                    <Stack spacing={3} align="flex-start">
                      <Image
                        src={barcode.qrCode}
                        alt="QR Code pengajuan"
                        boxSize="180px"
                        borderWidth="1px"
                        borderRadius="md"
                      />
                      <Text fontSize="sm" color="gray.600">
                        Kode: {barcode.kode}
                      </Text>
                      <Button size="sm" variant="outline" onClick={unduhBarcode}>
                        Unduh QR Code
                      </Button>
                    </Stack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      QR Code belum dapat ditampilkan.
                    </Text>
                  )}
                </Box>
              )}

              {bolehStatus && (
                <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 3, md: 5 }}>
                  <Heading size="sm" mb={4}>
                    Ubah status
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.nama}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    {statusTerpilih?.nama === "Ditolak" && (
                      <FormControl isRequired>
                        <FormLabel>Alasan penolakan</FormLabel>
                        <Textarea
                          value={alasan}
                          onChange={(e) => setAlasan(e.target.value)}
                        />
                      </FormControl>
                    )}
                  </SimpleGrid>
                  <Button
                    mt={4}
                    colorScheme="orange"
                    isLoading={isSavingStatus}
                    onClick={simpanStatus}
                  >
                    Simpan Status
                  </Button>
                  <Text fontSize="sm" color="gray.500" mt={3}>
                    Status Disetujui, Diproses, dan Selesai memasukkan barang ke
                    stok dan menampilkan QR Code pada dokumen. Status pembelian
                    per item juga mengubah pengajuan menjadi Diproses atau
                    Selesai.
                  </Text>
                </Box>
              )}

              <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto">
                <Box p={{ base: 3, md: 5 }} pb={0}>
                  <Heading size="sm">Daftar item</Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Estimasi diisi saat pengajuan dibuat. Setelah disetujui,
                    General Affair atau Keuangan mengisi harga aktual. Setelah
                    harga tersimpan, tandai tiap item sudah dibeli atau belum.
                  </Text>
                </Box>
                <Table size="sm" mt={3}>
                  <Thead>
                    <Tr>
                      <Th>Barang / jasa</Th>
                      <Th>Jumlah</Th>
                      <Th>Keterangan</Th>
                      <Th>Foto</Th>
                      <Th isNumeric>Estimasi</Th>
                      <Th>Harga aktual</Th>
                      <Th>Pembelian</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <Text fontWeight="semibold">{item.nama}</Text>
                          {item.spesifikasi && (
                            <Text fontSize="sm" color="gray.500">
                              {item.spesifikasi}
                            </Text>
                          )}
                          {item.barangJasaKpbpnId ? (
                            <Badge mt={1} colorScheme="green">
                              Terdaftar
                            </Badge>
                          ) : (
                            <Button
                              mt={1}
                              size="xs"
                              variant="outline"
                              isLoading={daftarItemId === item.id}
                              onClick={() => daftarkanItem(item.id)}
                            >
                              Daftarkan
                            </Button>
                          )}
                        </Td>
                        <Td>
                          {formatJumlah(item.jumlah)} {item.satuan}
                        </Td>
                        <Td maxW="220px">{item.keterangan || "-"}</Td>
                        <Td>
                          {item.foto ? (
                            <Image
                              src={getFotoUrl(item.foto)}
                              alt={item.nama}
                              boxSize="64px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td isNumeric={bolehStatus ? undefined : true}>
                          {bolehStatus ? (
                            <Input
                              size="sm"
                              inputMode="numeric"
                              value={estimasi[item.id] ?? ""}
                              onChange={(e) =>
                                setEstimasi((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Estimasi satuan"
                            />
                          ) : (
                            formatRupiah(item.estimasiHarga)
                          )}
                        </Td>
                        <Td>
                          {bolehHarga ? (
                            <Input
                              size="sm"
                              inputMode="numeric"
                              value={harga[item.id] ?? ""}
                              onChange={(e) =>
                                setHarga((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Harga satuan"
                            />
                          ) : (
                            <Stack spacing={1}>
                              <Text>{formatRupiah(item.hargaAktual)}</Text>
                              {!siapBeli && (
                                <Text fontSize="xs" color="gray.500">
                                  Diisi setelah disetujui
                                </Text>
                              )}
                            </Stack>
                          )}
                        </Td>
                        <Td>
                          {bolehStatusItem ? (
                            <Stack spacing={1}>
                              <Select
                                size="sm"
                                value={item.statusBeli === "dibeli" ? "dibeli" : "belum"}
                                isDisabled={menyimpanItemId === item.id}
                                onChange={(e) => ubahStatusItem(item, e.target.value)}
                              >
                                <option value="belum">Belum dibeli</option>
                                <option
                                  value="dibeli"
                                  disabled={
                                    item.hargaAktual == null || item.hargaAktual === ""
                                  }
                                >
                                  Sudah dibeli
                                </option>
                              </Select>
                              {(item.hargaAktual == null || item.hargaAktual === "") && (
                                <Text fontSize="xs" color="gray.500">
                                  Simpan harga aktual dulu
                                </Text>
                              )}
                            </Stack>
                          ) : (
                            <Badge colorScheme={item.statusBeli === "dibeli" ? "green" : "gray"}>
                              {item.statusBeli === "dibeli" ? "Sudah dibeli" : "Belum dibeli"}
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                <HStack
                  justify="space-between"
                  align="flex-end"
                  p={{ base: 3, md: 5 }}
                  wrap="wrap"
                  spacing={3}
                >
                  <Stack spacing={1}>
                    <Text fontWeight="semibold">
                      Total estimasi:{" "}
                      {bolehStatus
                        ? items.some(
                            (item) =>
                              estimasi[item.id] !== "" &&
                              estimasi[item.id] != null,
                          )
                          ? formatRupiah(totalEstimasiInput)
                          : "-"
                        : adaEstimasi
                          ? formatRupiah(totalEstimasi)
                          : "-"}
                    </Text>
                    <Text fontWeight="semibold">
                      Total aktual: {formatRupiah(totalAktual)}
                    </Text>
                  </Stack>
                  <HStack>
                    {bolehStatus && (
                      <Button
                        colorScheme="orange"
                        isLoading={isSavingEstimasi}
                        onClick={simpanEstimasi}
                      >
                        Simpan Estimasi
                      </Button>
                    )}
                    {bolehHarga && (
                      <Button
                        colorScheme="orange"
                        variant="outline"
                        isLoading={isSavingHarga}
                        onClick={simpanHarga}
                      >
                        Simpan Harga Aktual
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Box>
            </Stack>
          )}
        </Container>
      </Box>

      <ModalPratinjauPengajuan
        preview={previewPdf}
        onClose={tutupPreview}
        onUnduhPdf={() => {
          if (!previewPdf) return;
          unduhBlobDokumen(previewPdf.blob, previewPdf.fileName);
        }}
        onUnduhWord={() => cetak("docx")}
        isLoadingWord={loadingCetak.docx}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Hapus Pengajuan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Pengajuan {data?.nomor} dan seluruh item di dalamnya akan dihapus.
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button colorScheme="red" isLoading={isDeleting} onClick={hapus}>
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default DetailPengajuan;
