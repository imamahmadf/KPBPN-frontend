import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const parseStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const tokenFromStorage = localStorage.getItem("token");

if (tokenFromStorage) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${tokenFromStorage}`;
}

const initialState = {
  user: parseStorage("user"),
  token: tokenFromStorage,
  role: parseStorage("role"),
  mitra: parseStorage("mitra"),
};

const normalizeRoleEntry = (roleObj) => ({
  id: roleObj.id,
  roleId: roleObj.roleKPBPNId ?? roleObj.roleId ?? roleObj.id,
  roleKPBPNId: roleObj.roleKPBPNId ?? roleObj.roleId,
  userKPBPNId: roleObj.userKPBPNId,
  name: roleObj.roleKPBPN?.name ?? roleObj.role?.name ?? roleObj.name,
  roleKPBPN: roleObj.roleKPBPN ?? roleObj.role,
});

export const normalizeRoles = (roles) => {
  if (!roles) return [];
  if (!Array.isArray(roles)) return [normalizeRoleEntry(roles)];
  return roles.map(normalizeRoleEntry);
};

export const normalizeUser = (user) => {
  if (!user || Array.isArray(user)) return null;
  const { password, userRoleKPBPNs, mitra, ...safeUser } = user;
  return safeUser;
};

export const normalizeMitra = (mitra) => {
  if (!mitra || Array.isArray(mitra)) return null;
  return mitra;
};

const parseLoginResponse = (data) => {
  const token = data.token ?? data.accessToken;

  let user = normalizeUser(data.user);
  let role = normalizeRoles(data.role ?? data.roles ?? data.userRoleKPBPNs);
  let mitra = normalizeMitra(data.mitra ?? data.user?.mitra);

  if (!user && data.id && data.namaPengguna) {
    user = normalizeUser(data);
    if (!role.length) {
      role = normalizeRoles(data.userRoleKPBPNs);
    }
    if (!mitra) {
      mitra = normalizeMitra(data.mitra);
    }
  }

  return { token, user, role, mitra };
};

const persistAuth = ({ token, user, role, mitra }) => {
  localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  if (role?.length) localStorage.setItem("role", JSON.stringify(role));
  if (mitra) {
    localStorage.setItem("mitra", JSON.stringify(mitra));
  } else {
    localStorage.removeItem("mitra");
  }
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("mitra");
  delete axios.defaults.headers.common["Authorization"];
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.token = action.payload.token;
      if (action.payload.role) {
        state.role = action.payload.role;
      }
      if (action.payload.mitra !== undefined) {
        state.mitra = action.payload.mitra;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.mitra = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export const login = (namaPengguna, password) => async (dispatch) => {
  try {
    const { data } = await axios.post(`${API_BASE}/user-kpbpn/login`, {
      namaPengguna,
      password,
    });

    const authData = parseLoginResponse(data);
    if (!authData.token) {
      throw new Error("Token tidak ditemukan dalam respons login");
    }

    persistAuth(authData);
    dispatch(loginSuccess(authData));
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const checkAuth = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (!token) {
    dispatch(logout());
    return false;
  }

  try {
    await axios.get(`${API_BASE}/user-kpbpn/check-auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = parseStorage("user");
    const role = parseStorage("role");
    const mitra = parseStorage("mitra");
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    dispatch(loginSuccess({ token, user, role, mitra }));
    return true;
  } catch (error) {
    clearAuthStorage();
    dispatch(logout());
    return false;
  }
};

export const selectRole = (state) => state.auth.role;
export const selectRoleIds = (state) =>
  (state.auth.role ?? []).map(
    (roleObj) => roleObj.roleKPBPNId ?? roleObj.roleId ?? roleObj.id,
  );
export const userRedux = (state) => state.auth.user;

export const register =
  (nama, password, namaPengguna, role, mitraId = null) => async () => {
    try {
      await axios.post(`${API_BASE}/user-kpbpn/register`, {
        nama,
        password,
        namaPengguna,
        role,
        mitraId,
      });
    } catch (error) {
      console.error("Register gagal", error);
      throw error;
    }
  };

export const performLogout = () => (dispatch) => {
  clearAuthStorage();
  dispatch(logout());
  window.location.href = "/login";
};

export default authSlice.reducer;

export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectMitra = (state) => state.auth.mitra;
export const selectIsKpbpnAdmin = (state) => {
  const roleIds = selectRoleIds(state);
  return roleIds.includes(1) || roleIds.includes(2);
};
export const selectScopedMitraId = (state) => {
  if (selectIsKpbpnAdmin(state)) return null;
  return state.auth.mitra?.id ?? state.auth.user?.mitraId ?? null;
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isLoginRequest = error.config?.url?.includes("/login");

    if (isUnauthorized && !isLoginRequest) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);