import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store';
import { initLenis, destroyLenis } from '../lib/lenis';

function ThemeSync({ children }) {
  const theme = useSelector((state) => state.app.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return children;
}

function LenisScrollProvider({ children }) {
  useEffect(() => {
    const lenis = initLenis();
    return () => {
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeSync>
        <LenisScrollProvider>
          {children}
        </LenisScrollProvider>
      </ThemeSync>
    </Provider>
  );
}

export default Providers;
