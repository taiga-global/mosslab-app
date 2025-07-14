// import { defaultConfig } from '@tamagui/config/v4';
// import { createTamagui } from 'tamagui';

// export const tamaguiConfig = createTamagui(defaultConfig);

// export default tamaguiConfig;

// export type Conf = typeof tamaguiConfig;

// declare module 'tamagui' {
//   interface TamaguiCustomConfig extends Conf {}
// }

import { radius, size, space, zIndex } from '@tamagui/themes';
import { createTamagui, createTokens } from 'tamagui';

const tokens = createTokens({
  size,
  space,
  zIndex,
  color: {
    pinkDark: '#610c62',
    pinkLight: '#f17efc',
    primary: '#0B6939',
  },
  radius,
});

const themes = {
  dark: {
    background: '#000',
    color: '#fff',
  },
  light: {
    color: '#000',
    background: '#fff',
  },
  dark_pink: {
    background: tokens.color.pinkDark,
    color: tokens.color.pinkLight,
  },
  light_pink: {
    background: tokens.color.pinkLight,
    color: tokens.color.pinkDark,
  },
};

const config = createTamagui({
  themes,
  tokens,
  // ... see Configuration
});

export type Conf = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
