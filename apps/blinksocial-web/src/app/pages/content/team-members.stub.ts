// Stubbed team-member list used by post-detail's brief-step "Owner" select.
// Once a workspace-team service is wired the source moves there; this file
// exists only so the brief UI has a deterministic option set.
//
// IDs are kept in sync with the dev `mocks/data/**/content-items/*.json`
// owner values (`user-sarah`, `user-brett`, `user-mara`, `user-jordan`) so
// that an existing item's owner shows up as the selected option in the
// dropdown — otherwise the select silently falls back to "Select owner…"
// while item.owner is still populated, and ownerValid() looks green even
// though the user can't see who's assigned.
export interface TeamMemberStub {
  id: string;
  name: string;
  role: string;
}

export const TEAM_MEMBERS_STUB: readonly TeamMemberStub[] = [
  { id: 'user-sarah', name: 'Sarah Chen', role: 'Producer' },
  { id: 'user-brett', name: 'Brett Patel', role: 'Editor' },
  { id: 'user-mara', name: 'Mara Reyes', role: 'Designer' },
  { id: 'user-jordan', name: 'Jordan Hayes', role: 'Strategist' },
  { id: 'user-taylor', name: 'Taylor Brooks', role: 'Creative Lead' },
  { id: 'user-riley', name: 'Riley Park', role: 'Marketing' },
  { id: 'user-morgan', name: 'Morgan Cole', role: 'Operations' },
  { id: 'user-priya', name: 'Priya Shah', role: 'Approver' },
];
