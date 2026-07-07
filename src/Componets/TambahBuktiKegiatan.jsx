import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useDisclosure } from "@chakra-ui/react";
import Foto from "../assets/add_photo.png";
import { useFormik } from "formik";
import * as Yup from "yup";
import YupPassword from "yup-password";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  Heading,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Image,
  ModalCloseButton,
  Container,
  FormControl,
  Alert,
  Toast,
  Input,
  FormHelperText,
  Spacer,
  SimpleGrid,
  IconButton,
  Flex,
  Badge,
  HStack,
  VStack,
  Center,
} from "@chakra-ui/react";
import { BsImage, BsX, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { useToast } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../Redux/Reducers/auth";
function TambahBuktiKegiatan(props) {
  const inputFileRef = useRef(null);
  const toast = useToast();
  const [fileSizeMsg, setFileSizeMsg] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const {
    isOpen: isInputOpen,
    onOpen: onInputOpen,
    onClose: onInputClose,
  } = useDisclosure();
  const {
    isOpen: isGalleryOpen,
    onOpen: onGalleryOpen,
    onClose: onGalleryClose,
  } = useDisclosure();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleFile = (event) => {
    const files = Array.from(event.target.files);
    setFileSizeMsg("");

    // Validasi ukuran file untuk semua file
    const invalidFiles = files.filter((file) => file.size / 1024 > 1024);
    if (invalidFiles.length > 0) {
      setFileSizeMsg("Beberapa file melebihi batas maksimal 1MB");
      return;
    }

    // Tambahkan file baru ke array yang sudah ada
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Buat preview URLs untuk semua file
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);

    formik.setFieldValue("pic", newFiles);

    // Reset input file agar bisa memilih file yang sama lagi
    event.target.value = "";
  };

  const removeFile = (index) => {
    // Hapus file dari array
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    // Revoke URL untuk mencegah memory leak
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    formik.setFieldValue("pic", newFiles);
  };

  // Cleanup preview URLs saat component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleClose = () => {
    // Cleanup preview URLs saat modal ditutup
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFileSizeMsg("");
    onInputClose();
  };
  const formik = useFormik({
    initialValues: {},
    // onSubmit: (values) => {
    //   alert(JSON.stringify(values, null, 2));
    // },
    validationSchema: Yup.object().shape({}),
    validateOnChange: false,
    onSubmit: async (values) => {
      if (selectedFiles.length === 0) {
        toast({
          title: "Peringatan!",
          description: "Silakan pilih minimal 1 foto.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      console.log(selectedFiles, "tes formik");

      // kirim data ke back-end
      const formData = new FormData();
      formData.append("perjalananId", props.id);

      // Append semua file dengan nama field yang sama (backend akan menerima sebagai array)
      selectedFiles.forEach((file) => {
        formData.append("pic", file);
      });

      // Log data yang akan dikirim untuk debugging
      console.log("Data yang dikirim:", {
        perjalananId: props.id,
        jumlahFile: selectedFiles.length,
      });

      await axios
        .post(
          `${
            import.meta.env.VITE_REACT_APP_API_BASE_URL
          }/kwitansi/post/bukti-perjalanan`,
          formData
        )
        .then((res) => {
          // Menampilkan toast setelah berhasil
          console.log(res.data);
          const fileCount = selectedFiles.length;
          props.randomNumber(Math.random());

          // Cleanup preview URLs
          previewUrls.forEach((url) => URL.revokeObjectURL(url));
          setSelectedFiles([]);
          setPreviewUrls([]);
          setFileSizeMsg("");

          handleClose();

          toast({
            title: "Berhasil!",
            description: `${fileCount} foto berhasil disimpan.`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: "Error!",
            description: "Gagal menyimpan foto. Silakan coba lagi.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        });
    },
  });
  // Ambil array foto dari props
  const fotoPerjalanan = props.fotoPerjalanan || [];
  const hasFoto = fotoPerjalanan.length > 0;

  return (
    <Box 
      position="relative" 
      borderRadius="lg" 
      overflow="hidden" 
      shadow="md"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {hasFoto ? (
        <Box flex={1} display="flex" flexDirection="column" position="relative">
          {/* Foto utama (foto pertama) */}
          <Box
            cursor="pointer"
            onClick={onGalleryOpen}
            position="relative"
            overflow="hidden"
            borderRadius="lg"
            flex={1}
            minH="240px"
          >
            {/* Badge jumlah foto */}
            <Box position="absolute" top="10px" right="10px" zIndex={2}>
              <Badge
                colorScheme="blue"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
                shadow="md"
              >
                {fotoPerjalanan.length} Foto
              </Badge>
            </Box>
            <Image
              borderRadius="lg"
              alt="foto kegiatan"
              width="100%"
              height="100%"
              minH="240px"
              objectFit="cover"
              src={
                import.meta.env.VITE_REACT_APP_API_BASE_URL +
                fotoPerjalanan[0].foto
              }
              transition="transform 0.3s ease"
              _hover={{ transform: "scale(1.02)" }}
            />
            {/* Overlay untuk hover effect */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.400"
              opacity={0}
              _hover={{ opacity: 1 }}
              transition="opacity 0.3s"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontWeight="semibold" fontSize="lg">
                Klik untuk melihat semua foto
              </Text>
            </Box>
          </Box>

          {/* Grid foto tambahan di bawah */}
          {fotoPerjalanan.length > 1 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={3}>
              {fotoPerjalanan.slice(1, 5).map((foto, index) => (
                <Box
                  key={foto.id}
                  cursor="pointer"
                  onClick={onGalleryOpen}
                  position="relative"
                  overflow="hidden"
                  borderRadius="md"
                  shadow="sm"
                  _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                >
                  <Image
                    borderRadius="md"
                    alt={`foto kegiatan ${index + 2}`}
                    width="100%"
                    height="120px"
                    objectFit="cover"
                    src={
                      import.meta.env.VITE_REACT_APP_API_BASE_URL + foto.foto
                    }
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Indicator jika ada lebih dari 5 foto */}
          {fotoPerjalanan.length > 5 && (
            <Center mt={3}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onGalleryOpen}
                colorScheme="blue"
              >
                Lihat {fotoPerjalanan.length - 5} foto lainnya →
              </Button>
            </Center>
          )}

          {/* Tombol Tambah - di bawah semua foto */}
          {props.status === 1 || props.status == 4 ? (
            <Button
              onClick={onInputOpen}
              mt={4}
              w="100%"
              h="45px"
              colorScheme="blue"
              shadow="md"
              borderRadius="md"
              leftIcon={<BsImage />}
              fontWeight="semibold"
              _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              transition="all 0.2s"
            >
              Tambah Foto
            </Button>
          ) : null}
        </Box>
      ) : (
        <Box 
          position="relative"
          flex={1}
          minH="240px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            borderRadius="lg"
            alt="foto kegiatan"
            width="100%"
            height="100%"
            minH="240px"
            objectFit="cover"
            src={Foto}
            opacity={0.7}
          />
          <Center
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            flexDirection="column"
            gap={2}
          >
      
          </Center>
          {/* Tombol Tambah - untuk kondisi belum ada foto */}
          {props.status === 1 || props.status == 4 ? (
            <Button
              onClick={onInputOpen}
              position="absolute"
              bottom="15px"
              left="15px"
              right="15px"
              h="45px"
              colorScheme="blue"
              shadow="lg"
              borderRadius="md"
              leftIcon={<BsImage />}
              fontWeight="semibold"
              _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
              transition="all 0.2s"
            >
              Tambah Foto
            </Button>
          ) : null}
        </Box>
      )}

      <Modal
        closeOnOverlayClick={false}
        isOpen={isInputOpen}
        onClose={handleClose}
        size="xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" maxWidth="900px">
          <ModalHeader
            bg="blue.50"
            borderTopRadius="xl"
            py={4}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <HStack>
              <BsImage />
              <Text>Upload Foto Kegiatan</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6} pt={6}>
            <VStack spacing={6} align="stretch">
              {/* Input file hidden */}
              <FormControl>
                <Input
                  onChange={handleFile}
                  ref={inputFileRef}
                  accept="image/png, image/jpeg"
                  display="none"
                  type="file"
                  multiple
                />
              </FormControl>

              {/* Preview area */}
              {previewUrls.length > 0 ? (
                <Box>
                  <HStack mb={4} justify="space-between">
                    <Text fontWeight="semibold" fontSize="lg" color="gray.700">
                      Foto yang dipilih ({previewUrls.length})
                    </Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {previewUrls.length} Foto
                    </Badge>
                  </HStack>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                    {previewUrls.map((url, index) => (
                      <Box
                        key={index}
                        position="relative"
                        borderRadius="lg"
                        overflow="hidden"
                        shadow="md"
                        _hover={{ shadow: "lg", transform: "scale(1.02)" }}
                        transition="all 0.2s"
                      >
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width="100%"
                          height="200px"
                          objectFit="cover"
                        />
                        <IconButton
                          aria-label="Hapus foto"
                          icon={<BsX size={20} />}
                          position="absolute"
                          top="8px"
                          right="8px"
                          size="sm"
                          colorScheme="red"
                          borderRadius="full"
                          onClick={() => removeFile(index)}
                          shadow="md"
                          _hover={{ transform: "scale(1.1)" }}
                        />
                        <Box
                          position="absolute"
                          bottom="8px"
                          left="8px"
                          bg="blackAlpha.700"
                          color="white"
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="semibold"
                        >
                          Foto {index + 1}
                        </Box>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              ) : (
                <Box
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="xl"
                  p={8}
                  textAlign="center"
                  bg="gray.50"
                  _hover={{ borderColor: "blue.400", bg: "blue.50" }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => inputFileRef.current.click()}
                >
                  <VStack spacing={4}>
                    <BsImage size={64} color="gray" />
                    <VStack spacing={2}>
                      <Text fontWeight="semibold" color="gray.700">
                        Klik untuk memilih foto
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        atau drag & drop foto di sini
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              )}

              {/* Upload button */}
              <FormControl>
                <Button
                  variant="outline"
                  w="100%"
                  size="lg"
                  leftIcon={<BsImage />}
                  onClick={() => inputFileRef.current.click()}
                  colorScheme="blue"
                  borderWidth="2px"
                >
                  {selectedFiles.length > 0 ? "Tambah Foto Lagi" : "Pilih Foto"}
                </Button>
                <FormHelperText textAlign="center" mt={2}>
                  Maksimal 1MB per file. Format: JPG, PNG
                </FormHelperText>
                {fileSizeMsg && (
                  <Alert status="error" mt={3} borderRadius="md">
                    <Text>{fileSizeMsg}</Text>
                  </Alert>
                )}
              </FormControl>

              {/* Submit button */}
              <Button
                colorScheme="blue"
                size="lg"
                onClick={formik.handleSubmit}
                w="100%"
                isDisabled={selectedFiles.length === 0}
                isLoading={formik.isSubmitting}
                fontWeight="semibold"
                shadow="md"
                _hover={{ shadow: "lg" }}
              >
                {selectedFiles.length > 0
                  ? `Upload ${selectedFiles.length} Foto`
                  : "Pilih Foto Terlebih Dahulu"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Gallery Modal untuk melihat semua foto */}
      {hasFoto && (
        <Modal
          isOpen={isGalleryOpen}
          onClose={onGalleryClose}
          size="full"
          isCentered
        >
          <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(4px)" />
          <ModalContent bg="blackAlpha.950" borderRadius={0} m={0} h="100vh">
            <ModalHeader
              color="white"
              borderBottom="1px solid"
              borderColor="whiteAlpha.200"
              py={4}
            >
              <HStack>
                <BsImage />
                <Text>Foto Kegiatan</Text>
                <Badge colorScheme="blue" ml={2}>
                  {fotoPerjalanan.length} Foto
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="white" size="lg" />
            <ModalBody pb={6} pt={4}>
              <Flex direction="column" align="center" h="calc(100vh - 180px)">
                {/* Foto utama yang dipilih */}
                <Box
                  flex="1"
                  w="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Image
                    src={
                      import.meta.env.VITE_REACT_APP_API_BASE_URL +
                      fotoPerjalanan[selectedImageIndex]?.foto
                    }
                    alt={`Foto ${selectedImageIndex + 1}`}
                    maxH="75vh"
                    maxW="100%"
                    objectFit="contain"
                    borderRadius="lg"
                    shadow="2xl"
                  />
                  {/* Navigasi dengan icon di kiri kanan foto */}
                  {fotoPerjalanan.length > 1 && (
                    <>
                      <IconButton
                        aria-label="Foto sebelumnya"
                        icon={<BsChevronLeft />}
                        position="absolute"
                        left="20px"
                        size="lg"
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() =>
                          setSelectedImageIndex(
                            selectedImageIndex > 0
                              ? selectedImageIndex - 1
                              : fotoPerjalanan.length - 1
                          )
                        }
                        shadow="lg"
                      />
                      <IconButton
                        aria-label="Foto selanjutnya"
                        icon={<BsChevronRight />}
                        position="absolute"
                        right="20px"
                        size="lg"
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() =>
                          setSelectedImageIndex(
                            selectedImageIndex < fotoPerjalanan.length - 1
                              ? selectedImageIndex + 1
                              : 0
                          )
                        }
                        shadow="lg"
                      />
                    </>
                  )}
                </Box>

                {/* Counter dan navigasi */}
                <Flex justify="center" align="center" w="100%" mt={4} gap={4}>
                  <Text
                    color="white"
                    fontWeight="semibold"
                    fontSize="lg"
                    bg="blackAlpha.500"
                    px={4}
                    py={2}
                    borderRadius="full"
                  >
                    {selectedImageIndex + 1} / {fotoPerjalanan.length}
                  </Text>
                </Flex>

                {/* Thumbnail grid di bawah */}
                {fotoPerjalanan.length > 1 && (
                  <Box
                    mt={4}
                    w="100%"
                    maxH="140px"
                    overflowX="auto"
                    overflowY="hidden"
                    css={{
                      "&::-webkit-scrollbar": {
                        height: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(255,255,255,0.3)",
                        borderRadius: "4px",
                      },
                    }}
                  >
                    <HStack spacing={3} align="flex-start">
                      {fotoPerjalanan.map((foto, index) => (
                        <Box
                          key={foto.id}
                          cursor="pointer"
                          border={
                            selectedImageIndex === index
                              ? "3px solid"
                              : "2px solid"
                          }
                          borderColor={
                            selectedImageIndex === index
                              ? "blue.400"
                              : "whiteAlpha.300"
                          }
                          borderRadius="lg"
                          overflow="hidden"
                          onClick={() => setSelectedImageIndex(index)}
                          _hover={{
                            borderColor: "blue.300",
                            transform: "scale(1.05)",
                          }}
                          transition="all 0.2s"
                          flexShrink={0}
                          shadow={selectedImageIndex === index ? "lg" : "md"}
                        >
                          <Image
                            src={
                              import.meta.env.VITE_REACT_APP_API_BASE_URL +
                              foto.foto
                            }
                            alt={`Thumbnail ${index + 1}`}
                            width="120px"
                            height="120px"
                            objectFit="cover"
                          />
                        </Box>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

export default TambahBuktiKegiatan;
