import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const CONFIRM_TEXT = "HAPUS SEMUA";

function AdminData() {
  const toast = useToast();
  const suratJalanModal = useDisclosure();
  const pengisianModal = useDisclosure();
  const ujiLabModal = useDisclosure();
  const pengajuanModal = useDisclosure();

  const [stats, setStats] = useState({
    totalSuratJalan: 0,
    totalKonfirmasi: 0,
    totalProduksi: 0,
    totalPengisianTanki: 0,
    totalPengisianDenganBA: 0,
    totalBABongkarTerkait: 0,
    totalUjiLabK3S: 0,
    totalUjiLabDenganBA: 0,
    totalPengajuan: 0,
    totalItemPengajuan: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingSuratJalan, setIsDeletingSuratJalan] = useState(false);
  const [isDeletingPengisian, setIsDeletingPengisian] = useState(false);
  const [isDeletingUjiLab, setIsDeletingUjiLab] = useState(false);
  const [isDeletingPengajuan, setIsDeletingPengajuan] = useState(false);
  const [confirmSuratJalan, setConfirmSuratJalan] = useState("");
  const [confirmPengisian, setConfirmPengisian] = useState("");
  const [confirmUjiLab, setConfirmUjiLab] = useState("");
  const [confirmPengajuan, setConfirmPengajuan] = useState("");

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [suratRes, pengajuanRes] = await Promise.all([
        axios.get(`${API_BASE}/pengiriman/admin/stats`),
        axios.get(`${API_BASE}/pengajuan-barjas/admin/stats`),
      ]);
      setStats({
        totalSuratJalan: suratRes.data.totalSuratJalan || 0,
        totalKonfirmasi: suratRes.data.totalKonfirmasi || 0,
        totalProduksi: suratRes.data.totalProduksi || 0,
        totalPengisianTanki: suratRes.data.totalPengisianTanki || 0,
        totalPengisianDenganBA: suratRes.data.totalPengisianDenganBA || 0,
        totalBABongkarTerkait: suratRes.data.totalBABongkarTerkait || 0,
        totalUjiLabK3S: suratRes.data.totalUjiLabK3S || 0,
        totalUjiLabDenganBA: suratRes.data.totalUjiLabDenganBA || 0,
        totalPengajuan: pengajuanRes.data.totalPengajuan || 0,
        totalItemPengajuan: pengajuanRes.data.totalItem || 0,
      });
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
    fetchStats();
  }, []);

  const closeSuratJalanModal = () => {
    setConfirmSuratJalan("");
    suratJalanModal.onClose();
  };

  const closePengisianModal = () => {
    setConfirmPengisian("");
    pengisianModal.onClose();
  };

  const closeUjiLabModal = () => {
    setConfirmUjiLab("");
    ujiLabModal.onClose();
  };

  const closePengajuanModal = () => {
    setConfirmPengajuan("");
    pengajuanModal.onClose();
  };

  const handleDeleteAllSuratJalan = async () => {
    if (confirmSuratJalan !== CONFIRM_TEXT) return;

    setIsDeletingSuratJalan(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengiriman/admin/delete-all-surat-jalan`,
      );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      closeSuratJalanModal();
      fetchStats();
    } catch (err) {
      toast({
        title: "Gagal menghapus data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingSuratJalan(false);
    }
  };

  const handleDeleteAllPengisian = async () => {
    if (confirmPengisian !== CONFIRM_TEXT) return;

    setIsDeletingPengisian(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengiriman/admin/delete-all-pengisian-tanki`,
      );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      closePengisianModal();
      fetchStats();
    } catch (err) {
      toast({
        title: "Gagal menghapus data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingPengisian(false);
    }
  };

  const handleDeleteAllUjiLab = async () => {
    if (confirmUjiLab !== CONFIRM_TEXT) return;

    setIsDeletingUjiLab(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengiriman/admin/delete-all-uji-lab`,
      );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      closeUjiLabModal();
      fetchStats();
    } catch (err) {
      toast({
        title: "Gagal menghapus data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingUjiLab(false);
    }
  };

  const handleDeleteAllPengajuan = async () => {
    if (confirmPengajuan !== CONFIRM_TEXT) return;

    setIsDeletingPengajuan(true);
    try {
      const res = await axios.post(`${API_BASE}/pengajuan-barjas/admin/delete-all`);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      closePengajuanModal();
      fetchStats();
    } catch (err) {
      toast({
        title: "Gagal menghapus data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingPengajuan(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" maxW="900px">
          <Heading color="kpbpn" mb={4}>
            Kelola Data
          </Heading>
          <Text color="gray.600" mb={6}>
            Halaman ini digunakan untuk menghapus seluruh data surat jalan,
            pengisian tanki, uji lab K3S, atau pengajuan barang dan jasa.
            Tindakan ini bersifat permanen.
          </Text>

          <VStack spacing={6} align="stretch">
            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                Menghapus surat jalan juga akan menghapus konfirmasi penerimaan
                dan produksi sumur yang terkait.
              </Alert>
              <HStack justify="space-between" align="flex-start" spacing={6}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={2}>
                    Surat Jalan
                  </Text>
                  {isLoading ? (
                    <Spinner size="sm" color="kpbpn" />
                  ) : (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.700">
                        Jumlah surat jalan:{" "}
                        <Text as="span" fontWeight="bold">
                          {stats.totalSuratJalan}
                        </Text>
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Konfirmasi penerimaan terkait: {stats.totalKonfirmasi}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Produksi sumur terkait: {stats.totalProduksi}
                      </Text>
                    </VStack>
                  )}
                </Box>
                <Button
                  colorScheme="red"
                  onClick={suratJalanModal.onOpen}
                  isDisabled={isLoading || stats.totalSuratJalan === 0}
                >
                  Hapus Semua Surat Jalan
                </Button>
              </HStack>
            </Box>

            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                Menghapus pengisian tanki juga akan menghapus BA Bongkar, uji
                lab, dan BAK3S yang terkait.
              </Alert>
              <HStack justify="space-between" align="flex-start" spacing={6}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={2}>
                    Pengisian Tanki
                  </Text>
                  {isLoading ? (
                    <Spinner size="sm" color="kpbpn" />
                  ) : (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.700">
                        Jumlah pengisian tanki:{" "}
                        <Text as="span" fontWeight="bold">
                          {stats.totalPengisianTanki}
                        </Text>
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Terhubung BA Bongkar: {stats.totalPengisianDenganBA}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        BA Bongkar terkait: {stats.totalBABongkarTerkait}
                      </Text>
                    </VStack>
                  )}
                </Box>
                <Button
                  colorScheme="red"
                  onClick={pengisianModal.onOpen}
                  isDisabled={isLoading || stats.totalPengisianTanki === 0}
                >
                  Hapus Semua Pengisian Tanki
                </Button>
              </HStack>
            </Box>

            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                Menghapus uji lab K3S akan menghapus seluruh data uji lab,
                termasuk yang sudah terhubung ke BA Bongkar. BA Bongkar tidak
                ikut terhapus.
              </Alert>
              <HStack justify="space-between" align="flex-start" spacing={6}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={2}>
                    Uji Lab K3S
                  </Text>
                  {isLoading ? (
                    <Spinner size="sm" color="kpbpn" />
                  ) : (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.700">
                        Jumlah uji lab K3S:{" "}
                        <Text as="span" fontWeight="bold">
                          {stats.totalUjiLabK3S}
                        </Text>
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Terhubung BA Bongkar: {stats.totalUjiLabDenganBA}
                      </Text>
                    </VStack>
                  )}
                </Box>
                <Button
                  colorScheme="red"
                  onClick={ujiLabModal.onOpen}
                  isDisabled={isLoading || stats.totalUjiLabK3S === 0}
                >
                  Hapus Semua Uji Lab K3S
                </Button>
              </HStack>
            </Box>

            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                Menghapus pengajuan juga menghapus item dan foto di dalamnya.
                Stok yang masuk dari pengajuan ikut dikurangi. Daftar item
                terdaftar tetap ada.
              </Alert>
              <HStack justify="space-between" align="flex-start" spacing={6}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={2}>
                    Pengajuan Barang & Jasa
                  </Text>
                  {isLoading ? (
                    <Spinner size="sm" color="kpbpn" />
                  ) : (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.700">
                        Jumlah pengajuan:{" "}
                        <Text as="span" fontWeight="bold">
                          {stats.totalPengajuan}
                        </Text>
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Item terkait: {stats.totalItemPengajuan}
                      </Text>
                    </VStack>
                  )}
                </Box>
                <Button
                  colorScheme="red"
                  onClick={pengajuanModal.onOpen}
                  isDisabled={isLoading || stats.totalPengajuan === 0}
                >
                  Hapus Semua Pengajuan
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      <Modal
        isOpen={suratJalanModal.isOpen}
        onClose={closeSuratJalanModal}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus Semua Surat Jalan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3}>
              Anda akan menghapus{" "}
              <Text as="span" fontWeight="bold">
                {stats.totalSuratJalan} surat jalan
              </Text>
              , beserta {stats.totalKonfirmasi} konfirmasi penerimaan dan{" "}
              {stats.totalProduksi} produksi sumur terkait. Tindakan ini tidak
              dapat dibatalkan.
            </Text>
            <Text fontSize="sm" mb={2}>
              Ketik{" "}
              <Text as="span" fontWeight="bold">
                {CONFIRM_TEXT}
              </Text>{" "}
              untuk konfirmasi.
            </Text>
            <Input
              placeholder={CONFIRM_TEXT}
              value={confirmSuratJalan}
              onChange={(e) => setConfirmSuratJalan(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeSuratJalanModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAllSuratJalan}
              isLoading={isDeletingSuratJalan}
              isDisabled={confirmSuratJalan !== CONFIRM_TEXT}
            >
              Hapus Semua
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={pengisianModal.isOpen}
        onClose={closePengisianModal}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus Semua Pengisian Tanki</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3}>
              Anda akan menghapus{" "}
              <Text as="span" fontWeight="bold">
                {stats.totalPengisianTanki} pengisian tanki
              </Text>
              , beserta {stats.totalBABongkarTerkait} BA Bongkar terkait
              termasuk uji lab dan BAK3S. Tindakan ini tidak dapat dibatalkan.
            </Text>
            <Text fontSize="sm" mb={2}>
              Ketik{" "}
              <Text as="span" fontWeight="bold">
                {CONFIRM_TEXT}
              </Text>{" "}
              untuk konfirmasi.
            </Text>
            <Input
              placeholder={CONFIRM_TEXT}
              value={confirmPengisian}
              onChange={(e) => setConfirmPengisian(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closePengisianModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAllPengisian}
              isLoading={isDeletingPengisian}
              isDisabled={confirmPengisian !== CONFIRM_TEXT}
            >
              Hapus Semua
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={ujiLabModal.isOpen} onClose={closeUjiLabModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus Semua Uji Lab K3S</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3}>
              Anda akan menghapus{" "}
              <Text as="span" fontWeight="bold">
                {stats.totalUjiLabK3S} uji lab K3S
              </Text>
              , termasuk {stats.totalUjiLabDenganBA} data yang terhubung ke BA
              Bongkar. BA Bongkar tidak ikut terhapus. Tindakan ini tidak dapat
              dibatalkan.
            </Text>
            <Text fontSize="sm" mb={2}>
              Ketik{" "}
              <Text as="span" fontWeight="bold">
                {CONFIRM_TEXT}
              </Text>{" "}
              untuk konfirmasi.
            </Text>
            <Input
              placeholder={CONFIRM_TEXT}
              value={confirmUjiLab}
              onChange={(e) => setConfirmUjiLab(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeUjiLabModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAllUjiLab}
              isLoading={isDeletingUjiLab}
              isDisabled={confirmUjiLab !== CONFIRM_TEXT}
            >
              Hapus Semua
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={pengajuanModal.isOpen}
        onClose={closePengajuanModal}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus Semua Pengajuan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3}>
              Anda akan menghapus{" "}
              <Text as="span" fontWeight="bold">
                {stats.totalPengajuan} pengajuan
              </Text>{" "}
              dan {stats.totalItemPengajuan} item di dalamnya, termasuk fotonya.
              Stok yang berasal dari pengajuan ikut dikurangi. Tindakan ini
              tidak dapat dibatalkan.
            </Text>
            <Text fontSize="sm" mb={2}>
              Ketik{" "}
              <Text as="span" fontWeight="bold">
                {CONFIRM_TEXT}
              </Text>{" "}
              untuk konfirmasi.
            </Text>
            <Input
              placeholder={CONFIRM_TEXT}
              value={confirmPengajuan}
              onChange={(e) => setConfirmPengajuan(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closePengajuanModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAllPengajuan}
              isLoading={isDeletingPengajuan}
              isDisabled={confirmPengajuan !== CONFIRM_TEXT}
            >
              Hapus Semua
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default AdminData;
