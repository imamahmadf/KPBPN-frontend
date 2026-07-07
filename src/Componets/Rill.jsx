import React, { useState } from "react";
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";

function Rill(props) {
  const [item, setItem] = useState("");
  const [nilai, setNilai] = useState(0);
  const [editMode, setEditMode] = useState(null);
  const [editedData, setEditedData] = useState({});
  const {
    isOpen: isRillOpen,
    onOpen: onRillOpen,
    onClose: onRillClose,
  } = useDisclosure();
  const handleChange = (e, field) => {
    const value = e?.target?.value;
    setEditedData((prev) => ({
      ...prev,
      [field]: field === "nilai" ? (typeof value === "number" ? value : parseRupiah(value)) : value,
    }));
  };
  const handleEdit = (item) => {
    setEditMode(item.id);
    setEditedData({
      ...item,
    });
  };
  const formatRupiah = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseRupiah = (str) => {
    if (!str) return 0;
    const onlyDigits = str.toString().replace(/[^0-9]/g, "");
    return onlyDigits ? parseInt(onlyDigits, 10) : 0;
  };
  function hapusRill(val) {
    console.log(val);
    axios
      .post(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/rill/delete`, val)
      .then((res) => {
        console.log(res.data);
        setEditMode(null);
        props.randomNumber(Math.random());
        onRillClose();
      })
      .catch((err) => {
        console.error(err);
      });
  }
  const handleSave = (val) => {
    console.log(val);
    axios
      .post(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/rill/update`, {
        nilai: editedData.nilai,
        id: editedData.id,
        item: editedData.item,
        oldNilai: val.nilai,
        rincianBPDId: val.rincianBPD.id,
        nilaiBPD: val.rincianBPD.nilai,
      })
      .then((res) => {
        setEditMode(null);
        props.randomNumber(Math.random());
        onRillClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };
  const submitRill = () => {
    axios
      .post(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/rill/post`, {
        item,
        nilai,
        rincianBPDId: props.data[0]?.rincianBPDId,
        personilId: props.personilId,
        status: props.data[0]?.rincianBPD?.id ? 1 : 0,
        nilaiBPD: props.data[0]?.rincianBPD?.nilai || 0,
      })
      .then((res) => {
        console.log(res.data);
        props.randomNumber(Math.random());
        onRillClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };
  const isFormStacked = useBreakpointValue({ base: true, md: false });

  return (
    <Box>
      <Button variant="secondary" onClick={onRillOpen} size="sm">
        Rill
      </Button>
      <Modal
        closeOnOverlayClick={false}
        isOpen={isRillOpen}
        onClose={onRillClose}
        size={{ base: "full", md: "4xl", lg: "6xl" }}
      >
        <ModalOverlay />
        <ModalContent
          borderRadius="lg"
          maxWidth={{ base: "100%", md: "900px", lg: "1200px" }}
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 8 }}
        >
          <ModalHeader bg="primary" color="white" borderTopRadius="lg" pr={12}>
            Rill
          </ModalHeader>
          <ModalCloseButton color="white" top={3} right={3} />

          <ModalBody pb={6} pt={6}>
            <Box overflowX="auto" mb={6}>
              <Table variant="primary" size={{ base: "sm", md: "md" }}>
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th>Nilai</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {props?.data?.length > 0 ? (
                    props.data.map((row) => (
                      <Tr key={row.id}>
                        <Td>
                          {editMode === row.id ? (
                            <Input
                              size="sm"
                              bgColor="terang"
                              value={editedData.item ?? ""}
                              onChange={(e) => handleChange(e, "item")}
                            />
                          ) : (
                            row.item
                          )}
                        </Td>
                        <Td>
                          {editMode === row.id ? (
                            <Input
                              size="sm"
                              bgColor="terang"
                              inputMode="numeric"
                              value={formatRupiah(editedData.nilai ?? 0)}
                              onChange={(e) =>
                                handleChange(
                                  { target: { value: parseRupiah(e.target.value) } },
                                  "nilai"
                                )
                              }
                            />
                          ) : (
                            formatRupiah(row.nilai)
                          )}
                        </Td>
                        <Td>
                          {editMode === row.id ? (
                            <HStack spacing={2} flexWrap="wrap">
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="solid"
                                onClick={() => handleSave(row)}
                                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                              >
                                Simpan
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="gray"
                                variant="outline"
                                onClick={() => setEditMode(null)}
                                _hover={{ bg: "gray.100" }}
                              >
                                Batal
                              </Button>
                            </HStack>
                          ) : (
                            <HStack spacing={2} flexWrap="wrap">
                              <Button
                                size="sm"
                                colorScheme="blue"
                                variant="solid"
                                onClick={() => handleEdit(row)}
                                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="solid"
                                onClick={() => hapusRill(row)}
                                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                              >
                                Hapus
                              </Button>
                            </HStack>
                          )}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={3} textAlign="center" py={8} color="gray.500">
                        Belum ada data rill. Tambah data menggunakan form di bawah.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>

            {props.status !== 3 && props.status !== 2 && (
              <Stack
                as="form"
                border="1px solid"
                borderRadius="lg"
                borderColor="gray.200"
                bgColor="terang"
                spacing={4}
                p={6}
                direction={isFormStacked ? "column" : "row"}
                align={isFormStacked ? "stretch" : "flex-end"}
              >
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>
                    Item
                  </FormLabel>
                  <Input
                    placeholder="Masukkan item"
                    bgColor="white"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>
                    Nilai
                  </FormLabel>
                  <Input
                    placeholder="0"
                    inputMode="numeric"
                    bgColor="white"
                    value={formatRupiah(nilai)}
                    onChange={(e) => {
                      const parsed = parseRupiah(e.target.value);
                      setNilai(parsed);
                    }}
                  />
                </FormControl>
                <Button
                  onClick={submitRill}
                  variant="primary"
                  alignSelf={isFormStacked ? "stretch" : "flex-end"}
                >
                  Tambah
                </Button>
              </Stack>
            )}
          </ModalBody>

          <ModalFooter />
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Rill;
