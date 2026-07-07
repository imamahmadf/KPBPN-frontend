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
  Tooltip,
  Heading,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { BsEyeFill } from "react-icons/bs";
import ReactPaginate from "react-paginate";
import {
  Select as Select2,
  CreatableSelect,
  AsyncSelect,
} from "chakra-react-select";
import "../../Style/pagination.css";
import { Link, useHistory } from "react-router-dom";
import axios, { Axios } from "axios";
import Layout from "../../Componets/Layout";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../../Redux/Reducers/auth";
import Loading from "../../Componets/Loading";

function DaftarAdmin() {
  const [dataPerjalanan, setDataPerjalanan] = useState([]);
  const history = useHistory();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dataUnitKerja, setDataUnitKerja] = useState(null);
  const [dataSumberDana, setDataSumberDana] = useState(null);
  const [filterUnitKerjaId, setFilterUnitKerjaId] = useState(0);
  const [filterSumberDanaId, setFilterSumberDanaId] = useState(0);
  const [pegawaiId, setPegawaiId] = useState(0);

  const user = useSelector(userRedux);
  const role = useSelector(selectRole);

  const changePage = ({ selected }) => {
    setPage(selected);
  };

  async function fetchUnitkerja() {
    axios
      .get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/admin/get/unit-kerja`
      )
      .then((res) => {
        setDataUnitKerja(res.data.result);
        console.log(res.data.result, "ÏNI DSATAAA");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  async function fetchSumberDana() {
    axios
      .get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/admin/get/sumber-dana`
      )
      .then((res) => {
        setDataSumberDana(res.data.result);
        console.log(res.data.result, "ÏNI DSATAAA");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  async function fetchDataPerjalanan() {
    await axios
      .get(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/admin/get/keuangan/daftar-perjalanan?&time=${time}&page=${page}&limit=${limit}&unitKerjaId=${filterUnitKerjaId}&pegawaiId=${pegawaiId}&sumberDanaId=${filterSumberDanaId}`
      )
      .then((res) => {
        setDataPerjalanan(res.data.result);
        setPage(res.data.page);
        setPages(res.data.totalPage);
        setRows(res.data.totalRows);
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  useEffect(() => {
    fetchDataPerjalanan();
    fetchUnitkerja();
    fetchSumberDana();
  }, [page, filterUnitKerjaId, pegawaiId, filterSumberDanaId]);
  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
        <Container maxW={"3280px"} variant={"primary"} ps={"0px"} my={"30px"}>
          <Box style={{ overflowX: "auto" }} p={"30px"}>
            <Flex gap={4} my={"30px"}>
              {" "}
              <FormControl>
                <FormLabel fontSize={"24px"}>Nama Pegawai</FormLabel>
                <AsyncSelect
                  loadOptions={async (inputValue) => {
                    if (!inputValue) return [];
                    try {
                      const res = await axios.get(
                        `${
                          import.meta.env.VITE_REACT_APP_API_BASE_URL
                        }/pegawai/search?q=${inputValue}`
                      );
                      return res.data.result.map((val) => ({
                        value: val,
                        label: val.nama,
                      }));
                    } catch (err) {
                      console.error("Failed to load options:", err.message);
                      return [];
                    }
                  }}
                  placeholder="Ketik Nama Pegawai"
                  onChange={(selectedOption) => {
                    setPegawaiId(selectedOption.value.id);
                  }}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
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
                      _hover: { borderColor: "yellow.700" },
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
                <FormLabel fontSize={"24px"}>Unit Kerja</FormLabel>
                <Select2
                  options={dataUnitKerja?.map((val) => ({
                    value: val.id,
                    label: `${val.unitKerja}`,
                  }))}
                  focusBorderColor="red"
                  onChange={(selectedOption) => {
                    setFilterUnitKerjaId(selectedOption.value);
                  }}
                  components={{
                    DropdownIndicator: () => null, // Hilangkan tombol panah
                    IndicatorSeparator: () => null, // Kalau mau sekalian hilangkan garis vertikal
                  }}
                  chakraStyles={{
                    container: (provided) => ({
                      ...provided,
                      borderRadius: "0px",
                    }),
                    control: (provided) => ({
                      ...provided,
                      backgroundColor: "terang",
                      color: "gelap",
                      textTransform: "none",
                      border: "0px",

                      height: "30px",
                      _hover: {
                        borderColor: "yellow.700",
                      },
                      minHeight: "60px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      bg: state.isFocused ? "primary" : "white",
                      color: state.isFocused ? "white" : "gelap",
                      textTransform: "none",
                    }),
                  }}
                />
              </FormControl>{" "}
              <FormControl>
                <FormLabel fontSize={"24px"}>Sumber Dana</FormLabel>
                <Select2
                  options={dataSumberDana?.map((val) => {
                    return {
                      value: val.id,
                      label: `${val.sumber}`,
                    };
                  })}
                  focusBorderColor="red"
                  onChange={(selectedOption) => {
                    setFilterSumberDanaId(selectedOption.value);
                  }}
                  components={{
                    DropdownIndicator: () => null, // Hilangkan tombol panah
                    IndicatorSeparator: () => null, // Kalau mau sekalian hilangkan garis vertikal
                  }}
                  chakraStyles={{
                    container: (provided) => ({
                      ...provided,
                      borderRadius: "0px",
                    }),
                    control: (provided) => ({
                      ...provided,
                      backgroundColor: "terang",
                      color: "gelap",
                      textTransform: "none",
                      border: "0px",

                      height: "30px",
                      _hover: {
                        borderColor: "yellow.700",
                      },
                      minHeight: "60px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      bg: state.isFocused ? "primary" : "white",
                      color: state.isFocused ? "white" : "gelap",
                      textTransform: "none",
                    }),
                  }}
                />
              </FormControl>
            </Flex>
            <Table variant={"primary"}>
              <Thead>
                <Tr>
                  <Th>no.</Th>
                  <Th>jenis Perjalanan</Th>

                  <Th>Unit Kerja Surat Tugas</Th>
                  <Th>No Surat Tugas</Th>

                  <Th>Tanggal Berangkat</Th>
                  <Th>tanggal Pulang</Th>
                  <Th>Personil 1</Th>
                  <Th>Personil 2</Th>
                  <Th>Personil 3</Th>
                  <Th>Personil 4</Th>
                  <Th>Personil 5</Th>
                  <Th>Sumber</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dataPerjalanan?.map((item, index) => (
                  <Tr key={item.id}>
                    <Td>{page * limit + index + 1}</Td>
                    <Td>{item.jenisPerjalanan.jenis}</Td>{" "}
                    <Td>
                      {item.ttdSuratTuga.indukUnitKerja_ttdSuratTugas.kodeInduk}
                    </Td>
                    <Td>{item.noSuratTugas ? item.noSuratTugas : "-"}</Td>
                    <Td>
                      {item.tempats?.[0]?.tanggalBerangkat
                        ? new Date(
                            item.tempats[0].tanggalBerangkat
                          ).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </Td>
                    <Td>
                      {item.tempats?.[0]?.tanggalPulang
                        ? new Date(
                            item.tempats[0].tanggalPulang
                          ).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </Td>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Td key={i}>
                        <Tooltip
                          label={item.personils?.[i]?.status?.statusKuitansi}
                          aria-label="A tooltip"
                          bgColor={
                            item.personils?.[i]?.statusId === 1
                              ? "gelap"
                              : item.personils?.[i]?.statusId === 2
                              ? "ungu"
                              : item.personils?.[i]?.statusId === 3
                              ? "primary"
                              : item.personils?.[i]?.statusId === 4
                              ? "danger"
                              : null
                          }
                        >
                          <Flex>
                            <Center
                              borderRadius={"2px"}
                              width={"5px"}
                              maxH={"20px"}
                              me={"3px"}
                              bgColor={
                                item.personils?.[i]?.statusId === 1
                                  ? "gelap"
                                  : item.personils?.[i]?.statusId === 2
                                  ? "ungu"
                                  : item.personils?.[i]?.statusId === 3
                                  ? "primary"
                                  : item.personils?.[i]?.statusId === 4
                                  ? "danger"
                                  : null
                              }
                            ></Center>
                            <Text>
                              {item.personils?.[i]?.pegawai?.nama || "-"}
                            </Text>
                          </Flex>
                        </Tooltip>
                      </Td>
                    ))}
                    <Td>{item?.bendahara?.sumberDana?.sumber || "-"}</Td>
                    <Td>
                      <Button
                        variant={"primary"}
                        p={"0px"}
                        fontSize={"14px"}
                        onClick={() =>
                          history.push(`/admin/rampung/${item.id}`)
                        }
                      >
                        <BsEyeFill />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
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
    </Layout>
  );
}

export default DaftarAdmin;
