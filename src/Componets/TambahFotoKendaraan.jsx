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
  useToast,
} from "@chakra-ui/react";

import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../Redux/Reducers/auth";
function TambahFotoKendaraan(props) {
  const inputFileRef = useRef(null);
  const [fileSizeMsg, setFileSizeMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(Foto);
  const toast = useToast();
  const {
    isOpen: isInputOpen,
    onOpen: onInputOpen,
    onClose: onInputClose,
  } = useDisclosure();

  const handleFile = (event) => {
    if (event.target.files[0].size / 1024 > 1024) {
      setFileSizeMsg("File size is greater than maximum limit");
    } else {
      const file = event.target.files[0];
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      formik.setFieldValue("pic", file);
    }
  };
  const formik = useFormik({
    initialValues: {},
    // onSubmit: (values) => {
    //   alert(JSON.stringify(values, null, 2));
    // },
    validationSchema: Yup.object().shape({}),
    validateOnChange: false,
    onSubmit: async (values) => {
      console.log(selectedFile, "tes formik");
      const { item } = values;

      // kirim data ke back-end
      const formData = new FormData();
      formData.append("id", props.id);

      formData.append("pic", selectedFile);
      formData.append("old_img", props.foto);
      await axios
        .post(
          `${
            import.meta.env.VITE_REACT_APP_API_BASE_URL
          }/kendaraan/post/foto-kendaraan`,
          formData
        )
        .then((res) => {
          // Menampilkan toast setelah berhasil
          console.log(res.data);
          props.randomNumber(Math.random());
          onInputClose();

          toast({
            title: "Berhasil!",
            description: "Data Nomor Batch berhasil disimpan.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });

          // Reset form dan state setelah berhasil

          // Arahkan pengguna ke halaman lain (misalnya daftar obat)
        })
        .catch((err) => {
          console.error(err);
        });
    },
  });
  return (
    <Box position="relative">
      <Image
        borderRadius={"5px"}
        alt="foto obat"
        width="720px"
        height="820px"
        overflow="hiden"
        objectFit="cover"
        src={
          props?.foto
            ? import.meta.env.VITE_REACT_APP_API_BASE_URL + props?.foto
            : Foto
        }
      />

      <Button
        onClick={onInputOpen}
        position="absolute"
        bottom="0px"
        left="0px"
        h={"40px"}
        variant={"secondary"}
      >
        Tambah +
      </Button>

      <Modal
        closeOnOverlayClick={false}
        isOpen={isInputOpen}
        onClose={onInputClose}
      >
        <ModalOverlay />
        <ModalContent borderRadius={0} maxWidth="1200px">
          <ModalHeader>Edit Foto Kendaraan </ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Box>
              <FormControl>
                <Input
                  onChange={handleFile}
                  ref={inputFileRef}
                  accept="image/png, image/jpeg"
                  display="none"
                  type="file"

                  // hidden="hidden"
                />
              </FormControl>{" "}
              <FormControl>
                <Image
                  src={previewUrl}
                  id="imgpreview"
                  alt="Room image"
                  width="100%"
                  height={{ ss: "210px", sm: "210px", sl: "650px" }}
                  me="10px"
                  mt="20px"
                  overflow="hiden"
                  objectFit="cover"
                />
              </FormControl>{" "}
              <FormControl mt="20px">
                <FormHelperText>Max size: 1MB</FormHelperText>
                <Button
                  variant={"secondary"}
                  w="100%"
                  onClick={() => inputFileRef.current.click()}
                >
                  Add Photo
                </Button>
                {fileSizeMsg ? (
                  <Alert status="error" color="red" text="center">
                    {/* <i className="fa-solid fa-circle-exclamation"></i> */}
                    <Text ms="10px">{fileSizeMsg}</Text>
                  </Alert>
                ) : null}
              </FormControl>{" "}
              <Button
                variant={"primary"}
                w={"100%"}
                mt={"30px"}
                onClick={formik.handleSubmit}
              >
                submit
              </Button>
            </Box>
          </ModalBody>

          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default TambahFotoKendaraan;
