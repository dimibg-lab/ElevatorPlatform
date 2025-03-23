"use client"

import { type ReactNode, useContext, useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { ThemeContext } from "../../App"
import { supabase } from "../../supabaseClient"
import { notify } from "../Notifications"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  userRole?: string
  userName?: string
}

// Tooltip компонент
const Tooltip = ({
  children,
  text,
  position = "right",
}: { children: ReactNode; text: string; position?: "right" | "bottom" }) => {
  if (!text) return <>{children}</>

  // Различни стилове според позицията
  const positionClasses = {
    right: "left-[100%] ml-1 top-1/2 -translate-y-1/2",
    bottom: "top-full mt-1 left-1/2 -translate-x-1/2",
  }

  // Различни стилове за стрелката според позицията
  const arrowClasses = {
    right:
      "absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-t-4 border-r-4 border-b-4 border-t-transparent border-r-gray-800 dark:border-r-gray-700 border-b-transparent",
    bottom:
      "absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-b-4 border-r-4 border-l-transparent border-b-gray-800 dark:border-b-gray-700 border-r-transparent",
  }

  return (
    <div className="group relative inline-block w-full">
      {children}
      <div
        className={`fixed z-[1000] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-100 bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-md px-2 py-1.5 ${positionClasses[position]} drop-shadow-lg pointer-events-none whitespace-nowrap`}
      >
        {text}
        <div className={arrowClasses[position]}></div>
      </div>
    </div>
  )
}

const DashboardLayout = ({
  children,
  title = "Табло",
  userRole = "Потребител",
  userName = "Потребител",
}: DashboardLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useContext(ThemeContext)
  const [isSidebarOpen, setIsSidebarOpen] = useState(localStorage.getItem("sidebarOpen") === "false" ? false : true)
  const [isMobileView, setIsMobileView] = useState(false)

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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      notify.success("Успешно излизане от системата")
      navigate("/login")
    } catch (error) {
      console.error("Грешка при излизане:", error)
      notify.error("Грешка при излизане от системата")
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Функция за проверка дали линкът е активен
  const isActive = (path: string) => {
    return location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path))
  }

  // Функция за генериране на CSS класове за навигационните линкове
  const getLinkClasses = (path: string) => {
    const baseClasses =
      "flex items-center justify-center px-2 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 relative w-full"

    let activeClasses = ""
    if (isActive(path)) {
      activeClasses =
        "text-primary-700 bg-primary-50 dark:text-primary-100 dark:bg-primary-900/50 border-l-4 border-primary-500 dark:border-primary-400"
    } else {
      activeClasses =
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
    }

    return `${baseClasses} ${activeClasses}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Навигационна лента */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Tooltip text={isSidebarOpen ? "Свий навигация" : "Разгъни навигация"} position="bottom">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                  aria-label="Отвори/затвори навигация"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </Tooltip>
              <div className="ml-4 font-medium text-lg">{title}</div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
                aria-label="Превключване на тема"
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

              <div className="relative">
                <button className="flex items-center space-x-2 text-sm focus:outline-none p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-700 flex items-center justify-center">
                    <span className="font-medium text-primary-800 dark:text-primary-100">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{userRole}</div>
                  </div>
                </button>
              </div>

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Изход
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-hidden">
        {/* Странична лента */}
        <aside
          className={`fixed inset-y-0 pt-16 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:static lg:h-screen z-10 overflow-hidden ${
            isMobileView ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
          } ${isSidebarOpen ? "w-64" : "w-[60px]"}`}
        >
          <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden py-1 px-1">
            <div className={`px-2 py-1 mb-1 ${isSidebarOpen ? "flex" : "flex justify-center"} items-center`}>
              <Link to="/dashboard" className={`flex items-center ${isSidebarOpen ? "space-x-2" : ""}`}>
                <div className="p-1 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary-600 dark:text-primary-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                </div>
                {isSidebarOpen && (
                  <div className="text-base font-medium bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-300 bg-clip-text text-transparent whitespace-nowrap">
                    АП Дашборд
                  </div>
                )}
              </Link>
            </div>

            <nav className="space-y-0.5 flex-1 overflow-x-hidden">
              {isSidebarOpen && (
                <div className="px-3 py-0.5">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    УПРАВЛЕНИЕ
                  </h3>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Начало" : ""}>
                  <Link to="/dashboard" className={getLinkClasses("/dashboard")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
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
                    {isSidebarOpen && <span>Начало</span>}
                  </Link>
                </Tooltip>
              </div>

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Асансьори" : ""}>
                  <Link to="/dashboard/elevators" className={getLinkClasses("/dashboard/elevators")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    {isSidebarOpen && <span>Асансьори</span>}
                  </Link>
                </Tooltip>
              </div>

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Поддръжка" : ""}>
                  <Link to="/dashboard/maintenance" className={getLinkClasses("/dashboard/maintenance")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    {isSidebarOpen && <span>Поддръжка</span>}
                  </Link>
                </Tooltip>
              </div>

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Заявки" : ""}>
                  <Link to="/dashboard/tickets" className={getLinkClasses("/dashboard/tickets")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {isSidebarOpen && <span>Заявки</span>}
                  </Link>
                </Tooltip>
              </div>

              {isSidebarOpen && (
                <div className="px-3 py-0.5 pt-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    УЧАСТНИЦИ
                  </h3>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Техници" : ""}>
                  <Link to="/dashboard/technicians" className={getLinkClasses("/dashboard/technicians")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {isSidebarOpen && <span>Техници</span>}
                  </Link>
                </Tooltip>
              </div>

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Клиенти" : ""}>
                  <Link to="/dashboard/customers" className={getLinkClasses("/dashboard/customers")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {isSidebarOpen && <span>Клиенти</span>}
                  </Link>
                </Tooltip>
              </div>

              {isSidebarOpen && (
                <div className="px-3 py-0.5 pt-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ФИНАНСИ
                  </h3>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Фактури" : ""}>
                  <Link to="/dashboard/invoices" className={getLinkClasses("/dashboard/invoices")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    {isSidebarOpen && <span>Фактури</span>}
                  </Link>
                </Tooltip>
              </div>

              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Отчети" : ""}>
                  <Link to="/dashboard/reports" className={getLinkClasses("/dashboard/reports")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    {isSidebarOpen && <span>Отчети</span>}
                  </Link>
                </Tooltip>
              </div>
            </nav>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
              <div className="flex flex-col space-y-1">
                <Tooltip text={!isSidebarOpen ? "Настройки" : ""}>
                  <Link to="/dashboard/settings" className={getLinkClasses("/dashboard/settings")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {isSidebarOpen && <span>Настройки</span>}
                  </Link>
                </Tooltip>

                <Tooltip text={!isSidebarOpen ? "Изход" : ""}>
                  <button
                    onClick={handleSignOut}
                    className={`w-full text-left flex items-center px-2 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors duration-200 ${isSidebarOpen ? "" : "justify-center"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-6 w-6`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {isSidebarOpen && <span>Изход</span>}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </aside>

        {/* Основно съдържание */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout

