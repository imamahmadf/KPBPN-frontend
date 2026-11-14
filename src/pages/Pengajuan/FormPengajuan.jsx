import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { userRedux } from "../../Redux/Reducers/auth";
import { buatItemKosong, formatRupiah, getFotoUrl } from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

function FormPengajuan({ match }) {
  const pengajuanId = match?.params?.id;
  const isEdit = Boolean(pengajuanId);
  const history = useHistory();
  const toast = useToast();
  const user = useSelector(userRedux);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [nomor, setNomor] = useState("");
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: "barang",
    level: "normal",
    tanggalDibutuhkan: "",
    lokasi: "",
    keperluan: "",
    catatan: "",
    mengetahuiId: "",
    menyetujuiId: "",
  });
  const [items, setItems] = useState([buatItemKosong()]);
  const [katalog, setKatalog] = useState([]);
  const [katalogTerbuka, setKatalogTerbuka] = useState(null);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/pengajuan-barjas/barang-jasa`, { params: { ringkas: 1 } })
      .then((res) => setKatalog(res.data.result || []))
      .catch(() => setKatalog([]));
    axios
      .get(`${API_BASE}/pengajuan-barjas/seed`)
      .then((res) => {
        setSupervisorOptions(res.data.supervisor || []);
        setManagerOptions(res.data.generalManager || []);
      })
      .catch(() => {
        setSupervisorOptions([]);
        setManagerOptions([]);
      });
  }, []);

  useEffect(() => {
    if (!pengajuanId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/pengajuan-barjas/detail/${pengajuanId}`,
        );
        const data = res.data.result;
        setNomor(data.nomor || "");
        setForm({
          tanggal: String(data.tanggal || "").slice(0, 10),
          jenis: data.jenis || "barang",
          level: data.level || "normal",
          tanggalDibutuhkan: data.tanggalDibutuhkan
            ? String(data.tanggalDibutuhkan).slice(0, 10)
            : "",
          lokasi: data.lokasi || "",
          keperluan: data.keperluan || "",
          catatan: data.catatan || "",
          mengetahuiId: data.mengetahuiId ? String(data.mengetahuiId) : "",
          menyetujuiId: data.menyetujuiId ? String(data.menyetujuiId) : "",
        });
        const loaded = (data.itemPengajuanBarjasKpbpns || []).map((item) => ({
          ...buatItemKosong(),
          id: item.id,
          nama: item.nama || "",
          spesifikasi: item.spesifikasi || "",
          jumlah: item.jumlah ?? "",
          satuan: item.satuan || "unit",
          keterangan: item.keterangan || "",
          estimasiHarga: item.estimasiHarga ?? "",
          barangJasaKpbpnId: item.barangJasaKpbpnId || null,
          foto: item.foto || null,
        }));
        setItems(loaded.length ? loaded : [buatItemKosong()]);
      } catch (err) {
        toast({
          title: "Gagal memuat pengajuan",
          description: err.response?.data?.error || err.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [pengajuanId, toast]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field !== "jenis") return;
    setItems((prev) =>
      prev.map((item) => {
        if (!item.barangJasaKpbpnId) return item;
        const master = katalog.find((row) => row.id === item.barangJasaKpbpnId);
        if (master && master.jenis !== value) {
          return { ...item, barangJasaKpbpnId: null };
        }
        return item;
      }),
    );
  };

  const updateItem = (key, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const next = { ...item, [field]: value };
        if (field === "nama") {
          const master = katalog.find(
            (row) =>
              row.jenis === form.jenis &&
              row.nama.trim().toLowerCase() === value.trim().toLowerCase(),
          );
          next.barangJasaKpbpnId = master ? master.id : null;
          if (master && !item.spesifikasi) next.spesifikasi = master.spesifikasi || "";
          if (master && (!item.satuan || item.satuan === "unit")) {
            next.satuan = master.satuan || "unit";
          }
          if (
            master &&
            (item.estimasiHarga === "" || item.estimasiHarga == null) &&
            master.estimasiTerbaru != null &&
            master.estimasiTerbaru !== ""
          ) {
            next.estimasiHarga = String(master.estimasiTerbaru);
          }
        }
        return next;
      }),
    );
  };

  const pilihKatalog = (key, id) => {
    const master = katalog.find((row) => String(row.id) === String(id));
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        if (!master) return { ...item, barangJasaKpbpnId: null };
        return {
          ...item,
          barangJasaKpbpnId: master.id,
          nama: master.nama,
          satuan: master.satuan || "unit",
          spesifikasi: master.spesifikasi || "",
          estimasiHarga:
            master.estimasiTerbaru != null && master.estimasiTerbaru !== ""
              ? String(master.estimasiTerbaru)
              : item.estimasiHarga,
        };
      }),
    );
  };

  const pilihFoto = (key, file) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        if (item.preview) URL.revokeObjectURL(item.preview);
        return {
          ...item,
          file: file || null,
          preview: file ? URL.createObjectURL(file) : null,
          hapusFoto: false,
        };
      }),
    );
  };

  const hapusFotoItem = (key) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        if (item.preview) URL.revokeObjectURL(item.preview);
        return { ...item, file: null, preview: null, foto: null, hapusFoto: true };
      }),
    );
  };

  const simpan = async () => {
    if (!form.keperluan.trim()) {
      toast({
        title: "Keperluan wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!form.mengetahuiId) {
      toast({
        title: "Mengetahui wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!form.menyetujuiId) {
      toast({
        title: "Menyetujui wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const itemAktif = items.filter(
      (item) =>
        item.nama.trim() ||
        String(item.jumlah).trim() ||
        item.spesifikasi.trim() ||
        item.keterangan.trim(),
    );
    const tanpaEstimasi = itemAktif.find((item) => {
      const angka = Number(String(item.estimasiHarga).replace(/[^\d]/g, ""));
      return !Number.isFinite(angka) || angka <= 0;
    });
    if (tanpaEstimasi) {
      toast({
        title: "Estimasi harga wajib diisi",
        description: "Isi estimasi harga satuan untuk setiap item.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!user?.id) {
      toast({
        title: "Data pengguna tidak ditemukan",
        description: "Masuk ulang, lalu buat pengajuan lagi.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      ...form,
      pemohonId: user.id,
      items: items.map((item) => ({
        id: item.id,
        nama: item.nama,
        spesifikasi: item.spesifikasi,
        jumlah: item.jumlah,
        satuan: item.satuan,
        keterangan: item.keterangan,
        estimasiHarga: item.estimasiHarga,
        barangJasaKpbpnId: item.barangJasaKpbpnId,
        foto: item.foto,
        hapusFoto: item.hapusFoto,
      })),
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    items.forEach((item, index) => {
      if (item.file) formData.append(`foto_${index}`, item.file);
    });

    setIsSaving(true);
    try {
      const url = isEdit
        ? `${API_BASE}/pengajuan-barjas/edit/${pengajuanId}`
        : `${API_BASE}/pengajuan-barjas/post`;
      const res = await axios.post(url, formData);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      history.push(`/pengajuan/detail/${res.data.result.id}`);
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="5xl">
          <HStack justify="space-between" mb={6} align="start">
            <Box>
              <Heading size="lg">
                {isEdit ? "Ubah Pengajuan" : "Buat Pengajuan"}
              </Heading>
              <Text color="gray.500" mt={1}>
                {isEdit
                  ? `Nomor ${nomor}`
                  : "Nomor pengajuan dibuat otomatis saat disimpan."}
              </Text>
            </Box>
            <Button variant="outline" onClick={() => history.push("/pengajuan/daftar")}>
              Kembali
            </Button>
          </HStack>

          {isLoading ? (
            <Text>Memuat data...</Text>
          ) : (
            <Stack spacing={4}>
              <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 3, md: 5 }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Tanggal pengajuan</FormLabel>
                    <Input
                      type="date"
                      value={form.tanggal}
                      onChange={(e) => updateForm("tanggal", e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Tanggal dibutuhkan</FormLabel>
                    <Input
                      type="date"
                      value={form.tanggalDibutuhkan}
                      onChange={(e) =>
                        updateForm("tanggalDibutuhkan", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Jenis</FormLabel>
                    <Select
                      value={form.jenis}
                      onChange={(e) => updateForm("jenis", e.target.value)}
                    >
                      <option value="barang">Barang</option>
                      <option value="jasa">Jasa</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Level</FormLabel>
                    <Select
                      value={form.level}
                      onChange={(e) => updateForm("level", e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Lokasi penggunaan</FormLabel>
                    <Input
                      value={form.lokasi}
                      onChange={(e) => updateForm("lokasi", e.target.value)}
                      placeholder="Contoh: kantor KPBPN, stasiun pengumpul"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Mengetahui</FormLabel>
                    <Select
                      placeholder="Pilih supervisor"
                      value={form.mengetahuiId}
                      onChange={(e) => updateForm("mengetahuiId", e.target.value)}
                    >
                      {supervisorOptions.map((pengguna) => (
                        <option key={pengguna.id} value={pengguna.id}>
                          {pengguna.nama}
                        </option>
                      ))}
                    </Select>
                    {!supervisorOptions.length && (
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Belum ada user dengan role Supervisor.
                      </Text>
                    )}
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Menyetujui</FormLabel>
                    <Select
                      placeholder="Pilih general manager"
                      value={form.menyetujuiId}
                      onChange={(e) => updateForm("menyetujuiId", e.target.value)}
                    >
                      {managerOptions.map((pengguna) => (
                        <option key={pengguna.id} value={pengguna.id}>
                          {pengguna.nama}
                        </option>
                      ))}
                    </Select>
                    {!managerOptions.length && (
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Belum ada user dengan role General Manager.
                      </Text>
                    )}
                  </FormControl>
                  <FormControl isRequired gridColumn={{ md: "1 / -1" }}>
                    <FormLabel>Keperluan</FormLabel>
                    <Textarea
                      value={form.keperluan}
                      onChange={(e) => updateForm("keperluan", e.target.value)}
                      placeholder="Jelaskan untuk apa barang atau jasa ini diajukan"
                    />
                  </FormControl>
                  <FormControl gridColumn={{ md: "1 / -1" }}>
                    <FormLabel>Catatan</FormLabel>
                    <Textarea
                      value={form.catatan}
                      onChange={(e) => updateForm("catatan", e.target.value)}
                      placeholder="Catatan tambahan, opsional"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {items.map((item, index) => {
                const preview =
                  item.preview || (item.foto ? getFotoUrl(item.foto) : null);
                const kata = item.nama.trim().toLowerCase();
                const saran = katalog.filter(
                  (row) =>
                    row.jenis === form.jenis &&
                    (!kata || row.nama.toLowerCase().includes(kata)),
                );
                const masterTerpilih = katalog.find(
                  (row) => String(row.id) === String(item.barangJasaKpbpnId),
                );
                const adaEstimasiTerakhir =
                  masterTerpilih &&
                  masterTerpilih.estimasiTerbaru != null &&
                  masterTerpilih.estimasiTerbaru !== "";
                return (
                  <Box
                    key={item.key}
                    bg="white"
                    borderWidth="1px"
                    borderRadius="md"
                    p={{ base: 3, md: 5 }}
                  >
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold">Item {index + 1}</Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        isDisabled={items.length === 1}
                        onClick={() =>
                          setItems((prev) => prev.filter((row) => row.key !== item.key))
                        }
                      >
                        Hapus item
                      </Button>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired gridColumn={{ md: "1 / -1" }}>
                        <FormLabel>Nama barang / jasa</FormLabel>
                        <Box
                          position="relative"
                          zIndex={katalogTerbuka === item.key ? 30 : 1}
                        >
                          <Input
                            value={item.nama}
                            placeholder="Ketik item baru, atau pilih yang sudah terdaftar"
                            autoComplete="off"
                            onFocus={() => setKatalogTerbuka(item.key)}
                            onBlur={() => {
                              window.setTimeout(() => {
                                setKatalogTerbuka((terbuka) =>
                                  terbuka === item.key ? null : terbuka,
                                );
                              }, 150);
                            }}
                            onChange={(e) => {
                              updateItem(item.key, "nama", e.target.value);
                              setKatalogTerbuka(item.key);
                            }}
                          />
                          {katalogTerbuka === item.key && (
                            <Box
                              position="absolute"
                              zIndex={20}
                              top="100%"
                              left={0}
                              right={0}
                              mt={1}
                              bg="white"
                              borderWidth="1px"
                              borderRadius="md"
                              boxShadow="md"
                              maxH="220px"
                              overflowY="auto"
                            >
                              {saran.length === 0 ? (
                                <Text px={3} py={2} fontSize="sm" color="gray.500">
                                  {item.nama.trim()
                                    ? "Nama ini belum terdaftar dan akan disimpan sebagai item baru."
                                    : "Belum ada item terdaftar untuk jenis ini. Ketik nama item baru."}
                                </Text>
                              ) : (
                                saran.map((row) => (
                                    <Box
                                      as="button"
                                      type="button"
                                      key={row.id}
                                      w="100%"
                                      textAlign="left"
                                      px={3}
                                      py={2}
                                      _hover={{ bg: "orange.50" }}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        pilihKatalog(item.key, row.id);
                                        setKatalogTerbuka(null);
                                      }}
                                    >
                                      <Text fontWeight="semibold">{row.nama}</Text>
                                      <Text fontSize="xs" color="gray.500">
                                        Terdaftar · {row.satuan}
                                        {row.spesifikasi ? ` · ${row.spesifikasi}` : ""}
                                        {" · "}
                                        {row.estimasiTerbaru != null &&
                                        row.estimasiTerbaru !== ""
                                          ? `Estimasi terakhir ${formatRupiah(row.estimasiTerbaru)}`
                                          : "Belum ada estimasi"}
                                      </Text>
                                    </Box>
                                  ))
                              )}
                            </Box>
                          )}
                        </Box>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {item.barangJasaKpbpnId
                            ? "Terhubung ke item terdaftar. Jumlahnya ikut terlacak."
                            : "Ketik untuk item baru, atau pilih saran di atas untuk item yang sudah terdaftar."}
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Spesifikasi</FormLabel>
                        <Input
                          value={item.spesifikasi}
                          onChange={(e) =>
                            updateItem(item.key, "spesifikasi", e.target.value)
                          }
                          placeholder="Merek, ukuran, atau uraian jasa"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Jumlah</FormLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.jumlah}
                          onChange={(e) =>
                            updateItem(item.key, "jumlah", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Satuan</FormLabel>
                        <Input
                          value={item.satuan}
                          onChange={(e) =>
                            updateItem(item.key, "satuan", e.target.value)
                          }
                          placeholder="unit, liter, hari"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Estimasi harga satuan</FormLabel>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.estimasiHarga}
                          onChange={(e) =>
                            updateItem(item.key, "estimasiHarga", e.target.value)
                          }
                          placeholder="Harga per satuan"
                        />
                        {adaEstimasiTerakhir && (
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            Estimasi terakhir {formatRupiah(masterTerpilih.estimasiTerbaru)}.
                            Nilai ini bisa diubah untuk pengajuan ini.
                          </Text>
                        )}
                      </FormControl>
                      <FormControl gridColumn={{ md: "1 / -1" }}>
                        <FormLabel>Keterangan</FormLabel>
                        <Textarea
                          value={item.keterangan}
                          onChange={(e) =>
                            updateItem(item.key, "keterangan", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Foto</FormLabel>
                        <Input
                          type="file"
                          accept="image/*"
                          p={1}
                          onChange={(e) => pilihFoto(item.key, e.target.files?.[0])}
                        />
                      </FormControl>
                      {preview && (
                        <Box>
                          <Image
                            src={preview}
                            alt={item.nama || "Foto item"}
                            maxH="140px"
                            objectFit="contain"
                            borderWidth="1px"
                            borderRadius="md"
                          />
                          <Button
                            size="xs"
                            variant="link"
                            colorScheme="red"
                            mt={1}
                            onClick={() => hapusFotoItem(item.key)}
                          >
                            Hapus foto
                          </Button>
                        </Box>
                      )}
                    </SimpleGrid>
                  </Box>
                );
              })}

              <HStack>
                <Button
                  variant="outline"
                  onClick={() => setItems((prev) => [...prev, buatItemKosong()])}
                >
                  Tambah item
                </Button>
              </HStack>

              <Button
                colorScheme="orange"
                alignSelf="flex-end"
                isLoading={isSaving}
                onClick={simpan}
              >
                Simpan Pengajuan
              </Button>
            </Stack>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default FormPengajuan;
