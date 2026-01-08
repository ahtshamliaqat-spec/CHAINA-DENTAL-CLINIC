
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, Facebook, Twitter, Youtube, Instagram, Linkedin, UserCircle, LogOut } from 'lucide-react';
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

  const NEW_LOGO_URL = "https://img.icons8.com/fluency/96/tooth.png";

  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden font-sans">
      
      {/* 1. Top Black Bar */}
      <div className="bg-black text-white text-[10px] md:text-xs py-2.5 px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-2 z-30 relative shadow-sm">
          <div className="tracking-wide text-center md:text-left flex flex-wrap justify-center gap-1 font-medium">
              <span className="font-bold text-[#00b5e2]">Clinic Timing: </span> 
              <span>Mon-Sat: 08:00 AM – 08:00 PM</span>
              <span className="hidden sm:inline mx-1">|</span>
              <span className="text-[#00b5e2] font-semibold">Emergency: 24/7 Response</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <a href="#" className="bg-[#00b5e2] w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:text-[#00b5e2] transition-colors text-white"><Facebook size={12} fill="currentColor" strokeWidth={0} /></a>
                <a href="#" className="bg-[#00b5e2] w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:text-[#00b5e2] transition-colors text-white"><Instagram size={12} /></a>
                <a href="#" className="bg-[#00b5e2] w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:text-[#00b5e2] transition-colors text-white"><Linkedin size={12} fill="currentColor" strokeWidth={0} /></a>
              </div>
          </div>
      </div>

      {/* 2. Middle White Bar */}
      <div className="bg-white/95 backdrop-blur-md py-4 px-4 md:px-12 border-b border-gray-100 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm z-20 relative">
          {/* Logo */}
          <div className="flex items-center gap-4 self-center xl:self-start min-w-max">
             <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                      src={NEW_LOGO_URL} 
                      alt="Chaina Dental Logo" 
                      className="w-full h-full object-contain drop-shadow-md"
                  />
              </div>
              <div className="text-center lg:text-left">
                  <span className="font-bold text-3xl tracking-tight text-[#00b5e2] font-serif block leading-none">Chaina Dental Clinic</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 block">Excellence in Dentistry</span>
              </div>
          </div>

          {/* Contact Info & Action */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full xl:w-auto justify-center xl:justify-end">
              
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                      <Phone className="text-[#00b5e2]" size={32} strokeWidth={1.5} />
                      <div className="text-left">
                          <p className="text-sm font-bold text-gray-800 leading-tight">Give Us a Call</p>
                          <p className="text-[#00b5e2] font-medium text-sm leading-tight">0333-4216580</p>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-700 text-white flex items-center justify-center font-black">
                      {currentUser.full_name[0]}
                  </div>
                  <div className="pr-4">
                      <p className="text-xs font-black text-gray-900 leading-none">{currentUser.full_name}</p>
                      <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider mt-1">{currentUser.role === UserRole.ADMIN ? 'Administrator' : `Patient: ${currentUser.mrn}`}</p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
              </div>
          </div>
      </div>

      {/* 3. Blue Nav Bar */}
      <nav className="bg-[#00b5e2] text-white shadow-md relative z-10">
          <div className="max-w-[1600px] mx-auto px-4 md:px-12">
              <div className="flex items-center justify-between h-14">
                  <div className="flex items-center overflow-x-auto no-scrollbar h-full w-full justify-center md:justify-start">
                      {navItems.map((item, index) => {
                          const isActive = location.pathname === item.path;
                          return (
                              <div key={item.path} className="flex items-center h-full group">
                                  <Link
                                      to={item.path}
                                      className={`px-5 text-[15px] font-medium h-full flex items-center transition-colors whitespace-nowrap
                                      ${isActive ? 'text-white font-bold' : 'text-white/90 hover:text-white'}`}
                                  >
                                      {item.label}
                                  </Link>
                                  {index < navItems.length - 1 && (
                                      <span className="text-white/40 text-sm hidden sm:inline select-none">|</span>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-transparent scroll-smooth">
        <main className="max-w-[1400px] mx-auto p-4 md:px-8 py-6 md:py-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
