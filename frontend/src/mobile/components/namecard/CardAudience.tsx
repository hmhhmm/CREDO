// Control — candidate agency over a verified *identity*.
//
// One card, three curated faces (Public / Recruiter / Anonymous), per-field visibility
// overrides, a revocable + expiring share link, and a "who viewed" pulse. All state is
// local to this component (demo-safe); nothing here mutates the shared namecard data.
import { useState } from "react";
import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Eye, Link2, Check, RotateCcw, Clock, Users } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Audience = "public" | "recruiter" | "anonymous";
type FieldKey = "identity" | "skills" | "behavioral" | "contact" | "salary" | "employers";

const AUDIENCES: { key: Audience; label: string; blurb: string }[] = [
  { key: "public", label: "Public", blurb: "A lean card for anyone with the link — proof, no contact details." },
  { key: "recruiter", label: "Recruiter", blurb: "The full card: identity, skills, behavioral proof, and how to reach you." },
  { key: "anonymous", label: "Anonymous", blurb: "Fair-mode: verified skills and scores only — no name, photo, or contact." },
];

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "identity", label: "Name & photo" },
  { key: "skills", label: "Verified skills" },
  { key: "behavioral", label: "Behavioral proof (SimuHire)" },
  { key: "contact", label: "Contact links" },
  { key: "salary", label: "Salary expectation" },
  { key: "employers", label: "Past employers" },
];

const PRESETS: Record<Audience, Record<FieldKey, boolean>> = {
  public: { identity: true, skills: true, behavioral: true, contact: false, salary: false, employers: false },
  recruiter: { identity: true, skills: true, behavioral: true, contact: true, salary: true, employers: true },
  anonymous: { identity: false, skills: true, behavioral: true, contact: false, salary: true, employers: false },
};

const EXPIRIES: { key: string; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "never", label: "Never" },
];

// Demo pulse — in production this comes from scan/view logs.
const RECENT_VIEWS = [
  { who: "Acme Corp · Talent", when: "2h ago" },
  { who: "Northwind · Eng hiring", when: "yesterday" },
  { who: "Anonymous employer", when: "3 days ago" },
];

export default function CardAudience({ handle }: { handle: string }) {
  const [audience, setAudience] = useState<Audience>("public");
  const [fields, setFields] = useState<Record<FieldKey, boolean>>(PRESETS.public);
  const [expiry, setExpiry] = useState("7d");
  const [linkActive, setLinkActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkNonce, setLinkNonce] = useState("a1f9");

  const shareUrl = `credo.id/s/${handle}-${linkNonce}`;

  const pickAudience = (a: Audience) => {
    setAudience(a);
    setFields(PRESETS[a]);
  };

  const toggleField = (k: FieldKey) => setFields((prev) => ({ ...prev, [k]: !prev[k] }));

  const copy = async () => {
    if (!linkActive) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = () => {
    setLinkNonce(Math.random().toString(16).slice(2, 6));
    setLinkActive(true);
  };

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        {/* Audience selector */}
        <View style={styles.headRow}>
          <Eye size={14} color={colors.ink} />
          <Text style={styles.title}>Who sees what</Text>
        </View>
        <View style={styles.segment}>
          {AUDIENCES.map((a) => {
            const on = a.key === audience;
            return (
              <Pressable key={a.key} style={[styles.segItem, on && styles.segItemOn]} onPress={() => pickAudience(a.key)}>
                <Text style={[styles.segText, on && styles.segTextOn]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.blurb}>{AUDIENCES.find((a) => a.key === audience)?.blurb}</Text>

        {/* Per-field overrides */}
        <View style={styles.fieldList}>
          {FIELDS.map((f, i) => (
            <View key={f.key} style={[styles.fieldRow, i > 0 && styles.divider]}>
              <Text style={[styles.fieldLabel, !fields[f.key] && { color: colors.slate }]}>{f.label}</Text>
              <Switch value={fields[f.key]} onValueChange={() => toggleField(f.key)} />
            </View>
          ))}
        </View>

        {/* Revocable + expiring link */}
        <View style={styles.linkBlock}>
          <View style={styles.linkTop}>
            <Link2 size={14} color={linkActive ? colors.ink : colors.slate} />
            <Text style={[styles.linkUrl, !linkActive && styles.linkUrlOff]} numberOfLines={1}>
              {linkActive ? shareUrl : "Link revoked"}
            </Text>
            <Pressable onPress={copy} disabled={!linkActive} hitSlop={8}>
              {copied ? <Check size={15} color={colors.verified} /> : <Link2 size={15} color={linkActive ? colors.ink : colors.slate} />}
            </Pressable>
          </View>
          <View style={styles.expiryRow}>
            <Clock size={11} color={colors.slate} />
            {EXPIRIES.map((e) => {
              const on = e.key === expiry;
              return (
                <Pressable key={e.key} onPress={() => setExpiry(e.key)} style={[styles.expiryChip, on && styles.expiryChipOn]}>
                  <Text style={[styles.expiryText, on && styles.expiryTextOn]}>{e.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.linkActions}>
            <Pressable style={styles.linkBtn} onPress={() => setLinkActive((v) => !v)}>
              <Text style={[styles.linkBtnText, { color: linkActive ? colors.alert : colors.verified }]}>
                {linkActive ? "Revoke link" : "Re-enable"}
              </Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={regenerate}>
              <RotateCcw size={12} color={colors.slate} />
              <Text style={styles.linkBtnText}>New link</Text>
            </Pressable>
          </View>
        </View>

        {/* Who viewed */}
        <View style={styles.viewsBlock}>
          <View style={styles.headRow}>
            <Users size={13} color={colors.slate} />
            <Text style={styles.viewsTitle}>{RECENT_VIEWS.length} employers viewed this week</Text>
          </View>
          {RECENT_VIEWS.map((v, i) => (
            <View key={i} style={styles.viewRow}>
              <View style={styles.viewDot} />
              <Text style={styles.viewWho}>{v.who}</Text>
              <Text style={styles.viewWhen}>{v.when}</Text>
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  segment: { flexDirection: "row", backgroundColor: "rgba(16,25,43,0.06)", borderRadius: 11, padding: 3, gap: 3 },
  segItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9 },
  segItemOn: { backgroundColor: colors.ink },
  segText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.slate },
  segTextOn: { color: colors.parchment },
  blurb: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },
  fieldList: { marginTop: 2 },
  fieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  fieldLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  linkBlock: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  linkTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkUrl: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  linkUrlOff: { color: colors.slate, textDecorationLine: "line-through" },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  expiryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(16,25,43,0.06)" },
  expiryChipOn: { backgroundColor: `${colors.verified}1F` },
  expiryText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  expiryTextOn: { color: colors.verified },
  linkActions: { flexDirection: "row", gap: 10 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4 },
  linkBtnText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.slate },
  viewsBlock: { gap: 8, marginTop: 2 },
  viewsTitle: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  viewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  viewWho: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate },
  viewWhen: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
});
