import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { BsPencil } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getKeteranganSurat = (item) => {
  if (item.id === 1) {
    return "Template format nomor surat jalan. Nomor urut mengikuti pasangan mitra dan kode asal minyak.";
  }
  if (item.id === 2) {
    return "Template format nomor BAST. Nomor urut BAST mengikuti masing-masing mitra.";
  }
  if (item.id === 3) {
    return "Template nomor pengajuan barang dan jasa. NOMOR diganti nomor urut, BULAN diganti bulan romawi, TAHUN diganti tahun tanggal pengajuan.";
  }
  return "Template format nomor dokumen KPBPN.";
};

const BULAN_ROMAWI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const susunContohPengajuan = (pola, urut) => {
  const sekarang = new Date();
  return String(pola || "")
    .split("NOMOR")
    .join(String(urut).padStart(3, "0"))
    .split("BULAN")
    .join(BULAN_ROMAWI[sekarang.getMonth()])
    .split("TAHUN")
    .join(String(sekarang.getFullYear()));
};

const gabungNomorAsal = (kodeAsal, nomorUrut) =>
  `${String(kodeAsal || "").trim()}${String(nomorUrut).padStart(3, "0")}`;

function AdminNomorUrut() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dataNomorSurat, setDataNomorSurat] = useState([]);
  const [dataMitra, setDataMitra] = useState([]);
  const [dataNomorUrutSuratJalan, setDataNomorUrutSuratJalan] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nomorUrutInput, setNomorUrutInput] = useState("");
  const [formatInput, setFormatInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/nomor-surat-kpbpn/get`);
      setDataNomorSurat(res.data.resultNomorSurat || []);
      setDataMitra(res.data.resultMitra || []);
      setDataNomorUrutSuratJalan(res.data.resultNomorUrutSuratJalan || []);
    } catch (err) {
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

  useEffect(() => {
    fetchData();
  }, []);

  const openEditBast = (item) => {
    setEditing({
      ...item,
      jenis: "bast",
      title: `Ubah Nomor Urut BAST ${item.nama}`,
    });
    setNomorUrutInput(String(item.nomorUrut ?? 0));
    onOpen();
  };

  const openEditSuratJalan = (item) => {
    setEditing({
      ...item,
      jenis: "suratJalan",
      title: `Ubah Nomor Urut Surat Jalan ${item.mitraNama}`,
    });
    setNomorUrutInput(String(item.nomorUrut ?? 0));
    onOpen();
  };

  const openEditPengajuan = (item) => {
    setEditing({
      ...item,
      jenis: "pengajuan",
      title: "Ubah Nomor Pengajuan",
    });
    setNomorUrutInput(String(item.nomorUrut ?? 0));
    setFormatInput(item.nomor || "");
    onOpen();
  };

  const closeEdit = () => {
    setEditing(null);
    setNomorUrutInput("");
    setFormatInput("");
    onClose();
  };

  const nomorBerikutnyaPreview = () => {
    const parsed = parseInt(nomorUrutInput, 10);
    if (Number.isNaN(parsed) || parsed < 0) return "-";
    if (editing?.jenis === "suratJalan") {
      return gabungNomorAsal(editing.asalNomor, parsed + 1);
    }
    if (editing?.jenis === "pengajuan") {
      return susunContohPengajuan(formatInput, parsed + 1);
    }
    return parsed + 1;
  };

  const handleSave = async () => {
    const parsed = parseInt(nomorUrutInput, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({
        title: "Nomor urut tidak valid",
        description: "Masukkan angka 0 atau lebih",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (editing?.jenis === "pengajuan" && !formatInput.includes("NOMOR")) {
      toast({
        title: "Format nomor belum lengkap",
        description: "Format wajib memuat kata NOMOR.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const res =
        editing.jenis === "suratJalan"
          ? await axios.post(`${API_BASE}/nomor-surat-kpbpn/edit/surat-jalan`, {
              mitraId: editing.mitraId,
              asalMinyakId: editing.asalMinyakId,
              nomorUrut: parsed,
            })
          : editing.jenis === "pengajuan"
            ? await axios.post(
                `${API_BASE}/nomor-surat-kpbpn/edit/surat/${editing.id}`,
                { nomorUrut: parsed, nomor: formatInput.trim() },
              )
            : await axios.post(
                `${API_BASE}/nomor-surat-kpbpn/edit/mitra/${editing.id}`,
                { nomorUrut: parsed, jenis: "bast" },
              );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      closeEdit();
      fetchData();
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" maxW="1200px">
          <Heading color="kpbpn" mb={4}>
            Nomor Urut Surat
          </Heading>
          <Text color="gray.600" mb={6}>
            Nomor urut BAST mengikuti masing-masing mitra. Nomor urut surat
            jalan mengikuti pasangan mitra dan kode asal minyak. Nomor
            pengajuan memakai format dan nomor urut yang diatur pada baris
            Pengajuan Barang & Jasa.
          </Text>

          {isLoading ? (
            <HStack justify="center" py={10}>
              <Spinner size="lg" color="kpbpn" />
            </HStack>
          ) : (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="md" mb={2}>
                  Format Nomor Dokumen
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Template format nomor diambil dari tabel nomor surat KPBPN.
                  Contoh surat jalan: 08001/KPBPN-SEN/LOG/X/2026, lalu
                  08002 untuk asal yang sama, dan 09001 saat asal minyak
                  berganti. Mitra lain memulai urutannya sendiri, misalnya
                  08001/KPBPN-SSE/LOG/X/2026.
                </Text>
                <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Jenis</Th>
                        <Th>Format Nomor</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataNomorSurat.length === 0 ? (
                        <Tr>
                          <Td colSpan={2} textAlign="center" py={6}>
                            Data nomor surat belum tersedia
                          </Td>
                        </Tr>
                      ) : (
                        dataNomorSurat.map((item) => (
                          <Tr key={item.id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{item.label}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {getKeteranganSurat(item)}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Badge colorScheme="purple">{item.nomor}</Badge>
                                  {item.id === 3 && (
                                    <IconButton
                                      aria-label="Ubah nomor pengajuan"
                                      title="Ubah nomor pengajuan"
                                      icon={<BsPencil />}
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="orange"
                                      onClick={() => openEditPengajuan(item)}
                                    />
                                  )}
                                </HStack>
                                {item.id === 3 && (
                                  <Text fontSize="xs" color="gray.600">
                                    Terakhir {item.nomorUrut ?? 0}. Berikutnya{" "}
                                    {item.contohBerikutnya || "-"}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>

              <Box>
                <Heading size="md" mb={2}>
                  Nomor Urut BAST per Mitra
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Setiap mitra memiliki counter BAST sendiri. Nomor berikutnya
                  adalah nilai tersimpan + 1.
                </Text>
                <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>No</Th>
                        <Th>Kode</Th>
                        <Th>Jenis</Th>
                        <Th>Nama Mitra</Th>
                        <Th>BAST Terakhir</Th>
                        <Th>BAST Berikutnya</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataMitra.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={6}>
                            Belum ada data mitra
                          </Td>
                        </Tr>
                      ) : (
                        dataMitra.map((item, index) => (
                          <Tr key={item.id}>
                            <Td>{index + 1}</Td>
                            <Td>{item.kode || "-"}</Td>
                            <Td>{item.jenisMitra?.jenis || "-"}</Td>
                            <Td fontWeight="medium">{item.nama}</Td>
                            <Td>
                              <HStack spacing={1}>
                                <Text fontWeight="bold">
                                  {item.nomorUrut ?? 0}
                                </Text>
                                <IconButton
                                  aria-label="Ubah nomor urut BAST"
                                  title="Ubah nomor urut BAST"
                                  icon={<BsPencil />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => openEditBast(item)}
                                />
                              </HStack>
                            </Td>
                            <Td>{item.nomorBerikutnya}</Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>

              <Box>
                <Heading size="md" mb={2}>
                  Nomor Urut Surat Jalan per Asal Minyak
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Dua digit depan adalah kode asal minyak. Tiga digit berikutnya
                  adalah nomor urut milik mitra untuk asal tersebut. SEN asal
                  08 dan SEN asal 09 dihitung terpisah, begitu juga SSE asal 08.
                </Text>
                <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>No</Th>
                        <Th>Mitra</Th>
                        <Th>Kode Asal</Th>
                        <Th>Asal Minyak</Th>
                        <Th>Terakhir</Th>
                        <Th>Berikutnya</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataNomorUrutSuratJalan.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={6}>
                            Belum ada pasangan mitra dan asal minyak
                          </Td>
                        </Tr>
                      ) : (
                        dataNomorUrutSuratJalan.map((item, index) => (
                          <Tr key={item.id}>
                            <Td>{index + 1}</Td>
                            <Td>
                              <Text fontWeight="medium">{item.mitraNama}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {item.mitraKode || "-"}
                              </Text>
                            </Td>
                            <Td>{item.asalNomor || "-"}</Td>
                            <Td>{item.asalNama || "-"}</Td>
                            <Td>
                              <HStack spacing={1}>
                                <Text fontWeight="bold">
                                  {item.nomorGabunganTerakhir}
                                </Text>
                                <IconButton
                                  aria-label="Ubah nomor urut surat jalan"
                                  title="Ubah nomor urut surat jalan"
                                  icon={<BsPencil />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="purple"
                                  onClick={() => openEditSuratJalan(item)}
                                />
                              </HStack>
                            </Td>
                            <Td>{item.nomorGabunganBerikutnya}</Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </VStack>
          )}
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={closeEdit} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing?.title || "Ubah Nomor Urut"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              {editing?.jenis === "suratJalan"
                ? `Urutan ini hanya untuk ${editing.mitraNama} pada asal ${editing.asalNomor || "-"} ${editing.asalNama || ""}. Dokumen berikutnya memakai nilai ini ditambah 1.`
                : editing?.jenis === "pengajuan"
                  ? "Nomor pengajuan berikutnya memakai urutan ini ditambah 1, lalu disusun sesuai format."
                  : "Nomor dokumen berikutnya akan memakai nilai ini ditambah 1."}
            </Alert>
            {editing?.jenis === "pengajuan" && (
              <FormControl mb={4}>
                <FormLabel>Format nomor</FormLabel>
                <Input
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  placeholder="PBJ/NOMOR/BULAN/TAHUN"
                />
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Gunakan NOMOR untuk urutan, BULAN untuk bulan romawi, dan
                  TAHUN untuk tahun tanggal pengajuan.
                </Text>
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Nomor urut terakhir</FormLabel>
              <Input
                type="number"
                min={0}
                value={nomorUrutInput}
                onChange={(e) => setNomorUrutInput(e.target.value)}
              />
            </FormControl>
            <Text fontSize="sm" color="gray.600" mt={3}>
              Nomor berikutnya:{" "}
              <Text as="span" fontWeight="bold">
                {nomorBerikutnyaPreview()}
              </Text>
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeEdit}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default AdminNomorUrut;
