import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
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
import AdminData from "./pages/Admin/AdminData.jsx";
import DetailSuratJalan from "./pages/SuratJalan/DetailSuratJalan.jsx";
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
            roleRoute={[1, 2, 3]}
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
            roleRoute={[1, 2]}
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
            component={AdminData}
            path="/admin/data"
            exact
            roleRoute={[1, 2]}
          />

          <ProtectedRoute
            component={DetailSuratJalan}
            path="/pengiriman-kpbpn/detail-surat-jalan/:id"
            exact
            roleRoute={[1, 2]}
          />

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
