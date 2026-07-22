import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { jobsApi, ApiError } from "../../lib/api";
import type { EmploymentType } from "../../data/types";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "JobCreate">;

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

export default function JobCreateScreen({ navigation }: Props) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full-time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [skills, setSkills] = useState<{ name: string; verifiedOnly: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, verifiedOnly }]);
    setSkillInput("");
    setVerifiedOnly(false);
  };

  const removeSkill = (name: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== name));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Job title is required.";
    if (!location.trim()) e.location = "Location is required.";
    if (skills.length === 0) e.skills = "Add at least one required skill.";
    const parsedMin = parseInt(salaryMin, 10);
    const parsedMax = parseInt(salaryMax, 10);
    if (!Number.isNaN(parsedMin) && !Number.isNaN(parsedMax) && parsedMin > parsedMax) {
      e.salary = "Min salary cannot exceed max salary";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const parsedMin = parseInt(salaryMin, 10);
    const parsedMax = parseInt(salaryMax, 10);
    try {
      await jobsApi.create({
        title: title.trim(),
        location: location.trim(),
        employment_type: employmentType,
        salary_min: Number.isNaN(parsedMin) ? null : parsedMin,
        salary_max: Number.isNaN(parsedMax) ? null : parsedMax,
        description: description.trim(),
        required_skills: skills.map((s) => ({ name: s.name, verified_only: s.verifiedOnly })),
      });
      // Replace so back button goes to JobList, not back to an empty form.
      navigation.replace("JobList");
    } catch (e) {
      console.error("JobCreateScreen submit failed:", e);
      setSubmitError(e instanceof ApiError ? e.message : "Could not post the role. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Job title */}
            <View style={styles.field}>
              <Text style={styles.label}>Job title <Text style={styles.required}>*</Text></Text>
              <GlassCard radius={14}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Junior ML Engineer"
                  placeholderTextColor={colors.slate}
                  value={title}
                  onChangeText={setTitle}
                />
              </GlassCard>
              {errors.title && <Text style={styles.fieldError}>{errors.title}</Text>}
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
              <GlassCard radius={14}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kuala Lumpur or Remote"
                  placeholderTextColor={colors.slate}
                  value={location}
                  onChangeText={setLocation}
                />
              </GlassCard>
              {errors.location && <Text style={styles.fieldError}>{errors.location}</Text>}
            </View>

            {/* Employment type */}
            <View style={styles.field}>
              <Text style={styles.label}>Employment type</Text>
              <View style={styles.segmentRow}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[styles.segment, employmentType === t.value && styles.segmentActive]}
                    onPress={() => setEmploymentType(t.value)}
                  >
                    <Text style={[styles.segmentText, employmentType === t.value && styles.segmentTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Salary range */}
            <View style={styles.field}>
              <Text style={styles.label}>Salary range (RM / month)</Text>
              <View style={styles.salaryRow}>
                <GlassCard radius={14} style={styles.salaryCell}>
                  <TextInput
                    style={styles.input}
                    placeholder="Min"
                    placeholderTextColor={colors.slate}
                    value={salaryMin}
                    onChangeText={setSalaryMin}
                    keyboardType="numeric"
                  />
                </GlassCard>
                <Text style={styles.salarySep}>–</Text>
                <GlassCard radius={14} style={styles.salaryCell}>
                  <TextInput
                    style={styles.input}
                    placeholder="Max"
                    placeholderTextColor={colors.slate}
                    value={salaryMax}
                    onChangeText={setSalaryMax}
                    keyboardType="numeric"
                  />
                </GlassCard>
              </View>
              {errors.salary && <Text style={styles.fieldError}>{errors.salary}</Text>}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <GlassCard radius={14}>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="What will this person work on? What do you value in a hire?"
                  placeholderTextColor={colors.slate}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </GlassCard>
            </View>

            {/* Required skills */}
            <View style={styles.field}>
              <Text style={styles.label}>Required skills <Text style={styles.required}>*</Text></Text>
              <View style={styles.skillBuilder}>
                <GlassCard radius={14} style={styles.flex1}>
                  <TextInput
                    style={styles.input}
                    placeholder="Skill name"
                    placeholderTextColor={colors.slate}
                    value={skillInput}
                    onChangeText={setSkillInput}
                    onSubmitEditing={addSkill}
                    returnKeyType="done"
                  />
                </GlassCard>
                <Pressable
                  style={[styles.verifiedToggle, verifiedOnly && styles.verifiedToggleActive]}
                  onPress={() => setVerifiedOnly((v) => !v)}
                >
                  <Text style={[styles.verifiedToggleText, verifiedOnly && styles.verifiedToggleTextActive]}>
                    Verified
                  </Text>
                </Pressable>
                <Pressable style={styles.addSkillBtn} onPress={addSkill}>
                  <Plus size={16} color={colors.parchment} strokeWidth={2.5} />
                </Pressable>
              </View>
              {skills.length > 0 && (
                <View style={styles.chipRow}>
                  {skills.map((s) => (
                    <View
                      key={s.name}
                      style={[styles.chip, { backgroundColor: s.verifiedOnly ? "rgba(31,122,92,0.12)" : "rgba(16,25,43,0.06)" }]}
                    >
                      <Text style={[styles.chipText, { color: s.verifiedOnly ? colors.verified : colors.ink }]}>{s.name}</Text>
                      {s.verifiedOnly && (
                        <Text style={styles.chipVerified}>· verified</Text>
                      )}
                      <Pressable onPress={() => removeSkill(s.name)} hitSlop={8}>
                        <X size={11} color={s.verifiedOnly ? colors.verified : colors.slate} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              {errors.skills && <Text style={styles.fieldError}>{errors.skills}</Text>}
            </View>

            {/* Submit */}
            {submitError && <Text style={styles.submitError}>{submitError}</Text>}
            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.parchment} />
              ) : (
                <Text style={styles.submitBtnText}>Post role</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, gap: 20 },

  field: { gap: 8 },
  label: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  required: { color: colors.alert },
  input: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, padding: 14 },
  textarea: { minHeight: 96, paddingTop: 14 },
  fieldError: { fontFamily: fonts.mono, fontSize: 11, color: colors.alert },

  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.05)",
    alignItems: "center",
  },
  segmentActive: { backgroundColor: colors.ink },
  segmentText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  segmentTextActive: { color: colors.parchment },

  salaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  salaryCell: { flex: 1 },
  salarySep: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.slate },

  skillBuilder: { flexDirection: "row", alignItems: "center", gap: 8 },
  verifiedToggle: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.05)",
  },
  verifiedToggleActive: { backgroundColor: "rgba(31,122,92,0.12)" },
  verifiedToggleText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  verifiedToggleTextActive: { color: colors.verified },
  addSkillBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10 },
  chipText: { fontFamily: fonts.mono, fontSize: 11 },
  chipVerified: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },

  submitBtn: {
    backgroundColor: colors.ink, borderRadius: 16,
    paddingVertical: 17, alignItems: "center",
  },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.parchment },
  submitError: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert, textAlign: "center" },
});
