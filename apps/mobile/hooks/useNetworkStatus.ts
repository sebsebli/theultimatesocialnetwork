import { useState, useEffect, useMemo } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Get initial state with error handling
    NetInfo.fetch()
      .then((state) => {
        setIsConnected(state.isConnected);
        setIsInternetReachable(state.isInternetReachable);
      })
      .catch(() => {
        // Assume connected if check fails
        setIsConnected(true);
        setIsInternetReachable(true);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  return useMemo(
    () => ({
      isConnected: isConnected ?? false,
      isInternetReachable: isInternetReachable ?? false,
      isOffline: !isConnected || !isInternetReachable,
    }),
    [isConnected, isInternetReachable],
  );
}
