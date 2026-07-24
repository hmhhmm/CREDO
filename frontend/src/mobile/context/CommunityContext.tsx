// F/E5 Community — a LinkedIn-style feed shared by every role (candidates, employers,
// universities all read and post into the same global timeline; there's no per-role
// scoping here the way Pipeline/InterviewStages are scoped per employer, because the
// whole point of a community feed is one shared space everyone sees the same view of).
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { allCandidates, allEmployers } from "../data/generateDataset";

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  date: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorSubtitle: string; // field/university for candidates, industry/company for employers
  authorRole: "candidate" | "employer" | "university";
  content: string;
  createdAt: string;
  likedBy: string[];
  comments: CommunityComment[];
}

interface CommunityContextValue {
  posts: CommunityPost[];
  createPost: (author: { id: string; name: string; subtitle: string; role: CommunityPost["authorRole"] }, content: string) => void;
  toggleLike: (postId: string, userId: string) => void;
  addComment: (postId: string, author: { id: string; name: string }, text: string) => void;
}

const CommunityCtx = createContext<CommunityContextValue | null>(null);

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function seedPosts(): CommunityPost[] {
  const a = allCandidates[1] ?? allCandidates[0];
  const b = allCandidates[2] ?? allCandidates[0];
  const e1 = allEmployers[1] ?? allEmployers[0];
  const e2 = allEmployers[2] ?? allEmployers[0];

  return [
    {
      id: "seed-1",
      authorId: e1.id,
      authorName: e1.contactName,
      authorInitials: initials(e1.contactName),
      authorSubtitle: `${e1.industry} · ${e1.name}`,
      authorRole: "employer",
      content: `We just wrapped a great round of SimuHire interviews — impressed by how much verified signal it surfaces before we even talk to a candidate. If you're on the market and open to work, make sure your profile is verified.`,
      createdAt: "2d ago",
      likedBy: [],
      comments: [],
    },
    {
      id: "seed-2",
      authorId: a.id,
      authorName: a.name,
      authorInitials: initials(a.name),
      authorSubtitle: `${a.field} · ${a.university}`,
      authorRole: "candidate",
      content: `Finally got my GitHub verified end to end — the confidence score really does change how employers respond. Small milestone but feels good.`,
      createdAt: "5h ago",
      likedBy: [],
      comments: [],
    },
    {
      id: "seed-3",
      authorId: e2.id,
      authorName: e2.contactName,
      authorInitials: initials(e2.contactName),
      authorSubtitle: `${e2.industry} · ${e2.name}`,
      authorRole: "employer",
      content: `Reminder to fellow hiring managers: verified-only filters cut noise dramatically. Cut our screening time in half this quarter.`,
      createdAt: "1d ago",
      likedBy: [],
      comments: [],
    },
    {
      id: "seed-4",
      authorId: b.id,
      authorName: b.name,
      authorInitials: initials(b.name),
      authorSubtitle: `${b.field} · ${b.university}`,
      authorRole: "candidate",
      content: `Completed my SimuHire session today — genuinely felt like a real interview. Sharing my report on my namecard now.`,
      createdAt: "18h ago",
      likedBy: [],
      comments: [],
    },
  ];
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts);

  const createPost = useCallback(
    (author: { id: string; name: string; subtitle: string; role: CommunityPost["authorRole"] }, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const post: CommunityPost = {
        id: `post-${Date.now()}`,
        authorId: author.id,
        authorName: author.name,
        authorInitials: initials(author.name),
        authorSubtitle: author.subtitle,
        authorRole: author.role,
        content: trimmed,
        createdAt: "Just now",
        likedBy: [],
        comments: [],
      };
      setPosts((prev) => [post, ...prev]);
    },
    []
  );

  const toggleLike = useCallback((postId: string, userId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedBy: p.likedBy.includes(userId) ? p.likedBy.filter((id) => id !== userId) : [...p.likedBy, userId] }
          : p
      )
    );
  }, []);

  const addComment = useCallback((postId: string, author: { id: string; name: string }, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const comment: CommunityComment = {
      id: `comment-${Date.now()}`,
      authorId: author.id,
      authorName: author.name,
      text: trimmed,
      date: "Just now",
    };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
  }, []);

  return (
    <CommunityCtx.Provider value={{ posts, createPost, toggleLike, addComment }}>{children}</CommunityCtx.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityCtx);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}
