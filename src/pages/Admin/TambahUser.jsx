import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../Componets/Layout";
import { useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import Loading from "../../Componets/Loading";
import { register } from "../../Redux/Reducers/auth";
import { Select as Select2 } from "chakra-react-select";
import { Formik, Form } from "formik";
import * as Yup from "yup";

function TambahUser() {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const history = useHistory();
  const [dataRole, setDataRole] = useState(null);
  const [dataMitra, setDataMitra] = useState([]);

  const initialValues = {
    nama: "",
    role: null,
    mitra: null,
    namaPengguna: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    nama: Yup.string().required("Nama wajib diisi"),
    role: Yup.mixed().nullable().required("Role wajib dipilih"),
    mitra: Yup.mixed().nullable(),
    namaPengguna: Yup.string()
      .required("Nama Pengguna wajib diisi")
      .min(3, "Nama Pengguna minimal 3 karakter"),
    password: Yup.string()
      .required("Kata Sandi wajib diisi")
      .min(6, "Kata Sandi minimal 6 karakter"),
  });

  async function fetchFormData() {
    try {
      const [roleRes, mitraRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/get-role`,
        ),
        axios.get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/mitra/get`),
      ]);
      setDataRole(roleRes.data.result);
      setDataMitra(mitraRes.data.resultMitra ?? []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFormData();
  }, []);

  const selectStyles = {
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
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const roleId = values.role?.value?.id || values.role?.id || values.role;
      const mitraId =
        values.mitra?.value?.id || values.mitra?.id || values.mitra || null;
      await dispatch(
        register(
          values.nama,
          values.password,
          values.namaPengguna,
          roleId,
          mitraId,
        ),
      );
      history.push("/admin/daftar-user");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box bgColor={"secondary"} minH={"90vh"} pb={"40px"} px={"30px"}>
        <Container variant={"primary"} maxW={"1280px"} p={"30px"}>
          {isLoading ? (
            <Loading />
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form>
                  <FormControl
                    my={"30px"}
                    isInvalid={!!errors.nama && touched.nama}
                  >
                    <FormLabel fontSize={"24px"}>Nama</FormLabel>
                    <Input
                      height={"60px"}
                      bgColor={"terang"}
                      value={values.nama}
                      onChange={(e) => setFieldValue("nama", e.target.value)}
                      placeholder="Nama"
                    />
                    <FormErrorMessage>{errors.nama}</FormErrorMessage>
                  </FormControl>

                  <FormControl
                    my={"30px"}
                    isInvalid={!!errors.role && touched.role}
                  >
                    <FormLabel fontSize={"24px"}>Role</FormLabel>
                    <Select2
                      options={dataRole?.map((val) => ({
                        value: val,
                        label: val.name ?? val.nama,
                      }))}
                      placeholder="Cari Role"
                      focusBorderColor="red"
                      value={values.role}
                      onChange={(selectedOption) => {
                        setFieldValue("role", selectedOption);
                      }}
                      components={{
                        DropdownIndicator: () => null,
                        IndicatorSeparator: () => null,
                      }}
                      chakraStyles={selectStyles}
                    />
                    <FormErrorMessage>{errors.role}</FormErrorMessage>
                  </FormControl>

                  <FormControl my={"30px"}>
                    <FormLabel fontSize={"24px"}>Mitra (Opsional)</FormLabel>
                    <Select2
                      isClearable
                      options={dataMitra.map((val) => ({
                        value: val,
                        label: val.kode ? `${val.nama} (${val.kode})` : val.nama,
                      }))}
                      placeholder="Pilih Mitra"
                      focusBorderColor="red"
                      value={values.mitra}
                      onChange={(selectedOption) => {
                        setFieldValue("mitra", selectedOption);
                      }}
                      components={{
                        DropdownIndicator: () => null,
                        IndicatorSeparator: () => null,
                      }}
                      chakraStyles={selectStyles}
                    />
                  </FormControl>

                  <FormControl
                    my={"30px"}
                    isInvalid={!!errors.namaPengguna && touched.namaPengguna}
                  >
                    <FormLabel fontSize={"24px"}>Nama Pengguna</FormLabel>
                    <Input
                      height={"60px"}
                      bgColor={"terang"}
                      value={values.namaPengguna}
                      onChange={(e) =>
                        setFieldValue("namaPengguna", e.target.value)
                      }
                      placeholder="Nama Pengguna"
                    />
                    <FormErrorMessage>{errors.namaPengguna}</FormErrorMessage>
                  </FormControl>

                  <FormControl
                    my={"30px"}
                    isInvalid={!!errors.password && touched.password}
                  >
                    <FormLabel fontSize={"24px"}>Kata Sandi</FormLabel>
                    <Input
                      type="password"
                      height={"60px"}
                      bgColor={"terang"}
                      value={values.password}
                      onChange={(e) =>
                        setFieldValue("password", e.target.value)
                      }
                      placeholder="kata sandi"
                    />
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  <Button
                    mt={"30px"}
                    variant={"primary"}
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Menambahkan..."
                  >
                    Tambah +
                  </Button>
                </Form>
              )}
            </Formik>
          )}
        </Container>
      </Box>
    </Layout>
  );
}

export default TambahUser;
