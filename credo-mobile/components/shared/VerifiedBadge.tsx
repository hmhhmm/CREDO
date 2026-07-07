// Status pill. Visual language ported from frontend/src/components/ArtifactCard.jsx's
// statusConfig (colored border+bg+icon per state). "Pending" means a verification is
// actively processing; an untouched agent shows the neutral "Not started" instead so a
// brand-new account doesn't look like three stuck jobs.
import { View, Text, StyleSheet } from "react-native";
import { Check, Clock, X, Circle } from "lucide-react-native";
import { fonts } from "../../theme/typography";

export type BadgeStatus = "verified" | "pending" | "failed" | "not_started";

const CONFIG: Record<BadgeStatus, { label: string; Icon: typeof Check; color: string; bg: string }> = {
  verified: { label: "Verified", Icon: Check, color: "#1F7A5C", bg: "#F0FAF6" },
  pending: { label: "Pending", Icon: Clock, color: "#D9A441", bg: "#FFFBEB" },
  failed: { label: "Unverified", Icon: X, color: "#C4503A", bg: "#FEF2F0" },
  not_started: { label: "Not started", Icon: Circle, color: "#6B7785", bg: "rgba(255,255,255,0.7)" },
};

export default function VerifiedBadge({ status }: { status: BadgeStatus }) {
  const { label, Icon, color, bg } = CONFIG[status];

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: color }]}>
      <Icon size={10} color={color} strokeWidth={3} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  label: { fontFamily: fonts.mono, fontSize: 11 },
});
