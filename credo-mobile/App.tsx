import "./global.css";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useFraunces,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  useFonts as usePlexMono,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import RootNavigator from "./navigation/RootNavigator";
import { colors } from "./theme/colors";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_600SemiBold, Fraunces_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [plexMonoLoaded] = usePlexMono({ IBMPlexMono_400Regular, IBMPlexMono_500Medium });

  const fontsLoaded = frauncesLoaded && interLoaded && plexMonoLoaded;

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}
