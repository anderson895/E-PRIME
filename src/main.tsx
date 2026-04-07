import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { logger } from "@/utils/logger";

// ─── Global unhandled error/promise handlers ─────────────────────────────────
// These catch errors that escape React's component tree (e.g. in setTimeout,
// event listeners, or async code not tied to a component lifecycle).

window.addEventListener("error", (event) => {
  logger.error("global.uncaughtError", event.error ?? event.message, {
    filename: event.filename,
    lineno:   event.lineno,
    colno:    event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("global.unhandledPromiseRejection", event.reason, {
    context: "Promise rejected without a .catch() handler",
  });
});

// ─── Render ──────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary name="App">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
