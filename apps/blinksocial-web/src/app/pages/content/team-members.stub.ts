// Stubbed team-member list used by post-detail's brief-step "Owner" select.
// Once a workspace-team service is wired the source moves there; this file
// exists only so the brief UI has a deterministic option set.
export interface TeamMemberStub {
  id: string;
  name: string;
  role: string;
}

export const TEAM_MEMBERS_STUB: readonly TeamMemberStub[] = [
  { id: 'tm-amelia', name: 'Amelia Chen', role: 'Producer' },
  { id: 'tm-noah', name: 'Noah Patel', role: 'Editor' },
  { id: 'tm-sofia', name: 'Sofia Reyes', role: 'Designer' },
  { id: 'tm-jordan', name: 'Jordan Hayes', role: 'Strategist' },
  { id: 'tm-taylor', name: 'Taylor Brooks', role: 'Creative Lead' },
  { id: 'tm-riley', name: 'Riley Park', role: 'Marketing' },
  { id: 'tm-morgan', name: 'Morgan Cole', role: 'Operations' },
  { id: 'tm-priya', name: 'Priya Shah', role: 'Approver' },
];
