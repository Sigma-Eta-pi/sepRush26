import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// After a new deploy, cached HTML may reference stale chunk hashes — reload once to fix.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
