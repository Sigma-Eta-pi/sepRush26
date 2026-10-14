import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { canonicalChapterUrl } from "./lib/canonical-origin";

// After a new deploy, cached HTML may reference stale chunk hashes — reload once to fix.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

const canonicalUrl = canonicalChapterUrl(window.location.href);
if (canonicalUrl) {
  window.location.replace(canonicalUrl);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
