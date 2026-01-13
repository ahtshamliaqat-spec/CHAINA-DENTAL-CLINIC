import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, UserCheck, Activity, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie 
} from 'recharts';
import { ClinicService } from '../services/api';
import { Appointment, Invoice, Doctor } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    ClinicService.getAppointments().then(setAppointments);
    ClinicService.getInvoices().then(setInvoices);
    ClinicService.getDoctors().then(setDoctors);
  }, []);

  const todayAppts = appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString());
  const pendingCount = todayAppts.filter(a => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN').length;
  
  // Count patients who have been checked in, are in progress, or completed today
  const checkedInCount = todayAppts.filter(a => 
    ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)
  ).length;

  const activeDocCount = doctors.filter(d => d.active === 'Y').length;

  // Mock data for the Bar Chart
  const data = [
    { name: 'Mon', visits: 12 },
    { name: 'Tue', visits: 19 },
    { name: 'Wed', visits: 15 },
    { name: 'Thu', visits: 22 },
    { name: 'Fri', visits: 28 },
    { name: 'Sat', visits: 10 },
  ];

  // Calculate Patient Status Distribution for Today
  const scheduledCount = todayAppts.filter(a => a.status === 'SCHEDULED').length;
  const checkedCount = todayAppts.filter(a => ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)).length;
  const cancelledCount = todayAppts.filter(a => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;

  const patientStatusData = [
    { name: 'Pending', value: scheduledCount, color: '#3b82f6' }, // Blue
    { name: 'Checked', value: checkedCount, color: '#22c55e' },   // Green
    { name: 'Cancelled', value: cancelledCount, color: '#ef4444' }, // Red
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Appointments" 
          value={todayAppts.length.toString()} 
          icon={CalendarCheck} 
          color="bg-blue-500" 
          onClick={() => navigate('/appointments')}
        />
        <StatCard 
          title="Patients Waiting" 
          value={pendingCount.toString()} 
          icon={Clock} 
          color="bg-amber-500" 
          onClick={() => navigate('/clinical')}
        />
        <StatCard 
          title="Today's Patients Checked" 
          value={checkedInCount.toString()} 
          icon={UserCheck}
          color="bg-emerald-500" 
          onClick={() => navigate('/clinical')}
        />
        <StatCard 
          title="Active Doctors" 
          value={activeDocCount.toString()} 
          icon={Activity} 
          color="bg-purple-500" 
          onClick={() => navigate('/doctors')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section (Left - Wider) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Patient Visits (Weekly)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="visits" fill="#0e7490" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0e7490' : '#155e75'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column Stack */}
        <div className="space-y-6">
            
            {/* Patient Status Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">Patient Status</h3>
              <div className="h-48 relative flex justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                          <Pie
                              data={patientStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {patientStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex flex-col items-center space-y-1.5 mt-2">
                 {patientStatusData.map(item => (
                     <div key={item.name} className="text-sm text-gray-600 font-medium">
                         {item.name}: {item.value}
                     </div>
                 ))}
              </div>
            </div>

            {/* Today's Schedule Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Today</h3>
            <div className="space-y-4">
                {todayAppts.slice(0, 5).map(appt => (
                <div key={appt.appt_id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                        appt.status === 'CHECKED_IN' ? 'bg-green-500' : 
                        appt.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} 
                    />
                    <div className="flex-1">
                    <p className="font-medium text-gray-900">{appt.patient_name}</p>
                    <p className="text-xs text-gray-500">
                        {new Date(appt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {appt.doctor_name}
                    </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                    appt.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {appt.status.replace('_', ' ')}
                    </span>
                </div>
                ))}
                {todayAppts.length === 0 && (
                <p className="text-gray-400 text-center py-4">No appointments for today</p>
                )}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon?: any;
  color: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, color, onClick }: StatCardProps) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-all duration-200 group ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-cyan-200 active:scale-95' : ''
    }`}
  >
    {Icon && (
      <div className={`p-3 rounded-lg ${color} text-white shadow-md transition-transform duration-200 ${onClick ? 'group-hover:scale-110' : ''}`}>
        <Icon size={24} />
      </div>
    )}
    <div>
      <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

export default Dashboard;