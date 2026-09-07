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

  const [stats, setStats] = useState({
    totalSuratJalan: 0,
    totalKonfirmasi: 0,
    totalProduksi: 0,
    totalPengisianTanki: 0,
    totalPengisianDenganBA: 0,
    totalBABongkarTerkait: 0,
    totalUjiLabK3S: 0,
    totalUjiLabDenganBA: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingSuratJalan, setIsDeletingSuratJalan] = useState(false);
  const [isDeletingPengisian, setIsDeletingPengisian] = useState(false);
  const [isDeletingUjiLab, setIsDeletingUjiLab] = useState(false);
  const [confirmSuratJalan, setConfirmSuratJalan] = useState("");
  const [confirmPengisian, setConfirmPengisian] = useState("");
  const [confirmUjiLab, setConfirmUjiLab] = useState("");

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/pengiriman/admin/stats`);
      setStats({
        totalSuratJalan: res.data.totalSuratJalan || 0,
        totalKonfirmasi: res.data.totalKonfirmasi || 0,
        totalProduksi: res.data.totalProduksi || 0,
        totalPengisianTanki: res.data.totalPengisianTanki || 0,
        totalPengisianDenganBA: res.data.totalPengisianDenganBA || 0,
        totalBABongkarTerkait: res.data.totalBABongkarTerkait || 0,
        totalUjiLabK3S: res.data.totalUjiLabK3S || 0,
        totalUjiLabDenganBA: res.data.totalUjiLabDenganBA || 0,
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

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" maxW="900px">
          <Heading color="kpbpn" mb={4}>
            Kelola Data
          </Heading>
          <Text color="gray.600" mb={6}>
            Halaman ini digunakan untuk menghapus seluruh data surat jalan,
            pengisian tanki, atau uji lab K3S. Tindakan ini bersifat permanen.
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
    </LayoutKPBPN>
  );
}

export default AdminData;
