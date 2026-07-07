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
import BAPenerimaan from "./pages/Tanki/BAPenerimaan.jsx";
import TambahPengisianTanki from "./pages/Tanki/TambahPengisianTanki.jsx";
import DaftarTanki from "./pages/Tanki/DaftarTanki.jsx";
import AdminDashborad from "./pages/Dashboard/AdminDashborad.jsx";
import TemplateKPBPN from "./pages/TemplateKPBPN/TemplateKPBPN.jsx";
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
            component={BAPenerimaan}
            path="/tanki-kpbpn/ba-bongkar"
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
            path="/tanki-kpbpn/daftar-tanki"
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
