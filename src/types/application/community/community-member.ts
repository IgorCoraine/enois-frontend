export type CommunityMember = {
  /** null for anonymous viewers: the public list does not expose ids. */
  userId: string | null;
  username: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "MEMBER";
};
