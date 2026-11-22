import Workspace from './Workspace.jsx'
import MyBookings from "./MyBookings.jsx";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SpecialistProfile from './SpecialistProfile.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import ProfessionalDashboard from './ProfessionalDashboard.jsx'
import './theme.css'
import MessagesPage from './MessagesPage.jsx'
import ClientProfile from './ClientProfile.jsx'
import Settings from './Settings.jsx'
import AdminPage from './AdminPage.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/professionals/:id"
          element={<SpecialistProfile />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<ClientProfile />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route
          path="/professional/dashboard"
          element={<ProfessionalDashboard />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
