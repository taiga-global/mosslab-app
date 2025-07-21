import tamaguiConfig from '@/tamagui.config';
import '../global.css';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 커스텀 테마
  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: 'rgb(255, 45, 85)',
      background: '#fff', // 원하는 배경색
    },
  };

  return (
    <ActionSheetProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
        <ThemeProvider value={MyTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(modes)" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </TamaguiProvider>
    </ActionSheetProvider>
  );
}
