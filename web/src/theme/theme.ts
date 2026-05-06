import { createTheme } from "@mui/material";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2f6bff" },
    secondary: { main: "#7b1fa2" },
    background: { default: "#f6f9ff" }
  },
  shape: { borderRadius: 12 }
});
