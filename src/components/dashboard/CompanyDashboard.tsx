import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import DashboardLayout from '../layouts/DashboardLayout';
import { notify } from '../Notifications';

// Типове данни за статистика
interface DashboardStats {
  totalElevators: number;
  totalCustomers: number;
  totalTechnicians: number;
  pendingTickets: number;
  completedTickets: number;
  todayTickets: number;
}

// Типове данни за последни заявки
interface Ticket {
  id: string;
  created_at: string;
  status: string;
  title: string;
  priority: string;
  customer_name: string;
  elevator_id: string;
  assigned_technician?: string;
}

// Типове данни за техник
interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  active_tickets: number;
  specialization: string;
}

const CompanyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalElevators: 0,
    totalCustomers: 0,
    totalTechnicians: 0,
    pendingTickets: 0,
    completedTickets: 0,
    todayTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [userData, setUserData] = useState<any>(null);

  // Зареждане на данни за потребителя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Зареждане на профилната информация от profiles таблицата
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (profileData) {
            setUserData(profileData);
            setCompanyName(profileData.company_name || 'Фирма');
          }
        }
      } catch (error) {
        console.error('Грешка при зареждане на потребителски данни:', error);
        notify.error('Не можахме да заредим вашите данни');
      }
    };
    
    fetchUserData();
  }, []);

  // Зареждане на статистика и данни за таблото
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Тук ще се зареждат данни от Supabase
        // Примерно:
        
        // 1. Брой асансьори
        const { count: elevatorsCount, error: elevatorsError } = await supabase
          .from('elevators')
          .select('*', { count: 'exact', head: true });
        
        // 2. Брой клиенти
        const { count: customersCount, error: customersError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        // 3. Брой техници
        const { count: techniciansCount, error: techniciansError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'technician');
        
        // 4. Заявки по статус
        const { count: pendingCount, error: pendingError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress']);
        
        const { count: completedCount, error: completedError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        // 5. Днешни заявки
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount, error: todayError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);
        
        // Задаване на статистиката
        setStats({
          totalElevators: elevatorsCount || 0,
          totalCustomers: customersCount || 0,
          totalTechnicians: techniciansCount || 0,
          pendingTickets: pendingCount || 0,
          completedTickets: completedCount || 0,
          todayTickets: todayCount || 0
        });
        
        // Зареждане на последните заявки
        const { data: recentTicketsData, error: recentTicketsError } = await supabase
          .from('tickets')
          .select('id, created_at, status, title, priority, customer_name, elevator_id, assigned_technician')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentTicketsError) throw recentTicketsError;
        
        if (recentTicketsData) {
          setRecentTickets(recentTicketsData);
        }
        
        // Зареждане на списък с техници
        const { data: techniciansData, error: techniciansListError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, specialization')
          .eq('role', 'technician')
          .limit(5);
          
        if (techniciansListError) throw techniciansListError;
        
        if (techniciansData) {
          // Преобразуване на данните с добавяне на статус и активни заявки (примерно)
          const formattedTechnicians = techniciansData.map(tech => ({
            ...tech,
            status: ['available', 'busy', 'off_duty'][Math.floor(Math.random() * 3)],
            active_tickets: Math.floor(Math.random() * 5)
          }));
          
          setTechnicians(formattedTechnicians);
        }
      } catch (error) {
        console.error('Грешка при зареждане на данни за табло:', error);
        notify.error('Възникна грешка при зареждане на информацията');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Форматира дата и час
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Връща клас за цвят според статуса
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'off_duty':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'busy':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Превеждане на статус на български
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'Завършена',
      'in_progress': 'В процес',
      'pending': 'Чакаща',
      'off_duty': 'Неактивен',
      'available': 'Свободен',
      'busy': 'Зает'
    };
    
    return statusMap[status] || status;
  };
  
  // Връща клас за цвят според приоритета
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Превеждане на приоритет на български
  const translatePriority = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'high': 'Висок',
      'medium': 'Среден',
      'low': 'Нисък'
    };
    
    return priorityMap[priority] || priority;
  };

  return (
    <DashboardLayout 
      title={`Табло - ${companyName}`}
      userRole="Фирма за поддръжка"
      userName={userData?.full_name || 'Потребител'}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div>
          {/* Статистически карти */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Асансьори</p>
                  <p className="text-lg font-semibold">{stats.totalElevators}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Клиенти</p>
                  <p className="text-lg font-semibold">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Техници</p>
                  <p className="text-lg font-semibold">{stats.totalTechnicians}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Чакащи</p>
                  <p className="text-lg font-semibold">{stats.pendingTickets}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Завършени</p>
                  <p className="text-lg font-semibold">{stats.completedTickets}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Днес</p>
                  <p className="text-lg font-semibold">{stats.todayTickets}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Последни заявки */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium">Последни заявки</h2>
              </div>
              
              <div className="overflow-x-auto">
                {recentTickets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Няма налични заявки
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Заявка
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Клиент
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Статус
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Приоритет
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Дата
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{ticket.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">#{ticket.id.substring(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{ticket.customer_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Асансьор #{ticket.elevator_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                              {translateStatus(ticket.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                              {translatePriority(ticket.priority)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(ticket.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                  Виж всички заявки →
                </button>
              </div>
            </div>
            
            {/* Списък с техници */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium">Техници</h2>
              </div>
              
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                {technicians.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Няма налични техници
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {technicians.map((technician) => (
                      <div key={technician.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="font-medium text-blue-800 dark:text-blue-300">
                                {technician.full_name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">{technician.full_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{technician.specialization || 'Общ техник'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(technician.status)}`}>
                            {translateStatus(technician.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <div className="text-gray-500 dark:text-gray-400">
                            Активни заявки: <span className="font-medium">{technician.active_tickets}</span>
                          </div>
                          <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                            Назначи заявка
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                  Управлявай техници →
                </button>
              </div>
            </div>
          </div>
          
          {/* Бързи действия */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button className="flex items-center justify-center p-4 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Нова заявка
            </button>
            
            <button className="flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Добави техник
            </button>
            
            <button className="flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Генерирай отчет
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CompanyDashboard; 