import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./Redux/Reducers";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { myNewTheme } from "./Style/theme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <ColorModeScript initialColorMode={myNewTheme.config.initialColorMode} />
    <ChakraProvider theme={myNewTheme}>
      <Provider store={store}>
        <App />
      </Provider>
    </ChakraProvider>
  </>
);
