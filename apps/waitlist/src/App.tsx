import { BrowserRouter, Routes, Route } from "react-router-dom";
import WaitlistPage from "./WaitlistPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaitlistPage />} />
        {/* Fallback to root for marketing URLs */}
        <Route path="*" element={<WaitlistPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
