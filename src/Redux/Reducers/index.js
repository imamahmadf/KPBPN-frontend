import user from "./user";
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import auth from "./auth";
const rootReducer = combineReducers({
  // user,
  auth,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk],
});

export default store;
