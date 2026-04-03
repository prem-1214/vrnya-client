import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { AppProvider } from "./context/AppContext";

import ChatPage from "./pages/ChatPage";
import SearchPage from "./pages/SearchPage";
import IndexPage from "./pages/IndexPage";
import FilesPage from "./pages/FilesPage";
import DocumentViewerPage from "./pages/DocumentViewerPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/index" element={<IndexPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/document/:id" element={<DocumentViewerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
