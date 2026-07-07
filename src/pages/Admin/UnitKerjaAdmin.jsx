import React, { useState, useEffect } from "react";
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
  ModalCloseButton,
  Container,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Stack,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  useToast,
  Badge,
  VStack,
  Divider,
  FormControl,
  FormLabel,
  Spacer,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";
import Layout from "../../Componets/Layout";
import { Link, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Select as Select2,
  CreatableSelect,
  AsyncSelect,
} from "chakra-react-select";
import { userRedux, selectRole } from "../../Redux/Reducers/auth";

function UnitKerjaAdmin(props) {
  const [dataPegawai, setDataPegawai] = useState([]);
  const [pegawaiId, setPegawaiId] = useState(0);
  const [jenis, setJenis] = useState(0);
  const [jabatan, setJabatan] = useState("");
  const history = useHistory();
  async function fetchDataPegawai() {
    await axios
      .get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/pegawai/get`)
      .then((res) => {
        console.log(res.status, res.data, "tessss");

        setDataPegawai(res.data);
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  const postTandaTangan = () => {
    axios
      .post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/induk-unit-kerja/post/tanda-tangan`,
        {
          pegawaiId,
          unitKerjaId: props.match.params.id,
          jabatan,
          jenis,
        }
      )
      .then((res) => {
        console.log(res.status, res.data, "tessss");
        history.push("/admin/induk-unit-kerja");
      })
      .catch((err) => {
        console.error(err.message);
      });
  };

  useEffect(() => {
    fetchDataPegawai();
  }, []);
  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
        <Container maxW={"1280px"} variant={"primary"} p={"30px"} my={"30px"}>
          <FormControl mb={"30px"}>
            <FormLabel fontSize={"24px"}>Nama Pegawai</FormLabel>
            <Select2
              options={dataPegawai.result?.map((val) => {
                return {
                  value: val,
                  label: `${val.nama}`,
                };
              })}
              placeholder="Cari Nama Pegawai"
              focusBorderColor="red"
              onChange={(selectedOption) => {
                setPegawaiId(selectedOption.value.id);
              }}
              components={{
                DropdownIndicator: () => null, // Hilangkan tombol panah
                IndicatorSeparator: () => null, // Kalau mau sekalian hilangkan garis vertikal
              }}
              chakraStyles={{
                container: (provided) => ({
                  ...provided,
                  borderRadius: "6px",
                }),
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "terang",
                  border: "0px",
                  height: "60px",
                  _hover: {
                    borderColor: "yellow.700",
                  },
                  minHeight: "40px",
                }),
                option: (provided, state) => ({
                  ...provided,
                  bg: state.isFocused ? "primary" : "white",
                  color: state.isFocused ? "white" : "black",
                }),
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize={"24px"}>Jenis</FormLabel>
            <Select
              height={"60px"}
              bgColor={"terang"}
              borderRadius={"8px"}
              placeholder="jenis"
              borderColor={"rgba(229, 231, 235, 1)"}
              onChange={(e) => {
                setJenis(e.target.value);
              }}
            >
              <option value={1}>Tanda Tangan Nota Dinas</option>
              <option value={2}>Tanda Tangan Pengguna Anggaran</option>
              <option value={3}>Tanda Tangan PPTK</option>
            </Select>
          </FormControl>
          <FormControl my={"30px"}>
            <FormLabel fontSize={"24px"}>Jabatan</FormLabel>
            <Input
              height={"60px"}
              bgColor={"terang"}
              type="text"
              border={"none"}
              onChange={(e) => {
                setJabatan(e.target.value);
              }}
            />
          </FormControl>
          <Button variant={"primary"} onClick={postTandaTangan}>
            Tambahkan
          </Button>
        </Container>
      </Box>
    </Layout>
  );
}

export default UnitKerjaAdmin;
