# Data reliability audit

Date: 2026-10-05. Scope: process engine, optimistic storage, member import matching, MCP read/write consistency, current-class progress, and historical record invariants. This audit reads local demo data; it does not migrate, reset, or modify member records.

## Confirmed issues fixed

| Area | Previous behavior | Corrected behavior |
| --- | --- | --- |
| Imported identities | The first matching name could beat a later exact email match and attach another person's profile details. | A unique email match wins. Name fallback must also be unique; ambiguous matches leave the account's existing profile intact. Account role, ID, and login email remain authoritative. |
| Dates and deadlines | `Date.parse` accepted ambiguous local timestamps and normalized impossible dates, including February 30. A timezone-free MCP timestamp could acquire the hosting server's timezone. | Strict calendar validation; calendar events and task/deliverable deadlines require an ISO timestamp with explicit offset or `Z`. Date-only fields use real ISO calendar dates. The web action engine and MCP input schemas use the same validators. DST offsets are retained. |
| Expired makeup offers | An expired task could be created or approved as available, then fail only when claimed. | Creation and approval reject elapsed deadlines before publishing the task. |
| Makeup credit | Assignment reserved credit safely, but review assumed previously stored links/reservations were valid. Imported or historical inconsistent records could award excess credit or credit a different pledge's strike. | Reviews validate matching pledge ownership and available credit again before approval/verification. Concurrent assignments still reserve at most the strike's points. |
| Current role and archived access | Engine/snapshot callers could pass a stale actor object whose role no longer matched the supplied roster. | Both resolve the actor from the current supplied roster and reject removed users; permission checks use that canonical role. |
| Deliverable totals | Counting submission rows could count duplicate approvals or approvals for nonexistent deliverables. | Class progress and MCP progress count unique approved current deliverable IDs. Historical rows are retained. |
| MCP coffee totals | Historical duplicate completions, duplicate pending rows, and pending chats with removed actives could inflate totals. | Counts use unique current active IDs; completed pairs are excluded from pending counts. Full history remains readable by pledge masters. |

## Existing protections verified

- Process writes clone a document and use compare-and-swap. Contending changes are revalidated against fresh process state; no save is reported when all retries conflict.
- Concurrent logging of the same coffee pair commits once.
- Concurrent makeup assignments against a one-point strike commit only one reservation.
- MCP request receipts are saved atomically with actions. Retrying the same request ID cannot issue duplicate strikes; reusing it with a changed payload fails.
- MCP tools recheck current role/access at execution, and read-only connections do not expose write tools.
- Removing members retains historical records, while normal current-class snapshots omit their coffee/submission/makeup activity.
- Imported content cannot set the authenticated user's role or login identity.
- A dismissal cancels unfinished linked makeup work, while approved history remains available.
- Owner verification alone earns no strike credit; final pledge-master approval is required.

## Read-only local data inspection

The workspace contained 57 total member profiles, 55 current members, and 16 current pledges. Two existing removed members were preserved. The private import contained 56 profiles with unique import IDs.

| Collection | Records |
| --- | ---: |
| Events | 6 |
| Deliverables | 4 |
| Submissions | 31 |
| Coffee chats | 363 |
| Strikes | 13 |
| Makeups | 6 |
| Questions | 4 |

No duplicate record IDs, duplicate non-declined coffee pairs, missing member references, invalid makeup-to-strike pledge links, or overcommitted strike reservations were found. The demo remains fictional process activity attached to real profiles; this does not verify the factual accuracy of members' personal details or real-world completion claims.

## Validation

- `tests/data-reliability.test.ts`: 10 regression tests cover matching precedence/ambiguity, calendar validity, timezone ambiguity, stale roles, archived access, deduplicated deliverables, expired offers, invalid/excess makeup credit, and concurrent assignments.
- `tests/mcp-reliability.test.ts`: 2 integration tests exercise the actual in-memory MCP client/server protocol for historical counts and explicit DST offsets.
- `tests/progress-reliability.test.ts`: 5 browser-helper regression tests cover unique current coffee pairs, archived accounts, duplicate/orphan deliverable submissions, authorized class summaries, duplicate requirement IDs, and wrong-pledge credit.
- Existing makeup assignment expiry fixture now supplies the explicit timestamp required by the deadline contract.
- All 114 tests passed across 18 test files after the client-helper follow-up; TypeScript check passed.

## Remaining boundaries

- Google OAuth and the production PostgreSQL deployment are not configured in this local preview. Live SQL, real Google sessions, remote MCP client connectivity, backup/restore, and deployment failure modes were not exercised.
- Roster/profile edits and process actions live in separate storage operations. Process compare-and-swap serializes process writes, but it is not a database transaction spanning a simultaneous role/archive change and an already in-flight action. Immediate auth checks and retry checks reduce exposure; production should serialize authorization-sensitive membership changes with mutations if strict transactional revocation is required.
- Browser refresh behavior after an external MCP write is a client concern. This audit verifies that the next read returns committed records; it does not claim push notifications or live subscriptions.
- MCP mutation receipts are currently retained inside the process document without a retention policy. Audit history in the engine is capped at 2,000 entries. A long-running production deployment should move durable audit history and idempotency receipts to indexed tables with explicit retention guarantees.
- Shared profile fields use last-write-wins updates. There is no per-field optimistic version for two simultaneous editors changing the same profile field.
- Ambiguous imports are skipped instead of silently merged; a future import-review screen could surface these cases for a human decision.
- Client progress and strike-table helpers now defensively count unique current requirements and apply approved makeup only when it belongs to the same pledge as the strike. Five additional helper tests verify these calculations; visual rendering and live refresh remain the parent UI audit scope.

No commits, pushes, deployment, server restart, or demo data mutations were performed by this audit.
