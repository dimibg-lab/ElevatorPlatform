import { Link } from 'react-router-dom';
import { notify } from './Notifications';
import { useEffect } from 'react';

const EmailVerification = () => {
  useEffect(() => {
    // Показваме нотификация при зареждане на компонента
    notify.info('Изпратен е имейл за потвърждение!');
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <svg className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Потвърдете Вашия имейл</h2>
        
        <p className="text-gray-700 mb-6">
          Изпратихме писмо с връзка за потвърждение на Вашия имейл адрес. Моля, проверете пощата си и 
          кликнете върху линка за потвърждение.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Ако не получите имейл до 5 минути, проверете папката "Спам" или се свържете с нас.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          След потвърждение на имейла, ще можете да влезете в системата.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="btn btn-primary"
          >
            Към страницата за вход
          </Link>
          
          <Link
            to="/resend-verification"
            className="btn btn-outline"
          >
            Изпрати отново
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 