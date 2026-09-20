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
  FormHelperText,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Select,
  Container,
  Heading,
  HStack,
  Flex,
  Spacer,
  Stack,
  SimpleGrid,
  Checkbox,
  Text,
  Divider,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import { userRedux } from "../../Redux/Reducers/auth";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const pengisianSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  tangkiId: Yup.string().required("Tangki wajib dipilih"),

  gross: Yup.number()
    .typeError("Gross harus angka")
    .required("Gross wajib diisi"),
  net: Yup.number()
    .typeError("Net harus angka")
    .required("Net wajib diisi")
    .min(0, "Net tidak boleh negatif"),
  penampilanVisual: Yup.string().required("Penampilan visual wajib diisi"),
  warna: Yup.string().required("Warna wajib diisi"),
  kandunganAir: Yup.number()
    .typeError("Kandungan air harus angka")
    .required("Kandungan air wajib diisi")
    .min(0, "Kandungan air tidak boleh negatif")
    .test(
      "max-gross",
      "Kandungan air tidak boleh lebih besar dari Gross",
      function (value) {
        const { gross } = this.parent;
        if (
          value === undefined ||
          value === null ||
          gross === "" ||
          gross === undefined
        ) {
          return true;
        }
        return Number(value) <= Number(gross);
      },
    ),
  BSW: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null || originalValue === undefined
        ? null
        : value,
    )
    .nullable()
    .typeError("BSW harus angka"),
  satuanVolumeId: Yup.string().required("Satuan volume wajib dipilih"),
  catatan: Yup.string(),
  saksi: Yup.string(),
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

const hitungNet = (gross, kandunganAir) => {
  if (gross === "" || kandunganAir === "") return "";
  const nilaiGross = Number(gross);
  const nilaiKandunganAir = Number(kandunganAir);
  if (Number.isNaN(nilaiGross) || Number.isNaN(nilaiKandunganAir)) return "";
  return nilaiGross - nilaiKandunganAir;
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(angka);
};

const toggleKonfirmasiId = (ids, id) => {
  const strId = String(id);
  return ids.includes(strId)
    ? ids.filter((value) => value !== strId)
    : [...ids, strId];
};

const getLinkedTankiKode = (kp) =>
  Array.from(
    new Set(
      (kp.pengisianTankis || [])
        .map((item) => item.tanki?.kode)
        .filter(Boolean),
    ),
  );

const MobileField = ({ label, children }) => (
  <Box minW={0}>
    <Text
      fontSize="xs"
      color="gray.500"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={0.5}
    >
      {label}
    </Text>
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

const TambahPengisianTanki = () => {
  const toast = useToast();
  const history = useHistory();
  const user = useSelector(userRedux);
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
        axios.get(`${API_BASE}/tanki/get/konfirmasi-penerimaan`, {
          params: { availableForPengisian: 1 },
        }),
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
      const gross = parseInt(values.gross, 10);
      const kandunganAir = parseInt(values.kandunganAir, 10);

      await axios.post(`${API_BASE}/tanki/post`, {
        tanggal: values.tanggal,
        tangkiId: parseInt(values.tangkiId, 10),

        gross,
        net: gross - kandunganAir,
        penampilanVisual: values.penampilanVisual,
        warna: values.warna,
        kandunganAir,
        BSW:
          values.BSW === "" || values.BSW === null || values.BSW === undefined
            ? null
            : parseInt(values.BSW, 10),
        catatan: values.catatan,
        saksi: values.saksi || null,
        satuanVolumeId: parseInt(values.satuanVolumeId, 10),
        ids: values.ids.map((id) => parseInt(id, 10)),
        userKPBPNId: user?.id || null,
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
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
        overflowX="hidden"
      >
        <Container
          variant="primary"
          maxW="100%"
          minW={0}
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
            gap={3}
            mb={6}
          >
            <VStack
              align={{ base: "center", sm: "start" }}
              spacing={1}
              minW={0}
            >
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", sm: "left" }}
              >
                Buat BAST
              </Heading>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", sm: "left" }}
              >
                Dokumen akan tercatat atas nama:{" "}
                <Text as="span" fontWeight="semibold" color="gray.700">
                  {user?.nama || "-"}
                </Text>
              </Text>
            </VStack>
            <Spacer display={{ base: "none", sm: "block" }} />
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={() => history.push("/tanki-kpbpn/pengisian")}
            >
              Kembali
            </Button>
          </Flex>

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
                setFieldTouched,
              }) => {
                const isAllSelected =
                  dataKonfirmasi.length > 0 &&
                  dataKonfirmasi.every((item) =>
                    values.ids.includes(String(item.id)),
                  );
                const isSomeSelected =
                  values.ids.length > 0 &&
                  values.ids.length < dataKonfirmasi.length;
                const toggleSemua = (checked) => {
                  setFieldTouched("ids", true);
                  setFieldValue(
                    "ids",
                    checked
                      ? dataKonfirmasi.map((item) => String(item.id))
                      : [],
                  );
                };

                return (
                <Form>
                  <VStack spacing={{ base: 4, md: 6 }} align="stretch" minW={0}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 3, md: 4 }}>
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
                          onChange={(e) => {
                            handleChange(e);
                            const selected = dataTanki.find(
                              (item) => String(item.id) === e.target.value,
                            );
                            if (selected?.satuanVolumeId) {
                              setFieldValue(
                                "satuanVolumeId",
                                String(selected.satuanVolumeId),
                              );
                            }
                          }}
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
                          onChange={(e) => {
                            handleChange(e);
                            setFieldValue(
                              "net",
                              hitungNet(e.target.value, values.kandunganAir),
                            );
                          }}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.gross}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={touched.kandunganAir && errors.kandunganAir}
                      >
                        <FormLabel>Kandungan Air</FormLabel>
                        <Input
                          name="kandunganAir"
                          type="number"
                          value={values.kandunganAir}
                          onChange={(e) => {
                            handleChange(e);
                            setFieldValue(
                              "net",
                              hitungNet(values.gross, e.target.value),
                            );
                          }}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>
                          {errors.kandunganAir}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl isInvalid={touched.net && errors.net}>
                        <FormLabel>Net</FormLabel>
                        <Input
                          name="net"
                          type="number"
                          value={values.net}
                          isReadOnly
                          bg="gray.50"
                          onBlur={handleBlur}
                        />
                        <FormHelperText>
                          Otomatis: Gross − Kandungan Air
                        </FormHelperText>
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
                        Pilih minimal satu konfirmasi penerimaan. Hanya
                        surat jalan berstatus BONGKAR yang belum terhubung ke
                        pengisian, atau yang terhubung paling lama 2 hari yang
                        lalu, yang ditampilkan.
                      </Text>
                      {dataKonfirmasi.length === 0 ? (
                        <Text fontSize="sm" color="red.500">
                          Tidak ada konfirmasi penerimaan berstatus BONGKAR
                          yang tersedia. Lakukan konfirmasi bongkar terlebih
                          dahulu sebelum menyimpan pengisian tanki.
                        </Text>
                      ) : (
                        <Box minW={0}>
                          <Flex
                            justify="space-between"
                            align={{ base: "stretch", sm: "center" }}
                            direction={{ base: "column", sm: "row" }}
                            gap={2}
                            mb={3}
                          >
                            <Text fontSize="sm" color="gray.600">
                              {values.ids.length} dari {dataKonfirmasi.length}{" "}
                              data dipilih
                            </Text>
                            <Checkbox
                              isChecked={isAllSelected}
                              isIndeterminate={isSomeSelected}
                              onChange={(e) => toggleSemua(e.target.checked)}
                            >
                              Pilih semua
                            </Checkbox>
                          </Flex>

                          <Stack
                            display={{ base: "flex", lg: "none" }}
                            spacing={3}
                          >
                            {dataKonfirmasi.map((item, index) => {
                              const id = String(item.id);
                              const isSelected = values.ids.includes(id);
                              const linkedTanki = getLinkedTankiKode(item);

                              return (
                                <Box
                                  key={item.id}
                                  p={4}
                                  borderRadius="lg"
                                  border="1px solid"
                                  borderColor={
                                    isSelected ? "orange.300" : "gray.200"
                                  }
                                  bg={isSelected ? "orange.50" : "white"}
                                  boxShadow="sm"
                                  cursor="pointer"
                                  onClick={() => {
                                    setFieldTouched("ids", true);
                                    setFieldValue(
                                      "ids",
                                      toggleKonfirmasiId(values.ids, item.id),
                                    );
                                  }}
                                >
                                  <HStack
                                    justify="space-between"
                                    align="start"
                                    mb={3}
                                    spacing={3}
                                  >
                                    <HStack align="start" spacing={3} minW={0}>
                                      <Checkbox
                                        mt={1}
                                        isChecked={isSelected}
                                        onChange={() => {
                                          setFieldTouched("ids", true);
                                          setFieldValue(
                                            "ids",
                                            toggleKonfirmasiId(
                                              values.ids,
                                              item.id,
                                            ),
                                          );
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <VStack align="start" spacing={0} minW={0}>
                                        <Text fontSize="xs" color="gray.500">
                                          No. {index + 1}
                                        </Text>
                                        <Text
                                          fontWeight="bold"
                                          color="kpbpn"
                                          wordBreak="break-word"
                                        >
                                          {item.nomor || "-"}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    {linkedTanki.length > 0 ? (
                                      <HStack
                                        flexWrap="wrap"
                                        spacing={1}
                                        justify="flex-end"
                                        flexShrink={0}
                                      >
                                        {linkedTanki.map((kode) => (
                                          <Badge
                                            key={kode}
                                            colorScheme="orange"
                                          >
                                            {kode}
                                          </Badge>
                                        ))}
                                      </HStack>
                                    ) : (
                                      <Badge colorScheme="gray" flexShrink={0}>
                                        Belum terhubung
                                      </Badge>
                                    )}
                                  </HStack>

                                  <SimpleGrid
                                    columns={{ base: 1, sm: 2 }}
                                    spacing={3}
                                  >
                                    <MobileField label="Tanggal">
                                      {formatDate(item.tanggal)}
                                    </MobileField>
                                    <MobileField label="Surat Jalan">
                                      {item.suratJalan?.nomor || "-"}
                                    </MobileField>
                                    <MobileField label="Mitra">
                                      {item.suratJalan?.mitra?.nama || "-"}
                                    </MobileField>
                                    <MobileField label="Supir">
                                      {item.suratJalan?.supir?.nama || "-"}
                                    </MobileField>
                                    <MobileField label="Transportir">
                                      {item.suratJalan?.transportir?.plat ||
                                        "-"}
                                    </MobileField>
                                    <MobileField label="Volume">
                                      <VolumeMultiSatuan
                                        volume={
                                          item.volume ?? item.suratJalan?.volume
                                        }
                                        satuan={
                                          item.suratJalan?.satuanVolume
                                            ?.satuan || "Barrel"
                                        }
                                      />
                                    </MobileField>
                                    <MobileField label="API">
                                      {formatAngka(item.api)}
                                    </MobileField>
                                    <MobileField label="BSNW">
                                      {formatAngka(item.BSNW)}
                                    </MobileField>
                                    <MobileField label="Petugas PK">
                                      {item.userPK?.nama || "-"}
                                    </MobileField>
                                    <MobileField label="Petugas Lab">
                                      {item.userLab?.nama || "-"}
                                    </MobileField>
                                  </SimpleGrid>
                                </Box>
                              );
                            })}
                          </Stack>

                          <TableContainer
                            display={{ base: "none", lg: "block" }}
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            maxH="360px"
                            overflowY="auto"
                            overflowX="auto"
                          >
                            <Table size="sm" variant="simple" minW="1200px">
                              <Thead
                                bg="gray.50"
                                position="sticky"
                                top={0}
                                zIndex={1}
                                sx={{ th: { bg: "gray.50" } }}
                              >
                                <Tr>
                                  <Th w="48px">
                                    <Checkbox
                                      isChecked={isAllSelected}
                                      isIndeterminate={isSomeSelected}
                                      onChange={(e) =>
                                        toggleSemua(e.target.checked)
                                      }
                                    />
                                  </Th>
                                  <Th textTransform="capitalize">No.</Th>
                                  <Th textTransform="capitalize">Nomor</Th>
                                  <Th textTransform="capitalize">Tanggal</Th>
                                  <Th textTransform="capitalize">
                                    Surat Jalan
                                  </Th>
                                  <Th textTransform="capitalize">Mitra</Th>
                                  <Th textTransform="capitalize">Supir</Th>
                                  <Th textTransform="capitalize">
                                    Transportir
                                  </Th>
                                  <Th textTransform="capitalize">Volume</Th>
                                  <Th textTransform="capitalize">API</Th>
                                  <Th textTransform="capitalize">BSNW</Th>
                                  <Th textTransform="capitalize">Petugas PK</Th>
                                  <Th textTransform="capitalize">
                                    Petugas Lab
                                  </Th>
                                  <Th textTransform="capitalize">
                                    Tanki terkait
                                  </Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {dataKonfirmasi.map((item, index) => {
                                  const id = String(item.id);
                                  const isSelected = values.ids.includes(id);
                                  const linkedTanki = getLinkedTankiKode(item);

                                  return (
                                    <Tr
                                      key={item.id}
                                      bg={isSelected ? "orange.50" : "white"}
                                      _hover={{
                                        bg: isSelected
                                          ? "orange.50"
                                          : "gray.50",
                                      }}
                                      cursor="pointer"
                                      onClick={() => {
                                        setFieldTouched("ids", true);
                                        setFieldValue(
                                          "ids",
                                          toggleKonfirmasiId(
                                            values.ids,
                                            item.id,
                                          ),
                                        );
                                      }}
                                    >
                                      <Td onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                          isChecked={isSelected}
                                          onChange={() => {
                                            setFieldTouched("ids", true);
                                            setFieldValue(
                                              "ids",
                                              toggleKonfirmasiId(
                                                values.ids,
                                                item.id,
                                              ),
                                            );
                                          }}
                                        />
                                      </Td>
                                      <Td>{index + 1}</Td>
                                      <Td fontWeight="medium" whiteSpace="nowrap">
                                        {item.nomor || "-"}
                                      </Td>
                                      <Td whiteSpace="nowrap">
                                        {formatDate(item.tanggal)}
                                      </Td>
                                      <Td whiteSpace="nowrap">
                                        {item.suratJalan?.nomor || "-"}
                                      </Td>
                                      <Td>
                                        {item.suratJalan?.mitra?.nama || "-"}
                                      </Td>
                                      <Td>
                                        {item.suratJalan?.supir?.nama || "-"}
                                      </Td>
                                      <Td>
                                        {item.suratJalan?.transportir?.plat ||
                                          "-"}
                                      </Td>
                                      <Td>
                                        <VolumeMultiSatuan
                                          volume={
                                            item.volume ??
                                            item.suratJalan?.volume
                                          }
                                          satuan={
                                            item.suratJalan?.satuanVolume
                                              ?.satuan || "Barrel"
                                          }
                                        />
                                      </Td>
                                      <Td>{formatAngka(item.api)}</Td>
                                      <Td>{formatAngka(item.BSNW)}</Td>
                                      <Td>{item.userPK?.nama || "-"}</Td>
                                      <Td>{item.userLab?.nama || "-"}</Td>
                                      <Td>
                                        {linkedTanki.length === 0 ? (
                                          <Text fontSize="sm" color="gray.500">
                                            Belum terhubung
                                          </Text>
                                        ) : (
                                          linkedTanki.map((kode) => (
                                            <Badge
                                              key={kode}
                                              colorScheme="orange"
                                              mr={1}
                                              mb={1}
                                            >
                                              {kode}
                                            </Badge>
                                          ))
                                        )}
                                      </Td>
                                    </Tr>
                                  );
                                })}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                      <FormErrorMessage>{errors.ids}</FormErrorMessage>
                    </FormControl>

                    <Flex
                      justify={{ base: "stretch", sm: "flex-end" }}
                      direction={{ base: "column-reverse", sm: "row" }}
                      gap={3}
                      pt={4}
                    >
                      <Button
                        variant="outline"
                        w={{ base: "full", sm: "auto" }}
                        onClick={() => history.push("/tanki-kpbpn/pengisian")}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        w={{ base: "full", sm: "auto" }}
                        isLoading={isSubmitting}
                        isDisabled={dataKonfirmasi.length === 0}
                      >
                        Simpan
                      </Button>
                    </Flex>
                  </VStack>
                </Form>
                );
              }}
            </Formik>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
};

export default TambahPengisianTanki;
