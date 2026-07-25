import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GrowScreen from "../app/candidate/GrowScreen";
import CareerPathScreen from "../app/candidate/CareerPathScreen";
import SalaryTruthScreen from "../app/candidate/SalaryTruthScreen";
import CareerCoachScreen from "../app/candidate/CareerCoachScreen";
import LifeChapterScreen from "../app/candidate/LifeChapterScreen";
import CoachSessionScreen from "../app/candidate/CoachSessionScreen";
import ResumeBuilderScreen from "../app/candidate/ResumeBuilderScreen";
import CourseDetailScreen from "../app/candidate/CourseDetailScreen";
import InterviewPracticeScreen from "../app/candidate/InterviewPracticeScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { CredentialProgram } from "../data/generateDataset";

export type GrowStackParamList = {
  GrowMain: undefined;
  CareerPath: undefined;
  SalaryTruth: undefined;
  CareerCoach: undefined;
  LifeChapter: undefined;
  CoachSession: undefined;
  ResumeBuilder: undefined;
  CourseDetail: { skill: string; course: string | null; program: CredentialProgram | null };
  InterviewPractice: undefined;
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
      <Stack.Screen name="CoachSession" component={CoachSessionScreen} options={{ title: "Coach Session" }} />
      <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} options={{ title: "Resume Builder" }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: "Course Detail" }} />
      <Stack.Screen name="InterviewPractice" component={InterviewPracticeScreen} options={{ title: "Interview Practice" }} />
    </Stack.Navigator>
  );
}
