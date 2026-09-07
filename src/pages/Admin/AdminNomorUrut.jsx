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
    return "Dipakai saat verifikasi surat jalan. Nomor berikutnya adalah nilai ini + 1.";
  }
  if (item.id === 2) {
    return "Template format nomor BAST. Nomor urut BAST mengikuti masing-masing mitra.";
  }
  return "Nomor urut dokumen KPBPN.";
};

function AdminNomorUrut() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [dataNomorSurat, setDataNomorSurat] = useState([]);
  const [dataMitra, setDataMitra] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nomorUrutInput, setNomorUrutInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/nomor-surat-kpbpn/get`);
      setDataNomorSurat(res.data.resultNomorSurat || []);
      setDataMitra(res.data.resultMitra || []);
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

  const openEdit = (item, jenis) => {
    setEditing({
      ...item,
      jenis,
      title:
        jenis === "surat"
          ? `Ubah Nomor Urut ${item.label || "Dokumen"}`
          : `Ubah Nomor Urut BAST ${item.nama}`,
    });
    setNomorUrutInput(String(item.nomorUrut ?? 0));
    onOpen();
  };

  const closeEdit = () => {
    setEditing(null);
    setNomorUrutInput("");
    onClose();
  };

  const nomorBerikutnyaPreview = () => {
    const parsed = parseInt(nomorUrutInput, 10);
    if (Number.isNaN(parsed) || parsed < 0) return "-";
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

    setIsSaving(true);
    try {
      const endpoint =
        editing.jenis === "surat"
          ? `${API_BASE}/nomor-surat-kpbpn/edit/surat/${editing.id}`
          : `${API_BASE}/nomor-surat-kpbpn/edit/mitra/${editing.id}`;

      const res = await axios.post(endpoint, { nomorUrut: parsed });
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
        <Container variant="primary" p="30px" my="30px" maxW="1100px">
          <Heading color="kpbpn" mb={4}>
            Nomor Urut Surat
          </Heading>
          <Text color="gray.600" mb={6}>
            Atur nomor urut terakhir yang tersimpan. Dokumen berikutnya akan
            memakai nilai ini ditambah 1.
          </Text>

          {isLoading ? (
            <HStack justify="center" py={10}>
              <Spinner size="lg" color="kpbpn" />
            </HStack>
          ) : (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="md" mb={2}>
                  Nomor Urut Global
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Counter surat jalan diambil dari tabel nomor surat KPBPN.
                  Nomor urut BAST mengikuti masing-masing mitra.
                </Text>
                <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Jenis</Th>
                        <Th>Format Nomor</Th>
                        <Th>Nomor Urut Terakhir</Th>
                        <Th>Nomor Berikutnya</Th>
                        <Th>Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataNomorSurat.length === 0 ? (
                        <Tr>
                          <Td colSpan={5} textAlign="center" py={6}>
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
                              <Badge colorScheme="purple">{item.nomor}</Badge>
                            </Td>
                            <Td fontWeight="bold">{item.nomorUrut ?? 0}</Td>
                            <Td>{item.nomorBerikutnya}</Td>
                            <Td>
                              <IconButton
                                aria-label="Ubah nomor urut"
                                icon={<BsPencil />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEdit(item, "surat")}
                              />
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
                        <Th>Nomor Urut Terakhir</Th>
                        <Th>Nomor Berikutnya</Th>
                        <Th>Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataMitra.length === 0 ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={6}>
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
                            <Td fontWeight="bold">{item.nomorUrut ?? 0}</Td>
                            <Td>{item.nomorBerikutnya}</Td>
                            <Td>
                              <IconButton
                                aria-label="Ubah nomor urut mitra"
                                icon={<BsPencil />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEdit(item, "mitra")}
                              />
                            </Td>
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
              Nomor dokumen berikutnya akan memakai nilai ini ditambah 1.
            </Alert>
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
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default AdminNomorUrut;
