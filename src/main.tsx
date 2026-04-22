import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";

const root = ReactDOM.createRoot(
  document.getElementById("app") as HTMLElement
);

// Inject GLOBAL_CSS into DOM
function injectGlobalCSS(css: string) {
  const styleTag = document.getElementById("global-styles");
  if (styleTag) {
    styleTag.innerHTML = css;
  }
}

// @ts-ignore (we'll export it from app.tsx)
import { GLOBAL_CSS } from "./app";

injectGlobalCSS(GLOBAL_CSS);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
