// E1 Verified Marketplace — a 3-icon glance row (GitHub / credential / document) so an
// employer sees verification completeness by pattern, not by reading text. Reads from
// getVerificationCompleteness so this can never disagree with the fully-verified stamp.
import { View, StyleSheet } from "react-native";
import { Award, FileText } from "lucide-react-native";
import GitHubIcon from "../GitHubIcon";
import { colors } from "../../theme/colors";
import type { VerificationCompleteness } from "../../data/employerData";

interface Props {
  completeness: VerificationCompleteness;
  size?: number;
}

function Dot({ active, size, children }: { active: boolean; size: number; children: React.ReactNode }) {
  const bg = active ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.05)";
  return (
    <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {children}
    </View>
  );
}

export default function VerificationGlance({ completeness, size = 20 }: Props) {
  const iconSize = size * 0.55;
  return (
    <View style={styles.row}>
      <Dot active={completeness.github} size={size}>
        <GitHubIcon size={iconSize} color={completeness.github ? colors.verified : colors.line} />
      </Dot>
      <Dot active={completeness.credential} size={size}>
        <Award size={iconSize} color={completeness.credential ? colors.verified : colors.line} strokeWidth={2.5} />
      </Dot>
      <Dot active={completeness.document} size={size}>
        <FileText size={iconSize} color={completeness.document ? colors.verified : colors.line} strokeWidth={2.5} />
      </Dot>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  dot: { alignItems: "center", justifyContent: "center" },
});
