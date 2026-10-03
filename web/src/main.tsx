import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
// V-4 / DSGVO: Schrift „Inter" aus dem eigenen Build statt von fonts.googleapis.com.
// Vorher übermittelte jeder Seitenaufruf die IP-Adresse des Nutzers an Google
// (LG München I, 20.01.2022 – 3 O 17493/20). Gleiche Schnitte wie zuvor: 300–800.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "./index.css";
import { bootstrapAccent } from "./lib/accentTheme";
import { bootstrapThemeMode } from "./lib/themeMode";

document.title = "UniqSuite – Compliance & ISMS Management";
bootstrapThemeMode();
bootstrapAccent();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
