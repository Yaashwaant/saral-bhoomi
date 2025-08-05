import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppSettings {
  darkMode: boolean;
  locale: string;
  // Add other settings here
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSetting: (key: string, value: any) => void;
  updateNestedSetting: (section: string, key: string, value: any) => void;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  locale: 'fr-FR',
  // Default values for other settings
};

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  updateSetting: () => {},
  updateNestedSetting: () => {},
});

export const useAppSettings = () => useContext(AppSettingsContext);

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const updateSetting = (key: string, value: any) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  // Fix the updateNestedSetting function with proper typing
  const updateNestedSetting = (section: string, key: string, value: any) => {
    setSettings((prevSettings) => {
      // Create a copy of the current settings
      const updatedSettings = { ...prevSettings };
      
      // Safely handle the nested section
      const sectionData = updatedSettings[section] as Record<string, any>;
      
      // If the section exists, update it
      if (sectionData) {
        // Create a new object for the section to avoid direct mutation
        updatedSettings[section] = {
          ...sectionData,
          [key]: value
        };
      }
      
      return updatedSettings;
    });
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, updateNestedSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
};
