import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { demoVideos } from '../../data/demo';
import { colors } from '../../constants/theme';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createPostComment, getPostComments, getPublicFeed, type CommunityComment, type CommunityPost } from '../../lib/community';

export default function Reels() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setFeedError('The public feed will appear when the app is connected to CRUSH.');
      setFeedLoading(false);
      return;
    }
    getPublicFeed()
      .then((items) => { if (active) setPosts(items); })
      .catch(() => { if (active) setFeedError('The public feed could not load. Please try again later.'); })
      .finally(() => { if (active) setFeedLoading(false); });
    return () => { active = false; };
  }, []);

  const openComments = async (postId: string) => {
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    setOpenPost(openPost === postId ? null : postId);
    if (openPost === postId || comments[postId]) return;
    try {
      const rows = await getPostComments(postId);
      setComments((current) => ({ ...current, [postId]: rows }));
    } catch {
      setCommentError((current) => ({ ...current, [postId]: 'Comments could not be loaded.' }));
    }
  };

  const submitComment = async (postId: string) => {
    const body = (drafts[postId] ?? '').trim();
    if (!body || commentBusy) return;
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    setCommentBusy(postId);
    setCommentError((current) => ({ ...current, [postId]: '' }));
    try {
      await createPostComment(postId, body);
      const rows = await getPostComments(postId);
      setComments((current) => ({ ...current, [postId]: rows }));
      setDrafts((current) => ({ ...current, [postId]: '' }));
      setPosts((current) => current.map((post) =>
        post.post_id === postId ? { ...post, comment_count: rows.length } : post,
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Your comment could not be posted.';
      setCommentError((current) => ({ ...current, [postId]: message }));
    } finally {
      setCommentBusy(null);
    }
  };

  return <Screen>
    <Heading eyebrow="CRUSH SOCIAL" title="Reels" subtitle="Browse public posts from the campus community." />

    <View style={s.section}>
      <Text style={s.sectionTitle}>Community feed</Text>
      {feedLoading ? <ActivityIndicator color={colors.pink} /> : null}
      {!feedLoading && feedError ? <Text style={s.note}>{feedError}</Text> : null}
      {!feedLoading && !feedError && posts.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>The feed is getting ready.</Text>
          <Text style={s.note}>There are no published community posts yet. Check back soon.</Text>
        </View>
      ) : null}
      {posts.map((post) => <View key={post.post_id} style={s.post}>
        <Text style={s.creator}>{post.author_name}</Text>
        <Text style={s.postBody}>{post.body}</Text>
        <Text style={s.postMeta}>{new Date(post.created_at).toLocaleDateString()} · {post.comment_count} comments</Text>
        <Pressable accessibilityRole="button" onPress={() => openComments(post.post_id)} style={s.commentButton}>
          <Text style={s.commentText}>{session ? 'View / add comments' : 'Sign in to comment'}</Text>
        </Pressable>
        {openPost === post.post_id ? <View style={s.commentPanel}>
          {(comments[post.post_id] ?? []).map((comment) => <View key={comment.comment_id} style={s.comment}>
            <Text style={s.commentAuthor}>{comment.author_name}</Text>
            <Text style={s.commentBody}>{comment.body}</Text>
          </View>)}
          {comments[post.post_id]?.length === 0 ? <Text style={s.note}>No comments yet. Start the conversation.</Text> : null}
          <TextInput
            accessibilityLabel="Write a comment"
            value={drafts[post.post_id] ?? ''}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [post.post_id]: value.slice(0, 1000) }))}
            placeholder="Write a comment…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            style={s.input}
          />
          <Pressable accessibilityRole="button" disabled={commentBusy === post.post_id || !(drafts[post.post_id] ?? '').trim()} onPress={() => submitComment(post.post_id)} style={s.sendButton}>
            <Text style={s.sendText}>{commentBusy === post.post_id ? 'Posting…' : 'Post comment'}</Text>
          </Pressable>
          {commentError[post.post_id] ? <Text style={s.error}>{commentError[post.post_id]}</Text> : null}
        </View> : null}
      </View>)}
    </View>

    <Text style={s.sectionTitle}>Reels preview</Text>
    {demoVideos.map((v) => <View key={v.id} style={s.video}>
      <Text style={{ fontSize: 64 }}>{v.emoji}</Text>
      <Text style={s.creator}>{v.creator}</Text>
      <Text style={s.caption}>{v.caption}</Text>
      <Text style={s.category}>{v.category} · Demo preview</Text>
    </View>)}

    {!session ? <View style={s.guestBox}>
      <Text style={s.guestTitle}>Enjoying CRUSH?</Text>
      <Text style={s.note}>Browse public content freely. Sign in when you want to comment or access member features.</Text>
      <Pressable accessibilityRole="button" style={s.joinButton} onPress={() => router.push('/(auth)/register')}>
        <Text style={s.joinText}>Create account</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')}>
        <Text style={s.loginText}>Already a member? Sign in</Text>
      </Pressable>
    </View> : null}
    <Text style={s.note}>Demo reels are samples, not real student uploads. Comments require sign-in plus completed age and UNESWA student verification. Public uploads and moderation tools are still being developed.</Text>
  </Screen>;
}

const s = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.black },
  empty: { backgroundColor: colors.blush, borderRadius: 16, padding: 18, gap: 6 },
  emptyTitle: { color: colors.black, fontSize: 16, fontWeight: '900' },
  post: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  creator: { color: colors.black, fontWeight: '900', fontSize: 16 },
  postBody: { color: colors.black, fontSize: 16, lineHeight: 23 },
  postMeta: { color: colors.muted, fontSize: 11 },
  commentButton: { backgroundColor: colors.blush, padding: 11, borderRadius: 12, alignItems: 'center' },
  commentText: { color: colors.pink, fontWeight: '900' },
  commentPanel: { gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  comment: { backgroundColor: colors.background, padding: 10, borderRadius: 10, gap: 3 },
  commentAuthor: { color: colors.black, fontWeight: '800', fontSize: 12 },
  commentBody: { color: colors.black, fontSize: 14 },
  input: { minHeight: 72, maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.black, textAlignVertical: 'top' },
  sendButton: { backgroundColor: colors.pink, padding: 12, borderRadius: 12, alignItems: 'center' },
  sendText: { color: colors.white, fontWeight: '900' },
  error: { color: '#B42318', fontSize: 12 },
  guestBox: { backgroundColor: colors.blush, borderRadius: 18, padding: 18, gap: 10, marginVertical: 14 },
  guestTitle: { fontSize: 18, fontWeight: '900', color: colors.black },
  joinButton: { backgroundColor: colors.pink, padding: 14, borderRadius: 12, alignItems: 'center' },
  joinText: { color: colors.white, fontWeight: '900' },
  loginText: { color: colors.pink, fontWeight: '900', textAlign: 'center', padding: 8 },
  video: { height: 360, borderRadius: 22, backgroundColor: '#271522', alignItems: 'center', justifyContent: 'center', padding: 22, gap: 12 },
  caption: { color: colors.white, textAlign: 'center', fontSize: 16 },
  category: { color: '#F7B6D4', fontWeight: '700' },
  note: { fontSize: 11, color: colors.muted, lineHeight: 16 },
});
