import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useHistory } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Select,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Checkbox,
  CheckboxGroup,
  Stack,
  Text,
  Divider,
  Spinner,
  Center,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const pengisianSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  tangkiId: Yup.string().required("Tangki wajib dipilih"),

  gross: Yup.number()
    .typeError("Gross harus angka")
    .required("Gross wajib diisi"),
  net: Yup.number().typeError("Net harus angka").required("Net wajib diisi"),
  penampilanVisual: Yup.string().required("Penampilan visual wajib diisi"),
  warna: Yup.string().required("Warna wajib diisi"),
  kandunganAir: Yup.number()
    .typeError("Kandungan air harus angka")
    .required("Kandungan air wajib diisi"),
  BSW: Yup.number().typeError("BSW harus angka").required("BSW wajib diisi"),
  satuanVolumeId: Yup.string().required("Satuan volume wajib dipilih"),
  catatan: Yup.string(),
  saksi: Yup.string().required("Saksi wajib diisi"),
  ids: Yup.array()
    .of(Yup.string())
    .min(1, "Konfirmasi penerimaan wajib dipilih"),
});

const getTodayInputDate = () => new Date().toISOString().split("T")[0];

const initialValues = {
  tanggal: getTodayInputDate(),
  tangkiId: "",

  gross: "",
  net: "",
  penampilanVisual: "",
  warna: "",
  kandunganAir: "",
  BSW: "",
  catatan: "",
  saksi: "",
  satuanVolumeId: "",
  ids: [],
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const getKonfirmasiPenerimaanLabel = (item) => {
  const volume = formatVolumeLabel(
    item.volume ?? item.suratJalan?.volume,
    item.suratJalan?.satuanVolume?.satuan,
  );
  const tanggal = formatDate(item.tanggal);
  const mitra = item.suratJalan?.mitra?.nama || "-";
  const nomorSuratJalan = item.suratJalan?.nomor || "-";

  return `Vol: ${volume} — ${tanggal} — ${mitra} — SJ: ${nomorSuratJalan}`;
};

const TambahPengisianTanki = () => {
  const toast = useToast();
  const history = useHistory();
  const [dataTanki, setDataTanki] = useState([]);
  const [dataSatuanVolume, setDataSatuanVolume] = useState([]);
  const [dataKonfirmasi, setDataKonfirmasi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFormData = async () => {
    setIsLoading(true);
    try {
      const [tankiRes, konfirmasiRes] = await Promise.all([
        axios.get(`${API_BASE}/tanki/get/tanki`),
        axios.get(`${API_BASE}/tanki/get/konfirmasi-penerimaan`),
      ]);
      setDataTanki(tankiRes.data.result || []);
      setDataSatuanVolume(tankiRes.data.resultSatuanVolume || []);
      setDataKonfirmasi(konfirmasiRes.data.result || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/tanki/post`, {
        tanggal: values.tanggal,
        tangkiId: parseInt(values.tangkiId, 10),

        gross: parseInt(values.gross, 10),
        net: parseInt(values.net, 10),
        penampilanVisual: values.penampilanVisual,
        warna: values.warna,
        kandunganAir: parseInt(values.kandunganAir, 10),
        BSW: parseInt(values.BSW, 10),
        catatan: values.catatan,
        saksi: values.saksi,
        satuanVolumeId: parseInt(values.satuanVolumeId, 10),
        ids: values.ids.map((id) => parseInt(id, 10)),
      });

      toast({
        title: "Berhasil",
        description: "Data pengisian tanki berhasil disimpan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      resetForm();
      history.push("/tanki-kpbpn/pengisian");
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description:
          err.response?.data?.message?.message ||
          err.response?.data?.message ||
          err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">Buat BAST</Heading>
            <Button
              variant="outline"
              onClick={() => history.push("/tanki-kpbpn/pengisian")}
            >
              Kembali
            </Button>
          </HStack>

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={pengisianSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl
                        isInvalid={touched.tanggal && errors.tanggal}
                      >
                        <FormLabel>Tanggal</FormLabel>
                        <Input
                          name="tanggal"
                          type="date"
                          value={values.tanggal}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.tanggal}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={touched.tangkiId && errors.tangkiId}
                      >
                        <FormLabel>Tangki</FormLabel>
                        <Select
                          name="tangkiId"
                          placeholder="Pilih tangki"
                          value={values.tangkiId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          {dataTanki.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.kode}
                            </option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.tangkiId}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={touched.gross && errors.gross}>
                        <FormLabel>Gross</FormLabel>
                        <Input
                          name="gross"
                          type="number"
                          value={values.gross}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.gross}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={touched.net && errors.net}>
                        <FormLabel>Net</FormLabel>
                        <Input
                          name="net"
                          type="number"
                          value={values.net}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.net}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={
                          touched.satuanVolumeId && errors.satuanVolumeId
                        }
                      >
                        <FormLabel>Satuan Volume</FormLabel>
                        <Select
                          name="satuanVolumeId"
                          placeholder="Pilih satuan volume"
                          value={values.satuanVolumeId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          {dataSatuanVolume.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.satuan}
                            </option>
                          ))}
                        </Select>
                        <FormErrorMessage>
                          {errors.satuanVolumeId}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={
                          touched.penampilanVisual && errors.penampilanVisual
                        }
                      >
                        <FormLabel>Penampilan Visual</FormLabel>
                        <Input
                          name="penampilanVisual"
                          value={values.penampilanVisual}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>
                          {errors.penampilanVisual}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={touched.warna && errors.warna}>
                        <FormLabel>Warna</FormLabel>
                        <Input
                          name="warna"
                          value={values.warna}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.warna}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={touched.kandunganAir && errors.kandunganAir}
                      >
                        <FormLabel>Kandungan Air</FormLabel>
                        <Input
                          name="kandunganAir"
                          type="number"
                          value={values.kandunganAir}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>
                          {errors.kandunganAir}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={touched.BSW && errors.BSW}>
                        <FormLabel>BSW</FormLabel>
                        <Input
                          name="BSW"
                          type="number"
                          value={values.BSW}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.BSW}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={touched.saksi && errors.saksi}>
                        <FormLabel>Saksi</FormLabel>
                        <Input
                          name="saksi"
                          value={values.saksi}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.saksi}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl isInvalid={touched.catatan && errors.catatan}>
                      <FormLabel>Catatan</FormLabel>
                      <Textarea
                        name="catatan"
                        value={values.catatan}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <FormErrorMessage>{errors.catatan}</FormErrorMessage>
                    </FormControl>

                    <Divider />

                    <FormControl isInvalid={touched.ids && errors.ids}>
                      <FormLabel mb={3}>Konfirmasi Penerimaan</FormLabel>
                      <Text fontSize="sm" color="gray.500" mb={3}>
                        Pilih minimal satu konfirmasi penerimaan yang belum
                        terhubung ke pengisian tanki
                      </Text>
                      {dataKonfirmasi.length === 0 ? (
                        <Text fontSize="sm" color="red.500">
                          Tidak ada konfirmasi penerimaan tersedia. Tambah
                          konfirmasi terlebih dahulu sebelum menyimpan pengisian
                          tanki.
                        </Text>
                      ) : (
                        <CheckboxGroup
                          value={values.ids}
                          onChange={(val) => setFieldValue("ids", val)}
                        >
                          <Stack spacing={2}>
                            {dataKonfirmasi.map((item) => (
                              <Checkbox key={item.id} value={String(item.id)}>
                                {getKonfirmasiPenerimaanLabel(item)}
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      )}
                      <FormErrorMessage>{errors.ids}</FormErrorMessage>
                    </FormControl>

                    <HStack justify="flex-end" pt={4}>
                      <Button
                        variant="outline"
                        onClick={() => history.push("/tanki-kpbpn/pengisian")}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        isDisabled={dataKonfirmasi.length === 0}
                      >
                        Simpan
                      </Button>
                    </HStack>
                  </VStack>
                </Form>
              )}
            </Formik>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
};

export default TambahPengisianTanki;
