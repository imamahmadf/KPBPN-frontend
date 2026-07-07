import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { register } from "../Redux/Reducers/auth";

const Register = () => {
  const [nama, setNama] = useState("");
  const [namaPengguna, setNamaPengguna] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role sebagai 'user'
  const dispatch = useDispatch();
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(register(nama, password, namaPengguna, role));
    history.push("/login"); // Arahkan ke halaman login setelah register
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nama Pengguna"
          value={namaPengguna}
          onChange={(e) => setNamaPengguna(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
