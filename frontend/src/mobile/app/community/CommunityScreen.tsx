import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThumbsUp, MessageCircle, Send } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useCommunity, type CommunityPost } from "../../context/CommunityContext";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Identity = { id: string; name: string; subtitle: string; role: CommunityPost["authorRole"] };

// University's tab passes its own identity (it has no AuthContext session, unlike
// candidate/employer — see UniversityAuthGate); candidate/employer fall back to useAuth().
type Props = { identity?: Identity };

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

const ROLE_BADGE: Record<CommunityPost["authorRole"], { label: string; color: string }> = {
  candidate: { label: "Candidate", color: colors.slate },
  employer: { label: "Employer", color: colors.verified },
  university: { label: "University", color: colors.gold },
};

function PostCard({ post, currentUserId, onLike, onComment }: {
  post: CommunityPost;
  currentUserId: string;
  onLike: () => void;
  onComment: (text: string) => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const liked = post.likedBy.includes(currentUserId);
  const badge = ROLE_BADGE[post.authorRole];

  return (
    <GlassCard radius={16}>
      <View style={styles.postCard}>
        {/* Header — LinkedIn-style: avatar, name + role badge on one line, subtitle below */}
        <View style={styles.postHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.authorInitials}</Text>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
              <View style={[styles.roleBadge, { borderColor: badge.color }]}>
                <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={styles.authorSubtitle} numberOfLines={1}>{post.authorSubtitle}</Text>
            <Text style={styles.postDate}>{post.createdAt}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {/* Reaction summary — LinkedIn shows the counts as their own line above the divider,
            separate from the tappable action row underneath. */}
        {(post.likedBy.length > 0 || post.comments.length > 0) && (
          <View style={styles.summaryRow}>
            {post.likedBy.length > 0 && (
              <View style={styles.summaryLeft}>
                <View style={styles.likeIconBadge}>
                  <ThumbsUp size={9} color={colors.parchment} fill={colors.parchment} />
                </View>
                <Text style={styles.summaryText}>{post.likedBy.length}</Text>
              </View>
            )}
            {post.comments.length > 0 && (
              <Pressable onPress={() => setShowComments((v) => !v)}>
                <Text style={styles.summaryText}>{post.comments.length} comment{post.comments.length === 1 ? "" : "s"}</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={onLike}>
            <ThumbsUp size={16} color={liked ? colors.gold : colors.slate} fill={liked ? colors.gold : "transparent"} strokeWidth={2} />
            <Text style={[styles.actionLabel, liked && { color: colors.gold }]}>Like</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setShowComments((v) => !v)}>
            <MessageCircle size={16} color={colors.slate} strokeWidth={2} />
            <Text style={styles.actionLabel}>Comment</Text>
          </Pressable>
        </View>

        {showComments && (
          <View style={styles.commentsBlock}>
            {post.comments.map((cm) => (
              <View key={cm.id} style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{initials(cm.authorName)}</Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{cm.authorName}</Text>
                  <Text style={styles.commentText}>{cm.text}</Text>
                </View>
              </View>
            ))}
            <View style={styles.commentComposeRow}>
              <TextInput
                style={styles.commentInput}
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Add a comment…"
                placeholderTextColor={colors.slate}
                multiline
              />
              <Pressable
                style={[styles.commentSendBtn, !commentDraft.trim() && styles.commentSendBtnDisabled]}
                onPress={() => {
                  onComment(commentDraft);
                  setCommentDraft("");
                }}
                disabled={!commentDraft.trim()}
              >
                <Send size={13} color={colors.parchment} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export default function CommunityScreen({ identity }: Props) {
  const { posts, createPost, toggleLike, addComment } = useCommunity();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");

  const me: Identity = identity ?? {
    id: user?.id ?? "guest",
    name: user?.name ?? "You",
    subtitle:
      user?.role === "employer"
        ? user.company_name ?? ""
        : [user?.field_of_study, user?.university].filter(Boolean).join(" · "),
    role: (user?.role as Identity["role"]) ?? "candidate",
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Community</Text>

          {/* Compose — LinkedIn's "Start a post" card: avatar + a single pill-shaped prompt
              row up top, with the real multi-line composer only once you tap in. */}
          <GlassCard radius={16}>
            <View style={styles.composeCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(me.name)}</Text>
              </View>
              <TextInput
                style={styles.composeInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="Share an update with the community…"
                placeholderTextColor={colors.slate}
                multiline
              />
            </View>
            {draft.trim().length > 0 && (
              <View style={styles.composeFooter}>
                <Pressable
                  style={styles.postBtn}
                  onPress={() => {
                    createPost(me, draft);
                    setDraft("");
                  }}
                >
                  <Text style={styles.postBtnText}>Post</Text>
                </Pressable>
              </View>
            )}
          </GlassCard>

          <View style={{ gap: 12 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={me.id}
                onLike={() => toggleLike(post.id, me.id)}
                onComment={(text) => addComment(post.id, me, text)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 110, gap: 12 },
  heading: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, paddingHorizontal: 4, marginBottom: 2 },

  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.parchment },

  composeCard: { flexDirection: "row", gap: 10, padding: 14, alignItems: "flex-start" },
  composeInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink, minHeight: 42, paddingTop: 10, paddingHorizontal: 12, backgroundColor: "rgba(16,25,43,0.045)", borderRadius: 20 },
  composeFooter: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 14, paddingBottom: 12 },
  postBtn: { backgroundColor: colors.ink, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 20 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.parchment },

  postCard: { padding: 14, gap: 10 },
  postHead: { flexDirection: "row", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  authorName: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.ink },
  roleBadge: { borderWidth: 1, borderRadius: 100, paddingVertical: 1.5, paddingHorizontal: 7 },
  roleBadgeText: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 },
  authorSubtitle: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate },
  postDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 1 },
  postContent: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20.5 },

  summaryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeIconBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  summaryText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate },

  divider: { height: 1, backgroundColor: "rgba(16,25,43,0.08)" },

  actionRow: { flexDirection: "row" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 6 },
  actionLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.slate },

  commentsBlock: { gap: 10, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 12 },
  commentRow: { flexDirection: "row", gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(16,25,43,0.08)", alignItems: "center", justifyContent: "center" },
  commentAvatarText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.ink },
  commentBubble: { flex: 1, backgroundColor: "rgba(16,25,43,0.04)", borderRadius: 14, padding: 10, gap: 2 },
  commentAuthor: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  commentText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 17 },

  commentComposeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  commentInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.ink,
    backgroundColor: "rgba(16,25,43,0.04)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 36,
  },
  commentSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  commentSendBtnDisabled: { opacity: 0.4 },
});
