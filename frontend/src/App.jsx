import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './pages/About'
import Appointments from './pages/Appointment'
import Contact from './pages/Contact'
import Doctors from './pages/Doctors'
import Home from './pages/Home'
import Login from './pages/Login'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Report from './pages/Report'
import Admin from './pages/admin'
import ApproveRequests from './pages/ApproveRequests'

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>  
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile/>} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:docId' element={<Appointments/>} />
        <Route path='/report' element={<Report />} />
        <Route path='/admin' element={<Admin />} /> {/* existing admin dashboard */}
        <Route path='/approve-requests' element={<ApproveRequests />} /> {/* new route */}
      </Routes>
      <Footer />
    </div>
  )
}

export default App
