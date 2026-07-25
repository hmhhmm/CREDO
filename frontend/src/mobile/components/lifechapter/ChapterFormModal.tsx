// The actual interaction the Designer was missing — a real form that creates or edits a
// chapter the candidate controls, instead of a dead "Plan a chapter" button. Kind, title,
// status, a real target period, and (for planned chapters) a savings goal + what's saved so
// far — all persisted through LifeChapterContext, so a chapter made here is still there on
// reload and immediately shows up in ChapterTimeline/ChapterPlanner.
import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Baby, HeartPulse, Compass, GraduationCap, Sparkles, X, Trash2 } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { ChapterKind, ChapterStatus, LifeChapter } from "../../context/LifeChapterContext";

const KIND_OPTIONS: { key: ChapterKind; label: string; Icon: typeof Baby }[] = [
  { key: "parental", label: "Parental leave", Icon: Baby },
  { key: "health", label: "Health break", Icon: HeartPulse },
  { key: "sabbatical", label: "Sabbatical", Icon: Compass },
  { key: "education", label: "Education", Icon: GraduationCap },
  { key: "custom", label: "Custom", Icon: Sparkles },
];

export interface ChapterDraft {
  kind: ChapterKind;
  title: string;
  period: string;
  targetDate: string; // yyyy-mm-dd, optional
  status: ChapterStatus;
  note: string;
  savingsGoal: string;
  savingsSaved: string;
}

function draftFromChapter(c: LifeChapter | null): ChapterDraft {
  if (!c) {
    return { kind: "sabbatical", title: "", period: "", targetDate: "", status: "planned", note: "", savingsGoal: "", savingsSaved: "" };
  }
  return {
    kind: c.kind,
    title: c.title,
    period: c.period,
    targetDate: c.targetDate ?? "",
    status: c.status,
    note: c.note,
    savingsGoal: c.savingsGoal != null ? String(c.savingsGoal) : "",
    savingsSaved: c.savingsSaved ? String(c.savingsSaved) : "",
  };
}

export default function ChapterFormModal({
  visible,
  editing,
  initialKind,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  editing: LifeChapter | null;
  initialKind?: ChapterKind;
  onClose: () => void;
  onSave: (draft: ChapterDraft) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<ChapterDraft>(() => draftFromChapter(editing));

  useEffect(() => {
    if (visible) {
      const base = draftFromChapter(editing);
      setDraft(initialKind && !editing ? { ...base, kind: initialKind } : base);
    }
  }, [visible, editing, initialKind]);

  const set = <K extends keyof ChapterDraft>(key: K, value: ChapterDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const canSave = draft.title.trim().length > 0 && draft.period.trim().length > 0;

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{editing ? "Edit chapter" : "Plan a chapter"}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={20} color={colors.slate} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.kindRow}>
              {KIND_OPTIONS.map(({ key, label, Icon }) => {
                const on = draft.kind === key;
                return (
                  <Pressable key={key} style={[styles.kindChip, on && styles.kindChipOn]} onPress={() => set("kind", key)}>
                    <Icon size={14} color={on ? colors.parchment : colors.ink} />
                    <Text style={[styles.kindChipText, on && styles.kindChipTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={draft.title}
              onChangeText={(v) => set("title", v)}
              placeholder="e.g. Sabbatical to learn ML"
              placeholderTextColor={colors.slate}
            />

            <Text style={styles.label}>Period</Text>
            <TextInput
              style={styles.input}
              value={draft.period}
              onChangeText={(v) => set("period", v)}
              placeholder="e.g. 2026 · Q4"
              placeholderTextColor={colors.slate}
            />

            <Text style={styles.label}>Target date (optional)</Text>
            <TextInput
              style={styles.input}
              value={draft.targetDate}
              onChangeText={(v) => set("targetDate", v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.slate}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(["planned", "past"] as ChapterStatus[]).map((s) => {
                const on = draft.status === s;
                return (
                  <Pressable key={s} style={[styles.statusChip, on && styles.statusChipOn]} onPress={() => set("status", s)}>
                    <Text style={[styles.statusChipText, on && styles.statusChipTextOn]}>{s === "planned" ? "Planned" : "Already happened"}</Text>
                  </Pressable>
                );
              })}
            </View>

            {draft.status === "planned" && (
              <>
                <Text style={styles.label}>Savings goal, RM (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={draft.savingsGoal}
                  onChangeText={(v) => set("savingsGoal", v.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 30000"
                  placeholderTextColor={colors.slate}
                  keyboardType="number-pad"
                />
                {draft.savingsGoal !== "" && (
                  <>
                    <Text style={styles.label}>Saved so far, RM</Text>
                    <TextInput
                      style={styles.input}
                      value={draft.savingsSaved}
                      onChangeText={(v) => set("savingsSaved", v.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 12000"
                      placeholderTextColor={colors.slate}
                      keyboardType="number-pad"
                    />
                  </>
                )}
              </>
            )}

            <Text style={styles.label}>Note</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={draft.note}
              onChangeText={(v) => set("note", v)}
              placeholder="What's this chapter for? Only you see this unless you choose to share it."
              placeholderTextColor={colors.slate}
              multiline
            />

            <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} disabled={!canSave} onPress={() => onSave(draft)}>
              <Text style={styles.saveButtonText}>{editing ? "Save changes" : "Add chapter"}</Text>
            </Pressable>

            {editing && onDelete && (
              <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Trash2 size={14} color={colors.alert} />
                <Text style={styles.deleteButtonText}>Delete chapter</Text>
              </Pressable>
            )}
          </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,25,43,0.45)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  sheet: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: "88%",
    maxHeight: "88%",
    overflow: "hidden",
  },
  header: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,25,43,0.08)",
    backgroundColor: colors.parchment,
  },
  headerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  body: { padding: 20, gap: 8, paddingBottom: 40 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: colors.slate, marginTop: 10 },
  input: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.14)",
    backgroundColor: "rgba(16,25,43,0.02)",
  },
  kindChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  kindChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink },
  kindChipTextOn: { color: colors.parchment },
  statusRow: { flexDirection: "row", gap: 8 },
  statusChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.14)",
    backgroundColor: "rgba(16,25,43,0.02)",
  },
  statusChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  statusChipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink },
  statusChipTextOn: { color: colors.parchment },
  saveButton: { marginTop: 20, backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 10 },
  deleteButtonText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.alert },
});
