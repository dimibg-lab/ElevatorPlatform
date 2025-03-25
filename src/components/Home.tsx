import { Link } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { session } = useAuth(); // Използваме useAuth хука за достъп до текущата сесия
  
  // Следи за скролване
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen w-full">
      <div className="min-h-screen w-full bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 shadow-md backdrop-blur-md' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 md:h-20 items-center">
              <div className="flex items-center">
                <Link to="/" className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 flex items-center group">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 mr-2 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                    <div className="absolute inset-0 bg-primary-200 dark:bg-primary-800/30 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  </div>
                  <span className="hidden sm:inline bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-300 bg-clip-text text-transparent">Асансьорна Платформа</span>
                  <span className="sm:hidden bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-300 bg-clip-text text-transparent">АП</span>
                </Link>
              </div>
              
              <div className="hidden md:flex md:items-center md:space-x-8">
                <a href="#features" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium transition-colors">Функционалности</a>
                <a href="#benefits" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium transition-colors">Предимства</a>
                <a href="#pricing" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium transition-colors">Цени</a>
                <a href="#contact" className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium transition-colors">Контакти</a>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                
                {session ? (
                  <Link
                    to="/dashboard"
                    className="btn btn-primary text-sm md:text-base py-2 px-3 md:px-4 shadow-md"
                  >
                    Табло
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn btn-secondary text-sm md:text-base py-2 px-3 md:px-4 shadow-sm dark:text-gray-200"
                    >
                      Вход
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn-primary text-sm md:text-base py-2 px-3 md:px-4 shadow-md relative overflow-hidden group"
                    >
                      <span className="relative z-10">Регистрация</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="w-full">
          {/* Героична секция */}
          <div className="relative w-full pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="md:flex md:items-center md:justify-between">
                <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0 relative z-10">
                  <div className="inline-block px-4 py-1.5 text-sm md:text-base font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full mb-4 md:mb-6 animate-fade-in">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ново
                    </span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900 dark:text-white animate-slide-up">
                    <span className="block">Модерно управление на</span>
                    <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent">асансьорни системи</span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-600 dark:text-gray-300 max-w-xl animate-slide-up" style={{animationDelay: '0.1s'}}>
                    Свързваме фирми, техници и клиенти за безпроблемна поддръжка и управление на асансьорни съоръжения
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <Link to="/register" className="btn py-3 px-6 text-white font-medium bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-primary-800/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/30 dark:hover:shadow-primary-800/30">
                      Започнете сега
                    </Link>
                    <Link to="/about" className="btn py-3 px-6 text-gray-800 dark:text-white font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-sm transition-all duration-300">
                      Научете повече
                    </Link>
                  </div>
                  
                  <div className="mt-8 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 animate-slide-up" style={{animationDelay: '0.3s'}}>
                    <div className="flex -space-x-2">
                      <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Потребител" className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
                      <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Потребител" className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
                      <img src="https://randomuser.me/api/portraits/men/86.jpg" alt="Потребител" className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
                    </div>
                    <p>Повече от <strong className="text-primary-600 dark:text-primary-400">1000+</strong> потребители</p>
                  </div>
                </div>
                
                <div className="md:w-1/2 relative">
                  <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-100 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/30 rounded-2xl -z-10 transform -translate-y-2 translate-x-2"></div>
                    
                    <div className="relative flex justify-center items-center">
                      <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <rect x="70" y="30" width="160" height="240" rx="8" fill="#E0EFFE" className="dark:fill-gray-700" />
                        <rect x="85" y="45" width="130" height="210" rx="4" fill="#FFFFFF" className="dark:fill-gray-800" />
                        <rect x="100" y="65" width="100" height="5" rx="2.5" fill="#BAE0FD" className="dark:fill-blue-800" />
                        <rect x="100" y="80" width="80" height="5" rx="2.5" fill="#BAE0FD" className="dark:fill-blue-800" />
                        <rect x="100" y="105" width="100" height="60" rx="4" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="115" y="120" width="70" height="5" rx="2.5" fill="#FFFFFF" />
                        <rect x="115" y="135" width="50" height="5" rx="2.5" fill="#FFFFFF" />
                        <rect x="115" y="150" width="30" height="5" rx="2.5" fill="#FFFFFF" />
                        <rect x="100" y="175" width="100" height="30" rx="4" fill="#E0EFFE" className="dark:fill-gray-700" />
                        <circle cx="115" cy="190" r="10" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="130" y="185" width="60" height="5" rx="2.5" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="130" y="195" width="40" height="3" rx="1.5" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="100" y="215" width="100" height="30" rx="4" fill="#E0EFFE" className="dark:fill-gray-700" />
                        <circle cx="115" cy="230" r="10" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="130" y="225" width="60" height="5" rx="2.5" fill="#0D96EA" className="dark:fill-blue-600" />
                        <rect x="130" y="235" width="40" height="3" rx="1.5" fill="#0D96EA" className="dark:fill-blue-600" />
                      </svg>
                      
                      <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-yellow-400 rounded-full opacity-20 animate-pulse-slow"></div>
                      <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-primary-500 rounded-full opacity-10 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-100 dark:bg-primary-900/20 rounded-full filter blur-3xl opacity-50 -z-10"></div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-50 -z-10"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-800 -z-10"></div>
          </div>
          
          {/* Функционалности секция */}
          <div className="w-full py-12 sm:py-16 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-slate-800">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-3 sm:mb-4">
                  Модерна платформа за управление на асансьори
                </h2>
                <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Нашето решение свързва всички участници в асансьорната индустрия с цел по-ефикасна работа и по-малко проблеми
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">За сградни управители</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
                    Управлявайте асансьорите си, планирайте поддръжки и комуникирайте с техници директно през платформата
                  </p>
                  <Link to="/register/building-manager" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center group">
                    <span className="group-hover:mr-2 transition-all duration-300">Регистрирай се като управител</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>

                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">За фирми</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
                    Управлявайте вашите асансьори, намерете квалифицирани техници и следете поддръжката лесно и бързо
                  </p>
                  <Link to="/register/company" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center group">
                    <span className="group-hover:mr-2 transition-all duration-300">Регистрирай фирма</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>

                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">За техници</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
                    Свържете се с фирми, управлявайте задачи и документирайте поддръжката през удобен интерфейс
                  </p>
                  <Link to="/register/technician" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center group">
                    <span className="group-hover:mr-2 transition-all duration-300">Регистрирай се като техник</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Призив за действие */}
          <div className="w-full bg-gradient-to-b from-blue-50 via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-800 py-12 sm:py-16">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-blue-500/20">
                <div className="px-4 py-8 sm:px-6 sm:py-12 md:p-12 text-center md:text-left md:flex md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white md:text-3xl">
                      Готови ли сте да подобрите управлението на асансьорите?
                    </h2>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg text-blue-100">
                      Регистрирайте се сега и започнете да използвате платформата още днес!
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 md:mt-0 flex justify-center">
                    <Link
                      to="/register"
                      className="btn bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 rounded-lg"
                    >
                      Започнете безплатно
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Предимства секция */}
          <div className="w-full bg-gradient-to-b from-slate-100 via-white to-blue-50/20 dark:from-slate-800 dark:via-slate-900 dark:to-blue-950/20 py-12 sm:py-16">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-3 sm:mb-4">
                  Защо да изберете нашата платформа?
                </h2>
                <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Предоставяме цялостно решение за управление на асансьорни системи
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4 flex justify-center sm:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center sm:text-left">Сигурност</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base text-center sm:text-left">
                    Всички данни са защитени и достъпни само за оторизирани потребители
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4 flex justify-center sm:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center sm:text-left">Ефективност</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base text-center sm:text-left">
                    Оптимизирайте работните процеси и спестете време с нашата платформа
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4 flex justify-center sm:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center sm:text-left">Свързаност</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base text-center sm:text-left">
                    Лесно намерете и свържете се с техници или клиенти според нуждите ви
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-blue-600 dark:text-blue-400 mb-4 flex justify-center sm:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center sm:text-left">Документация</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base text-center sm:text-left">
                    Пълна история на поддръжката и отчети на едно място
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full bg-gray-800 text-white py-8 sm:py-12">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Асансьорна Платформа</h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-md">
                  Модерно решение за управление на асансьори, свързващо всички участници в процеса
                </p>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold uppercase text-gray-400 mb-2 sm:mb-3">Платформа</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link to="/features" className="text-sm sm:text-base text-gray-300 hover:text-white">Функционалности</Link></li>
                  <li><Link to="/pricing" className="text-sm sm:text-base text-gray-300 hover:text-white">Ценообразуване</Link></li>
                  <li><Link to="/faq" className="text-sm sm:text-base text-gray-300 hover:text-white">Въпроси и отговори</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold uppercase text-gray-400 mb-2 sm:mb-3">Компания</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link to="/about" className="text-sm sm:text-base text-gray-300 hover:text-white">За нас</Link></li>
                  <li><Link to="/contact" className="text-sm sm:text-base text-gray-300 hover:text-white">Контакти</Link></li>
                  <li><Link to="/careers" className="text-sm sm:text-base text-gray-300 hover:text-white">Кариери</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold uppercase text-gray-400 mb-2 sm:mb-3">Правно</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link to="/privacy" className="text-sm sm:text-base text-gray-300 hover:text-white">Поверителност</Link></li>
                  <li><Link to="/terms" className="text-sm sm:text-base text-gray-300 hover:text-white">Условия за ползване</Link></li>
                  <li><Link to="/cookies" className="text-sm sm:text-base text-gray-300 hover:text-white">Политика за бисквитки</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <p className="text-xs sm:text-sm text-gray-400">&copy; 2024 Асансьорна Платформа. Всички права запазени.</p>
              <div className="mt-4 sm:mt-0 flex space-x-4 sm:space-x-6 justify-center sm:justify-start">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home; 