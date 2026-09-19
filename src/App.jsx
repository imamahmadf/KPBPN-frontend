import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register.jsx";
import { useDispatch } from "react-redux";
import { checkAuth } from "./Redux/Reducers/auth.js";
import ProtectedRoute from "./Componets/ProtectedRoute";
import Template from "./pages/Template.jsx";
import TambahUser from "./pages/Admin/TambahUser.jsx";
import UnitKerjaAdmin from "./pages/Admin/UnitKerjaAdmin.jsx";
import DaftarIndukUnitKerjaAdmin from "./pages/Admin/DaftarIndukUnitKerjaAdmin.jsx";
import DaftarUserAdmin from "./pages/Admin/DaftarUserAdmin.jsx";
import DetailIndukUnitKerja from "./pages/Admin/DetailIndukUnitKerja.jsx";
import Profile from "./pages/Profile.jsx";
import DeveloperProfile from "./pages/DeveloperProfile.jsx";
import verifikasi from "./pages/Verifikasi.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import DaftarMitra from "./pages/MitraKPBPN/DaftarMitra.jsx";
import SuratJalan from "./pages/PengirimanAdminKPBPN/SuratJalan.jsx";
import SuratJalanMitra from "./pages/PengirimanMitraKPBPN/SuratJalanMitra.jsx";
import PengisianTanki from "./pages/Tanki/PengisianTanki.jsx";
import BABongkar from "./pages/Tanki/BABongkar.jsx";
import DetailBAK3S from "./pages/Tanki/DetailBAK3S.jsx";
import TambahPengisianTanki from "./pages/Tanki/TambahPengisianTanki.jsx";
import DaftarTanki from "./pages/Tanki/DaftarTanki.jsx";
import AdminDashborad from "./pages/Dashboard/AdminDashborad.jsx";
import TemplateKPBPN from "./pages/TemplateKPBPN/TemplateKPBPN.jsx";
import StokOpname from "./pages/Tanki/StokOpname";
import UjiLabK3S from "./pages/Tanki/UjiLabK3S.jsx";
import AdminSumurMinyak from "./pages/Admin/AdminSumurMinyak.jsx";
import ProduksiSumur from "./pages/Admin/ProduksiSumur.jsx";
import PetaSumur from "./pages/Admin/PetaSumur.jsx";
import StasiunPengumpulMinyak from "./pages/Admin/StasiunPengumpulMinyak.jsx";
import AsalMinyak from "./pages/Admin/AsalMinyak.jsx";
import AdminICP from "./pages/Admin/AdminICP.jsx";
import Rekapitulasi from "./pages/Keuangan/Rekapitulasi.jsx";
import AdminData from "./pages/Admin/AdminData.jsx";
import AdminNomorUrut from "./pages/Admin/AdminNomorUrut.jsx";
import DetailSuratJalan from "./pages/SuratJalan/DetailSuratJalan.jsx";
import DetailSuratJalanMitra from "./pages/PengirimanMitraKPBPN/DetailSuratJalanMitra.jsx";
import QRCodeSumur from "./pages/QRCodeSumur.jsx";
import QRCodeSuratJalan from "./pages/QRCodeSuratJalan.jsx";
import LaporanPetugasKeamanan from "./pages/Laporan/LaporanPetugasKeamanan.jsx";
import LaporanBAST from "./pages/Laporan/LaporanBAST.jsx";
import LaporanSuratJalan from "./pages/Laporan/LaporanSuratJalan.jsx";
import LaporanBABongkar from "./pages/Laporan/LaporanBABongkar.jsx";
import LaporanKonfirmasiPenerimaan from "./pages/Laporan/LaporanKonfirmasiPenerimaan.jsx";
import LaporanKeuangan from "./pages/Laporan/LaporanKeuangan.jsx";
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  return (
    <>
      <BrowserRouter>
        <Switch>
          <ProtectedRoute
            component={Profile}
            path="/profile"
            exact
            roleRoute={[1, 2, 3, 5]}
          />

          <Route component={Login} path="/login" />
          <Route component={Register} path="/register" />
          <Route component={Unauthorized} path="/unauthorized" exact />
          <ProtectedRoute
            component={Template}
            path="/unit-kerja/template"
            exact
            roleRoute={[1]}
          />

          <ProtectedRoute
            component={DaftarIndukUnitKerjaAdmin}
            path="/admin/daftar-induk-unit-kerja"
            exact
            roleRoute={[1]}
          />
          <ProtectedRoute
            component={DetailIndukUnitKerja}
            path="/admin/detail-induk-unit-kerja/:id"
            exact
            roleRoute={[1]}
          />
          <ProtectedRoute
            component={TambahUser}
            path="/admin/tambah-user"
            exact
            roleRoute={[1]}
          />
          <ProtectedRoute
            component={DaftarUserAdmin}
            path="/admin/daftar-user"
            exact
            roleRoute={[1]}
          />

          <ProtectedRoute
            component={UnitKerjaAdmin}
            path="/admin/unit-kerja/:id"
            exact
            roleRoute={[1]}
          />

          <ProtectedRoute
            component={DaftarMitra}
            path="/admin/mitra"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={SuratJalan}
            path="/pengiriman-kpbpn/surat-jalan"
            exact
            roleRoute={[1, 2, 5]}
          />

          <ProtectedRoute
            component={SuratJalanMitra}
            path="/pengiriman-mitra/surat-jalan"
            exact
            roleRoute={[1, 2, 3]}
          />

          <ProtectedRoute
            component={PengisianTanki}
            path="/tanki-kpbpn/pengisian"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={BABongkar}
            path="/tanki-kpbpn/ba-bongkar"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={DetailBAK3S}
            path="/tanki-kpbpn/detail-bak3s/:id"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={UjiLabK3S}
            path="/tanki-kpbpn/uji-lab"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={TambahPengisianTanki}
            path="/tanki-kpbpn/tambah-pengisian"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={DaftarTanki}
            path="/admin/daftar-tanki"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={AdminDashborad}
            path="/admin/dashboard"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={TemplateKPBPN}
            path="/admin/template-kpbpn"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={StokOpname}
            path="/tanki-kpbpn/stok-opname"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={AdminSumurMinyak}
            path="/sumur/sumur-minyak"
            exact
            roleRoute={[1, 2, 3]}
          />

          <ProtectedRoute
            component={ProduksiSumur}
            path="/sumur/produksi-sumur/:id"
            exact
            roleRoute={[1, 2, 3]}
          />

          <ProtectedRoute
            component={PetaSumur}
            path="/sumur/peta-sumur"
            exact
            roleRoute={[1, 2, 3]}
          />

          <ProtectedRoute
            component={StasiunPengumpulMinyak}
            path="/admin/stasiun-pengumpul-minyak"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={AsalMinyak}
            path="/admin/asal-minyak"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={AdminICP}
            path="/keuangan/icp"
            exact
            roleRoute={[1, 4]}
          />
          <ProtectedRoute
            component={Rekapitulasi}
            path="/keuangan/rekapitulasi"
            exact
            roleRoute={[1, 4]}
          />
          <ProtectedRoute
            component={LaporanPetugasKeamanan}
            path="/laporan/petugas-keamanan"
            exact
            roleRoute={[1, 2, 5]}
          />
          <ProtectedRoute
            component={LaporanBAST}
            path="/laporan/bast"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={LaporanSuratJalan}
            path="/laporan/surat-jalan"
            exact
            roleRoute={[1, 2, 3, 5]}
          />
          <ProtectedRoute
            component={LaporanBABongkar}
            path="/laporan/ba-bongkar"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={LaporanKonfirmasiPenerimaan}
            path="/laporan/konfirmasi-penerimaan"
            exact
            roleRoute={[1, 2, 5]}
          />
          <ProtectedRoute
            component={LaporanKeuangan}
            path="/laporan/keuangan"
            exact
            roleRoute={[1, 2, 4]}
          />
          <Redirect from="/admin/icp" to="/keuangan/icp" exact />
          <ProtectedRoute
            component={AdminData}
            path="/admin/data"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={AdminNomorUrut}
            path="/admin/nomor-urut"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={DetailSuratJalan}
            path="/pengiriman-kpbpn/detail-surat-jalan/:id"
            exact
            roleRoute={[1, 2]}
          />
          <ProtectedRoute
            component={DetailSuratJalanMitra}
            path="/pengiriman-mitra/detail-surat-jalan/:id"
            exact
            roleRoute={[1, 2, 3]}
          />
          <Route component={QRCodeSumur} path="/qr-sumur/:kode" />
          <Route component={QRCodeSuratJalan} path="/qr-surat-jalan/:kode" />
          <Route component={verifikasi} path="/verifikasi/:id" />
          <Route component={DeveloperProfile} path="/developer-profile" />
          <Route component={Home} path="/" />
        </Switch>
      </BrowserRouter>
    </>
  );
}

export default App;

// cek kolaborasi
