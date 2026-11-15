import { supabase } from './supabase';

export type CommunityPost = {
  post_id: string;
  author_name: string;
  body: string;
  created_at: string;
  comment_count: number;
};

export type CommunityComment = {
  comment_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export async function getPublicFeed(): Promise<CommunityPost[]> {
  const { data, error } = await supabase.rpc('get_public_feed', { p_limit: 20, p_before: null });
  if (error) throw error;
  return (data ?? []) as CommunityPost[];
}

export async function getPostComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase.rpc('get_post_comments', { p_post_id: postId });
  if (error) throw error;
  return (data ?? []) as CommunityComment[];
}

export async function createPostComment(postId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('create_post_comment', {
    p_post_id: postId,
    p_body: body,
  });
  if (error) throw error;
}
