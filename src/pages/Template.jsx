import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
  VStack,
  useToast,
  FormLabel,
  Select,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../Redux/Reducers/auth";
import Layout from "../Componets/Layout";
const Template = () => {
  const user = useSelector(userRedux);
  const role = useSelector(selectRole);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataTemplate, setDataTemplate] = useState([]);
  const [oldFile, setOldFile] = useState("");
  const toast = useToast();

  async function fetchTemplate() {
    await axios
      .get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/template/get/${
          user[0].unitKerja_profile.indukUnitKerja.id
        }`
      )
      .then((res) => {
        setDataTemplate(res.data.result);
        console.log(res.data.result);
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  const validationSchema = Yup.object().shape({
    file: Yup.mixed()
      .required("File harus diunggah")
      .test(
        "fileType",
        "Format file tidak valid. Harap unggah file .docx",
        (value) =>
          value &&
          value.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ),
  });

  const handleDownload = async (fileName) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/template/download`,
        {
          params: { fileName },

          responseType: "blob",
        }
      );

      // Membuat URL untuk file yang akan diunduh
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Gagal Mengunduh",
        description: "Terjadi kesalahan saat mengunduh file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);
  return (
    <Layout>
      <Box>
        <Container variant={"primary"} p={"30px"} my={"30px"} minW={"1000px"}>
          <Box
            mx="auto"
            mt={10}
            p={5}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
          >
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Upload Template Word
            </Text>

            <Formik
              initialValues={{ file: null, jenis: null }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                console.log("Nilai yang dikirim:", values.jenis);
                const formData = new FormData();
                formData.append("file", values.file);
                formData.append(
                  "id",
                  user[0]?.unitKerja_profile?.indukUnitKerja.id
                );
                formData.append("jenis", values.jenis);
                formData.append("oldFile", oldFile);

                try {
                  const response = await axios.post(
                    `${
                      import.meta.env.VITE_REACT_APP_API_BASE_URL
                    }/template/upload`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                  );

                  toast({
                    title: "Sukses!",
                    description: response.data.message,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                  });

                  resetForm();
                  setSelectedFile(null);
                  fetchTemplate();
                } catch (error) {
                  toast({
                    title: "Gagal Mengunggah",
                    description: "Terjadi kesalahan saat mengunggah file",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                }

                setSubmitting(false);
              }}
            >
              {({ setFieldValue, isSubmitting, errors, touched }) => (
                <Form>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Jenis Template</FormLabel>
                      <Select
                        mt="10px"
                        placeholder="Template"
                        border="1px"
                        borderRadius={"8px"}
                        borderColor={"rgba(229, 231, 235, 1)"}
                        onChange={(e) => {
                          const selectedValue = parseInt(e.target.value);
                          console.log("Nilai yang dipilih:", selectedValue);
                          setFieldValue("jenis", selectedValue);

                          if (selectedValue === 1) {
                            setOldFile(dataTemplate.templateSuratTugas);
                          } else if (selectedValue === 2) {
                            setOldFile(dataTemplate.templateNotaDinas);
                          } else if (selectedValue === 3) {
                            setOldFile(dataTemplate.templateSuratTugasSingkat);
                          } else if (selectedValue === 4) {
                            setOldFile(dataTemplate.telaahan);
                          } else if (selectedValue === 5) {
                            setOldFile(dataTemplate.templateSPD);
                          }
                        }}
                      >
                        <option value="1">Surat Tugas </option>
                        <option value="2">Nota Dinas</option>
                        <option value="3">Surat Tugas Singkat </option>{" "}
                        <option value="4">Telahaan Staf </option>
                        <option value="5">SPD </option>
                      </Select>
                      <FormErrorMessage>{errors.jenis}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={errors.file && touched.file}>
                      <Input
                        type="file"
                        accept=".docx"
                        onChange={(event) => {
                          setFieldValue("file", event.currentTarget.files[0]);
                          setSelectedFile(event.currentTarget.files[0]);
                        }}
                        p={1}
                      />
                      <FormErrorMessage>{errors.file}</FormErrorMessage>
                    </FormControl>

                    {selectedFile && (
                      <Text fontSize="sm" color="gray.600">
                        File: {selectedFile.name}
                      </Text>
                    )}

                    <Button
                      type="submit"
                      variant={"primary"}
                      isLoading={isSubmitting}
                      isDisabled={!selectedFile}
                    >
                      Upload
                    </Button>
                  </VStack>
                </Form>
              )}
            </Formik>
          </Box>
          <Box>
            <Box mt={"30px"}>
              <Table variant={"primary"}>
                <Thead>
                  <Tr>
                    <Th>Unit Kerja</Th>
                    <Th>Nota Dinas</Th> <Th>Telahaan Staf</Th>
                    <Th>Surat Tugas </Th>
                    <Th> SPD</Th>
                    <Th>Surat Tugas Singkat</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>{dataTemplate.indukUnitKerja}</Td>
                    <Td>
                      {dataTemplate.templateNotaDinas ? (
                        <Button
                          variant={"primary"}
                          onClick={() =>
                            handleDownload(dataTemplate.templateNotaDinas)
                          }
                        >
                          lihat
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>{" "}
                    <Td>
                      {dataTemplate.telaahan ? (
                        <Button
                          variant={"primary"}
                          onClick={() => handleDownload(dataTemplate.telaahan)}
                        >
                          lihat
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td>
                      {dataTemplate.templateSuratTugas ? (
                        <Button
                          variant={"primary"}
                          onClick={() =>
                            handleDownload(dataTemplate.templateSuratTugas)
                          }
                        >
                          lihat
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td>
                      {dataTemplate.templateSPD ? (
                        <Button
                          variant={"primary"}
                          onClick={() =>
                            handleDownload(dataTemplate.templateSPD)
                          }
                        >
                          lihatxx
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td>
                      {dataTemplate.templateSuratTugasSingkat ? (
                        <Button
                          variant={"primary"}
                          onClick={() =>
                            handleDownload(
                              dataTemplate.templateSuratTugasSingkat
                            )
                          }
                        >
                          lihat
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export default Template;
