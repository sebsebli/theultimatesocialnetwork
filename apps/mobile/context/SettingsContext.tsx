import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { useAuth } from './auth';

interface SettingsContextType {
  smartCiteEnabled: boolean;
  setSmartCiteEnabled: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  smartCiteEnabled: true,
  setSmartCiteEnabled: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [smartCiteEnabled, setSmartCiteEnabledState] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    AsyncStorage.getItem('citewalk_smart_cite').then((val) => {
      if (val !== null) {
        setSmartCiteEnabledState(val === 'true');
      }
    });
  }, []);

  // Sync from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/me').then((me: any) => {
        const remoteVal = me?.preferences?.smartCiteEnabled;
        if (remoteVal !== undefined) {
          setSmartCiteEnabledState(remoteVal);
          AsyncStorage.setItem('citewalk_smart_cite', String(remoteVal));
        }
      }).catch((err) => {
        // console.error('Failed to fetch user settings', err);
      });
    }
  }, [isAuthenticated]);

  const setSmartCiteEnabled = async (enabled: boolean) => {
    // 1. Optimistic update
    setSmartCiteEnabledState(enabled);
    
    // 2. Local persistence
    await AsyncStorage.setItem('citewalk_smart_cite', String(enabled));

    // 3. Server sync
    if (isAuthenticated) {
      try {
        const me: any = await api.get('/users/me');
        const currentPrefs = me.preferences || {};
        await api.patch('/users/me', {
          preferences: { ...currentPrefs, smartCiteEnabled: enabled }
        });
      } catch (e) {
        console.error('Failed to sync settings', e);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ smartCiteEnabled, setSmartCiteEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}
