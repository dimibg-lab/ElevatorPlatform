import { createClient, Session, AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('supabaseClient: Инициализиране', {
  url: supabaseUrl.slice(0, 15) + '...',
  hasKey: !!supabaseAnonKey,
  timestamp: new Date().toISOString()
});

// Конфигуриране на параметрите на Supabase клиента
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Добавяме обработчици на събития
    async onAuthStateChange(event: AuthChangeEvent, session: Session | null) {
      console.log('supabaseClient: Auth събитие:', event, {
        hasSession: !!session,
        sessionId: session?.access_token?.slice(-10) || 'няма',
        timestamp: new Date().toISOString()
      });
    },
  },
  global: {
    headers: {
      'Cache-Control': 'no-store', // Предотвратява кеширането на заявките
    },
  },
};

// Създаваме Supabase клиент според препоръчаната конфигурация
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions); 

// Добавяме логове за проследяване на сесиите
if (typeof window !== 'undefined') {
  // Проследяваме промени в localStorage за сесията
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    if (key === 'elevator-platform-auth') {
      try {
        const sessionData = JSON.parse(value);
        console.log('supabaseClient: Запазване на сесия в localStorage', {
          sessionId: sessionData?.access_token?.slice(-10) || 'непълна',
          expiresAt: sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toISOString() : 'неизвестно',
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.log('supabaseClient: Грешка при парсиране на сесия', e);
      }
    }
    originalSetItem.call(this, key, value);
  };
}

// Проверяване на автентикацията при зареждане
const checkInitialSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('supabaseClient: Грешка при проверка на началната сесия', error);
      return;
    }
    
    if (data.session) {
      console.log('supabaseClient: Налична начална сесия', {
        sessionId: data.session.access_token?.slice(-10) || 'непълна',
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'неизвестно',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('supabaseClient: Няма начална сесия', {
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('supabaseClient: Грешка при проверка на началната сесия', error);
  }
};

// Изпълняваме проверката
if (typeof window !== 'undefined') {
  checkInitialSession();
  
  // Добавяме слушател за видимост на документа
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('supabaseClient: Таб видим отново, проверка на сесията', {
        timestamp: new Date().toISOString()
      });
      checkInitialSession();
    }
  });
} 