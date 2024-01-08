import React from "react";
import { createContext, useContext, useState } from 'react';
import SafeLocalStorage from "../utils/SafeLocalStorage";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [tnsEnable, setTnsEnable] = useState(SafeLocalStorage.getItem('tnsEnable') === 'true');

  const updateTnsEnable = (value) => {
    setTnsEnable(value);
    SafeLocalStorage.setItem('tnsEnable', value);
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
