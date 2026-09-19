import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Text,
  useToast,
  Container,
  Heading,
  HStack,
  Badge,
  Flex,
  Spinner,
  Center,
  SimpleGrid,
  Image,
  VStack,
  Stack,
  Skeleton,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import {
  ProduksiStickyBar,
  ProduksiSumurList,
} from "../../Componets/KPBPN/ProduksiSumurInput";
import {
  convertProduksiInputsBySatuan,
  formatVolumeNumber,
  isVolumeEqual,
  isVolumeOver,
  parseProduksiNumber,
  roundVolumeNumber,
} from "../../lib/volumeSatuan";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const getDocumentUrl = (filePath) => (filePath ? `${API_BASE}${filePath}` : null);

const getDocumentName = (filePath) => {
  if (!filePath) return "";
  return String(filePath).split("/").pop();
};

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatJam = (value) => {
  if (!value) return "-";
  const str = String(value).trim();
  const timeOnly = str.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (timeOnly) return timeOnly[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return str;
  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return formatVolumeNumber(angka);
};

const statusColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "BONGKAR") return "orange";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
};

const kualitasColor = (kualitas) =>
  String(kualitas || "").toUpperCase() === "ONSPEC" ? "green" : "orange";

const InfoField = ({ label, children }) => (
  <Box minW={0}>
    <Text
      fontSize="xs"
      color="gray.500"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={0.5}
    >
      {label}
    </Text>
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

const SectionCard = ({ title, children, ...rest }) => (
  <Box
    p={{ base: 3, sm: 4, md: 5 }}
    borderWidth="1px"
    borderRadius="lg"
    bg="gray.50"
    overflow="hidden"
    h="100%"
    minW={0}
    {...rest}
  >
    <Heading size="sm" color="kpbpn" mb={{ base: 3, md: 4 }}>
      {title}
    </Heading>
    {children}
  </Box>
);

const EmptyText = ({ children }) => (
  <Text fontSize="sm" color="gray.500">
    {children}
  </Text>
);

const FotoThumb = ({ src, alt }) => {
  if (!src) return <EmptyText>Tidak ada foto</EmptyText>;
  return (
    <Image
      src={getImageUrl(src)}
      alt={alt}
      w="100%"
      maxW="100%"
      maxH={{ base: "160px", md: "180px" }}
      borderRadius="md"
      objectFit="cover"
      border="1px solid"
      borderColor="gray.200"
    />
  );
};

const NestedCard = ({ children }) => (
  <Box
    p={{ base: 3, md: 4 }}
    borderWidth="1px"
    borderRadius="md"
    bg="white"
    overflow="hidden"
  >
    {children}
  </Box>
);

function DetailSuratJalan({
  match,
  backTo = "/pengiriman-kpbpn/surat-jalan",
  showExtendedSections = true,
  allowEditProduksiAnytime = false,
}) {
  const suratJalanId = match.params.id;
  const toast = useToast();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [produksiPanel, setProduksiPanel] = useState({
    loading: false,
    saving: false,
    sumurList: [],
    inputs: {},
    volume: 0,
    satuan: "",
    satuanVolumeId: null,
    satuanVolumeOptions: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/detail-surat-jalan/${suratJalanId}`,
      );
      setData(res.data.result || null);
    } catch (err) {
      console.error(err);
      setData(null);
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProduksiPanel = async () => {
    if (!suratJalanId) return;

    setProduksiPanel((prev) => ({
      ...prev,
      loading: true,
      sumurList: [],
      inputs: {},
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/produksi-sumur/${suratJalanId}`,
      );

      const sumurList = res.data.resultSumurMinyak || [];
      const existingProduksi = res.data.resultProduksi || [];
      const satuanVolumeOptions = res.data.resultSatuanVolume || [];
      const inputs = {};

      sumurList.forEach((sumur) => {
        const existing = existingProduksi.find(
          (p) => p.sumurMinyakId === sumur.id,
        );
        inputs[sumur.id] = existing?.produksi ?? "";
      });

      const defaultSatuanVolumeId =
        existingProduksi.find((p) => p.satuanVolumeId)?.satuanVolumeId ??
        res.data.suratJalan?.satuanVolumeId ??
        satuanVolumeOptions[0]?.id ??
        null;

      setProduksiPanel((prev) => ({
        ...prev,
        loading: false,
        sumurList,
        inputs,
        volume: res.data.suratJalan?.volume ?? 0,
        satuan: res.data.suratJalan?.satuanVolume?.satuan || "",
        satuanVolumeId: defaultSatuanVolumeId,
        satuanVolumeOptions,
      }));
      setIsEditing(existingProduksi.length === 0);
      setEditSnapshot(null);
    } catch (err) {
      console.error(err);
      setProduksiPanel((prev) => ({ ...prev, loading: false }));
      toast({
        title: "Gagal memuat produksi",
        description:
          err.response?.data?.error || "Gagal memuat data produksi sumur",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchProduksiPanel();
  }, [suratJalanId]);

  const handleProduksiInputChange = (sumurMinyakId, value) => {
    setProduksiPanel((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [sumurMinyakId]: value,
      },
    }));
  };

  const handleSatuanChange = (e) => {
    const nextId = e.target.value ? Number(e.target.value) : null;
    setProduksiPanel((prev) => {
      const fromSatuan = prev.satuanVolumeOptions.find(
        (opt) => opt.id === prev.satuanVolumeId,
      )?.satuan;
      const toSatuan = prev.satuanVolumeOptions.find(
        (opt) => opt.id === nextId,
      )?.satuan;

      return {
        ...prev,
        satuanVolumeId: nextId,
        inputs: convertProduksiInputsBySatuan(
          prev.inputs,
          fromSatuan,
          toSatuan,
        ),
      };
    });
  };

  const totalProduksiInput = useMemo(() => {
    const total = Object.values(produksiPanel.inputs).reduce((sum, val) => {
      return sum + parseProduksiNumber(val);
    }, 0);
    return roundVolumeNumber(total, 3) ?? 0;
  }, [produksiPanel.inputs]);

  const produksiSatuanLabel = useMemo(() => {
    const selected = produksiPanel.satuanVolumeOptions.find(
      (opt) => opt.id === produksiPanel.satuanVolumeId,
    );
    return selected?.satuan || produksiPanel.satuan || "Barrel";
  }, [
    produksiPanel.satuanVolumeOptions,
    produksiPanel.satuanVolumeId,
    produksiPanel.satuan,
  ]);

  const isProduksiTotalValid = useMemo(
    () =>
      isVolumeEqual(
        totalProduksiInput,
        produksiSatuanLabel,
        produksiPanel.volume,
        produksiPanel.satuan || "Barrel",
      ),
    [
      totalProduksiInput,
      produksiSatuanLabel,
      produksiPanel.volume,
      produksiPanel.satuan,
    ],
  );

  const isProduksiOverLimit = useMemo(
    () =>
      isVolumeOver(
        totalProduksiInput,
        produksiSatuanLabel,
        produksiPanel.volume,
        produksiPanel.satuan || "Barrel",
      ),
    [
      totalProduksiInput,
      produksiSatuanLabel,
      produksiPanel.volume,
      produksiPanel.satuan,
    ],
  );

  const produksiComparison = isProduksiOverLimit
    ? "over"
    : isProduksiTotalValid
      ? "equal"
      : "under";

  const startEditProduksi = () => {
    setEditSnapshot({
      inputs: { ...produksiPanel.inputs },
      satuanVolumeId: produksiPanel.satuanVolumeId,
    });
    setIsEditing(true);
  };

  const cancelEditProduksi = () => {
    if (editSnapshot) {
      setProduksiPanel((prev) => ({
        ...prev,
        inputs: editSnapshot.inputs,
        satuanVolumeId: editSnapshot.satuanVolumeId,
      }));
    }
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const saveProduksiSumur = async () => {
    const items = Object.entries(produksiPanel.inputs)
      .map(([sumurMinyakId, produksi]) => ({
        sumurMinyakId: parseInt(sumurMinyakId, 10),
        produksi: parseProduksiNumber(produksi),
      }))
      .filter((item) => item.produksi > 0);

    if (!produksiPanel.satuanVolumeId) {
      toast({
        title: "Satuan belum dipilih",
        description: "Pilih satuan volume produksi terlebih dahulu.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isProduksiTotalValid) {
      toast({
        title: "Total produksi tidak sesuai",
        description: `Total produksi harus sama dengan volume surat jalan (${produksiPanel.volume}${produksiPanel.satuan ? ` ${produksiPanel.satuan}` : ""})`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setProduksiPanel((prev) => ({ ...prev, saving: true }));

    try {
      await axios.post(`${API_BASE}/pengiriman/post/produksi-sumur`, {
        suratJalanId,
        satuanVolumeId: produksiPanel.satuanVolumeId,
        items,
      });

      toast({
        title: "Berhasil",
        description: "Produksi sumur berhasil disimpan.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      await Promise.all([fetchDetail(), fetchProduksiPanel()]);
      setIsEditing(false);
      setEditSnapshot(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description:
          err.response?.data?.error || "Gagal menyimpan produksi sumur",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProduksiPanel((prev) => ({ ...prev, saving: false }));
    }
  };

  const konfirmasiList = data?.konfirmasiPenerimaans || [];
  const satuanSurat = data?.satuanVolume?.satuan || "Barrel";
  const canEditProduksi =
    allowEditProduksiAnytime || data?.statusSuratJalanId === 1;
  const isProduksiEditing = canEditProduksi && isEditing;
  const displayedSumurList = canEditProduksi
    ? produksiPanel.sumurList
    : produksiPanel.sumurList.filter((sumur) => {
        const value = produksiPanel.inputs[sumur.id];
        return value !== "" && value != null && Number(value) > 0;
      });

  const pengisianList = useMemo(() => {
    const items = [];
    konfirmasiList.forEach((kp) => {
      (kp.pengisianTankis || []).forEach((pt) => {
        items.push({ ...pt, konfirmasiNomor: kp.nomor, konfirmasiId: kp.id });
      });
    });
    return items;
  }, [konfirmasiList]);

  const ujiLabList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      (pt.BABongkar?.ujiLabK3S || []).forEach((uji) => {
        if (uji?.id && !map.has(uji.id)) map.set(uji.id, uji);
      });
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const bak3sList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      const bak = pt.BABongkar?.BAK3S;
      if (bak?.id && !map.has(bak.id)) {
        map.set(bak.id, {
          ...bak,
          baTanggal: pt.BABongkar?.tanggal,
          baId: pt.BABongkar?.id,
          tankiKode: pt.tanki?.kode,
        });
      }
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const baBongkarList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      const ba = pt.BABongkar;
      if (ba?.id && !map.has(ba.id)) {
        map.set(ba.id, {
          ...ba,
          tankiKode: pt.tanki?.kode,
          konfirmasiNomor: pt.konfirmasiNomor,
        });
      }
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const renderDokumenBak3s = (dokumen) => {
    if (!dokumen) return "-";
    return (
      <Button
        as="a"
        href={getDocumentUrl(dokumen)}
        target="_blank"
        rel="noreferrer"
        size="xs"
        variant="link"
        colorScheme="orange"
      >
        {getDocumentName(dokumen) || "Unduh dokumen"}
      </Button>
    );
  };

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
        maxW="100%"
      >
        <Container
          variant="primary"
          maxW="100%"
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <VStack align="stretch" spacing={2} mb={{ base: 4, md: 6 }}>
            <Button
              as={RouterLink}
              to={backTo}
              variant="ghost"
              size="sm"
              alignSelf={{ base: "stretch", sm: "flex-start" }}
            >
              ← Kembali ke Surat Jalan
            </Button>
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={2}
            >
              <Box>
                <Heading
                  color="kpbpn"
                  size={{ base: "md", md: "lg" }}
                  wordBreak="break-word"
                >
                  Detail Surat Jalan
                </Heading>
                {data && (
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Text
                      color="gray.600"
                      fontWeight="medium"
                      fontSize={{ base: "sm", md: "md" }}
                      wordBreak="break-word"
                    >
                      {data.nomor || `Surat Jalan #${data.id}`}
                    </Text>
                    <Badge
                      colorScheme={statusColor(data.statusSuratJalan?.status)}
                      variant="subtle"
                    >
                      {data.statusSuratJalan?.status || "-"}
                    </Badge>
                  </HStack>
                )}
              </Box>
            </Flex>
          </VStack>

          {isLoading ? (
            <Center py={16}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : !data ? (
            <Center py={16}>
              <Text color="gray.500">Surat jalan tidak ditemukan</Text>
            </Center>
          ) : (
            <Stack spacing={{ base: 4, md: 6 }}>
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={{ base: 4, md: 6 }}
                alignItems="stretch"
              >
                <SectionCard title="Data Surat Jalan">
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 3, md: 4 }}
                  >
                    <InfoField label="Nomor">{data.nomor || "-"}</InfoField>
                    <InfoField label="Tanggal">
                      {formatTanggal(data.tanggal)}
                    </InfoField>
                    <InfoField label="Status">
                      <Badge
                        colorScheme={statusColor(data.statusSuratJalan?.status)}
                        variant="subtle"
                      >
                        {data.statusSuratJalan?.status || "-"}
                      </Badge>
                    </InfoField>
                    <InfoField label="Mitra">{data.mitra?.nama || "-"}</InfoField>
                    <InfoField label="Jenis Mitra">
                      {data.mitra?.jenisMitra?.jenis || "-"}
                    </InfoField>
                    <InfoField label="Stasiun Pengumpul Minyak">
                      {data.stasiunPengumpulMinyak?.nama || "-"}
                    </InfoField>
                    <InfoField label="Asal Minyak">
                      {data.asalMinyak
                        ? [data.asalMinyak.nomor, data.asalMinyak.asal]
                            .filter(Boolean)
                            .join(" - ") || "-"
                        : "-"}
                    </InfoField>
                    <InfoField label="Volume">
                      <VolumeMultiSatuan
                        volume={data.volume}
                        satuan={satuanSurat}
                      />
                    </InfoField>
                    <InfoField label="Jam Datang">
                      {formatJam(data.jamDatang)}
                    </InfoField>
                    <InfoField label="Jam Pergi">
                      {formatJam(data.jamPergi)}
                    </InfoField>
                    <InfoField label="Unit Kerja">
                      {data.daftarUnitKerja?.unitKerja || "-"}
                    </InfoField>
                    <InfoField label="Kode Verifikasi">
                      {data.verifikasi || "-"}
                    </InfoField>
                    <InfoField label="Alamat Mitra">
                      {data.mitra?.alamat || "-"}
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>

                <SectionCard title="Kendaraan / Transportir">
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 3, md: 4 }}
                  >
                    <InfoField label="Plat">
                      {data.transportir?.plat || "-"}
                    </InfoField>
                    <InfoField label="Jenis">
                      {data.transportir?.jenisTransportir?.jenis || "-"}
                    </InfoField>
                    <InfoField label="Kapasitas">
                      {data.transportir?.kapasitas != null
                        ? `${data.transportir.kapasitas} ${
                            data.transportir.satuanVolume?.satuan || ""
                          }`.trim()
                        : "-"}
                    </InfoField>
                    <InfoField label="Nama Supir">
                      {data.supir?.nama || "-"}
                    </InfoField>
                    <InfoField label="NIK Supir">
                      {data.supir?.nik || "-"}
                    </InfoField>
                    <InfoField label="Foto Kendaraan">
                      <FotoThumb
                        src={data.transportir?.foto}
                        alt={data.transportir?.plat || "Kendaraan"}
                      />
                    </InfoField>
                    <InfoField label="Foto Supir">
                      <FotoThumb
                        src={data.supir?.foto}
                        alt={data.supir?.nama || "Supir"}
                      />
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>
              </SimpleGrid>

              <SectionCard
                title="Input Produksi Sumur"
                overflow="visible"
                minW={0}
              >
                {produksiPanel.loading ? (
                  <Stack spacing={3}>
                    <Skeleton height="20px" />
                    <Skeleton height="36px" />
                    <Skeleton height="36px" />
                  </Stack>
                ) : displayedSumurList.length === 0 ? (
                  <EmptyText>
                    {produksiPanel.sumurList.length === 0
                      ? "Tidak ada data sumur minyak untuk mitra ini."
                      : "Belum ada data produksi sumur untuk surat jalan ini."}
                  </EmptyText>
                ) : (
                  <>
                    <ProduksiStickyBar
                      totalProduksiInput={totalProduksiInput}
                      produksiSatuanLabel={produksiSatuanLabel}
                      acuanVolume={produksiPanel.volume}
                      acuanSatuan={produksiPanel.satuan || satuanSurat}
                      acuanLabel="Volume Surat Jalan"
                      comparison={produksiComparison}
                      statusHintOver="Total produksi harus sama dengan volume surat jalan"
                      statusHintUnder="Total produksi harus sama dengan volume surat jalan"
                      satuanVolumeId={produksiPanel.satuanVolumeId}
                      satuanVolumeOptions={produksiPanel.satuanVolumeOptions}
                      onSatuanChange={handleSatuanChange}
                      isEditing={isProduksiEditing}
                      saving={produksiPanel.saving}
                      canSave={
                        isProduksiEditing &&
                        isProduksiTotalValid &&
                        Boolean(produksiPanel.satuanVolumeId) &&
                        !produksiPanel.loading
                      }
                      onEdit={startEditProduksi}
                      onCancel={cancelEditProduksi}
                      onSave={saveProduksiSumur}
                      showEditButton={canEditProduksi}
                      showSaveButton={canEditProduksi}
                    />

                    <ProduksiSumurList
                      sumurList={displayedSumurList}
                      inputs={produksiPanel.inputs}
                      isEditing={isProduksiEditing}
                      produksiSatuanLabel={produksiSatuanLabel}
                      onInputChange={handleProduksiInputChange}
                    />
                  </>
                )}
              </SectionCard>

              {showExtendedSections && (
                <>
              <SectionCard title="Konfirmasi Penerimaan">
                {konfirmasiList.length === 0 ? (
                  <EmptyText>
                    Belum ada konfirmasi penerimaan untuk surat jalan ini.
                  </EmptyText>
                ) : (
                  <Stack spacing={4}>
                    {konfirmasiList.map((kp) => (
                      <NestedCard key={kp.id}>
                        <SimpleGrid
                          columns={{ base: 1, sm: 2 }}
                          spacing={{ base: 3, md: 4 }}
                        >
                          <InfoField label="Nomor Konfirmasi">
                            {kp.nomor || "-"}
                          </InfoField>
                          <InfoField label="Tanggal">
                            {formatTanggal(kp.tanggal)}
                          </InfoField>
                          <InfoField label="Volume Diterima">
                            <VolumeMultiSatuan
                              volume={kp.volume}
                              satuan={satuanSurat}
                            />
                          </InfoField>
                          <InfoField label="Petugas Penerima (PK)">
                            {kp.userPK?.nama || "-"}
                          </InfoField>
                          <InfoField label="Petugas Lab">
                            {kp.userLab?.nama || "-"}
                          </InfoField>
                          <InfoField label="API">{formatAngka(kp.api)}</InfoField>
                          <InfoField label="BSNW">
                            {formatAngka(kp.BSNW)}
                          </InfoField>
                          <Box gridColumn={{ sm: "span 2" }}>
                            <InfoField label="Catatan">
                              {kp.catatan || "-"}
                            </InfoField>
                          </Box>
                          <Box>
                            <InfoField label="Foto Bukti Penerimaan">
                              <FotoThumb
                                src={kp.foto}
                                alt={`Foto konfirmasi ${kp.nomor || kp.id}`}
                              />
                            </InfoField>
                          </Box>
                          <Box>
                            <InfoField label="Foto Lab">
                              <FotoThumb
                                src={kp.fotoLab}
                                alt={`Foto lab ${kp.nomor || kp.id}`}
                              />
                            </InfoField>
                          </Box>
                        </SimpleGrid>
                      </NestedCard>
                      ))}
                    </Stack>
                  )}
                </SectionCard>

              <SectionCard title="Pengisian Tanki">
                {pengisianList.length === 0 ? (
                  <EmptyText>
                    Belum ada data pengisian tanki yang terhubung dengan surat
                    jalan ini.
                  </EmptyText>
                ) : (
                  <Stack spacing={4}>
                    {pengisianList.map((pt) => (
                      <NestedCard key={pt.id}>
                        <Flex
                          justify="space-between"
                          align={{ base: "flex-start", sm: "center" }}
                          mb={3}
                          gap={2}
                          direction={{ base: "column", sm: "row" }}
                        >
                          <Heading size="xs" color="gray.700">
                            Tanki {pt.tanki?.kode || `#${pt.id}`}
                          </Heading>
                          {pt.konfirmasiNomor && (
                            <Badge colorScheme="blue" variant="subtle">
                              Konfirmasi {pt.konfirmasiNomor}
                            </Badge>
                          )}
                        </Flex>
                        <SimpleGrid
                          columns={{ base: 1, sm: 2, lg: 3 }}
                          spacing={{ base: 3, md: 4 }}
                        >
                          <InfoField label="Nomor Surat">
                            {pt.nomorSurat || "-"}
                          </InfoField>
                          <InfoField label="Tanggal">
                            {formatTanggal(pt.tanggal)}
                          </InfoField>
                          <InfoField label="Kapasitas Tanki">
                            {pt.tanki?.kapasitas != null
                              ? `${pt.tanki.kapasitas} ${
                                  pt.tanki.satuanVolume?.satuan || ""
                                }`.trim()
                              : "-"}
                          </InfoField>
                          <InfoField label="Gross">
                            <VolumeMultiSatuan
                              volume={pt.gross}
                              satuan={pt.satuanVolume?.satuan || satuanSurat}
                            />
                          </InfoField>
                          <InfoField label="Net">
                            <VolumeMultiSatuan
                              volume={pt.net}
                              satuan={pt.satuanVolume?.satuan || satuanSurat}
                            />
                          </InfoField>
                          <InfoField label="Flow Meter">
                            {formatAngka(pt.flowMeter)}
                          </InfoField>
                          <InfoField label="Penampilan Visual">
                            {pt.penampilanVisual || "-"}
                          </InfoField>
                          <InfoField label="Warna">{pt.warna || "-"}</InfoField>
                          <InfoField label="Kandungan Air">
                            {formatAngka(pt.kandunganAir)}
                          </InfoField>
                          <InfoField label="BSW">{formatAngka(pt.BSW)}</InfoField>
                          <InfoField label="Saksi">{pt.saksi || "-"}</InfoField>
                          <InfoField label="Catatan">
                            {pt.catatan || "-"}
                          </InfoField>
                        </SimpleGrid>
                      </NestedCard>
                    ))}
                  </Stack>
                )}
              </SectionCard>

              <SimpleGrid
                columns={{ base: 1, lg: 3 }}
                spacing={{ base: 4, md: 6 }}
                alignItems="stretch"
              >
                <SectionCard title="BA Bongkar">
                  {baBongkarList.length === 0 ? (
                    <EmptyText>
                      Belum ada data BA Bongkar yang terhubung dengan surat
                      jalan ini.
                    </EmptyText>
                  ) : (
                    <Stack spacing={3}>
                      {baBongkarList.map((ba) => (
                        <NestedCard key={ba.id}>
                          <HStack
                            justify="space-between"
                            mb={3}
                            flexWrap="wrap"
                            gap={2}
                          >
                            <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                              {ba.tankiKode || `BA #${ba.id}`}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatTanggal(ba.tanggal)}
                            </Text>
                          </HStack>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                            <InfoField label="Ukuran Cairan">
                              {formatAngka(ba.ukuranCairan)}
                            </InfoField>
                            <InfoField label="Ukuran Air">
                              {formatAngka(ba.ukuranAir)}
                            </InfoField>
                          </SimpleGrid>
                          {(ba.BABongkarTankis || []).length > 0 && (
                            <Box mt={3}>
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="semibold"
                                mb={2}
                              >
                                TANKI PADA BA BONGKAR
                              </Text>
                              <Stack spacing={2}>
                                {(ba.BABongkarTankis || []).map((baTanki) => (
                                  <Box
                                    key={baTanki.id}
                                    p={3}
                                    borderRadius="md"
                                    bg="gray.50"
                                  >
                                    <Text fontSize="sm" fontWeight="medium">
                                      {baTanki.tanki?.kode ||
                                        `Tanki #${baTanki.tangkiId}`}
                                    </Text>
                                    <SimpleGrid
                                      columns={2}
                                      spacing={2}
                                      mt={2}
                                    >
                                      <InfoField label="Cairan">
                                        {formatAngka(baTanki.ukuranCairan)}
                                      </InfoField>
                                      <InfoField label="Air">
                                        {formatAngka(baTanki.ukuranAir)}
                                      </InfoField>
                                    </SimpleGrid>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </NestedCard>
                      ))}
                    </Stack>
                  )}
                </SectionCard>

                <SectionCard title="BAK3S">
                  {bak3sList.length === 0 ? (
                    <EmptyText>
                      Belum ada data BAK3S yang terhubung dengan surat jalan
                      ini.
                    </EmptyText>
                  ) : (
                    <Stack spacing={3}>
                      {bak3sList.map((bak) => (
                        <NestedCard key={bak.id}>
                          <HStack
                            justify="space-between"
                            mb={3}
                            flexWrap="wrap"
                            gap={2}
                          >
                            <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                              {bak.tankiKode || `BA #${bak.baId || bak.id}`}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatTanggal(bak.baTanggal)}
                            </Text>
                          </HStack>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                            <InfoField label="API">
                              {formatAngka(bak.api)}
                            </InfoField>
                            <InfoField label="BSNW">
                              {formatAngka(bak.BSNW)}
                            </InfoField>
                            <InfoField label="Produksi">
                              {formatAngka(bak.produksi)}
                            </InfoField>
                            <InfoField label="SG">
                              {formatAngka(bak.sg)}
                            </InfoField>
                            <Box gridColumn={{ sm: "span 2" }}>
                              <InfoField label="Dokumen">
                                {renderDokumenBak3s(bak.dokumen)}
                              </InfoField>
                            </Box>
                          </SimpleGrid>
                        </NestedCard>
                      ))}
                    </Stack>
                  )}
                </SectionCard>

                <SectionCard title="Uji Lab K3S">
                  {ujiLabList.length === 0 ? (
                    <EmptyText>
                      Belum ada data uji lab K3S yang terhubung dengan surat
                      jalan ini.
                    </EmptyText>
                  ) : (
                    <Stack spacing={3}>
                      {ujiLabList.map((uji) => (
                        <NestedCard key={uji.id}>
                          <HStack
                            justify="space-between"
                            mb={3}
                            flexWrap="wrap"
                            gap={2}
                          >
                            <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                              {uji.tanki?.kode || "Tanki"}
                            </Text>
                            <Badge
                              colorScheme={kualitasColor(uji.kualitas)}
                              variant="subtle"
                            >
                              {uji.kualitas || "-"}
                            </Badge>
                          </HStack>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                            <InfoField label="Tanggal">
                              {formatTanggal(uji.tanggal)}
                            </InfoField>
                            <InfoField label="API">
                              {formatAngka(uji.api)}
                            </InfoField>
                            <InfoField label="BSNW">
                              {formatAngka(uji.BSNW)}
                            </InfoField>
                            <InfoField label="Suhu">
                              {formatAngka(uji.suhu)}
                            </InfoField>
                            <InfoField label="SG">
                              {formatAngka(uji.sg)}
                            </InfoField>
                            <Box gridColumn={{ sm: "span 2" }}>
                              <InfoField label="Foto">
                                {uji.foto ? (
                                  <Image
                                    src={getImageUrl(uji.foto)}
                                    alt="Foto uji lab"
                                    w="100%"
                                    maxH="140px"
                                    borderRadius="md"
                                    objectFit="cover"
                                  />
                                ) : (
                                  "-"
                                )}
                              </InfoField>
                            </Box>
                          </SimpleGrid>
                        </NestedCard>
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              </SimpleGrid>
                </>
              )}
            </Stack>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default DetailSuratJalan;
