// Web entry point for the ported CREDO mobile app — the browser counterpart of the Expo
// app's App.tsx.
//
// The only difference from App.tsx is font loading: Expo blocks the splash screen until
// expo-font has registered Fraunces/Inter/IBM Plex Mono, whereas the web loads them from
// the <link> tags in index.html and paints with a fallback face in the meantime. That
// removes the splash-screen/useFonts dance entirely; everything below it is unchanged.
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import RootNavigator from './navigation/RootNavigator'

export default function MobileApp() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  )
}
