import React from "react";
import { useDispatch } from "react-redux";
import { performLogout } from "../Redux/Reducers/auth";

const Logout = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(performLogout());
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Logout;
