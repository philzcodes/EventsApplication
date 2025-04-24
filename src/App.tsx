import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Home from './pages/Home'
import EventPage from './pages/EventPage'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import EventDetails from './pages/EventDetails'
import Attendees from './pages/Attendees'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import Events from './pages/Events'
import EditEvent from './pages/EditEvent'

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="e/:eventSlug" element={<EventPage />} />
          <Route path="register/:eventSlug" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>
        
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/events" element={<Events />} />
          <Route path="dashboard/create" element={<CreateEvent />} />
          <Route path="dashboard/events/:eventId" element={<EventDetails />} />
          <Route path="dashboard/events/:eventId/edit" element={<EditEvent />} />
          <Route path="dashboard/attendees" element={<Attendees />} />
          <Route path="dashboard/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App 