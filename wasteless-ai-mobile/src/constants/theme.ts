import { Platform } from 'react-native';

const tintColorLight = '#2F7D4B';
const tintColorDark = '#8FD9A8';

export const Colors = {
  light: {
    text: '#13251A',
    mutedText: '#667066',
    background: '#FAFBF7',
    surface: '#FFFFFF',
    border: '#DDE5DA',
    tint: tintColorLight,
    onTint: '#FFFFFF',
    danger: '#B42318',
    placeholder: '#8A9487',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    mutedText: '#B7C0B5',
    background: '#101610',
    surface: '#182018',
    border: '#2D3A2E',
    tint: tintColorDark,
    onTint: '#102116',
    danger: '#F97066',
    placeholder: '#879186',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
