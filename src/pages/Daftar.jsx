import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../Componets/Layout";
import ReactPaginate from "react-paginate";
import { BsFileEarmarkArrowDown } from "react-icons/bs";
import "../Style/pagination.css";
import { Link, useHistory } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Image,
  ModalCloseButton,
  Container,
  FormControl,
  FormLabel,
  Center,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Textarea,
  Tooltip,
  Input,
  Spacer,
  useToast,
  useDisclosure,
  useColorMode,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Heading,
  VStack,
  Divider,
  SimpleGrid,
  Spinner,
  Skeleton,
  Checkbox,
} from "@chakra-ui/react";
import { BsEyeFill, BsThreeDotsVertical, BsX } from "react-icons/bs";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../Redux/Reducers/auth";
import Loading from "../Componets/Loading";
import DataKosong from "../Componets/DataKosong";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "moment/locale/id";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Fungsi untuk menghasilkan warna unik dari nama pegawai
function stringToColor(str) {
  if (!str) return "#000000";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function KalenderPerjalanan({ events, colorMode, formats, localizer }) {
  return (
    <Box
      bg={colorMode === "dark" ? "gray.800" : "white"}
      p={{ base: "20px", md: "30px" }}
      borderRadius={"10px"}
      mb={"30px"}
      boxShadow="sm"
      border="1px solid"
      borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
    >
      <Heading
        size="md"
        mb={4}
        color={colorMode === "dark" ? "white" : "gray.700"}
      >
        Kalender Perjalanan Dinas
      </Heading>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        formats={formats}
        popup={false}
        eventPropGetter={(event) => {
          const backgroundColor = stringToColor(event.title || "");
          return {
            style: {
              backgroundColor,
              color: "white",
              borderRadius: "4px",
              border: "none",
            },
          };
        }}
      />
      <style>{`
        .rbc-month-row {
          min-height: 140px !important;
        }
        .rbc-date-cell {
          vertical-align: top !important;
        }
        .rbc-event {
          font-size: 12px;
          padding: 2px 4px;
          cursor: pointer;
        }
        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
        }
        .rbc-today {
          background-color: rgba(55, 176, 134, 0.1) !important;
        }
      `}</style>
    </Box>
  );
}
function Daftar() {
  const [dataPerjalanan, setDataPerjalanan] = useState([]);
  const history = useHistory();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const user = useSelector(userRedux);
  const role = useSelector(selectRole);
  const [selectedPerjalanan, setSelectedPerjalanan] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenCetakSPD,
    onOpen: onOpenCetakSPD,
    onClose: onCloseCetakSPD,
  } = useDisclosure();
  const [selectedPerjalananSPD, setSelectedPerjalananSPD] = useState(null);
  const [jenisKendaraan, setJenisKendaraan] = useState({
    darat: true,
    laut: false,
    udara: false,
  });
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  const resetFilter = () => {
    setTanggalAwal("");
    setTanggalAkhir("");
  };

  const changePage = ({ selected }) => {
    setPage(selected);
  };

  const postNotaDinas = (val) => {
    console.log(val);
    setIsLoading(true);

    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/perjalanan/post/daftar/nota-dinas`,
        {
          indukUnitKerjaId:
            user[0]?.unitKerja_profile?.indukUnitKerja?.id || "",
          pegawai: val?.personils || [],
          dataTtdSurTug: val?.ttdSuratTuga || null,
          dataTtdNotaDinas: val?.ttdNotaDina || null,
          penomoran: user[0]?.unitKerja_profile?.indukUnitKerja?.penomoran,
          tanggalPengajuan: val?.tanggalPengajuan || "",
          noSurTug: val?.noSuratTugas || "",
          noNotDis: val?.noNotaDinas || "",
          isSrikandi: val?.tipeSrikandi,
          isNotaDinas: val?.isNotaDinas,
          subKegiatan: val?.daftarSubKegiatan?.subKegiatan || "",
          untuk: val?.untuk || "",
          dasar: val?.dasar || "",
          asal: val?.asal || "",
          kodeRekeningFE: `${val?.daftarSubKegiatan?.kodeRekening || ""}${
            val?.jenisPerjalanan?.kodeRekening || ""
          }`,
          tempat: val?.tempats || [],
          // sumber: dataKegiatan.value.sumber,
          jenis: val?.jenisPerjalanan?.id || "",
          jenisPerjalanan: val?.jenisPerjalanan?.jenis || "",
        },
        {
          responseType: "blob", // Penting untuk menerima file sebagai blob
        },
      )
      .then((res) => {
        console.log(res.data); // Log respons dari backend

        // Buat URL untuk file yang diunduh
        const url = window.URL.createObjectURL(new Blob([res.data])); // Perbaikan di sini
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "nota_dinas.docx"); // Nama file yang diunduh
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Tampilkan toast sukses
        toast({
          title: "Berhasil",
          description: "File nota dinas berhasil diunduh",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });

        // Redirect setelah download selesai
        history.push(`/daftar`);
      })
      .catch((err) => {
        console.error(err); // Tangani error
        setIsLoading(false);

        // Tampilkan toast error
        toast({
          title: "Gagal",
          description: "Terjadi kesalahan saat mengunduh file",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      });
  };
  const hapusPerjalanan = (e) => {
    console.log(e);
    axios
      .post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/perjalanan/delete/${e}`,
      )
      .then((res) => {
        console.log(res.status, res.data, "tessss");
        fetchDataPerjalanan();
        onClose();
      })
      .catch((err) => {
        console.error(err.message);
      });
  };

  const postSuratTugas = (val) => {
    setIsLoading(true);
    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/perjalanan/post/surat-tugas`,
        {
          asal: val?.asal || "",
          jenis: val?.jenisPerjalanan?.id || "",
          kode: `${val?.daftarSubKegiatan?.kodeRekening || ""}${
            val?.jenisPerjalanan?.kodeRekening || ""
          }`,
          personilFE: val?.personils || [],
          ttdSurTug: val?.ttdSuratTuga || null,
          id: val?.id || "",
          tanggalPengajuan: val?.tanggalPengajuan || "",
          tempat: val?.tempats || [],
          untuk: val?.untuk || "",
          dasar: val?.dasar || "",
          isNotaDinas: val?.isNotaDinas || 0,
          ttdSurTugJabatan: val?.ttdSuratTuga?.jabatan || "",
          ttdSurTugNama: val?.ttdSuratTuga?.pegawai?.nama || "",
          ttdSurTugNip: val?.ttdSuratTuga?.pegawai?.nip || "",
          ttdSurTugPangkat:
            val?.ttdSuratTuga?.pegawai?.daftarPangkat?.pangkat || "",
          ttdSurTugGolongan:
            val?.ttdSuratTuga?.pegawai?.daftarGolongan?.golongan || "",
          ttdSurTugUnitKerja: val?.ttdSuratTuga?.indukUnitKerjaId || "",
          ttdSurtTugKode:
            val?.ttdSuratTuga?.indukUnitKerja_ttdSuratTugas?.kodeInduk || "",

          noNotaDinas: val?.suratKeluar?.nomor || "",
          noSuratTugas: val?.noSuratTugas || "",
          unitKerja: user[0]?.unitKerja_profile || null,
          indukUnitKerjaFE: user[0]?.unitKerja_profile || null,
          tipeSrikandi: val?.tipeSrikandi,
          penomoran: user[0]?.unitKerja_profile?.indukUnitKerja?.penomoran,
        },
        {
          responseType: "blob", // Penting untuk menerima file sebagai blob
        },
      )
      .then((res) => {
        // Buat URL untuk file yang diunduh
        const url = window.URL.createObjectURL(new Blob([res.data])); // Perbaikan di sini
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Surat_Tugas_${
            user[0]?.unitKerja_profile?.kode || "unknown"
          }_${Date.now()}.docx`,
        ); // Nama file yang diunduh
        document.body.appendChild(link);
        link.click();
        link.remove();
        fetchDataPerjalanan();

        toast({
          title: "Berhasil",
          description: "File surat tugas berhasil diunduh",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error(err); // Tangani error
        toast({
          title: "Gagal",
          description: "Gagal mengunduh file surat tugas",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCetakSPD = () => {
    if (!selectedPerjalananSPD) return;

    // Mengumpulkan jenis kendaraan yang dipilih
    const kendaraanTerpilih = [];
    if (jenisKendaraan.darat) kendaraanTerpilih.push(1);
    if (jenisKendaraan.laut) kendaraanTerpilih.push(2);
    if (jenisKendaraan.udara) kendaraanTerpilih.push(3);

    // Jika tidak ada yang dipilih, default ke darat
    if (kendaraanTerpilih.length === 0) {
      kendaraanTerpilih.push(1);
    }

    postSPD(selectedPerjalananSPD, kendaraanTerpilih);
    handleTutupModalCetakSPD();
  };

  const handleBukaModalCetakSPD = (item) => {
    setSelectedPerjalananSPD(item);
    // Reset checkbox ke default
    setJenisKendaraan({
      darat: true,
      laut: false,
      udara: false,
    });
    onOpenCetakSPD();
  };

  const handleTutupModalCetakSPD = () => {
    setSelectedPerjalananSPD(null);
    // Reset checkbox ke default
    setJenisKendaraan({
      darat: true,
      laut: false,
      udara: false,
    });
    onCloseCetakSPD();
  };

  const postSPD = (val, kendaraanTerpilih = [1]) => {
    console.log(val?.personils);
    setIsLoading(true);
    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/perjalanan/post/surat-perjalanan-dinas`,
        {
          asal: val?.asal || "",
          jenis: val?.jenisPerjalanan?.id || "",
          kode: `${val?.daftarSubKegiatan?.kodeRekening || ""}${
            val?.jenisPerjalanan?.kodeRekening || ""
          }`,
          personilFE: val?.personils || [],
          ttdSurTug: val?.ttdSuratTuga || null,
          id: val?.id || "",
          tanggalPengajuan: val?.tanggalPengajuan || "",
          tempat: val?.tempats || [],
          untuk: val?.untuk || "",
          dasar: val?.dasar || "",
          isNotaDinas: val?.isNotaDinas || 0,
          ttdSurTugUnitKerja: val?.ttdSuratTuga?.indukUnitKerjaId || "",
          ttdSurtTugKode:
            val?.ttdSuratTuga?.indukUnitKerja_ttdSuratTugas?.kodeInduk || "",
          KPANama: val?.KPA?.pegawai_KPA?.nama || "",
          KPANip: val?.KPA?.pegawai_KPA?.nip || "",
          KPAPangkat: val?.KPA?.pegawai_KPA?.daftarPangkat?.pangkat || "",
          KPAGolongan: val?.KPA?.pegawai_KPA?.daftarGolongan?.golongan || "",
          KPAJabatan: val?.KPA?.jabatan || "",
          noNotaDinas: val?.suratKeluar?.nomor || "",
          noSuratTugas: val?.noSuratTugas || "",
          unitKerja: user[0]?.unitKerja_profile || null,
          indukUnitKerjaFE: user[0]?.unitKerja_profile || null,
          jenisKendaraan: kendaraanTerpilih,
          penomoran: user[0]?.unitKerja_profile?.indukUnitKerja?.penomoran,
        },
        {
          responseType: "blob", // Penting untuk menerima file sebagai blob
        },
      )
      .then((res) => {
        // Buat URL untuk file yang diunduh
        const url = window.URL.createObjectURL(new Blob([res.data])); // Perbaikan di sini
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Surat_Tugas_${
            user[0]?.unitKerja_profile?.kode || "unknown"
          }_${Date.now()}.docx`,
        ); // Nama file yang diunduh
        document.body.appendChild(link);
        link.click();
        link.remove();
        fetchDataPerjalanan();

        toast({
          title: "Berhasil",
          description: "File surat tugas berhasil diunduh",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error(err); // Tangani error
        toast({
          title: "Gagal",
          description: "Gagal mengunduh file surat tugas",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const postSuratTugasKendaraan = (val) => {
    setIsLoading(true);
    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/perjalanan/post/surat-tugas-kendaraan`,
        {
          asal: val?.asal || "",
          jenis: val?.jenisPerjalanan?.id || "",
          kode: `${val?.daftarSubKegiatan?.kodeRekening || ""}${
            val?.jenisPerjalanan?.kodeRekening || ""
          }`,
          personilFE: val?.personils || [],
          ttdSurTug: val?.ttdSuratTuga || null,
          id: val?.id || "",
          tanggalPengajuan: val?.tanggalPengajuan || "",
          tempat: val?.tempats || [],
          untuk: val?.untuk || "",
          dasar: val?.dasar || "",
          ttdSurTugJabatan: val?.ttdSuratTuga?.jabatan || "",
          ttdSurTugNama: val?.ttdSuratTuga?.pegawai?.nama || "",
          ttdSurTugNip: val?.ttdSuratTuga?.pegawai?.nip || "",
          ttdSurTugPangkat:
            val?.ttdSuratTuga?.pegawai?.daftarPangkat?.pangkat || "",
          ttdSurTugGolongan:
            val?.ttdSuratTuga?.pegawai?.daftarGolongan?.golongan || "",
          ttdSurTugUnitKerja: val?.ttdSuratTuga?.indukUnitKerjaId || "",
          ttdSurtTugKode:
            val?.ttdSuratTuga?.indukUnitKerja_ttdSuratTugas?.kodeInduk || "",
          KPANama: val?.KPA?.pegawai_KPA?.nama || "",
          KPANip: val?.KPA?.pegawai_KPA?.nip || "",
          KPAPangkat: val?.KPA?.pegawai_KPA?.daftarPangkat?.pangkat || "",
          KPAGolongan: val?.KPA?.pegawai_KPA?.daftarGolongan?.golongan || "",
          KPAJabatan: val?.KPA?.jabatan || "",
          noNotaDinas: val?.suratKeluar?.nomor || "",
          noSuratTugas: val?.noSuratTugas || "",
          unitKerja: user[0]?.unitKerja_profile || null,
          indukUnitKerjaFE: user[0]?.unitKerja_profile || null,
        },
        {
          responseType: "blob", // Penting untuk menerima file sebagai blob
        },
      )
      .then((res) => {
        fetchDataPerjalanan();

        toast({
          title: "Berhasil",
          description: "File surat tugas berhasil diunduh",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error(err); // Tangani error
        toast({
          title: "Gagal",
          description: "Gagal mengunduh file surat tugas",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  async function fetchDataPerjalanan() {
    setIsLoadingData(true);

    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/perjalanan/get/all-perjalanan?&time=${time}&page=${page}&limit=${limit}&unitKerjaId=${
          user[0]?.unitKerja_profile?.id || ""
        }&tanggalBerangkat=${tanggalAwal}&tanggalPulang=${tanggalAkhir}`,
      );
      setDataPerjalanan(res?.data?.result || []);
      setPage(res?.data?.page || 0);
      setPages(res?.data?.totalPage || 0);
      setRows(res?.data?.totalRows || 0);
      console.log(res.data);
    } catch (err) {
      console.error(err);
      setDataPerjalanan([]);
      setPage(0);
      setPages(0);
      setRows(0);
      toast({
        title: "Error",
        description: "Gagal memuat data perjalanan dinas",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    fetchDataPerjalanan();
  }, [page, tanggalAkhir, tanggalAwal]);

  // Mapping dataPerjalanan ke events untuk kalender, setiap personil jadi event terpisah
  const events = (dataPerjalanan || []).flatMap((item) => {
    if (!item) return [];
    const start = item?.tempats?.[0]?.tanggalBerangkat
      ? new Date(item?.tempats?.[0]?.tanggalBerangkat)
      : null;
    const end = item?.tempats?.[item?.tempats?.length - 1]?.tanggalPulang
      ? new Date(item?.tempats?.[item?.tempats?.length - 1]?.tanggalPulang)
      : start;
    return (item?.personils || []).map((p) => ({
      title: p?.pegawai?.nama || "-",
      start,
      end,
      allDay: true,
      resource: item,
    }));
  });

  moment.locale("id");
  const localizer = momentLocalizer(moment);
  const formats = {
    dayFormat: (date, culture, localizer) =>
      format(date, "EEEE", { locale: idLocale }),
    weekdayFormat: (date, culture, localizer) =>
      format(date, "EEEEEE", { locale: idLocale }),
    monthHeaderFormat: (date, culture, localizer) =>
      format(date, "MMMM yyyy", { locale: idLocale }),
    dayHeaderFormat: (date, culture, localizer) =>
      format(date, "EEEE, d MMMM", { locale: idLocale }),
  };

  return (
    <>
      {isLoading && <Loading />}
      <Layout>
        {isLoadingData ? (
          <Box
            bg={colorMode === "dark" ? "gray.900" : "secondary.light"}
            pb={{ base: "30px", md: "40px" }}
            px={{ base: "15px", md: "30px" }}
            minH="100vh"
          >
            {/* Loading Skeleton untuk Kalender */}
            <Box
              bg={colorMode === "dark" ? "gray.800" : "white"}
              p={{ base: "20px", md: "30px" }}
              borderRadius="10px"
              boxShadow="sm"
              border="1px solid"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              mb={{ base: "20px", md: "30px" }}
            >
              <Skeleton height="40px" width="300px" mb={4} />
              <Skeleton height="400px" borderRadius="8px" />
            </Box>

            {/* Loading Skeleton untuk Tabel */}
            <Box
              bg={colorMode === "dark" ? "gray.800" : "white"}
              p={{ base: "20px", md: "30px" }}
              borderRadius="10px"
              boxShadow="sm"
              border="1px solid"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              <Skeleton height="40px" width="250px" mb={6} />
              <Divider mb={6} />

              {/* Filter Skeleton */}
              <Box
                mb={6}
                p={4}
                bg={colorMode === "dark" ? "gray.700" : "gray.50"}
                borderRadius="8px"
              >
                <Skeleton height="20px" width="150px" mb={4} />
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Skeleton height="60px" />
                  <Skeleton height="60px" />
                  <Skeleton height="60px" />
                </SimpleGrid>
              </Box>

              {/* Table Skeleton */}
              <Box overflowX="auto">
                <Skeleton height="50px" mb={2} />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height="80px" mb={2} />
                ))}
              </Box>

              {/* Pagination Skeleton */}
              <Center mt={6}>
                <Skeleton height="40px" width="300px" />
              </Center>
            </Box>
          </Box>
        ) : 1 ? (
          <Box
            bg={colorMode === "dark" ? "gray.900" : "secondary.light"}
            pb={{ base: "30px", md: "40px" }}
            px={{ base: "15px", md: "30px" }}
            minH="100vh"
          >
            {/* Kalender Perjalanan */}
            <Box
              bg={colorMode === "dark" ? "gray.900" : "secondary.light"}
              pb={{ base: "20px", md: "30px" }}
              px={{ base: "15px", md: "30px" }}
              pt={{ base: "20px", md: "30px" }}
            >
              <KalenderPerjalanan
                events={events}
                colorMode={colorMode}
                formats={formats}
                localizer={localizer}
              />
            </Box>

            {/* Tabel Data Perjalanan */}
            <Box
              mt={{ base: "30px", md: "40px" }}
              bg={colorMode === "dark" ? "gray.800" : "white"}
              p={{ base: "20px", md: "30px" }}
              borderRadius={"10px"}
              boxShadow="sm"
              border="1px solid"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              {/* Header Section */}
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                mb={6}
                gap={4}
              >
                <Heading
                  size="lg"
                  color={colorMode === "dark" ? "white" : "gray.700"}
                >
                  Daftar Perjalanan Dinas
                </Heading>
                <Text
                  fontSize="sm"
                  color={colorMode === "dark" ? "gray.400" : "gray.600"}
                >
                  Total: {rows} data
                </Text>
              </Flex>

              <Divider mb={6} />
              {JSON.stringify(
                user[0]?.unitKerja_profile?.indukUnitKerja?.penomoran,
              )}
              {/* Filter Section */}
              <Box
                mb={6}
                p={4}
                bg={colorMode === "dark" ? "gray.700" : "gray.50"}
                borderRadius="8px"
              >
                <Heading
                  size="sm"
                  mb={4}
                  color={colorMode === "dark" ? "white" : "gray.700"}
                >
                  Filter Data
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Tanggal Berangkat (Awal)
                    </FormLabel>
                    <Input
                      type="date"
                      value={tanggalAwal}
                      onChange={(e) => setTanggalAwal(e.target.value)}
                      bg={colorMode === "dark" ? "gray.800" : "white"}
                      borderColor={
                        colorMode === "dark" ? "gray.600" : "gray.300"
                      }
                      _hover={{
                        borderColor: "primary",
                      }}
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Tanggal Pulang (Akhir)
                    </FormLabel>
                    <Input
                      type="date"
                      value={tanggalAkhir}
                      onChange={(e) => setTanggalAkhir(e.target.value)}
                      bg={colorMode === "dark" ? "gray.800" : "white"}
                      borderColor={
                        colorMode === "dark" ? "gray.600" : "gray.300"
                      }
                      _hover={{
                        borderColor: "primary",
                      }}
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                      }}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="flex-end">
                    <Button
                      leftIcon={<BsX />}
                      onClick={resetFilter}
                      variant="outline"
                      colorScheme="gray"
                      width="100%"
                      isDisabled={!tanggalAwal && !tanggalAkhir}
                    >
                      Reset Filter
                    </Button>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Table Section */}
              <Box
                style={{ overflowX: "auto" }}
                borderRadius="8px"
                border="1px solid"
                borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              >
                <Table variant={"primary"} size={{ base: "sm", md: "md" }}>
                  <Thead>
                    <Tr>
                      <Th
                        position="sticky"
                        left={0}
                        bg={colorMode === "dark" ? "gray.800" : "white"}
                        zIndex={1}
                        minW="50px"
                      >
                        No.
                      </Th>
                      <Th minW="120px">Unit Kerja Surtug</Th>
                      <Th minW="200px">No Surat/Nota/Telaahan</Th>
                      <Th minW="180px">Tanggal Berangkat</Th>
                      <Th minW="180px">Tanggal Pulang</Th>
                      <Th minW="200px">Jenis & Tujuan</Th>
                      <Th minW="150px">Personil 1</Th>
                      <Th minW="150px">Personil 2</Th>
                      <Th minW="150px">Personil 3</Th>
                      <Th minW="150px">Personil 4</Th>
                      <Th minW="150px">Personil 5</Th>
                      <Th
                        position="sticky"
                        right={0}
                        bg={colorMode === "dark" ? "gray.800" : "white"}
                        zIndex={1}
                        minW="80px"
                      >
                        Aksi
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataPerjalanan?.map((item, index) => (
                      <Tr
                        key={item?.id || index}
                        _hover={{
                          bg: colorMode === "dark" ? "gray.750" : "gray.50",
                        }}
                        transition="background-color 0.2s"
                      >
                        <Td
                          position="sticky"
                          left={0}
                          bg={colorMode === "dark" ? "gray.800" : "white"}
                          zIndex={1}
                          fontWeight="medium"
                        >
                          {index + 1 + page * limit}
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            color={
                              colorMode === "dark" ? "gray.300" : "gray.700"
                            }
                          >
                            {item?.ttdSuratTuga?.indukUnitKerja_ttdSuratTugas
                              ?.kodeInduk || "-"}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            {item?.noSuratTugas && (
                              <Box>
                                <Text
                                  fontSize="xs"
                                  color={
                                    colorMode === "dark"
                                      ? "gray.400"
                                      : "gray.600"
                                  }
                                  mb={1}
                                >
                                  Surat Tugas:
                                </Text>
                                <Text
                                  fontWeight="medium"
                                  fontSize="sm"
                                  color={
                                    colorMode === "dark" ? "white" : "gray.700"
                                  }
                                >
                                  {item?.noSuratTugas || "-"}
                                </Text>
                              </Box>
                            )}
                            {item?.suratKeluar?.nomor && (
                              <Box>
                                <Text
                                  fontSize="xs"
                                  color={
                                    colorMode === "dark"
                                      ? "gray.400"
                                      : "gray.600"
                                  }
                                  mb={1}
                                >
                                  {item?.isNotaDinas === 0
                                    ? "Telaahan Staf:"
                                    : "Nota Dinas:"}
                                </Text>
                                <Text
                                  fontWeight="medium"
                                  fontSize="sm"
                                  color={
                                    colorMode === "dark" ? "white" : "gray.700"
                                  }
                                >
                                  {item?.suratKeluar?.nomor || "-"}
                                </Text>
                              </Box>
                            )}
                            {!item?.noSuratTugas &&
                              !item?.suratKeluar?.nomor && (
                                <Text
                                  fontSize="sm"
                                  color={
                                    colorMode === "dark"
                                      ? "gray.400"
                                      : "gray.500"
                                  }
                                >
                                  -
                                </Text>
                              )}
                          </VStack>
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            color={
                              colorMode === "dark" ? "gray.300" : "gray.700"
                            }
                          >
                            {item?.tempats?.[0]?.tanggalBerangkat
                              ? new Date(
                                  item?.tempats?.[0]?.tanggalBerangkat,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </Text>
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            color={
                              colorMode === "dark" ? "gray.300" : "gray.700"
                            }
                          >
                            {item?.tempats?.[item?.tempats?.length - 1]
                              ?.tanggalPulang
                              ? new Date(
                                  item?.tempats?.[item?.tempats?.length - 1]
                                    ?.tanggalPulang,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            <Box>
                              <Text
                                fontSize="xs"
                                color={
                                  colorMode === "dark" ? "gray.400" : "gray.600"
                                }
                                mb={1}
                              >
                                Jenis:
                              </Text>
                              <Badge
                                colorScheme="primary"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {item?.jenisPerjalanan?.jenis || "-"}
                              </Badge>
                            </Box>
                            {item?.tempats?.length > 0 && (
                              <Box>
                                <Text
                                  fontSize="xs"
                                  color={
                                    colorMode === "dark"
                                      ? "gray.400"
                                      : "gray.600"
                                  }
                                  mb={1}
                                >
                                  Tujuan:
                                </Text>
                                {item?.jenisPerjalanan?.tipePerjalanan?.id === 1
                                  ? item?.tempats?.map((val) => (
                                      <Text
                                        key={val?.id || Math.random()}
                                        fontWeight="medium"
                                        fontSize="sm"
                                        color={
                                          colorMode === "dark"
                                            ? "white"
                                            : "gray.700"
                                        }
                                      >
                                        {val?.dalamKota?.nama || "-"}
                                      </Text>
                                    ))
                                  : item?.tempats?.map((val) => (
                                      <Text
                                        key={val?.id || Math.random()}
                                        fontWeight="medium"
                                        fontSize="sm"
                                        color={
                                          colorMode === "dark"
                                            ? "white"
                                            : "gray.700"
                                        }
                                      >
                                        {val?.tempat || "-"}
                                      </Text>
                                    ))}
                              </Box>
                            )}
                          </VStack>
                        </Td>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Td key={i}>
                            {item?.personils?.[i] ? (
                              <Tooltip
                                label={
                                  item?.personils?.[i]?.status
                                    ?.statusKuitansi || "-"
                                }
                                aria-label="Status tooltip"
                                bg={
                                  item?.personils?.[i]?.statusId === 1
                                    ? "gelap"
                                    : item?.personils?.[i]?.statusId === 2
                                      ? "ungu"
                                      : item?.personils?.[i]?.statusId === 3
                                        ? "primary"
                                        : item?.personils?.[i]?.statusId === 4
                                          ? "danger"
                                          : "gray.600"
                                }
                                hasArrow
                                placement="top"
                              >
                                <Badge
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  px={3}
                                  py={1.5}
                                  maxW="200px"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                  borderRadius="md"
                                  textTransform="none"
                                  fontSize="xs"
                                  fontWeight="medium"
                                  bgColor={
                                    item?.personils?.[i]?.statusId === 1
                                      ? "gelap"
                                      : item?.personils?.[i]?.statusId === 2
                                        ? "ungu"
                                        : item?.personils?.[i]?.statusId === 3
                                          ? "primary"
                                          : item?.personils?.[i]?.statusId === 4
                                            ? "danger"
                                            : "gray.200"
                                  }
                                  color={
                                    item?.personils?.[i]?.statusId === 1 ||
                                    item?.personils?.[i]?.statusId === 2 ||
                                    item?.personils?.[i]?.statusId === 3 ||
                                    item?.personils?.[i]?.statusId === 4
                                      ? "white"
                                      : "gray.700"
                                  }
                                  cursor="help"
                                >
                                  {item?.personils?.[i]?.pegawai?.nama || "-"}
                                </Badge>
                              </Tooltip>
                            ) : (
                              <Text
                                fontSize="sm"
                                color={
                                  colorMode === "dark" ? "gray.500" : "gray.400"
                                }
                                fontStyle="italic"
                              >
                                -
                              </Text>
                            )}
                          </Td>
                        ))}
                        <Td
                          position="sticky"
                          right={0}
                          bg={colorMode === "dark" ? "gray.800" : "white"}
                          zIndex={1}
                        >
                          <Menu placement="auto" strategy="fixed">
                            <MenuButton
                              as={IconButton}
                              icon={<BsThreeDotsVertical />}
                              variant="ghost"
                              size="sm"
                              aria-label="Menu aksi"
                              _hover={{
                                bg:
                                  colorMode === "dark"
                                    ? "gray.700"
                                    : "gray.100",
                              }}
                            />
                            <MenuList
                              bg={colorMode === "dark" ? "gray.800" : "white"}
                              borderColor={
                                colorMode === "dark" ? "gray.700" : "gray.200"
                              }
                              zIndex={9999}
                            >
                              {item?.noSuratTugas && (
                                <MenuItem
                                  icon={<BsEyeFill />}
                                  onClick={() =>
                                    history.push(
                                      `/detail-perjalanan/${item?.id || ""}`,
                                    )
                                  }
                                  _hover={{
                                    bg:
                                      colorMode === "dark"
                                        ? "gray.700"
                                        : "gray.100",
                                  }}
                                >
                                  Lihat Detail
                                </MenuItem>
                              )}
                              <MenuItem
                                icon={<BsFileEarmarkArrowDown />}
                                onClick={() => postSuratTugas(item)}
                                _hover={{
                                  bg:
                                    colorMode === "dark"
                                      ? "gray.700"
                                      : "gray.100",
                                }}
                              >
                                Cetak Surat Tugas
                              </MenuItem>
                              <MenuItem
                                icon={<BsFileEarmarkArrowDown />}
                                onClick={() => handleBukaModalCetakSPD(item)}
                                _hover={{
                                  bg:
                                    colorMode === "dark"
                                      ? "gray.700"
                                      : "gray.100",
                                }}
                              >
                                Cetak Surat Perjalanan Dinas
                              </MenuItem>
                              <MenuItem
                                icon={<BsFileEarmarkArrowDown />}
                                onClick={() => postNotaDinas(item)}
                                _hover={{
                                  bg:
                                    colorMode === "dark"
                                      ? "gray.700"
                                      : "gray.100",
                                }}
                              >
                                Cetak Nota Dinas
                              </MenuItem>
                              {!item?.personils?.some(
                                (p) => p?.statusId === 2 || p?.statusId === 3,
                              ) && (
                                <MenuItem
                                  onClick={() => {
                                    setSelectedPerjalanan(item?.id || 0);
                                    onOpen();
                                  }}
                                  color="red.500"
                                  _hover={{
                                    bg: "red.50",
                                  }}
                                >
                                  Hapus
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              {/* Pagination */}
              <Box
                mt={6}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <ReactPaginate
                  previousLabel={"←"}
                  nextLabel={"→"}
                  pageCount={pages}
                  onPageChange={changePage}
                  activeClassName={"item active "}
                  breakClassName={"item break-me "}
                  breakLabel={"..."}
                  containerClassName={"pagination"}
                  disabledClassName={"disabled-page"}
                  marginPagesDisplayed={1}
                  nextClassName={"item next "}
                  pageClassName={"item pagination-page "}
                  pageRangeDisplayed={2}
                  previousClassName={"item previous"}
                />
              </Box>
            </Box>

            {/* Modal Konfirmasi Hapus */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
              <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
              <ModalContent
                bg={colorMode === "dark" ? "gray.800" : "white"}
                borderRadius="10px"
              >
                <ModalHeader
                  color={colorMode === "dark" ? "white" : "gray.700"}
                  borderBottom="1px solid"
                  borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                  pb={4}
                >
                  Konfirmasi Hapus
                </ModalHeader>
                <ModalCloseButton
                  color={colorMode === "dark" ? "white" : "gray.700"}
                />
                <ModalBody py={6}>
                  <Text color={colorMode === "dark" ? "gray.300" : "gray.600"}>
                    Apakah Anda yakin ingin menghapus data perjalanan dinas ini?
                    Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </ModalBody>
                <ModalFooter
                  borderTop="1px solid"
                  borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                  pt={4}
                >
                  <Button variant="ghost" mr={3} onClick={onClose}>
                    Batal
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => hapusPerjalanan(selectedPerjalanan)}
                    _hover={{
                      bg: "red.600",
                    }}
                  >
                    Ya, Hapus
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Modal Pilih Jenis Kendaraan untuk Cetak SPD */}
            <Modal
              isOpen={isOpenCetakSPD}
              onClose={handleTutupModalCetakSPD}
              isCentered
            >
              <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
              <ModalContent
                bg={colorMode === "dark" ? "gray.800" : "white"}
                borderRadius="10px"
              >
                <ModalHeader
                  color={colorMode === "dark" ? "white" : "gray.700"}
                  borderBottom="1px solid"
                  borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                  pb={4}
                >
                  Pilih Jenis Kendaraan
                </ModalHeader>
                <ModalCloseButton
                  color={colorMode === "dark" ? "white" : "gray.700"}
                />
                <ModalBody py={6}>
                  <VStack align="stretch" spacing={4}>
                    <Text
                      color={colorMode === "dark" ? "gray.300" : "gray.600"}
                      mb={2}
                    >
                      Pilih jenis kendaraan yang digunakan untuk perjalanan
                      dinas:
                    </Text>
                    <FormControl>
                      <Checkbox
                        isChecked={jenisKendaraan.darat}
                        onChange={(e) =>
                          setJenisKendaraan({
                            ...jenisKendaraan,
                            darat: e.target.checked,
                          })
                        }
                        size="lg"
                        sx={{
                          "& .chakra-checkbox__control": {
                            borderColor: "primary.500",
                            _checked: {
                              bg: "primary.500",
                              borderColor: "primary.500",
                              _hover: {
                                bg: "primary.600",
                                borderColor: "primary.600",
                              },
                            },
                            _hover: {
                              borderColor: "primary.400",
                            },
                          },
                        }}
                      >
                        <Text
                          color={colorMode === "dark" ? "white" : "gray.700"}
                          fontSize="md"
                          fontWeight="medium"
                        >
                          Kendaraan Darat
                        </Text>
                      </Checkbox>
                    </FormControl>
                    <FormControl>
                      <Checkbox
                        isChecked={jenisKendaraan.laut}
                        onChange={(e) =>
                          setJenisKendaraan({
                            ...jenisKendaraan,
                            laut: e.target.checked,
                          })
                        }
                        size="lg"
                        sx={{
                          "& .chakra-checkbox__control": {
                            borderColor: "primary.500",
                            _checked: {
                              bg: "primary.500",
                              borderColor: "primary.500",
                              _hover: {
                                bg: "primary.600",
                                borderColor: "primary.600",
                              },
                            },
                            _hover: {
                              borderColor: "primary.400",
                            },
                          },
                        }}
                      >
                        <Text
                          color={colorMode === "dark" ? "white" : "gray.700"}
                          fontSize="md"
                          fontWeight="medium"
                        >
                          Kendaraan Laut
                        </Text>
                      </Checkbox>
                    </FormControl>
                    <FormControl>
                      <Checkbox
                        isChecked={jenisKendaraan.udara}
                        onChange={(e) =>
                          setJenisKendaraan({
                            ...jenisKendaraan,
                            udara: e.target.checked,
                          })
                        }
                        size="lg"
                        sx={{
                          "& .chakra-checkbox__control": {
                            borderColor: "primary.500",
                            _checked: {
                              bg: "primary.500",
                              borderColor: "primary.500",
                              _hover: {
                                bg: "primary.600",
                                borderColor: "primary.600",
                              },
                            },
                            _hover: {
                              borderColor: "primary.400",
                            },
                          },
                        }}
                      >
                        <Text
                          color={colorMode === "dark" ? "white" : "gray.700"}
                          fontSize="md"
                          fontWeight="medium"
                        >
                          Kendaraan Udara
                        </Text>
                      </Checkbox>
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter
                  borderTop="1px solid"
                  borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                  pt={4}
                >
                  <Button
                    variant="ghost"
                    mr={3}
                    onClick={handleTutupModalCetakSPD}
                  >
                    Batal
                  </Button>
                  <Button
                    variant={"primary"}
                    onClick={handleCetakSPD}
                    isLoading={isLoading}
                    loadingText="Memproses..."
                  >
                    Buat
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Box>
        ) : (
          <DataKosong />
        )}
      </Layout>
    </>
  );
}

export default Daftar;
