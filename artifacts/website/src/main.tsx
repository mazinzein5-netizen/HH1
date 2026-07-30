import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// Only load 400 (body) + 700 (headings) up-front; others deferred
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
