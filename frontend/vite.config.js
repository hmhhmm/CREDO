import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const shim = (p) => fileURLToPath(new URL(`./src/native/${p}`, import.meta.url))

// The ported mobile screens under src/mobile keep their original React Native imports.
// Every native/Expo package they reach for is aliased to a browser implementation in
// src/native, so those files stay identical to the Expo app and can be re-synced.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native-safe-area-context': shim('safe-area-context.jsx'),
      'react-native-gesture-handler': shim('gesture-handler.jsx'),
      'react-native-reanimated': shim('react-native-reanimated.jsx'),
      'react-native-qrcode-svg': shim('react-native-qrcode-svg.jsx'),
      'react-native-svg': shim('react-native-svg.jsx'),
      // Must come after the longer react-native-* keys: Vite matches aliases in order.
      'react-native': shim('react-native.jsx'),
      '@react-navigation/native-stack': shim('navigation.jsx'),
      '@react-navigation/bottom-tabs': shim('navigation.jsx'),
      '@react-navigation/native': shim('navigation.jsx'),
      '@react-native-async-storage/async-storage': shim('async-storage.js'),
      'expo-linear-gradient': shim('expo-linear-gradient.jsx'),
      'expo-blur': shim('expo-blur.jsx'),
      'expo-clipboard': shim('expo-clipboard.js'),
      'expo-constants': shim('expo-constants.js'),
      'expo-document-picker': shim('expo-document-picker.js'),
      'expo-status-bar': shim('expo-status-bar.jsx'),
      'expo-splash-screen': shim('expo-splash-screen.js'),
      // The RN icon package is a drop-in re-export of lucide-react's icon set.
      'lucide-react-native': 'lucide-react',
    },
  },
})
