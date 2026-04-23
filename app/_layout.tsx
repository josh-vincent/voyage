import 'expo-dev-client';
import '../global.css';
import { useFonts, YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ActiveTripProvider } from './contexts/ActiveTripContext';
import { FlightSearchProvider } from './contexts/FlightSearchContext';
import { ThemeProvider } from './contexts/ThemeContext';
import useThemedNavigation from './hooks/useThemedNavigation';

import { handleDeepLink } from '@/lib/links';
import { PriceWatcher } from '@/utils/priceWatcher';
import { syncTripStatusWidgetFromStorage } from '@/utils/trackedStorage';

NativeWindStyleSheet.setOutput({
  default: 'native',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

  useEffect(() => {
    let mounted = true;
    Linking.getInitialURL().then((url) => {
      if (mounted && url) setTimeout(() => handleDeepLink(url), 300);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={screenOptions} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ YoungSerif_400Regular });

  useEffect(() => {
    syncTripStatusWidgetFromStorage();
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1 }} />;
  return (
    <GestureHandlerRootView
      className={`bg-light-primary dark:bg-dark-primary ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`}
      style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ActiveTripProvider>
            <FlightSearchProvider>
              <PriceWatcher />
              <ThemedLayout />
            </FlightSearchProvider>
          </ActiveTripProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
