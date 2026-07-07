import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../Componets/Layout";
import ReactPaginate from "react-paginate";
import "../../Style/pagination.css";
import { Link, useHistory } from "react-router-dom";
import { BsXCircle } from "react-icons/bs";
import { BsPlusCircle } from "react-icons/bs";
import { BsTrash } from "react-icons/bs";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useDisclosure } from "@chakra-ui/react";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Image,
  ModalCloseButton,
  Container,
  FormControl,
  FormLabel,
  Center,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Textarea,
  Input,
  Spacer,
  Select,
  InputGroup,
  InputRightElement,
  IconButton,
  Icon,
  FormHelperText,
  VStack,
  useToast,
} from "@chakra-ui/react";
import Loading from "../../Componets/Logout";
import { useSelector } from "react-redux";

function DaftarUserAdmin() {
  const [dataUser, setDataUser] = useState(null);
  const [role, setRole] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]); // Tambahkan state baru untuk menyimpan role pengguna yang dipilih
  const [availableRoles, setAvailableRoles] = useState([]);
  const [namaPengguna, setNamaPengguna] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const changePage = ({ selected }) => {
    setPage(selected);
  };
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteUserOpen,
    onOpen: onDeleteUserOpen,
    onClose: onDeleteUserClose,
  } = useDisclosure();

  const {
    isOpen: isEditPasswordOpen,
    onOpen: onEditPasswordOpen,
    onClose: onEditPasswordClose,
  } = useDisclosure();

  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEditPassword, setUserToEditPassword] = useState(null);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [mathQuestion, setMathQuestion] = useState({
    angka1: 0,
    angka2: 0,
    jawaban: 0,
  });
  const [jawabanUser, setJawabanUser] = useState("");
  const [mathQuestionDelete, setMathQuestionDelete] = useState({
    angka1: 0,
    angka2: 0,
    jawaban: 0,
  });
  const [jawabanUserDelete, setJawabanUserDelete] = useState("");
  const toast = useToast();

  // Fungsi untuk generate pertanyaan matematika random (untuk edit password)
  const generateMathQuestion = () => {
    const angka1 = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const angka2 = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const jawaban = angka1 + angka2;
    setMathQuestion({ angka1, angka2, jawaban });
    setJawabanUser(""); // Reset jawaban user
  };

  // Fungsi untuk generate pertanyaan matematika random (untuk hapus user)
  const generateMathQuestionDelete = () => {
    const angka1 = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const angka2 = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const jawaban = angka1 + angka2;
    setMathQuestionDelete({ angka1, angka2, jawaban });
    setJawabanUserDelete(""); // Reset jawaban user
  };

  // Handler untuk menutup modal edit password dan reset state
  const handleCloseEditPassword = () => {
    setPasswordBaru("");
    setKonfirmasiPassword("");
    setJawabanUser("");
    setUserToEditPassword(null);
    onEditPasswordClose();
  };

  // Handler untuk menutup modal hapus user dan reset state
  const handleCloseDeleteUser = () => {
    setJawabanUserDelete("");
    setUserToDelete(null);
    onDeleteUserClose();
  };
  const deleteRole = async () => {
    await axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/user-kpbpn/delete/user-role?userId=${currentUserId}&id=${selectedRole}`,
      )
      .then((res) => {
        // console.log(res.data.result);
        // console.log(selectedRole);
        fetchDataUser();
        setAvailableRoles([]);
        onDeleteClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };
  function inputHandler(event, field) {
    const tes = setTimeout(() => {
      const { value } = event.target;

      setNamaPengguna(value);
    }, 2000);
  }
  const deleteUser = async (val) => {
    // Validasi jawaban matematika sebelum menghapus
    if (
      !jawabanUserDelete ||
      parseInt(jawabanUserDelete) !== mathQuestionDelete.jawaban
    ) {
      toast({
        title: "Error",
        description: "Jawaban matematika salah. User tidak dapat dihapus.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      generateMathQuestionDelete(); // Generate pertanyaan baru
      return;
    }

    await axios
      .post(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user/delete/${val}`)
      .then((res) => {
        // console.log(res.data.result);
        fetchDataUser();
        setSelectedRole("");
        setAvailableRoles([]);
        toast({
          title: "Berhasil",
          description: "User berhasil dihapus",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Reset state setelah berhasil
        generateMathQuestionDelete(); // Generate pertanyaan baru untuk next time
        handleCloseDeleteUser();
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: err.response?.data?.message || "Gagal menghapus user",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const addUserRole = async () => {
    await axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/user-kpbpn/post/user-role?userKPBPNId=${currentUserId}&roleKPBPNId=${selectedRole}`,
      )
      .then((res) => {
        // console.log(res.data.result);
        fetchDataUser();
        setSelectedRole("");
        setAvailableRoles([]);
        onAddClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleEditPassword = async () => {
    // Validasi
    if (!passwordBaru || !konfirmasiPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi password harus diisi",
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

    if (passwordBaru !== konfirmasiPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi password tidak sama",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validasi jawaban matematika
    if (!jawabanUser || parseInt(jawabanUser) !== mathQuestion.jawaban) {
      toast({
        title: "Error",
        description: "Jawaban matematika salah. Silakan coba lagi.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      generateMathQuestion(); // Generate pertanyaan baru
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/update-password/${
          userToEditPassword?.id
        }`,
        {
          passwordBaru,
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
      generateMathQuestion(); // Generate pertanyaan baru untuk next time
      handleCloseEditPassword();
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
      setIsSubmittingPassword(false);
    }
  };

  async function fetchRole() {
    axios
      .get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/get-role`)
      .then((res) => {
        console.log(res.data, "GET ROLLEEEEE");
        setRole(res.data.result);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  async function fetchDataUser() {
    await axios
      .get(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/user-kpbpn/get/user?page=${page}&limit=${limit}&namaPengguna=${namaPengguna}`,
      )
      .then((res) => {
        console.log(res.status, res.data, "tessss");
        setPage(res.data.page);
        setPages(res.data.totalPage);
        setRows(res.data.totalRows);
        setDataUser(res.data.result);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  useEffect(() => {
    fetchDataUser();
    fetchRole();
  }, [page, namaPengguna]);
  return (
    <Layout>
      {isLoading ? (
        <Loading />
      ) : (
        <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
          <Container maxW={"1280px"} variant={"primary"} p={"30px"}>
            <FormControl mb={"30px"}>
              <FormLabel fontSize={"24px"}>Nama Pengguna</FormLabel>
              <Input
                height={"60px"}
                bgColor={"terang"}
                onChange={inputHandler}
                placeholder="Contoh : sifulan"
              />
            </FormControl>{" "}
            <Table variant={"primary"}>
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th>Nama</Th>
                  <Th>Nama Pengguna</Th>
                  <Th>Role</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dataUser?.map((user, index) => (
                  <Tr>
                    <Td>{page * limit + index + 1}</Td>
                    <Td>{user?.nama}</Td>
                    <Td>{user?.namaPengguna}</Td>
                    <Td>
                      <Text>
                        {user?.userRoleKPBPNs?.map((val) => (
                          <Text key={val.id}>{val.roleKPBPN?.name}</Text>
                        ))}
                      </Text>
                    </Td>
                    <Td>
                      {/* <Button>Hapus</Button> */}
                      <Flex gap={3}>
                        <Center
                          onClick={() => {
                            setCurrentUserId(user?.id);
                            onAddOpen();
                          }}
                          borderRadius={"5px"}
                          as="button"
                          h="35px"
                          w="35px"
                          fontSize="14px"
                          transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
                          color="white"
                          _hover={{
                            bg: "black",
                          }}
                          bg="primary"
                          // onClick={onOpen}
                        >
                          <BsPlusCircle />
                        </Center>{" "}
                        <Center
                          onClick={() => {
                            setCurrentUserId(user?.id);
                            setAvailableRoles(user.userRoleKPBPNs || []);
                            onDeleteOpen();
                          }}
                          borderRadius={"5px"}
                          as="button"
                          h="35px"
                          w="35px"
                          fontSize="14px"
                          transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
                          color="white"
                          _hover={{
                            bg: "black",
                          }}
                          bg="danger"
                        >
                          <BsXCircle />
                        </Center>{" "}
                        <Center
                          onClick={() => {
                            setUserToEditPassword(user);
                            setPasswordBaru("");
                            setKonfirmasiPassword("");
                            setJawabanUser("");
                            generateMathQuestion(); // Generate pertanyaan baru saat modal dibuka
                            onEditPasswordOpen();
                          }}
                          borderRadius={"5px"}
                          as="button"
                          h="35px"
                          w="35px"
                          fontSize="14px"
                          transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
                          color="white"
                          _hover={{
                            bg: "black",
                          }}
                          bg="blue.500"
                          title="Edit Password"
                        >
                          <Icon as={FaLock} />
                        </Center>{" "}
                        <Center
                          onClick={() => {
                            setUserToDelete(user);
                            setJawabanUserDelete("");
                            generateMathQuestionDelete(); // Generate pertanyaan baru saat modal dibuka
                            onDeleteUserOpen();
                          }}
                          borderRadius={"5px"}
                          as="button"
                          h="35px"
                          px="10px"
                          fontSize="14px"
                          transition="all 0.2s cubic-bezier(.08,.52,.52,1)"
                          color="white"
                          _hover={{
                            bg: "black",
                          }}
                          bg="danger"
                        >
                          <BsTrash />
                        </Center>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>{" "}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",

                boxSizing: "border-box",
                width: "100%",
                height: "100%",
              }}
            >
              <ReactPaginate
                previousLabel={"+"}
                nextLabel={"-"}
                pageCount={pages}
                onPageChange={changePage}
                activeClassName={"item active "}
                breakClassName={"item break-me "}
                breakLabel={"..."}
                containerClassName={"pagination"}
                disabledClassName={"disabled-page"}
                marginPagesDisplayed={1}
                nextClassName={"item next "}
                pageClassName={"item pagination-page "}
                pageRangeDisplayed={2}
                previousClassName={"item previous"}
              />
            </div>
          </Container>
        </Box>
      )}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pilih Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {" "}
            <Select
              placeholder="Pilih role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {role.map((roleItem) => (
                <option key={roleItem.id} value={roleItem.id}>
                  {roleItem.name ?? roleItem.nama}
                </option>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={addUserRole}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={onAddClose}>
              Batal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pilih Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Select
              placeholder="Pilih role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {availableRoles.map(
                (
                  roleItem, // Gunakan availableRoles
                ) => (
                  <option key={roleItem.id} value={roleItem.id}>
                    {roleItem.roleKPBPN?.name ?? roleItem.role?.nama}
                  </option>
                ),
              )}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={deleteRole}>
              Simpan
            </Button>
            <Button variant="ghost" onClick={onDeleteClose}>
              Batal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Konfirmasi Hapus User */}
      <Modal isOpen={isDeleteUserOpen} onClose={handleCloseDeleteUser}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus user{" "}
              <strong>{userToDelete?.nama}</strong> (
              {userToDelete?.namaPengguna})?
            </Text>
            <Text mt={2} color="red.500" fontSize="sm">
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data
              user terkait.
            </Text>

            {/* Pertanyaan Matematika */}
            <FormControl isRequired mt={4}>
              <FormLabel fontSize="md" fontWeight="bold">
                Verifikasi Matematika
              </FormLabel>
              <Box
                p={4}
                bg="red.50"
                borderRadius="md"
                border="1px"
                borderColor="red.200"
                mb={2}
              >
                <Text fontSize="lg" textAlign="center" fontWeight="bold">
                  {mathQuestionDelete.angka1} + {mathQuestionDelete.angka2} = ?
                </Text>
              </Box>
              <Input
                type="number"
                placeholder="Masukkan jawaban"
                value={jawabanUserDelete}
                onChange={(e) => setJawabanUserDelete(e.target.value)}
                size="lg"
              />
              <FormHelperText>
                Jawab pertanyaan matematika di atas untuk melanjutkan
                penghapusan
              </FormHelperText>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={() => {
                deleteUser(userToDelete?.id);
              }}
            >
              Hapus
            </Button>
            <Button variant="ghost" onClick={handleCloseDeleteUser}>
              Batal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Edit Password */}
      <Modal
        isOpen={isEditPasswordOpen}
        onClose={handleCloseEditPassword}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Mengubah password untuk user:{" "}
                <strong>{userToEditPassword?.nama}</strong> (
                {userToEditPassword?.namaPengguna})
              </Text>

              {/* Pertanyaan Matematika */}
              <FormControl isRequired>
                <FormLabel fontSize="md" fontWeight="bold">
                  Verifikasi Matematika
                </FormLabel>
                <Box
                  p={4}
                  bg="blue.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="blue.200"
                  mb={2}
                >
                  <Text fontSize="lg" textAlign="center" fontWeight="bold">
                    {mathQuestion.angka1} + {mathQuestion.angka2} = ?
                  </Text>
                </Box>
                <Input
                  type="number"
                  placeholder="Masukkan jawaban"
                  value={jawabanUser}
                  onChange={(e) => setJawabanUser(e.target.value)}
                  size="lg"
                />
                <FormHelperText>
                  Jawab pertanyaan matematika di atas untuk melanjutkan
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Password Baru
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password baru (min. 6 karakter)"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Password baru minimal 6 karakter
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Konfirmasi Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showKonfirmasiPassword ? "text" : "password"}
                    placeholder="Konfirmasi password baru"
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showKonfirmasiPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showKonfirmasiPassword ? <FaEyeSlash /> : <FaEye />}
                      onClick={() =>
                        setShowKonfirmasiPassword(!showKonfirmasiPassword)
                      }
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleCloseEditPassword}
              isDisabled={isSubmittingPassword}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleEditPassword}
              isLoading={isSubmittingPassword}
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

export default DaftarUserAdmin;
