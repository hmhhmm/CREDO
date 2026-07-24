// E9 — lets an employer define their own interview round names (Settings can add/rename/
// reorder/remove), instead of a fixed enum. Names must stay unique within one employer's
// list; useInterviewStages() enforces that and returns an error string on conflict.
import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronUp, ChevronDown, X, Plus, Pencil, Check } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function StageSettingsScreen() {
  const { stages, addStage, renameStage, removeStage, moveStage } = useInterviewStages();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditDraft(currentName);
    setEditError(null);
  };

  const confirmEdit = (id: string) => {
    const result = renameStage(id, editDraft);
    if (!result.ok) {
      setEditError(result.error ?? "Could not rename this stage.");
      return;
    }
    setEditingId(null);
    setEditError(null);
  };

  const submitNewStage = () => {
    const result = addStage(newStageName);
    if (!result.ok) {
      setAddError(result.error ?? "Could not add this stage.");
      return;
    }
    setNewStageName("");
    setAddError(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Interview Rounds</Text>
          <Text style={styles.subheading}>
            Define the round sequence candidates move through — reorder, rename, add, or remove. Every candidate
            invited to interview follows this same sequence, in order.
          </Text>

          <View style={{ gap: 10 }}>
            {stages.map((stage, index) => {
              const isEditing = editingId === stage.id;
              return (
                <GlassCard key={stage.id} radius={16}>
                  <View style={styles.row}>
                    <Text style={styles.orderNum}>{index + 1}</Text>

                    {isEditing ? (
                      <View style={{ flex: 1, gap: 6 }}>
                        <TextInput
                          style={styles.editInput}
                          value={editDraft}
                          onChangeText={(t) => {
                            setEditDraft(t);
                            setEditError(null);
                          }}
                        />
                        {editError && <Text style={styles.errorText}>{editError}</Text>}
                      </View>
                    ) : (
                      <Text style={styles.stageName}>{stage.name}</Text>
                    )}

                    <View style={styles.rowActions}>
                      {isEditing ? (
                        <Pressable style={styles.iconBtn} onPress={() => confirmEdit(stage.id)}>
                          <Check size={15} color={colors.verified} />
                        </Pressable>
                      ) : (
                        <>
                          <Pressable
                            style={styles.iconBtn}
                            onPress={() => moveStage(stage.id, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp size={15} color={index === 0 ? colors.line : colors.ink} />
                          </Pressable>
                          <Pressable
                            style={styles.iconBtn}
                            onPress={() => moveStage(stage.id, "down")}
                            disabled={index === stages.length - 1}
                          >
                            <ChevronDown size={15} color={index === stages.length - 1 ? colors.line : colors.ink} />
                          </Pressable>
                          <Pressable style={styles.iconBtn} onPress={() => startEditing(stage.id, stage.name)}>
                            <Pencil size={14} color={colors.ink} />
                          </Pressable>
                          <Pressable style={styles.iconBtn} onPress={() => removeStage(stage.id)}>
                            <X size={15} color={colors.alert} />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                </GlassCard>
              );
            })}

            {stages.length === 0 && (
              <Text style={styles.emptyText}>No interview rounds configured — candidates can't be invited until at least one exists.</Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Add a round</Text>
          <GlassCard radius={16}>
            <View style={styles.addBlock}>
              <TextInput
                style={styles.addInput}
                value={newStageName}
                onChangeText={(t) => {
                  setNewStageName(t);
                  setAddError(null);
                }}
                placeholder="e.g. Final Round"
                placeholderTextColor={colors.slate}
                onSubmitEditing={submitNewStage}
              />
              {addError && <Text style={styles.errorText}>{addError}</Text>}
              <Pressable
                style={[styles.addBtn, !newStageName.trim() && styles.addBtnDisabled]}
                onPress={submitNewStage}
                disabled={!newStageName.trim()}
              >
                <Plus size={14} color={colors.parchment} />
                <Text style={styles.addBtnText}>Add round</Text>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, gap: 14 },
  heading: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  orderNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate, width: 16 },
  stageName: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  rowActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  editInput: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingVertical: 2,
  },
  errorText: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.alert },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", paddingVertical: 12 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginTop: 6 },
  addBlock: { padding: 16, gap: 10 },
  addInput: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 11,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },
});
