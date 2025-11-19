import { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { token, setToken } = useContext(AppContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin'); // ✅ clear admin flag
    setToken(null);
    navigate('/login');
  };

  const isAdmin = localStorage.getItem('isAdmin') === 'true'; // ✅ check admin

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img
        onClick={() => navigate('/')}
        className='w-44 cursor-pointer'
        src={assets.logo}
        alt='logo'
      />

      {/* Desktop Menu */}
      <ul className='hidden md:flex items-start gap-5 font-semibold'>
        <NavLink to='/'><li className='py-1'>HOME</li></NavLink>
        <NavLink to='/doctors'><li className='py-1'>ALL ITEMS</li></NavLink>
        <NavLink to='/report'><li className='py-1'>REPORT ITEMS</li></NavLink>

        {/* ✅ Admin-only button */}
        {isAdmin && (
          <NavLink to='/approve-requests'>
            <li className='py-1 text-red-600 hover:text-red-700 font-bold'>
              APPROVE REQUESTS
            </li>
          </NavLink>
        )}

        <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
        <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
      </ul>

      {/* Profile / Auth */}
      <div className='flex items-center gap-4'>
        {token ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-10 rounded-full' src={assets.profile_pic} alt='profile' />
            <img className='w-2.5' src={assets.dropdown_icon} alt='dropdown' />
            <div className='absolute top-1 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>
                  My Profile
                </p>
                <p onClick={() => navigate('my-appointments')} className='hover:text-black cursor-pointer'>
                  My Appointments
                </p>
                {isAdmin && (
                  <p onClick={() => navigate('/admin')} className='hover:text-black cursor-pointer'>
                    Admin Dashboard
                  </p>
                )}
                <p onClick={handleLogout} className='hover:text-black cursor-pointer'>
                  LogOut
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className='bg-primary text-white px-7 py-3 rounded-full font-light hidden md:block'
          >
            Create Account
          </button>
        )}
        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden'
          src={assets.menu_icon}
          alt='menu'
        />
      </div>
    </div>
  );
};

export default Navbar;
