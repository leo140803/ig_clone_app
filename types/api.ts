export type User = {
  id: number;
  username: string;
  name: string | null;
  bio?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  private?: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean; // akan ada kalau kita request user lain: scope = current_user
  follows_me?: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};