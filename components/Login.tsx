
import React, { useState } from 'react';
import { User, Key, UserPlus, Info, Activity, ShieldCheck, LogIn, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ClinicService } from '../services/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<'PATIENT' | 'ADMIN'>('PATIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const NEW_LOGO_URL = "https://img.icons8.com/fluency/96/tooth.png";

  // Login form state
  const [loginData, setLoginData] = useState({
    identifier: '', // MRN or Username
    password: ''
  });

  // Registration form state
  const [regData, setRegData] = useState({
    full_name: '',
    mobile_no: '',
    dob: '',
    gender: 'Male' as const,
    password: ''
  });

  // Password reset state
  const [resetData, setResetData] = useState({
    username: '', // MRN (recovered or entered)
    phone: '',
    newPassword: ''
  });

  // Success state for registration
  const [regSuccess, setRegSuccess] = useState<{ mrn: string; password: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await ClinicService.login(loginData.identifier, loginData.password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid identifier or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const allPatients = await ClinicService.getPatients();
      const mrn = `MRN${String(allPatients.length + 1).padStart(4, '0')}`;
      const password = regData.password || Math.random().toString(36).slice(-8);

      const patient = await ClinicService.registerPatient({
        mrn,
        full_name: regData.full_name,
        father_name: '',
        dob: regData.dob,
        gender: regData.gender,
        mobile_no: regData.mobile_no,
        address: '',
        password: password
      });

      setRegSuccess({ mrn: patient.mrn, password: password });
    } catch (err) {
      setError('Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (userType === 'ADMIN') {
        const verified = await ClinicService.verifyAdminRecovery(resetData.username, resetData.phone);
        if (verified) {
          setResetStep(2);
        } else {
          setError('Verification failed. Admin details do not match.');
        }
      } else {
        // Patient Recovery: Search for MRNO using registered mobile number
        const patient = await ClinicService.verifyPatientRecovery(resetData.phone);
        if (patient) {
          setResetData(prev => ({ ...prev, username: patient.mrn }));
          setResetStep(2);
        } else {
          setError('No patient found with this mobile number. Please ensure you are using your registered cell phone.');
        }
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (userType === 'ADMIN') {
        await ClinicService.resetAdminPassword(resetData.username, resetData.newPassword);
      } else {
        await ClinicService.resetPatientPassword(resetData.username, resetData.newPassword);
      }
      setSuccess('Credentials updated successfully! Redirecting to login...');
      setTimeout(() => {
        setIsResetting(false);
        setResetStep(1);
        setSuccess('');
        setLoginData({ identifier: resetData.username, password: resetData.newPassword });
      }, 2500);
    } catch (err) {
      setError('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (regSuccess) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-md max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-cyan-100 p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-8">Please save your credentials securely. You will need them for future logins.</p>
          
          <div className="bg-cyan-50/50 rounded-2xl p-6 mb-8 border border-cyan-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">MR No.</span>
              <span className="font-mono font-bold text-gray-900 text-lg">{regSuccess.mrn}</span>
            </div>
            <div className="h-px bg-cyan-100 w-full"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Password</span>
              <span className="font-mono font-bold text-gray-900 text-lg">{regSuccess.password}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setRegSuccess(null);
              setIsRegistering(false);
              setLoginData({ identifier: regSuccess.mrn, password: regSuccess.password });
            }}
            className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-700/20 transition-all flex items-center justify-center gap-3"
          >
            <span>Proceed to Login</span>
            <LogIn size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans">
      <div className="bg-white/90 backdrop-blur-xl max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Left Branding Panel */}
        <div className="md:w-5/12 bg-cyan-700/95 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <img src={NEW_LOGO_URL} alt="Logo" className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg" />
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none uppercase">Chaina Dental</h1>
                <p className="text-[10px] text-cyan-200 font-bold tracking-[0.2em] uppercase mt-1">Surgery Manager</p>
              </div>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-4">Quality Dental Care for Everyone.</h2>
            <p className="text-cyan-100 text-sm leading-relaxed">The most advanced and friendly clinic management system in Phool Nagar.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">24/7 Care</p>
                <p className="text-sm font-medium">Emergency Assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-300 font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> <span>Secure Database Encryption</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:w-7/12 p-8 md:p-12">
          
          <div className="flex items-center justify-between mb-10">
            {!isResetting && (
                <div className="bg-gray-100/50 p-1 rounded-2xl flex">
                <button 
                    onClick={() => { setUserType('PATIENT'); setIsRegistering(false); setError(''); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userType === 'PATIENT' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-400'}`}
                >
                    Patient
                </button>
                <button 
                    onClick={() => { setUserType('ADMIN'); setIsRegistering(false); setError(''); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userType === 'ADMIN' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-400'}`}
                >
                    Admin
                </button>
                </div>
            )}
            
            {userType === 'PATIENT' && !isResetting && (
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2 hover:underline"
              >
                {isRegistering ? 'Back to Login' : 'First Time? Register'}
                {isRegistering ? <User size={16}/> : <UserPlus size={16} />}
              </button>
            )}

            {isResetting && (
                <button 
                    onClick={() => { setIsResetting(false); setError(''); setResetStep(1); }}
                    className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 hover:underline"
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>
            )}
          </div>

          <div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">
              {isResetting 
                ? (userType === 'PATIENT' ? 'Recover MRNO / Password' : 'Recover Admin Access') 
                : (isRegistering ? 'Create Account' : `Welcome, ${userType === 'ADMIN' ? 'Admin' : 'Patient'}`)}
            </h3>
            <p className="text-gray-500 mb-8">
              {isResetting 
                ? (userType === 'PATIENT' ? 'Use your registered cell phone number to find your MRNO.' : 'Enter your admin details to reset your password.') 
                : (isRegistering ? 'Register to start booking appointments online.' : 'Enter your credentials to access your dashboard.')}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl flex items-start gap-3 border border-green-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {isResetting ? (
                /* RECOVERY FLOW */
                <div className="space-y-6">
                    {resetStep === 1 ? (
                        <form onSubmit={handleVerifyRecovery} className="space-y-6">
                             {userType === 'ADMIN' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Admin Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="admin"
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                                            value={resetData.username}
                                            onChange={e => setResetData({...resetData, username: e.target.value})}
                                        />
                                    </div>
                                </div>
                             )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Registered Cell Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        type="tel" 
                                        placeholder="0300-XXXXXXX"
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                                        value={resetData.phone}
                                        onChange={e => setResetData({...resetData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button 
                                disabled={loading}
                                type="submit" 
                                className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-700/20 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Searching...' : (userType === 'PATIENT' ? 'Find My MRNO' : 'Verify Details')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="bg-cyan-50/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 mb-2 text-center">
                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-2">Account Identified</p>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Your MR Number is:</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tight font-mono">{resetData.username}</p>
                                </div>
                                <p className="text-[10px] text-cyan-500 mt-4 italic">You can now reset your password below or return to login.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Choose New Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        type="password" 
                                        placeholder="Min. 6 characters"
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                                        value={resetData.newPassword}
                                        onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsResetting(false);
                                        setLoginData({ ...loginData, identifier: resetData.username });
                                    }}
                                    className="bg-gray-100/50 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition-all"
                                >
                                    Login with MRNO
                                </button>
                                <button 
                                    disabled={loading}
                                    type="submit" 
                                    className="bg-cyan-700 hover:bg-cyan-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-700/20 transition-all transform active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Set & Login'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : !isRegistering ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
                    {userType === 'ADMIN' ? 'Username' : 'MR Number'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder={userType === 'ADMIN' ? 'admin' : 'MRN0001'}
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={loginData.identifier}
                      onChange={e => setLoginData({...loginData, identifier: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Password</label>
                    <button 
                        type="button" 
                        onClick={() => { setIsResetting(true); setResetStep(1); setError(''); setSuccess(''); }}
                        className="text-[10px] font-black text-cyan-700 uppercase tracking-widest hover:underline"
                    >
                        Forgot MRNO / Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={loginData.password}
                      onChange={e => setLoginData({...loginData, password: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-700/20 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
                
                {userType === 'ADMIN' && (
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Demo Recovery Phone: <span className="text-cyan-700">0333-4216580</span>
                  </p>
                )}
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Irfan Ali"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={regData.full_name}
                      onChange={e => setRegData({...regData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Mobile No</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="0300-1234567"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={regData.mobile_no}
                      onChange={e => setRegData({...regData, mobile_no: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Birth Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={regData.dob}
                      onChange={e => setRegData({...regData, dob: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Gender</label>
                    <select 
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                      value={regData.gender}
                      onChange={e => setRegData({...regData, gender: e.target.value as any})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Choose Password</label>
                  <input 
                    required
                    type="password" 
                    placeholder="Create a password"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-medium"
                    value={regData.password}
                    onChange={e => setRegData({...regData, password: e.target.value})}
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full mt-4 bg-cyan-700 hover:bg-cyan-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-700/20 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
