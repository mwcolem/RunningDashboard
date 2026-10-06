import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Gear from "./pages/Gear";
import Health from "./pages/Health";
import Training from "./pages/Training";
import Training2 from "./pages/Training2";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="activities" element={<Activities />} />
          <Route path="training" element={<Training />} />
          <Route path="gear" element={<Gear />} />
          <Route path="health" element={<Health />} />
          <Route path="training-2" element={<Training2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
