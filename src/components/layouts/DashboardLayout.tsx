"use client"

import { type ReactNode, useContext, useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { ThemeContext } from "../../App"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import { Tooltip } from "react-tooltip"
import { NotificationButton } from "../NotificationCenter"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

const DashboardLayout = ({
  children,
  title = "Табло",
}: DashboardLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useContext(ThemeContext)
  const { signOut, user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(localStorage.getItem("sidebarOpen") === "false" ? false : true)
  const [isMobileView, setIsMobileView] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Извличаме данни за потребителя
  const userName = user?.profile?.full_name || user?.email || user?.user_metadata?.name || "Потребител"
  const userRole = user?.profile?.role === "company" 
    ? "Фирма" 
    : user?.profile?.role === "technician" 
    ? "Техник" 
    : user?.profile?.role === "building_manager"
    ? "Управител на сграда"
    : user?.profile?.role || "Потребител"
  
  // Заглавие на дашборда с име на фирмата
  const dashboardTitle = `${title} - ${user?.profile?.company_name || "Фирма"}`

  // Проверка на размера на екрана
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 1024)
    }

    // Първоначална проверка
    checkScreenSize()

    // Слушане за промени в размера на екрана
    window.addEventListener("resize", checkScreenSize)

    // Почистване на event listener-а
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Запазване на състоянието на страничната лента в localStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", isSidebarOpen.toString())
  }, [isSidebarOpen])

  // Затваряне на профил менюто при клик извън него
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Успешно излизане от системата")
      navigate("/login")
    } catch (error) {
      console.error("Грешка при излизане:", error)
      toast.error("Грешка при излизане от системата")
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  // Функция за проверка дали линкът е активен
  const isActive = (path: string) => {
    return location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path))
  }

  // Функция за генериране на CSS класове за навигационните линкове
  const getLinkClasses = (path: string) => {
    const baseClasses =
      "flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 relative w-full"

    let activeClasses = ""
    if (isActive(path)) {
      activeClasses =
        "text-primary-700 bg-primary-50 dark:text-primary-100 dark:bg-primary-900/50"
    } else {
      activeClasses =
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
    }

    return `${baseClasses} ${activeClasses}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Навигационна лента */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <button
                id="sidebar-toggle"
                onClick={toggleSidebar}
                className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md focus:outline-none transition-colors duration-200 flex items-center justify-center"
                aria-label="Отвори/затвори навигация"
                data-tooltip-content={isSidebarOpen ? "Свий навигация" : "Разгъни навигация"}
                data-tooltip-place="bottom"
              >
                {isSidebarOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              <Tooltip 
                anchorSelect="#sidebar-toggle" 
                className="tooltip-custom" 
                place="bottom" 
                positionStrategy="fixed"
                style={{ zIndex: 9999 }}
              />
              <div className="font-bold text-lg bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-300 bg-clip-text text-transparent whitespace-nowrap">{dashboardTitle}</div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Търсене..." 
                    className="bg-gray-100 dark:bg-gray-700 border-0 rounded-full pl-10 pr-4 py-1.5 text-sm w-44 lg:w-56 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200"
                    id="search-input"
                    data-tooltip-content="Търсене в системата"
                    data-tooltip-place="bottom"
                  />
                  <Tooltip 
                    anchorSelect="#search-input" 
                    className="tooltip-custom" 
                    place="bottom" 
                    positionStrategy="fixed"
                    style={{ zIndex: 9999 }}
                  />
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 absolute left-3.5 top-2 text-gray-400 dark:text-gray-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
                aria-label="Превключване на тема"
                id="theme-toggle-btn"
                data-tooltip-content={darkMode ? "Светла тема" : "Тъмна тема"}
                data-tooltip-place="bottom"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <Tooltip 
                anchorSelect="#theme-toggle-btn" 
                className="tooltip-custom" 
                place="bottom" 
                positionStrategy="fixed"
                style={{ zIndex: 9999 }}
              />

              {/* Заменяме статичния бутон с NotificationButton компонента */}
              <NotificationButton />

              <div className="border-l border-gray-200 dark:border-gray-700 h-8 mx-0.5"></div>

              {/* Профил с dropdown меню */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 text-sm focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-700 flex items-center justify-center">
                    <span className="font-medium text-primary-800 dark:text-primary-100">
                      {userName?.charAt(0).toUpperCase() || 'П'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium truncate max-w-[120px]">{userName || 'Потребител'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{userRole || 'Потребител'}</div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Dropdown меню за профила */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium">{userName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userRole}</div>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Моят профил
                      </Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Настройки
                      </Link>
                      <Link to="/security" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Сигурност
                      </Link>
                      <Link to="/help" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Помощ
                      </Link>
                    </div>
                    <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Излизане
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow min-h-0 relative">
        {/* Странична лента */}
        <aside
          className={`absolute md:relative top-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out h-auto min-h-full z-10 ${
            isMobileView ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
          } ${isSidebarOpen ? "w-64" : "w-[60px]"}`}
        >
          <div className="h-full flex flex-col overflow-y-auto">
            <nav className="space-y-1 flex-1 overflow-x-hidden pt-2">
              {isSidebarOpen && (
                <div className="px-3 py-2 mb-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Основно
                  </span>
                </div>
              )}

              {/* Прилагаме Tooltip само когато страничната лента е свита */}
              {isSidebarOpen ? (
                <Link to="/dashboard" className={getLinkClasses("/dashboard")}>
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <span>Табло</span>
                </Link>
              ) : (
                <div className="w-full">
                  <Link 
                    to="/dashboard" 
                    className={getLinkClasses("/dashboard")} 
                    id="dashboard-link"
                    data-tooltip-content="Табло"
                    data-tooltip-place="right"
                  >
                    <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                  </Link>
                  <Tooltip 
                    anchorSelect="#dashboard-link" 
                    className="tooltip-custom" 
                    place="right"
                    positionStrategy="fixed"
                    style={{ zIndex: 9999 }}
                    offset={20}
                  />
                </div>
              )}

              {isSidebarOpen ? (
                <Link to="/elevators" className={getLinkClasses("/elevators")}>
                  <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span>Асансьори</span>
                </Link>
              ) : (
                <div className="w-full">
                  <Link 
                    to="/elevators" 
                    className={getLinkClasses("/elevators")} 
                    id="elevators-link"
                    data-tooltip-content="Асансьори"
                    data-tooltip-place="right"
                  >
                    <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </Link>
                  <Tooltip 
                    anchorSelect="#elevators-link" 
                    className="tooltip-custom" 
                    place="right"
                    positionStrategy="fixed"
                    style={{ zIndex: 9999 }}
                    offset={20}
                  />
                </div>
              )}

              {isSidebarOpen ? (
                <Link to="/maintenance" className={getLinkClasses("/maintenance")}>
                  <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span>Поддръжка</span>
                </Link>
              ) : (
                <div className="w-full">
                  <Link 
                    to="/maintenance" 
                    className={getLinkClasses("/maintenance")} 
                    id="maintenance-link"
                    data-tooltip-content="Поддръжка"
                    data-tooltip-place="right"
                  >
                    <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </Link>
                  <Tooltip 
                    anchorSelect="#maintenance-link" 
                    className="tooltip-custom" 
                    place="right"
                    positionStrategy="fixed"
                    style={{ zIndex: 9999 }}
                    offset={20}
                  />
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Основен контейнер */}
        <main className="flex-1 p-4 md:p-6 overflow-auto w-full">
          {/* Съдържание на страницата */}
          <div className="w-full mb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

