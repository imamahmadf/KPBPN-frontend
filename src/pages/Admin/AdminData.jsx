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
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [stats, setStats] = useState({
    totalSuratJalan: 0,
    totalKonfirmasi: 0,
    totalProduksi: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/pengiriman/admin/stats`);
      setStats({
        totalSuratJalan: res.data.totalSuratJalan || 0,
        totalKonfirmasi: res.data.totalKonfirmasi || 0,
        totalProduksi: res.data.totalProduksi || 0,
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

  const closeModal = () => {
    setConfirmInput("");
    onClose();
  };

  const handleDeleteAll = async () => {
    if (confirmInput !== CONFIRM_TEXT) return;

    setIsDeleting(true);
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
      closeModal();
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
      setIsDeleting(false);
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
            Halaman ini digunakan untuk menghapus seluruh data surat jalan.
            Tindakan ini bersifat permanen.
          </Text>

          <Alert status="warning" borderRadius="md" mb={6}>
            <AlertIcon />
            Menghapus surat jalan juga akan menghapus konfirmasi penerimaan dan
            produksi sumur yang terkait.
          </Alert>

          <Box borderWidth="1px" borderRadius="lg" p={6}>
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
                onClick={onOpen}
                isDisabled={isLoading || stats.totalSuratJalan === 0}
              >
                Hapus Semua Surat Jalan
              </Button>
            </HStack>
          </Box>
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={closeModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus Semua Data</ModalHeader>
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
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteAll}
              isLoading={isDeleting}
              isDisabled={confirmInput !== CONFIRM_TEXT}
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
