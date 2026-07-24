import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, MessageCircle, Send, Users } from "lucide-react-native";
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

function PostCard({ post, currentUserId, onLike, onComment }: {
  post: CommunityPost;
  currentUserId: string;
  onLike: () => void;
  onComment: (text: string) => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const liked = post.likedBy.includes(currentUserId);

  return (
    <GlassCard radius={20}>
      <View style={styles.postCard}>
        <View style={styles.postHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.authorInitials}</Text>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.authorSubtitle} numberOfLines={1}>{post.authorSubtitle}</Text>
          </View>
          <Text style={styles.postDate}>{post.createdAt}</Text>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={onLike} hitSlop={6}>
            <Heart size={16} color={liked ? colors.alert : colors.slate} fill={liked ? colors.alert : "transparent"} strokeWidth={2} />
            <Text style={[styles.actionText, liked && { color: colors.alert }]}>{post.likedBy.length || ""}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setShowComments((v) => !v)} hitSlop={6}>
            <MessageCircle size={16} color={colors.slate} strokeWidth={2} />
            <Text style={styles.actionText}>{post.comments.length || ""}</Text>
          </Pressable>
        </View>

        {showComments && (
          <View style={styles.commentsBlock}>
            {post.comments.map((cm) => (
              <View key={cm.id} style={styles.commentRow}>
                <View style={styles.commentHead}>
                  <Text style={styles.commentAuthor}>{cm.authorName}</Text>
                  <Text style={styles.commentDate}>{cm.date}</Text>
                </View>
                <Text style={styles.commentText}>{cm.text}</Text>
              </View>
            ))}
            <View style={styles.commentComposeRow}>
              <TextInput
                style={styles.commentInput}
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Write a comment…"
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
          <View style={styles.topRow}>
            <Users size={20} color={colors.gold} />
            <Text style={styles.heading}>Community</Text>
          </View>

          <GlassCard radius={20}>
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
            <Pressable
              style={[styles.postBtn, !draft.trim() && styles.postBtnDisabled]}
              onPress={() => {
                createPost(me, draft);
                setDraft("");
              }}
              disabled={!draft.trim()}
            >
              <Text style={styles.postBtnText}>Post</Text>
            </Pressable>
          </GlassCard>

          <View style={{ gap: 14 }}>
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
  scroll: { padding: 20, paddingBottom: 110, gap: 16 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink },

  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.parchment },

  composeCard: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
  composeInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, minHeight: 38, paddingTop: 8 },
  postBtn: { alignSelf: "flex-end", backgroundColor: colors.ink, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 18, marginRight: 16, marginBottom: 14 },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.parchment },

  postCard: { padding: 16, gap: 12 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  authorSubtitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  postDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },
  postContent: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, lineHeight: 20 },

  actionRow: { flexDirection: "row", gap: 20, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },

  commentsBlock: { gap: 10, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 10 },
  commentRow: { gap: 2 },
  commentHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthor: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  commentDate: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },
  commentText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 17 },

  commentComposeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  commentInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.ink,
    backgroundColor: "rgba(16,25,43,0.04)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  commentSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  commentSendBtnDisabled: { opacity: 0.4 },
});
