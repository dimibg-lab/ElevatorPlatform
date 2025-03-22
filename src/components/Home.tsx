import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
      <nav className="bg-white shadow-md sticky top-0 z-10 w-full">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
                <span className="hidden sm:inline">Асансьорна Платформа</span>
                <span className="sm:hidden">АП</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/login"
                className="btn btn-secondary text-sm sm:text-base px-2 sm:px-4"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-sm sm:text-base px-2 sm:px-4"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full">
        {/* Героична секция */}
        <div className="w-full bg-blue-600 text-white py-12 sm:py-16 md:py-20">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                  Модерно управление на асансьорни системи
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100">
                  Свързваме фирми, техници и клиенти за безпроблемна поддръжка и управление на асансьорни съоръжения
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Link to="/register" className="btn bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg text-center">
                    Започнете сега
                  </Link>
                  <Link to="/about" className="btn bg-blue-700 text-white hover:bg-blue-800 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg text-center">
                    Научете повече
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="bg-blue-500 p-4 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Функционалности секция */}
        <div className="w-full py-12 sm:py-16 bg-white">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Модерна платформа за управление на асансьори
              </h2>
              <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Нашето решение свързва всички участници в асансьорната индустрия с цел по-ефикасна работа и по-малко проблеми
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="card border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">За сградни управители</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Управлявайте асансьорите си, планирайте поддръжки и комуникирайте с техници директно през платформата
                </p>
                <Link to="/register/building-manager" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center">
                  Регистрирай се като управител
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              <div className="card border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">За фирми</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Управлявайте вашите асансьори, намерете квалифицирани техници и следете поддръжката лесно и бързо
                </p>
                <Link to="/register/company" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center">
                  Регистрирай фирма
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              <div className="card border border-gray-100 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">За техници</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Свържете се с фирми, управлявайте задачи и документирайте поддръжката през удобен интерфейс
                </p>
                <Link to="/register/technician" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center">
                  Регистрирай се като техник
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Призив за действие */}
        <div className="w-full bg-gray-50 py-12 sm:py-16">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-600 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
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
                    className="btn bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg shadow-md"
                  >
                    Започнете безплатно
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Предимства секция */}
        <div className="w-full bg-white py-12 sm:py-16">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Защо да изберете нашата платформа?
              </h2>
              <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Предоставяме цялостно решение за управление на асансьорни системи
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-blue-600 mb-4 flex justify-center sm:justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center sm:text-left">Сигурност</h3>
                <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                  Всички данни са защитени и достъпни само за оторизирани потребители
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-blue-600 mb-4 flex justify-center sm:justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center sm:text-left">Ефективност</h3>
                <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                  Оптимизирайте работните процеси и спестете време с нашата платформа
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-blue-600 mb-4 flex justify-center sm:justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center sm:text-left">Свързаност</h3>
                <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                  Лесно намерете и свържете се с техници или клиенти според нуждите ви
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-blue-600 mb-4 flex justify-center sm:justify-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center sm:text-left">Документация</h3>
                <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
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
  );
};

export default Home; 