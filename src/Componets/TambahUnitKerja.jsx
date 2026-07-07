import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

import { Link, useHistory } from "react-router-dom";

import { useDisclosure } from "@chakra-ui/react";
import Foto from "../assets/add_photo.png";
import {
  Select as Select2,
  CreatableSelect,
  AsyncSelect,
} from "chakra-react-select";
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
  FormLabel,
  Center,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Select,
  Td,
  Flex,
  Textarea,
  Alert,
  Toast,
  Input,
  FormHelperText,
  Spacer,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../Redux/Reducers/auth";

function TambahUnitKerja(props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [unitKerja, setUnitKerja] = useState("");
  const [kode, setKode] = useState("");
  const [asal, setAsal] = useState("");

  const postUnitKerja = () => {
    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/induk-unit-kerja/post/unit-kerja`,
        {
          unitKerja,
          kode,
          asal,
          indukUnitKerjaId: props.indukUnitKerjaId,
        }
      )
      .then((res) => {
        console.log(res.data);
        onClose();
      })
      .catch((err) => {
        console.error(err);
      });
  };
  return (
    <Box>
      <Button onClick={onOpen} variant={"primary"}>
        Tambah Unit Kerja +
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxWidth="900px">
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize={"24px"}>Unit Kerja</FormLabel>
              <Input
                onChange={(e) => {
                  setUnitKerja(e.target.value);
                }}
                bgColor={"terang"}
                height="60px"
                placeholder="isi dengan nama Unit Kerja"
              />
            </FormControl>
            <FormControl my={"30px"}>
              <FormLabel fontSize={"24px"}>Kode</FormLabel>
              <Input
                onChange={(e) => {
                  setKode(e.target.value);
                }}
                bgColor={"terang"}
                height="60px"
                placeholder="isi dengan Kode"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize={"24px"}>Asal</FormLabel>
              <Input
                onChange={(e) => {
                  setAsal(e.target.value);
                }}
                bgColor={"terang"}
                height="60px"
                placeholder="isi dengan Kode"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            {/* <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button> */}
            <Button onClick={postUnitKerja} variant="primary">
              Tambah
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default TambahUnitKerja;
