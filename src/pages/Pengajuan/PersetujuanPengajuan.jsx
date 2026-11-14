import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { formatJumlah, formatTanggal, statusColor } from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

function statusTugas(item) {
  if (!item.menungguSaya) {
    if (item.tugasMengetahui && item.tugasMenyetujui) {
      return "Menunggu pihak lain";
    }
    if (item.tugasMengetahui && !item.sudahMenyetujui) {
      return "Menunggu General Manager";
    }
    if (item.tugasMenyetujui && !item.sudahMengetahui) {
      return "Menunggu Supervisor";
    }
  }
  if (item.tugasMengetahui && item.tugasMenyetujui) return "Menunggu Anda";
  if (item.tugasMengetahui) return "Sebagai mengetahui";
  return "Sebagai menyetujui";
}

function PersetujuanPengajuan() {
  const toast = useToast();
  const history = useHistory();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aksiId, setAksiId] = useState(null);
  const [tolak, setTolak] = useState(null);
  const [alasan, setAlasan] = useState("");

  const muat = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/pengajuan-barjas/persetujuan`);
      setRows(res.data.result || []);
    } catch (err) {
      toast({
        title: "Gagal memuat persetujuan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    muat();
  }, [muat]);

  const putuskan = async (item, keputusan, alasanPenolakan) => {
    setAksiId(item.id);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/persetujuan/${item.id}`,
        { keputusan, alasanPenolakan },
      );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setTolak(null);
      setAlasan("");
      await muat();
    } catch (err) {
      toast({
        title: "Gagal menyimpan keputusan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setAksiId(null);
    }
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="7xl">
          <Heading size="lg">Persetujuan Pengajuan</Heading>
          <Text color="gray.500" mt={1} mb={6}>
            Status menjadi Disetujui setelah Supervisor dan General Manager yang
            ditunjuk sama-sama menyetujui. Penolakan salah satu pihak mengubah
            status menjadi Ditolak.
          </Text>

          <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto">
            {isLoading ? (
              <Text textAlign="center" color="gray.500" py={12}>
                Memuat data...
              </Text>
            ) : rows.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={12}>
                Tidak ada pengajuan yang menunggu persetujuan Anda.
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nomor</Th>
                    <Th>Tanggal</Th>
                    <Th>Pemohon</Th>
                    <Th>Keperluan</Th>
                    <Th>Item</Th>
                    <Th>Tugas</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => (
                    <Tr
                      key={item.id}
                      cursor="pointer"
                      _hover={{ bg: "orange.50" }}
                      onClick={() => history.push(`/pengajuan/detail/${item.id}`)}
                    >
                      <Td fontWeight="semibold">
                        <Stack spacing={1}>
                          <Text>{item.nomor}</Text>
                          <Badge
                            width="fit-content"
                            colorScheme={item.level === "urgent" ? "red" : "gray"}
                          >
                            {item.level === "urgent" ? "Urgent" : "Normal"}
                          </Badge>
                        </Stack>
                      </Td>
                      <Td>{formatTanggal(item.tanggal)}</Td>
                      <Td>{item.userKPBPN?.nama || "-"}</Td>
                      <Td maxW="280px" whiteSpace="normal">
                        {item.keperluan}
                      </Td>
                      <Td maxW="220px" whiteSpace="normal">
                        {(item.itemPengajuanBarjasKpbpns || [])
                          .map(
                            (barang) =>
                              `${barang.nama} (${formatJumlah(barang.jumlah)} ${barang.satuan})`,
                          )
                          .join(", ") || "-"}
                      </Td>
                      <Td>
                        <Badge colorScheme={statusColor(item.menungguSaya ? "Diajukan" : "Diproses")}>
                          {statusTugas(item)}
                        </Badge>
                      </Td>
                      <Td onClick={(event) => event.stopPropagation()}>
                        <HStack>
                          <Button
                            size="xs"
                            colorScheme="orange"
                            isDisabled={!item.menungguSaya}
                            isLoading={aksiId === item.id}
                            onClick={() => putuskan(item, "setuju")}
                          >
                            Setujui
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            isDisabled={!item.menungguSaya}
                            onClick={() => {
                              setTolak(item);
                              setAlasan("");
                            }}
                          >
                            Tolak
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </Container>
      </Box>

      <Modal isOpen={Boolean(tolak)} onClose={() => setTolak(null)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tolak {tolak?.nomor}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Alasan penolakan</FormLabel>
              <Textarea
                value={alasan}
                onChange={(event) => setAlasan(event.target.value)}
                placeholder="Jelaskan alasan pengajuan ditolak"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setTolak(null)}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              isLoading={aksiId === tolak?.id}
              onClick={() => putuskan(tolak, "tolak", alasan.trim())}
            >
              Tolak pengajuan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default PersetujuanPengajuan;
