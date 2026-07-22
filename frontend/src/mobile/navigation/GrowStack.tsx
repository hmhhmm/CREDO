import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GrowScreen from "../app/candidate/GrowScreen";
import CareerPathScreen from "../app/candidate/CareerPathScreen";
import SalaryTruthScreen from "../app/candidate/SalaryTruthScreen";
import CareerCoachScreen from "../app/candidate/CareerCoachScreen";
import LifeChapterScreen from "../app/candidate/LifeChapterScreen";
import { candidateHeaderOptions } from "./headerOptions";

export type GrowStackParamList = {
  GrowMain: undefined;
  CareerPath: undefined;
  SalaryTruth: undefined;
  CareerCoach: undefined;
  LifeChapter: undefined;
};

const Stack = createNativeStackNavigator<GrowStackParamList>();

export default function GrowStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="GrowMain" component={GrowScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CareerPath" component={CareerPathScreen} options={{ title: "Career Path Navigator" }} />
      <Stack.Screen name="SalaryTruth" component={SalaryTruthScreen} options={{ title: "Salary Truth Engine" }} />
      <Stack.Screen name="CareerCoach" component={CareerCoachScreen} options={{ title: "AI Career Coach" }} />
      <Stack.Screen name="LifeChapter" component={LifeChapterScreen} options={{ title: "Life Chapter Designer" }} />
    </Stack.Navigator>
  );
}
