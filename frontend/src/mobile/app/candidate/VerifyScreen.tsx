import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, StyleSheet, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import {
  Award,
  FileText,
  ChevronDown,
  MessagesSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Link2,
  Copy,
  Check,
  Share2,
  BadgeCheck,
} from "lucide-react-native";
import GitHubIcon from "../../components/GitHubIcon";
import VerifiedBadge, { type BadgeStatus } from "../../components/shared/VerifiedBadge";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { useCredentialIssuer } from "../../context/CredentialIssuerContext";
import {
  portfolioApi,
  namecardApi,
  verifyApi,
  ledgerApi,
  ApiError,
  type ArtifactResponse,
  type SimuHireBadge,
  type PortfolioResponse,
  type LedgerEntryResponse,
  type LedgerIntegrityResponse,
} from "../../lib/api";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { deriveCoSignStatus } from "../../utils/institutionalCoSign";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { ParentNav } from "../../navigation/types";
import { LedgerChain, LedgerIntegrityBanner } from "../../components/shared/LedgerChain";

type AgentKey = "github" | "credential" | "document";
type AskcPillar = "skills" | "knowledge" | "attitude" | "consistency";

const PILLAR_META: Record<AskcPillar, { code: string; label: string }> = {
  skills: { code: "S", label: "Skills" },
  knowledge: { code: "K", label: "Knowledge" },
  attitude: { code: "A", label: "Attitude" },
  consistency: { code: "C", label: "Consistency" },
};

const TYPE_ICON: Record<AgentKey, typeof GitHubIcon> = {
  github: GitHubIcon,
  credential: Award as unknown as typeof GitHubIcon,
  document: FileText as unknown as typeof GitHubIcon,
};

// Maps each verification channel to the ASKC pillar it actually feeds — matches
// deriveAskcBreakdown's own source mapping (github->Skills, credential/document->
// Knowledge, SimuHire->Attitude), so the tag shown here is never inconsistent with the
// score shown on Home's expanded breakdown.
const AGENTS: { key: AgentKey; label: string; subtitle: string; pillar: AskcPillar }[] = [
  { key: "github", label: "Link Repository", subtitle: "Repo commits & AST analysis", pillar: "skills" },
  { key: "credential", label: "Upload Certificate", subtitle: "Upload a certificate (PDF/DOCX)", pillar: "knowledge" },
  { key: "document", label: "Upload Document", subtitle: "Upload a paper (PDF/DOCX)", pillar: "knowledge" },
];

function badgeStatusFor(artifact: ArtifactResponse | undefined): BadgeStatus {
  if (!artifact) return "not_started"; // nothing triggered yet — distinct from an in-flight "Pending"
  if (artifact.status === "verified") return "verified";
  if (artifact.status === "failed") return "failed";
  return "pending";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PillarTag({ pillar }: { pillar: AskcPillar }) {
  const meta = PILLAR_META[pillar];
  return (
    <View style={styles.pillarTag}>
      <Text style={styles.pillarTagText}>[{meta.code}] {meta.label}</Text>
    </View>
  );
}

function CopyHashButton({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Pressable onPress={copy} style={styles.copyBtn} accessibilityRole="button">
      {copied ? (
        <Check size={11} color={colors.verified} strokeWidth={3} />
      ) : (
        <Copy size={11} color={colors.slate} />
      )}
      <Text style={[styles.copyBtnText, copied && { color: colors.verified }]}>
        {copied ? "Copied" : "Copy Hash"}
      </Text>
    </Pressable>
  );
}

// Every real field the backend already returns on an artifact (confidence, AI-generation
// flag, integrity hash, metadata) plus the real institutional co-sign check (Bridge A) —
// surfaced here instead of just a filename, so "more details" means the actual
// verification record, not invented copy.
function ArtifactDetail({
  artifact,
  pillar,
  coSigned,
  universityName,
}: {
  artifact: ArtifactResponse;
  pillar: AskcPillar;
  coSigned: boolean;
  universityName: string | null;
}) {
  const band = artifact.confidence != null ? getConfidenceBand(artifact.confidence) : null;
  const metadataEntries = artifact.metadata ? Object.entries(artifact.metadata) : [];
  const hashPreview = artifact.hash ? `${artifact.hash.slice(0, 16)}…` : null;

  return (
    <View style={styles.detailBody}>
      <View style={styles.detailHeadRow}>
        <PillarTag pillar={pillar} />
        {coSigned && (
          <View style={styles.coSignBadge}>
            <ShieldCheck size={11} color="#2F6E8F" />
            <Text style={styles.coSignBadgeText}>Co-Signed by {universityName}</Text>
          </View>
        )}
      </View>

      <Text style={styles.detailTitle}>{artifact.artifact_name}</Text>

      {artifact.confidence != null && band && (
        <View style={styles.meterBlock}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.round(artifact.confidence)}%`, backgroundColor: band.hex }]} />
          </View>
          <Text style={[styles.meterLabel, { color: band.hex }]}>
            {Math.round(artifact.confidence)}/100 · {band.label}
          </Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Uploaded</Text>
        <Text style={styles.detailValue}>{formatDate(artifact.created_at)}</Text>
      </View>
      {artifact.verified_at && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verified</Text>
          <Text style={styles.detailValue}>{formatDate(artifact.verified_at)}</Text>
        </View>
      )}
      {artifact.ai_generated != null && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>AI-generation check</Text>
          <View style={styles.detailFlagRow}>
            {artifact.ai_generated ? (
              <ShieldAlert size={12} color={colors.alert} />
            ) : (
              <Sparkles size={12} color={colors.verified} />
            )}
            <Text style={[styles.detailValue, { color: artifact.ai_generated ? colors.alert : colors.verified }]}>
              {artifact.ai_generated ? "Flagged as AI-generated" : "No AI-generation flags"}
            </Text>
          </View>
        </View>
      )}
      {metadataEntries.length > 0 && (
        <View style={styles.metadataBlock}>
          <Text style={styles.detailLabel}>Extracted details</Text>
          {metadataEntries.map(([key, value]) => (
            <View key={key} style={styles.metadataRow}>
              <Text style={styles.metadataKey}>{key.replace(/_/g, " ")}</Text>
              <Text style={styles.metadataValue} numberOfLines={1}>
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {artifact.artifact_url && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{artifact.artifact_url}</Text>
        </View>
      )}
      {artifact.hash && hashPreview && (
        <View style={styles.hashRow}>
          <Text style={styles.detailHash} numberOfLines={1}>{hashPreview}</Text>
          <CopyHashButton hash={artifact.hash} />
        </View>
      )}
    </View>
  );
}

function LedgerRow({
  label,
  pillar,
  artifact,
  expanded,
  onToggle,
  coSigned,
  universityName,
}: {
  label: string;
  pillar: AskcPillar;
  artifact: ArtifactResponse | undefined;
  expanded: boolean;
  onToggle: () => void;
  coSigned: boolean;
  universityName: string | null;
}) {
  const status = badgeStatusFor(artifact);
  return (
    <View>
      <Pressable
        onPress={artifact ? onToggle : undefined}
        style={styles.statusRow}
        accessibilityRole={artifact ? "button" : undefined}
      >
        <View style={styles.statusRowText}>
          <Text style={styles.statusLabel} numberOfLines={1}>{label}</Text>
          <Text style={styles.statusSubtext} numberOfLines={1}>
            {artifact ? artifact.artifact_name : "Not started"}
          </Text>
        </View>
        <View style={styles.statusRowEnd}>
          <VerifiedBadge status={status} />
          <View style={[styles.chevronSlot, expanded && styles.chevronFlipped]}>
            {artifact && <ChevronDown size={14} color={colors.slate} />}
          </View>
        </View>
      </Pressable>
      <View className={`rn-accordion-panel${expanded ? " rn-accordion-open" : ""}`}>
        {artifact && (
          <ArtifactDetail artifact={artifact} pillar={pillar} coSigned={coSigned} universityName={universityName} />
        )}
      </View>
    </View>
  );
}

function QuickVerifyCard({
  title,
  pillar,
  icon,
  subtitle,
  onPress,
}: {
  title: string;
  pillar: AskcPillar;
  icon: React.ReactNode;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.gridSlot}>
      {({ pressed }) => (
        <GlassCard radius={20} style={[styles.gridCardGlass, pressed && styles.gridCardPressed]}>
          <View style={styles.gridCard}>
            <View style={styles.gridCardIcon}>{icon}</View>
            <Text style={styles.gridCardTitle} numberOfLines={2}>{title}</Text>
            <Text style={styles.gridCardSubtitle} numberOfLines={2}>{subtitle}</Text>
            <PillarTag pillar={pillar} />
          </View>
        </GlassCard>
      )}
    </Pressable>
  );
}

// LinkedIn-style shareable credential card — light card, small square seal on the left
// (matching how LinkedIn's own certification cards read: logo mark + title/issuer stacked
// beside it), not a dark identity panel. One per verified artifact plus SimuHire. Every
// field is real (title, verifier, date, pillar), and the "Verified by CREDO" mark only
// appears on artifacts that actually cleared verification, never decoratively.
function CredentialBadgeCard({
  title,
  issuer,
  date,
  pillar,
  Icon,
  coSigned,
  universityName,
  onShare,
}: {
  title: string;
  issuer: string;
  date: string;
  pillar: AskcPillar;
  Icon: typeof GitHubIcon;
  coSigned: boolean;
  universityName: string | null;
  onShare: () => void;
}) {
  return (
    <GlassCard radius={18} style={styles.badgeCardGlass}>
      <View style={styles.badgeCard}>
        <View style={styles.badgeCardTopRow}>
          <View style={styles.badgeSeal}>
            <Icon size={20} color={colors.ink} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.badgeCardTitle} numberOfLines={2}>{title}</Text>
            <Text style={styles.badgeCardIssuer} numberOfLines={1}>{issuer}</Text>
          </View>
          <Pressable onPress={onShare} style={styles.badgeShareIconBtn} accessibilityRole="button" hitSlop={8}>
            <Share2 size={14} color={colors.slate} />
          </Pressable>
        </View>

        <View style={styles.badgeCardMetaRow}>
          <Text style={styles.badgeCardDate}>{date}</Text>
          <PillarTag pillar={pillar} />
        </View>

        {coSigned && (
          <View style={styles.badgeCoSignRow}>
            <ShieldCheck size={11} color="#2F6E8F" />
            <Text style={styles.badgeCoSignText}>Co-signed by {universityName}</Text>
          </View>
        )}

        <View style={styles.verifiedFooter}>
          <BadgeCheck size={13} color={colors.gold} />
          <Text style={styles.verifiedFooterText}>Verified by CREDO</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function VerifyScreen({ navigation }: { navigation: NonNullable<ParentNav> }) {
  const { user } = useAuth();
  const { isIssued } = useCredentialIssuer();
  const [artifactsByType, setArtifactsByType] = useState<Partial<Record<AgentKey, ArtifactResponse>>>({});
  const [simuhireBadge, setSimuhireBadge] = useState<SimuHireBadge | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<AgentKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<AgentKey | "simuhire" | "audit" | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryResponse[]>([]);
  const [ledgerIntegrity, setLedgerIntegrity] = useState<LedgerIntegrityResponse | null>(null);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const loadPortfolio = useCallback(async () => {
    if (!user) return;
    try {
      const [p, namecardRes] = await Promise.all([portfolioApi.me(), namecardApi.get(user.id)]);
      const latest: Partial<Record<AgentKey, ArtifactResponse>> = {};
      // verified_artifacts is ordered most-recent-first per the backend query.
      for (const a of p.verified_artifacts) {
        const key = a.artifact_type as AgentKey;
        if (!latest[key]) latest[key] = a;
      }
      setArtifactsByType(latest);
      setSimuhireBadge(namecardRes.simuhire_badge);
      setPortfolio(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPortfolio();
    const timers = pollTimers;
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  }, [loadPortfolio]);

  // Re-check status on focus — a SimuHire session finished on the SimuHire tab, or a
  // credential co-signed on the University side, should show up here without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      loadPortfolio();
    }, [loadPortfolio])
  );

  const pollArtifact = useCallback((agentKey: AgentKey, artifactId: string) => {
    if (pollTimers.current[artifactId]) return;
    pollTimers.current[artifactId] = setInterval(async () => {
      try {
        const artifact = await verifyApi.getArtifact(artifactId);
        setArtifactsByType((prev) => ({ ...prev, [agentKey]: artifact }));
        if (artifact.status !== "pending") {
          clearInterval(pollTimers.current[artifactId]);
          delete pollTimers.current[artifactId];
        }
      } catch {
        clearInterval(pollTimers.current[artifactId]);
        delete pollTimers.current[artifactId];
      }
    }, 2000);
  }, []);

  const uploadFor = useCallback(
    async (agentKey: "credential" | "document") => {
      setError(null);
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];

      setUploading(agentKey);
      try {
        await verifyApi.consent(agentKey);
        const trigger = await (agentKey === "credential" ? verifyApi.triggerCredential : verifyApi.triggerDocument)({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/pdf",
          file: (asset as { file?: File }).file,
        });
        const artifact = await verifyApi.getArtifact(trigger.artifact_id);
        setArtifactsByType((prev) => ({ ...prev, [agentKey]: artifact }));
        pollArtifact(agentKey, trigger.artifact_id);
      } catch (e) {
        console.error("Verify upload failed:", e);
        Alert.alert("Upload failed", e instanceof ApiError ? e.message : "Could not reach the server.");
      } finally {
        setUploading(null);
      }
    },
    [pollArtifact]
  );

  const onPressAgent = useCallback(
    (agentKey: AgentKey) => {
      if (agentKey === "github") {
        Alert.alert(
          "GitHub not connected",
          "GitHub verification requires connecting your GitHub account via OAuth, which this build's server hasn't been configured with yet."
        );
        return;
      }
      uploadFor(agentKey);
    },
    [uploadFor]
  );

  // VerifyScreen is a direct Tab.Screen (no wrapping Stack of its own), so its own
  // `navigation` prop already IS the Tab navigator — calling getParent() here would step
  // past it to the root Stack, where "Home" isn't a registered screen name there.
  const goSimuHire = () => navigation.navigate("Home", { screen: "SimuHire" });

  // Audit Trail expands in place on this page instead of navigating to the Card tab's
  // Ledger screen — fetched lazily, the first time it's actually opened.
  const toggleAuditTrail = async () => {
    const opening = expandedKey !== "audit";
    setExpandedKey(opening ? "audit" : null);
    if (opening && !ledgerLoaded && user) {
      try {
        const [entries, integrity] = await Promise.all([ledgerApi.list(user.id), ledgerApi.verify(user.id)]);
        setLedgerEntries(entries);
        setLedgerIntegrity(integrity);
        setLedgerLoaded(true);
      } catch (e) {
        console.error("Ledger load failed:", e);
      }
    }
  };

  const toggleExpanded = (key: AgentKey | "simuhire") =>
    setExpandedKey((prev) => (prev === key ? null : key));

  const coSign = deriveCoSignStatus(user?.university, portfolio, isIssued);

  const shareBadge = async (title: string) => {
    const url = portfolio?.public_url;
    try {
      if (url) {
        await Share.share({ message: `${title} — verified on my CREDO profile: ${url}` });
      } else {
        await Share.share({ message: `${title} — verified on CREDO.` });
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const verifiedArtifactBadges = AGENTS.filter(({ key }) => artifactsByType[key]?.status === "verified");

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.heading}>Portfolio</Text>
            <Text style={styles.subheading}>Your personal record of verified skills, documents, and credentials.</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              {/* Quick Verify Hub — 2x2 grid, each card tagged with the ASKC pillar it feeds.
                  All four are real actions; every slot shares the same fixed card height
                  (styles.gridCard) so nothing in the grid reads as a different size. */}
              <Text style={styles.sectionLabel}>Quick Verify</Text>
              <View style={styles.grid}>
                <QuickVerifyCard
                  title="Link Repository"
                  subtitle="Repo commits & AST analysis"
                  pillar="skills"
                  icon={<GitHubIcon size={20} color={colors.ink} />}
                  onPress={() => onPressAgent("github")}
                />
                <QuickVerifyCard
                  title="Upload Certificate"
                  subtitle={uploading === "credential" ? "Uploading…" : "PDF or DOCX certificate"}
                  pillar="knowledge"
                  icon={<Award size={20} color={colors.ink} />}
                  onPress={() => onPressAgent("credential")}
                />
                <QuickVerifyCard
                  title="SimuHire Session"
                  subtitle={
                    simuhireBadge
                      ? `${simuhireBadge.simulation_type} · ${Math.round(simuhireBadge.overall_score)}/100`
                      : "2-minute behavioral interview simulation"
                  }
                  pillar="attitude"
                  icon={<MessagesSquare size={20} color={colors.ink} />}
                  onPress={goSimuHire}
                />
                {/* Expands in place below — the full hash chain + integrity check, without
                    leaving the Verify page. */}
                <QuickVerifyCard
                  title="Audit Trail"
                  subtitle="Full ledger & integrity check"
                  pillar="consistency"
                  icon={<Link2 size={20} color={colors.ink} />}
                  onPress={toggleAuditTrail}
                />
              </View>

              <View className={`rn-accordion-panel rn-accordion-tall${expandedKey === "audit" ? " rn-accordion-open" : ""}`}>
                <View style={styles.auditPanel}>
                  {!ledgerLoaded ? (
                    <ActivityIndicator color={colors.ink} style={{ marginTop: 8 }} />
                  ) : (
                    <>
                      {ledgerIntegrity && <LedgerIntegrityBanner integrity={ledgerIntegrity} />}
                      <LedgerChain entries={ledgerEntries} />
                    </>
                  )}
                </View>
              </View>

              {/* Verification Ledger — expandable, real backend data per artifact. Every row
                  shares the same layout (statusRowText/statusRowEnd) so labels, subtext, and
                  badges line up regardless of content length. */}
              <Text style={styles.sectionLabel}>Verification Ledger</Text>
              <GlassCard radius={20}>
                <View style={styles.statusList}>
                  {AGENTS.map(({ key, label, pillar }, i) => (
                    <View key={key} style={[i > 0 && styles.statusRowDivider]}>
                      <LedgerRow
                        label={label}
                        pillar={pillar}
                        artifact={artifactsByType[key]}
                        expanded={expandedKey === key}
                        onToggle={() => toggleExpanded(key)}
                        coSigned={
                          key === "credential" && !!artifactsByType[key] && coSign.isCoSigned &&
                          coSign.coSignedArtifactName === artifactsByType[key]?.artifact_name
                        }
                        universityName={coSign.universityName}
                      />
                    </View>
                  ))}
                  <Pressable onPress={goSimuHire} style={[styles.statusRow, styles.statusRowDivider]}>
                    <View style={styles.statusRowText}>
                      <Text style={styles.statusLabel} numberOfLines={1}>SimuHire</Text>
                      <Text style={styles.statusSubtext} numberOfLines={1}>
                        {simuhireBadge
                          ? `${simuhireBadge.simulation_type} · ${Math.round(simuhireBadge.overall_score)}/100`
                          : "Not started"}
                      </Text>
                    </View>
                    <View style={styles.statusRowEnd}>
                      <VerifiedBadge status={simuhireBadge ? "verified" : "not_started"} />
                      <View style={styles.chevronSlot} />
                    </View>
                  </Pressable>
                </View>
              </GlassCard>

              {/* Verified Credentials Hub — a LinkedIn-style shareable badge wall: light
                  cards with a compact gold seal, not a dark identity panel, so it reads as
                  a document/badge library sitting on the same page as the ledger above it. */}
              <Text style={styles.sectionLabel}>Verified Credentials</Text>
              {verifiedArtifactBadges.length === 0 && !simuhireBadge ? (
                <GlassCard radius={18}>
                  <View style={styles.emptyBadgesCard}>
                    <Text style={styles.emptyBadgesTitle}>No verified credentials yet</Text>
                    <Text style={styles.emptyBadgesBody}>
                      Verify a channel above and it will appear here as a shareable, CREDO-verified badge.
                    </Text>
                  </View>
                </GlassCard>
              ) : (
                <View style={{ gap: 12 }}>
                  {verifiedArtifactBadges.map(({ key, pillar }) => {
                    const artifact = artifactsByType[key]!;
                    const Icon = TYPE_ICON[key];
                    const coSigned =
                      key === "credential" && coSign.isCoSigned && coSign.coSignedArtifactName === artifact.artifact_name;
                    return (
                      <CredentialBadgeCard
                        key={key}
                        title={artifact.artifact_name}
                        issuer={coSigned ? `${coSign.universityName} · Co-signed` : "CREDO Verification Engine"}
                        date={formatDate(artifact.verified_at ?? artifact.created_at)}
                        pillar={pillar}
                        Icon={Icon}
                        coSigned={coSigned}
                        universityName={coSign.universityName}
                        onShare={() => shareBadge(artifact.artifact_name)}
                      />
                    );
                  })}
                  {simuhireBadge && (
                    <CredentialBadgeCard
                      title={`SimuHire — ${simuhireBadge.simulation_type}`}
                      issuer="CREDO Behavioral Simulation"
                      date={`${Math.round(simuhireBadge.overall_score)}/100 overall`}
                      pillar="attitude"
                      Icon={MessagesSquare as unknown as typeof GitHubIcon}
                      coSigned={false}
                      universityName={null}
                      onShare={() => shareBadge(`SimuHire ${simuhireBadge.simulation_type} interview`)}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, marginTop: 4, lineHeight: 18 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  pillarTag: {
    alignSelf: "flex-start",
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: "rgba(201,166,70,0.16)",
  },
  pillarTagText: { fontFamily: fonts.mono, fontSize: 10, color: "#8A6D1F", letterSpacing: 0.3 },

  // Fixed basis + fixed card height (not minHeight) is what actually guarantees all four
  // grid cards render identically — flexWrap rows don't share height across wrapped items
  // on their own, so a shorter subtitle previously left that card visibly shorter.
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridSlot: { flexBasis: "47%", flexGrow: 1 },
  auditPanel: { paddingTop: 12, gap: 14 },
  gridCardGlass: { borderColor: "rgba(201,166,70,0.2)" },
  gridCardPressed: { opacity: 0.85 },
  gridCard: { padding: 16, gap: 8, height: 168, overflow: "hidden" },
  gridCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink, lineHeight: 18 },
  gridCardSubtitle: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 15, flex: 1 },

  // Every ledger row shares this same two-column shape (text column flexes, end column is a
  // fixed-content cluster) so row height and badge alignment stay identical regardless of
  // whether a row has a subtitle, a long name, or no artifact yet.
  statusList: { padding: 16, gap: 0 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, minHeight: 52 },
  statusRowText: { flex: 1, gap: 2 },
  statusRowEnd: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusRowDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  statusLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  statusSubtext: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },
  chevronSlot: { width: 14, alignItems: "center" },
  chevronFlipped: { transform: [{ rotate: "180deg" }] },

  detailBody: { paddingBottom: 14, paddingTop: 6, paddingLeft: 2, gap: 10 },
  detailHeadRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  detailTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },

  coSignBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: "rgba(47,110,143,0.1)",
  },
  coSignBadgeText: { fontFamily: fonts.mono, fontSize: 9.5, color: "#2F6E8F" },

  meterBlock: { gap: 5 },
  meterTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(16,25,43,0.08)", overflow: "hidden" },
  meterFill: { height: 6, borderRadius: 3 },
  meterLabel: { fontFamily: fonts.mono, fontSize: 11 },

  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  detailLabel: { fontFamily: fonts.mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.slate },
  detailValue: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink, flexShrink: 1, textAlign: "right" },
  detailFlagRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailHash: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, flexShrink: 1 },

  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(16,25,43,0.04)",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
  },
  copyBtnText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink },

  metadataBlock: {
    gap: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(16,25,43,0.04)",
  },
  metadataRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  metadataKey: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, textTransform: "capitalize" },
  metadataValue: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink, flexShrink: 1, textAlign: "right" },

  emptyBadgesCard: { padding: 20, gap: 6, alignItems: "center" },
  emptyBadgesTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  emptyBadgesBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, textAlign: "center", lineHeight: 17 },

  // Credential badge card — light card (LinkedIn certification-card shape: a small square
  // seal on the left, title/issuer stacked beside it), not a dark identity panel. Sits on
  // the same cream/glass system as the rest of the page; the gold-bordered seal and the
  // footer "Verified by CREDO" line are what mark it as CREDO's proof surface, not a
  // full dark treatment competing with the ledger above it.
  badgeCardGlass: { borderColor: "rgba(201,166,70,0.25)" },
  badgeCard: { padding: 16, gap: 10 },
  badgeCardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badgeSeal: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(201,166,70,0.45)",
    backgroundColor: "rgba(201,166,70,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeShareIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,43,0.05)",
  },

  badgeCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.ink, lineHeight: 19 },
  badgeCardIssuer: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 1 },

  badgeCardMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeCardDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },

  badgeCoSignRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  badgeCoSignText: { fontFamily: fonts.mono, fontSize: 10, color: "#2F6E8F" },

  verifiedFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.07)",
  },
  verifiedFooterText: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.3, color: "#8A6D1F" },

  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
});
