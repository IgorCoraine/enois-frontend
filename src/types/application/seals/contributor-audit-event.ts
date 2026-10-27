export type ContributorAuditEvent = {
  id: string;
  contributionId: string;
  actorUserId: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
};
