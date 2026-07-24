import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EmployerHomeScreen from "../app/employer/HomeScreen";
import JobListScreen from "../app/employer/JobListScreen";
import JobDetailScreen from "../app/employer/JobDetailScreen";
import JobCreateScreen from "../app/employer/JobCreateScreen";
import HireIntelligenceScreen from "../app/employer/HireIntelligenceScreen";
import InterviewDetailScreen from "../app/employer/InterviewDetailScreen";
import EmployerSettingsScreen from "../app/employer/SettingsScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { JobListingResponse } from "../lib/api";
import type { PipelineEntry } from "../data/employerData";
import type { Employer } from "../data/generateDataset";

export type EmployerHomeStackParamList = {
  EmployerHome: undefined;
  JobList: undefined;
  JobDetail: { job: JobListingResponse };
  JobCreate: undefined;
  HireIntelligence: undefined;
  InterviewDetail: { entry: PipelineEntry };
  // Optional: HomeScreen already resolved the logged-in employer and passes it along, so
  // Settings doesn't need to re-run the same currentEmployer() lookup a moment later.
  Settings: { employer?: Employer } | undefined;
};

const Stack = createNativeStackNavigator<EmployerHomeStackParamList>();

export default function EmployerHomeStack({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="EmployerHome" component={EmployerHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobList" component={JobListScreen} options={{ title: "Job Posting" }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: "Role Details" }} />
      <Stack.Screen name="JobCreate" component={JobCreateScreen} options={{ title: "Post a Role" }} />
      <Stack.Screen name="HireIntelligence" component={HireIntelligenceScreen} options={{ title: "Hire Intelligence" }} />
      <Stack.Screen name="InterviewDetail" component={InterviewDetailScreen} options={{ title: "Interview" }} />
      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {({ navigation, route }) => (
          <EmployerSettingsScreen navigation={navigation} employer={route.params?.employer} onSwitchRole={onSwitchRole} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
