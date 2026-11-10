import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent desktop browser zoom gestures globally
if (typeof window !== "undefined") {
  // Block Ctrl + mouse scroll wheel zoom
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Block Ctrl + '+' and Ctrl + '-' keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (
      e.ctrlKey &&
      (e.key === "=" ||
        e.key === "-" ||
        e.key === "+" ||
        e.key === "0" ||
        e.keyCode === 187 ||
        e.keyCode === 189 ||
        e.keyCode === 48)
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
