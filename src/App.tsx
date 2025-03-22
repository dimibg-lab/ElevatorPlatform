import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import ResendVerification from './components/ResendVerification'
import Notifications from './components/Notifications'

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col">
        <Notifications />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App