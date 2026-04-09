import React, { createContext, useContext, useEffect, useState } from 'react';

// Themes:
//  'midnight' → current dark navy/blue theme
//  'void'     → pure black theme

const ThemeContext = createContext({
  theme: 'midnight',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('aicfo-theme') || 'midnight'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aicfo-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === 'midnight' ? 'void' : 'midnight'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
