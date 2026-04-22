import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnimaProvider } from "@animaapp/playground-react-sdk";
import { WorkstationProvider } from "./context/WorkstationContext";
import Home from "./screens/IntelliCore/Home";
import "../tailwind.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AnimaProvider>
      <WorkstationProvider>
        <Home />
      </WorkstationProvider>
    </AnimaProvider>
  </StrictMode>,
);
