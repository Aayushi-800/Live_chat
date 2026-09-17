import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("digiTalk-theme") || 'forest',
  setTheme: (theme) => { 
    localStorage.setItem("digiTalk-theme", theme);
    set({ theme })
   },
}));