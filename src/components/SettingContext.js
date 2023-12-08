import React from "react";
import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [tnsEnable, setTnsEnable] = useState(localStorage.getItem('tnsEnable') === 'true');

  const updateTnsEnable = (value) => {
    setTnsEnable(value);
    localStorage.setItem('tnsEnable', value);
  };

  const contextValue = {
    tnsEnable,
    updateTnsEnable,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};
