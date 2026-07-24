import { useEffect, useState } from "react";
import { Building2, Users2, Mail, MapPin, Briefcase } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { getEmployerIdentity } from "../../data/employerData";
import { demoEmployer, type Employer } from "../../data/generateDataset";
import { currentEmployer } from "../../lib/mockApi";
import { colors } from "../../theme/colors";
import SettingsScreen from "../shared/SettingsScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = Pick<NativeStackScreenProps<EmployerHomeStackParamList, "Settings">, "navigation"> & {
  employer?: Employer;
  onSwitchRole: () => void;
};

export default function EmployerSettingsScreen({ navigation, employer: passedEmployer, onSwitchRole }: Props) {
  const { logout } = useAuth();
  const [employer, setEmployer] = useState<Employer>(passedEmployer ?? demoEmployer);
  useEffect(() => {
    // HomeScreen already resolved this moments ago and passed it along — only re-fetch
    // if Settings was somehow reached without it.
    if (!passedEmployer) currentEmployer().then(setEmployer);
  }, [passedEmployer]);

  const identity = getEmployerIdentity(employer);

  const logOut = async () => {
    // Employer logs in through the same shared AuthContext as Candidate (just a
    // different role passed to login()) — logout() clears the same tokenStore, whether
    // the stored token is tagged candidate: or employer:.
    await logout();
    onSwitchRole();
  };

  return (
    <SettingsScreen
      initial={identity.initial}
      name={identity.name}
      subtitle={`${identity.company} · ${identity.industry}`}
      sections={[
        {
          title: "Company",
          rows: [
            { icon: <Building2 size={15} color={colors.ink} />, label: "Company size", value: identity.size },
            { icon: <Users2 size={15} color={colors.ink} />, label: "Industry", value: identity.industry },
            { icon: <MapPin size={15} color={colors.ink} />, label: "City", value: employer.city },
            { icon: <Mail size={15} color={colors.ink} />, label: "Email", value: employer.email },
          ],
        },
        {
          title: "Hiring",
          rows: [
            { icon: <Briefcase size={15} color={colors.ink} />, label: "Job postings", onPress: () => navigation.navigate("JobList") },
          ],
        },
      ]}
      onLogOut={logOut}
    />
  );
}
