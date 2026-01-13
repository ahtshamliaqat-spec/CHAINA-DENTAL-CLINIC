import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Facebook, Instagram, LogOut } from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const navItems = isAdmin ? [
    { label: 'Dashboard', path: '/' },
    { label: 'Appointments', path: '/appointments' },
    { label: 'Patients', path: '/patients' },
    { label: 'Doctors', path: '/doctors' },
    { label: 'Clinical', path: '/clinical' },
    { label: 'Billing', path: '/billing' },
  ] : [
    { label: 'Book Appointment', path: '/appointments' }
  ];

  const NEW_LOGO_URL = "https://ytvvqf2doe9bgkjx.public.blob.vercel-storage.com/Teath.png";

  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden font-sans">
      <div className="bg-black text-white text-[10px] md:text-xs py-2 px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-2 z-30 relative shadow-sm">
          <div className="tracking-wide text-center md:text-left flex flex-wrap justify-center gap-1 font-medium">
              <span className="font-bold text-[#00b5e2]">Clinic Hours: </span> 
              <span>Mon-Sat: 08:00 AM – 08:00 PM</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <a href="#" className="bg-[#00b5e2] w-5 h-5 flex items-center justify-center rounded-full text-white"><Facebook size={10} fill="currentColor" strokeWidth={0} /></a>
                <a href="#" className="bg-[#00b5e2] w-5 h-5 flex items-center justify-center rounded-full text-white"><Instagram size={10} /></a>
              </div>
          </div>
      </div>

      <div className="bg-[#edf1f5] py-6 md:py-10 px-4 md:px-12 flex flex-col items-center justify-center relative z-20 shadow-sm border-b border-gray-200">
          <div className="max-w-4xl w-full flex flex-col items-center gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                  <div className="w-16 h-16 md:w-24 md:h-24 shrink-0">
                      <img src={NEW_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex flex-col items-center md:items-start">
                      <h1 className="text-2xl md:text-[52px] font-black text-[#1e2d3d] tracking-tight uppercase leading-none">
                          CHAINA DENTAL CLINIC
                      </h1>
                      <p className="text-[10px] md:text-[14px] font-bold text-[#008cb4] uppercase tracking-wider mt-1 md:mt-2 px-4 md:px-0">
                          Kachi Kothi Road, Phool Nagar
                      </p>
                      <div className="flex items-center gap-1 mt-2 md:mt-4 text-[#008cb4] font-black text-[10px] md:text-xs">
                          <span className="bg-[#008cb4] text-white p-0.5 md:p-1 rounded-sm"><Phone size={8} fill="currentColor" /></span>
                          <span>0333-4216580</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="absolute right-4 md:right-8 top-4 md:top-1/2 md:-translate-y-1/2 flex items-center gap-2 md:gap-3 bg-white/60 backdrop-blur-sm p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm scale-75 md:scale-100 origin-right">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#008cb4] text-white flex items-center justify-center font-black text-xs md:text-base">
                  {currentUser.full_name[0]}
              </div>
              <div className="hidden sm:block pr-2 md:pr-4">
                  <p className="text-[10px] md:text-xs font-black text-gray-900 leading-none">{currentUser.full_name}</p>
              </div>
              <button onClick={onLogout} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
          </div>
      </div>

      <nav className="bg-[#00b5e2] text-white shadow-md relative z-10 overflow-x-auto no-scrollbar">
          <div className="max-w-[1600px] mx-auto flex items-center h-12 md:h-14 px-2 md:px-12">
              {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                      <Link
                          key={item.path}
                          to={item.path}
                          className={`px-4 md:px-5 text-xs md:text-[15px] font-medium h-full flex items-center transition-colors whitespace-nowrap
                          ${isActive ? 'text-white font-bold border-b-2 border-white' : 'text-white/90 hover:text-white'}`}
                      >
                          {item.label}
                      </Link>
                  );
              })}
          </div>
      </nav>

      <div className="flex-1 overflow-auto bg-transparent scroll-smooth">
        <main className="max-w-[1400px] mx-auto p-4 md:px-8 py-4 md:py-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;