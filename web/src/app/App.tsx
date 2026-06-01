import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "components/Layout";
import { ProtectedRoute } from "components/ProtectedRoute";
import { AuthProvider } from "features/auth/AuthProvider";
import LoginPage from "features/auth/LoginPage";
import EntryPage from "features/entries/EntryPage";
import ViewEntriesPage from "features/entries/ViewEntriesPage";
import AnalyticsPage from "features/analytics/AnalyticsPage";
import SettingsPage from "features/settings/SettingsPage";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <AuthProvider>
      {/* ADD THIS: The ToastContainer must be rendered in the JSX */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EntryPage />} />
          <Route path="entries" element={<ViewEntriesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}