import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor for secure token-based RBAC
try {
  const originalFetch = window.fetch;
  if (originalFetch) {
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = localStorage.getItem('token');
      if (!token) {
        return originalFetch(input, init);
      }

      try {
        if (input instanceof Request) {
          const clonedRequest = input.clone();
          clonedRequest.headers.set('Authorization', `Bearer ${token}`);
          return originalFetch(clonedRequest, init);
        }

        const config = init ? { ...init } : {};
        let headers: Record<string, string> = {};

        if (config.headers) {
          if (config.headers instanceof Headers) {
            config.headers.set('Authorization', `Bearer ${token}`);
            return originalFetch(input, config);
          } else if (Array.isArray(config.headers)) {
            const clonedHeaders = [...config.headers];
            clonedHeaders.push(['Authorization', `Bearer ${token}`]);
            config.headers = clonedHeaders;
            return originalFetch(input, config);
          } else {
            headers = { ...(config.headers as any) };
          }
        }

        headers['Authorization'] = `Bearer ${token}`;
        config.headers = headers;
        return originalFetch(input, config);
      } catch (err) {
        console.warn('Authorisation token intercept failed, retrying plain fetch:', err);
        return originalFetch(input, init);
      }
    };

    // Try defining it on window safely
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch (defineError) {
      try {
        (window as any).fetch = customFetch;
      } catch (assignError) {
        console.warn('Could not override fetch on window, trying Prototype override:', assignError);
        try {
          Object.defineProperty(Object.getPrototypeOf(window), 'fetch', {
            value: customFetch,
            configurable: true,
            writable: true
          });
        } catch (protoError) {
          console.error('Global fetch override not supported by sandbox environment:', protoError);
        }
      }
    }
  }
} catch (globalErr) {
  console.error('Secure token fetch interceptor setup failed:', globalErr);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

