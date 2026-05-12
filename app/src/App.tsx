import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import RoutesPage from "./pages/RoutesPage"
import RouteDetail from "./pages/RouteDetail"
import ReportPage from "./pages/ReportPage"
import TripsPage from "./pages/TripsPage"
import ScanQRPage from "./pages/ScanQRPage"
import DriverPage from "./pages/DriverPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import ProfilePage from "./pages/ProfilePage"
import AuthLayout from "./components/AuthLayout"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout><Home /></AuthLayout>} />
      <Route path="/routes" element={<AuthLayout><RoutesPage /></AuthLayout>} />
      <Route path="/routes/:id" element={<AuthLayout><RouteDetail /></AuthLayout>} />
      <Route path="/report" element={<AuthLayout><ReportPage /></AuthLayout>} />
      <Route path="/trips" element={<AuthLayout><TripsPage /></AuthLayout>} />
      <Route path="/scan" element={<AuthLayout><ScanQRPage /></AuthLayout>} />
      <Route path="/driver" element={<AuthLayout><DriverPage /></AuthLayout>} />
      <Route path="/analytics" element={<AuthLayout><AnalyticsPage /></AuthLayout>} />
      <Route path="/profile" element={<AuthLayout><ProfilePage /></AuthLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
