import userTypes from "./Types/userTypes";

const init_state = {
  id: "",
  namaPengguna: "",
  emailVerified: "",
  firebaseProviderId: "",
  amprahanOpen: 0,
  profileId: 0,
  //   TenantId: 0,
  //   TenantName: "",
  ProfileName: "",
  ProfilePic: "",
  token: localStorage.getItem("token") || null,
};

export default (state = init_state, action) => {
  switch (action.type) {
    case userTypes.LOGIN_SUCCESS:
      console.log("Login berhasil:", action.payload);
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", action.payload.user.email);
      return { ...state, ...action.payload };

    case userTypes.LOGOUT:
      console.log("Logout berhasil");
      localStorage.removeItem("token");
      return { ...init_state, token: null };

    default:
      return state;
  }
};
