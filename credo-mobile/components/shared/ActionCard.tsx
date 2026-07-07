import { Pressable, Text, View, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import GlassCard from "./GlassCard";

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
}

export default function ActionCard({ title, subtitle, icon, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <GlassCard radius={18} style={pressed && styles.pressed}>
          <View style={styles.row}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={18} color={colors.slate} />
          </View>
        </GlassCard>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 },
  pressed: { opacity: 0.85 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 3 },
});
