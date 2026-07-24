import { Mail, MapPin, Building2, Users2 } from "lucide-react-native";
import { studentsOf, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import SettingsScreen from "../shared/SettingsScreen";

export default function UniversitySettingsScreen({
  university,
  onSwitchRole,
}: {
  university: University;
  onSwitchRole: () => void;
}) {
  const cohortSize = studentsOf(university).length;

  return (
    <SettingsScreen
      initial={university.short}
      name={university.name}
      subtitle={`${university.office} · ${university.city}`}
      sections={[
        {
          title: "Institution",
          rows: [
            { icon: <Mail size={15} color={colors.ink} />, label: "Email", value: university.email },
            { icon: <MapPin size={15} color={colors.ink} />, label: "City", value: university.city },
            { icon: <Building2 size={15} color={colors.ink} />, label: "Office", value: university.office },
            { icon: <Users2 size={15} color={colors.ink} />, label: "Cohort size", value: String(cohortSize) },
          ],
        },
      ]}
      // University has no AuthContext-backed session (see UniversityAuthGate) — its
      // "session" is local component state that unmounts when RoleSelect takes over, so
      // switching role is itself the sign-out, not a real logout — both the label and
      // the neutral (non-destructive) styling reflect that.
      onLogOut={onSwitchRole}
      logOutLabel="Switch role"
      logOutTone="neutral"
    />
  );
}
