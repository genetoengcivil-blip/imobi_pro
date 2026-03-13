export function getThemeColors(darkMode: boolean) {
  return {
    text: darkMode ? '#F5F5F7' : '#1D1D1F',
    text2: darkMode ? '#D1D1D6' : '#424245',
    textMut: darkMode ? '#8E8E93' : '#6E6E73',
    textSec: darkMode ? '#636366' : '#AEAEB2',
    textFaint: darkMode ? '#48484A' : '#D2D2D7',
    cardBg: darkMode ? '#1C1C1E' : '#FFFFFF',
    surfaceBg: darkMode ? '#2C2C2E' : '#F5F5F7',
    pageBg: darkMode ? '#000000' : '#F5F5F7',
    border: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    cardShadow: darkMode
      ? '0 0 0 0.5px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)'
      : '0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(0,0,0,0.04)',
  };
}
