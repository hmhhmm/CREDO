import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EmployerHomeScreen from "../app/employer/HomeScreen";
import JobListScreen from "../app/employer/JobListScreen";
import JobDetailScreen from "../app/employer/JobDetailScreen";
import JobCreateScreen from "../app/employer/JobCreateScreen";
import HireIntelligenceScreen from "../app/employer/HireIntelligenceScreen";
import InterviewDetailScreen from "../app/employer/InterviewDetailScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { JobListingResponse } from "../lib/api";
import type { PipelineEntry } from "../data/employerData";

export type EmployerHomeStackParamList = {
  EmployerHome: undefined;
  JobList: undefined;
  JobDetail: { job: JobListingResponse };
  JobCreate: undefined;
  HireIntelligence: undefined;
  InterviewDetail: { entry: PipelineEntry };
};

const Stack = createNativeStackNavigator<EmployerHomeStackParamList>();

export default function EmployerHomeStack({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="EmployerHome" options={{ headerShown: false }}>
        {(props) => <EmployerHomeScreen {...props} onSwitchRole={onSwitchRole} />}
      </Stack.Screen>
      <Stack.Screen name="JobList" component={JobListScreen} options={{ title: "Job Posting" }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: "Role Details" }} />
      <Stack.Screen name="JobCreate" component={JobCreateScreen} options={{ title: "Post a Role" }} />
      <Stack.Screen name="HireIntelligence" component={HireIntelligenceScreen} options={{ title: "Hire Intelligence" }} />
      <Stack.Screen name="InterviewDetail" component={InterviewDetailScreen} options={{ title: "Interview" }} />
    </Stack.Navigator>
  );
}
