import { useState } from "react";
import { Mail, Briefcase, Link2, ShieldCheck, Share2, Clock } from "lucide-react-native";
import GitHubIcon from "../../components/GitHubIcon";
import { useDemo } from "../../context/DemoContext";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import SettingsScreen from "../shared/SettingsScreen";
import type { ParentNav } from "../../navigation/types";

export default function CandidateSettingsScreen({
  navigation,
  onSwitchRole,
}: {
  navigation: { getParent: () => ParentNav };
  onSwitchRole: () => void;
}) {
  const { user, logout } = useAuth();
  const { liveCandidate } = useDemo();

  const name = user?.name || liveCandidate.name;
  const field = user?.field_of_study || liveCandidate.field;
  const university = user?.university || liveCandidate.university;
  const initial = name[0]?.toUpperCase() ?? "?";

  // No profile-update endpoint exists yet (see mockApi.ts) — this is real, interactive
  // local state rather than a fake disabled toggle, it just doesn't round-trip anywhere.
  const [openToWork, setOpenToWork] = useState(user?.open_to_work ?? liveCandidate.openToWork);

  const parent = navigation.getParent() as ParentNav;
  const goCardPrivacy = () => parent?.navigate("Card");
  const goLifeChapter = () => parent?.navigate("Grow", { screen: "LifeChapter" });

  const logOut = async () => {
    await logout();
    onSwitchRole();
  };

  return (
    <SettingsScreen
      initial={initial}
      name={name}
      subtitle={`${field} · ${university}`}
      sections={[
        {
          title: "Profile",
          rows: [
            { icon: <Mail size={15} color={colors.ink} />, label: "Email", value: user?.email ?? "—" },
            {
              icon: <Briefcase size={15} color={colors.ink} />,
              label: "Open to work",
              toggle: { value: openToWork, onValueChange: setOpenToWork },
            },
            { icon: <Link2 size={15} color={colors.ink} />, label: "LinkedIn", value: user?.linkedin_url ? "Connected" : "Not linked" },
            { icon: <GitHubIcon size={15} color={colors.ink} />, label: "GitHub", value: user?.github_username ?? "Not linked" },
          ],
        },
        {
          title: "Namecard",
          rows: [
            { icon: <ShieldCheck size={15} color={colors.ink} />, label: "Audience & privacy", onPress: goCardPrivacy },
            { icon: <Share2 size={15} color={colors.ink} />, label: "Distribution & sharing", onPress: goCardPrivacy },
          ],
        },
        {
          title: "Career",
          rows: [{ icon: <Clock size={15} color={colors.ink} />, label: "Life Chapter preferences", onPress: goLifeChapter }],
        },
      ]}
      onLogOut={logOut}
    />
  );
}
