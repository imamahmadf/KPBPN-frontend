import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "../Componets/Layout";
import { useDisclosure } from "@chakra-ui/react";
import Foto from "../assets/add_photo.png";
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
  FormLabel,
  HStack,
  Table,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Input,
  FormHelperText,
  VStack,
  Icon,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { FaEye, FaEyeSlash, FaLock, FaUser, FaEdit, FaCamera } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { persistUpdatedUser, userRedux } from "../Redux/Reducers/auth";

function Profile() {
  const user = useSelector(userRedux);
  const dispatch = useDispatch();
  const toast = useToast();
  const [dataProfile, setDataProfile] = useState(null);

  const {
    isOpen: isOpenGantiPassword,
    onOpen: onOpenGantiPassword,
    onClose: onCloseGantiPassword,
  } = useDisclosure();
  const {
    isOpen: isOpenEditProfil,
    onOpen: onOpenEditProfil,
    onClose: onCloseEditProfil,
  } = useDisclosure();
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfil, setIsSavingProfil] = useState(false);
  const [formNama, setFormNama] = useState("");
  const [formNamaPengguna, setFormNamaPengguna] = useState("");
  const {
    isOpen: isOpenEditFoto,
    onOpen: onOpenEditFoto,
    onClose: onCloseEditFoto,
  } = useDisclosure();
  const fileInputRef = useRef(null);
  const [selectedFoto, setSelectedFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const token = localStorage.getItem("token");

  const getFotoUrl = (profilePic) =>
    profilePic
      ? `${import.meta.env.VITE_REACT_APP_API_BASE_URL}${profilePic}`
      : Foto;

  async function fetchProfile() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/profile/${user.id}`,
      );
      setDataProfile(res.data.result);
      if (res.data.result?.profilePic) {
        dispatch(
          persistUpdatedUser({ profilePic: res.data.result.profilePic }),
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (previewFoto) {
        URL.revokeObjectURL(previewFoto);
      }
    };
  }, [previewFoto]);

  const handleOpenEditProfil = () => {
    setFormNama(dataProfile?.nama || "");
    setFormNamaPengguna(dataProfile?.namaPengguna || "");
    onOpenEditProfil();
  };

  const handleUpdateProfile = async () => {
    const nama = formNama.trim();
    const namaPengguna = formNamaPengguna.trim();

    if (!nama || !namaPengguna) {
      toast({
        title: "Error",
        description: "Nama dan nama pengguna harus diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (namaPengguna.length < 3) {
      toast({
        title: "Error",
        description: "Nama pengguna minimal 3 karakter",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSavingProfil(true);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/update-profile`,
        { nama, namaPengguna },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updated = res.data.result;
      setDataProfile(updated);
      dispatch(
        persistUpdatedUser({
          id: updated.id,
          nama: updated.nama,
          namaPengguna: updated.namaPengguna,
          mitraId: updated.mitraId,
          profilePic: updated.profilePic,
        }),
      );

      toast({
        title: "Berhasil",
        description: res.data.message || "Profil berhasil diperbarui",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onCloseEditProfil();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Gagal mengubah profil. Silakan coba lagi.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingProfil(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 2MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedFoto(file);
    const preview = URL.createObjectURL(file);
    setPreviewFoto(preview);
  };

  const handleCancelEditFoto = () => {
    setSelectedFoto(null);
    if (previewFoto) {
      URL.revokeObjectURL(previewFoto);
    }
    setPreviewFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCloseEditFoto();
  };

  const handleUploadFoto = async () => {
    if (!selectedFoto) {
      toast({
        title: "Error",
        description: "Silakan pilih foto terlebih dahulu",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedFoto);
      if (dataProfile?.profilePic) {
        formData.append("old_img", dataProfile.profilePic);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/profile/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const newPhoto = res.data.photo;
      setDataProfile((prev) => ({
        ...prev,
        profilePic: newPhoto,
      }));
      dispatch(persistUpdatedUser({ profilePic: newPhoto }));

      toast({
        title: "Berhasil",
        description: res.data.message || "Foto profil berhasil diubah",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      handleCancelEditFoto();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Gagal mengubah foto profil. Silakan coba lagi.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleChangePassword = async () => {
    // Validasi
    if (!passwordLama || !passwordBaru) {
      toast({
        title: "Error",
        description: "Password lama dan password baru harus diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordBaru.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/change-password`,
        {
          passwordLama,
          passwordBaru,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        title: "Berhasil",
        description: res.data.message || "Password berhasil diubah",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form dan tutup modal
      setPasswordLama("");
      setPasswordBaru("");
      onCloseGantiPassword();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Gagal mengubah password. Silakan coba lagi.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
        <Container
          border={"1px"}
          borderRadius={"6px"}
          borderColor={"rgba(229, 231, 235, 1)"}
          maxW={"1280px"}
          bgColor={"white"}
          pt={"30px"}
          ps={"0px"}
        >
          <Box p={"30px"}>
            {dataProfile ? (
              <>
                <Flex justify="space-between" align="center" mb={"30px"}>
                  <Heading size="lg">Profil Pengguna</Heading>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<Icon as={FaEdit} />}
                    onClick={handleOpenEditProfil}
                  >
                    Edit Profil
                  </Button>
                </Flex>

                <Box mb={"30px"}>
                  <Heading size="md" mb={"15px"}>
                    Foto Profile
                  </Heading>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Flex align="center" gap={6}>
                      <Box position="relative">
                        <Image
                          src={getFotoUrl(dataProfile.profilePic)}
                          alt="Foto Profile"
                          boxSize="150px"
                          borderRadius="full"
                          objectFit="cover"
                          border="4px solid"
                          borderColor="blue.200"
                        />
                        <IconButton
                          aria-label="Edit foto profile"
                          icon={<FaCamera />}
                          position="absolute"
                          bottom="0"
                          right="0"
                          colorScheme="blue"
                          borderRadius="full"
                          size="sm"
                          onClick={onOpenEditFoto}
                        />
                      </Box>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="md" fontWeight="medium">
                          {dataProfile.nama}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {dataProfile.namaPengguna}
                        </Text>
                        <Button
                          leftIcon={<Icon as={FaCamera} />}
                          colorScheme="blue"
                          variant="outline"
                          size="sm"
                          onClick={onOpenEditFoto}
                        >
                          Ubah Foto
                        </Button>
                      </VStack>
                    </Flex>
                  </Box>
                </Box>

                <Box mb={"30px"}>
                  <Heading size="md" mb={"15px"}>
                    Informasi Dasar
                  </Heading>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Th width={"30%"}>Nama</Th>
                          <Td>{dataProfile.nama}</Td>
                        </Tr>
                        <Tr>
                          <Th>Nama Pengguna</Th>
                          <Td>{dataProfile.namaPengguna}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </Box>

                <Box mb={"30px"}>
                  <HStack justify="space-between" mb={"15px"}>
                    <Heading size="md">Informasi User</Heading>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FaLock} />}
                      onClick={onOpenGantiPassword}
                    >
                      Ganti Password
                    </Button>
                  </HStack>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Th width={"30%"}>Nama Pengguna</Th>
                          <Td>{dataProfile.namaPengguna}</Td>
                        </Tr>
                        <Tr>
                          <Th>Roles</Th>
                          <Td>
                            {dataProfile.userRoleKPBPNs?.length > 0 ? (
                              dataProfile.userRoleKPBPNs.map((userRole) => (
                                <Text
                                  key={userRole.id}
                                  as="span"
                                  mr={"10px"}
                                  px={"10px"}
                                  py={"5px"}
                                  bgColor={"blue.100"}
                                  borderRadius={"4px"}
                                  display={"inline-block"}
                                  mb={"5px"}
                                >
                                  {userRole.roleKPBPN?.name || "-"}
                                </Text>
                              ))
                            ) : (
                              "-"
                            )}
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </>
            ) : (
              <Text>Memuat data profil...</Text>
            )}
          </Box>
        </Container>
      </Box>

      {/* Modal Edit Profil */}
      <Modal
        isOpen={isOpenEditProfil}
        onClose={onCloseEditProfil}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Profil</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaUser} />
                  Nama
                </FormLabel>
                <Input
                  placeholder="Masukkan nama"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaUser} />
                  Nama Pengguna
                </FormLabel>
                <Input
                  placeholder="Masukkan nama pengguna"
                  value={formNamaPengguna}
                  onChange={(e) => setFormNamaPengguna(e.target.value)}
                />
                <FormHelperText>
                  Nama pengguna minimal 3 karakter dan harus unik
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input
                  value={
                    dataProfile?.userRoleKPBPNs?.length > 0
                      ? dataProfile.userRoleKPBPNs
                          .map((userRole) => userRole.roleKPBPN?.name)
                          .filter(Boolean)
                          .join(", ")
                      : "-"
                  }
                  isReadOnly
                  bg="gray.100"
                  cursor="not-allowed"
                />
                <FormHelperText>
                  Role tidak dapat diubah dari halaman ini
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCloseEditProfil}
              isDisabled={isSavingProfil}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateProfile}
              isLoading={isSavingProfil}
              loadingText="Menyimpan..."
            >
              Simpan Perubahan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Edit Foto Profile */}
      <Modal isOpen={isOpenEditFoto} onClose={handleCancelEditFoto} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ubah Foto Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Pilih Foto</FormLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  display="none"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Icon as={FaCamera} />}
                  variant="outline"
                  width="full"
                >
                  Pilih Foto
                </Button>
                <FormHelperText>
                  Format: JPG, PNG, atau GIF. Maksimal 2MB
                </FormHelperText>
              </FormControl>

              <Image
                src={previewFoto || getFotoUrl(dataProfile?.profilePic)}
                alt="Preview foto"
                boxSize="200px"
                borderRadius="full"
                objectFit="cover"
                border="2px solid"
                borderColor="gray.200"
                mx="auto"
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleCancelEditFoto}
              isDisabled={isUploadingFoto}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUploadFoto}
              isLoading={isUploadingFoto}
              loadingText="Mengupload..."
              isDisabled={!selectedFoto}
            >
              Simpan Foto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Ganti Password */}
      <Modal
        isOpen={isOpenGantiPassword}
        onClose={onCloseGantiPassword}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ganti Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Password Lama
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswordLama ? "text" : "password"}
                    placeholder="Masukkan password lama"
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showPasswordLama
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showPasswordLama ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPasswordLama(!showPasswordLama)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Password Baru
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswordBaru ? "text" : "password"}
                    placeholder="Masukkan password baru (min. 6 karakter)"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showPasswordBaru
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showPasswordBaru ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPasswordBaru(!showPasswordBaru)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Password baru minimal 6 karakter
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCloseGantiPassword}
              isDisabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleChangePassword}
              isLoading={isSubmitting}
              loadingText="Mengubah..."
            >
              Ubah Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Layout>
  );
}

export default Profile;
