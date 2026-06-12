import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CandidateDashboard from './pages/CandidateDashboard'
import VerifyPage from './pages/VerifyPage'
import PortfolioPrivate from './pages/PortfolioPrivate'
import PortfolioPublic from './pages/PortfolioPublic'
import SimuHireSession from './pages/SimuHireSession'
import SimuHireReport from './pages/SimuHireReport'
import NamecardOwn from './pages/NamecardOwn'
import NamecardPublic from './pages/NamecardPublic'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerCandidates from './pages/EmployerCandidates'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Candidate */}
        <Route path="/dashboard" element={<CandidateDashboard />} />
        <Route path="/dashboard/verify" element={<VerifyPage />} />
        <Route path="/dashboard/portfolio" element={<PortfolioPrivate />} />
        <Route path="/dashboard/namecard" element={<NamecardOwn />} />

        {/* Public */}
        <Route path="/portfolio/:userId" element={<PortfolioPublic />} />
        <Route path="/card/:userId" element={<NamecardPublic />} />

        {/* SimuHire */}
        <Route path="/simuhire/:sessionId" element={<SimuHireSession />} />
        <Route path="/simuhire/:sessionId/report" element={<SimuHireReport />} />

        {/* Employer */}
        <Route path="/employer" element={<EmployerDashboard />} />
        <Route path="/employer/candidates" element={<EmployerCandidates />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
