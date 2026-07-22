import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Send } from "lucide-react-native";
import { simuhireApi, ApiError } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { SimuHireStackParamList } from "../../navigation/SimuHireStack";
import ScreenBackground from "../../components/shared/ScreenBackground";

interface ChatTurn {
  speaker: "interviewer" | "stakeholder" | "candidate";
  text: string;
}

type Props = NativeStackScreenProps<SimuHireStackParamList, "SimuHireChat">;

export default function SimuHireChatScreen({ navigation, route }: Props) {
  const { session } = route.params;
  const [turns, setTurns] = useState<ChatTurn[]>([{ speaker: "interviewer", text: session.opening_message }]);
  const [stage, setStage] = useState(session.stage);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setTurns((prev) => [...prev, { speaker: "candidate", text }]);
    setSending(true);
    try {
      const res = await simuhireApi.sendMessage(session.session_id, text);
      setStage(res.stage);
      setTurns((prev) => [
        ...prev,
        { speaker: "interviewer", text: res.interviewer_message },
        ...(res.stakeholder_message ? [{ speaker: "stakeholder" as const, text: res.stakeholder_message }] : []),
      ]);
    } catch (e) {
      Alert.alert("Message failed", e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setSending(false);
    }
  };

  const endSession = async () => {
    setEnding(true);
    try {
      await simuhireApi.endSession(session.session_id);
      navigation.replace("SimuHireReport", { sessionId: session.session_id });
    } catch (e) {
      Alert.alert("Could not end session", e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setEnding(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.stageBar}>
          <Text style={styles.stageText}>{stage}</Text>
          <Pressable onPress={endSession} disabled={ending}>
            {ending ? <ActivityIndicator color={colors.alert} size="small" /> : <Text style={styles.endText}>End session</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {turns.map((turn, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                turn.speaker === "candidate" ? styles.bubbleCandidate : styles.bubbleOther,
              ]}
            >
              {turn.speaker !== "candidate" && (
                <Text style={styles.speakerLabel}>{turn.speaker === "interviewer" ? "Scenario Master" : "Stakeholder"}</Text>
              )}
              <Text style={turn.speaker === "candidate" ? styles.bubbleTextCandidate : styles.bubbleText}>{turn.text}</Text>
            </View>
          ))}
          {sending && <ActivityIndicator color={colors.ink} />}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your response…"
            placeholderTextColor={colors.slate}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!sending}
          />
          <Pressable style={styles.sendButton} onPress={send} disabled={sending || !input.trim()}>
            <Send size={16} color={colors.parchment} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,25,43,0.1)",
  },
  stageText: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  endText: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },
  bubble: { maxWidth: "85%", padding: 14, borderRadius: 18 },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
    borderBottomLeftRadius: 4,
  },
  bubbleCandidate: { alignSelf: "flex-end", backgroundColor: colors.ink, borderBottomRightRadius: 4 },
  speakerLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, marginBottom: 4 },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  bubbleTextCandidate: { fontFamily: fonts.sans, fontSize: 14, color: colors.parchment, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    // Clear the floating glass tab bar (64 tall + 12 bottom margin) so the send box
    // stays reachable.
    marginBottom: 80,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.1)",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
