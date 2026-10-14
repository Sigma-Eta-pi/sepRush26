# Member platform role and action audit

Date: October 5, 2026. Target: local integrated website at port 4317.

## Result

The core member-process views were audited across pledge master, active, and pledge roles using source review, rendered-view tests, API checks, and browser walkthroughs. TypeScript, all 83 tests, and the production build pass. The isolated audit browser reported no console errors. This is local validation, not a production readiness certification.

## Role contract

| Area / controls | Pledge master | Active | Pledge |
|---|---|---|---|
| Overview / navigation | Class progress, reviews, settings | Report strikes, offer tasks, confirm chats, calendar, people | Own progress, deadlines, strikes, questions |
| Issue / report strike | Issue immediately; review active reports | Submit report for review; no self-approval | No reporting controls |
| Strike grid / records / filters | Whole class; per-pledge grid and record filters | Own reports only | Own records only |
| Strike responses | Review, uphold or dismiss | Read responses on own reports | Respond to own approved strike once |
| Dismiss issued strike | Allowed with a reason; retain history | Denied | Denied |
| Offer / request makeup | Publish immediately | Propose own task for approval | Not available |
| Approve opportunity | Publish or reject proposal | Not available | Not available |
| Claim opportunity | Not available | Not available | Own eligible strike; enough unassigned credit; deadline not passed |
| Submit makeup | Not available | Not available | Own claimed task, including requested revisions |
| Review makeup | Review and award final credit | Verify own task only; cannot award final credit | No review controls |
| Coffee list / search / filters | Any pledge; class matrix | Own pairings with pledges | Own pairings with actives |
| Log coffee chat | Record a selected pledge/active pair | Record own completed chat | Request matching active's confirmation |
| Confirm / Not yet | Review pending pair | Only own pending pair | Cannot approve own log |
| Calendar week / agenda / date navigation / filters | Available | Available | Available |
| Calendar create / edit / drag | Allowed | Hidden and server denied | Hidden and server denied |
| Event availability | Manage event; view attendance totals | RSVP for self | RSVP for self |
| Export calendar | Chapter schedule and relevant deadlines | Schedule and relevant task deadlines | Schedule and own makeup deadlines |
| Deliverable list / grid | Create/edit, inspect submissions, review | Read instructions; no creation or review | Submit own work; view own feedback; revise when requested |
| Question search / tabs / detail | All class questions and private conversations | Public questions and own private questions via direct page | Public questions and own private questions |
| Ask / reply / resolve | Ask, reply, resolve/reopen | Ask; reply to own question only | Ask; reply to own question only |
| Directory / search / class filters / contact links | All members | All members | All members |
| Edit own profile | Allowed | Allowed | Allowed |
| Edit another profile | Pledges only | Denied | Denied |
| Remove / restore pledge | Reversible; retains history; removed account loses access | Denied | Denied |
| Edit class / tags / supplemental details / images | Own or managed pledge | Own | Own; does not change access role |
| Process settings | Save class dates, title, message | No settings controls; server denied | No settings controls; server denied |
| Chapter administration / website editor | Requires separate website admin/editor privileges | Requires separate privileges | Requires separate privileges |
| Demo role switch | Local preview only | Local preview only | Local preview only |

## Fixes applied

1. Masters issue strikes immediately, with class-grid shortcuts and preselected pledges. Actives still submit for review.
2. Added master dismissal of an issued strike with an explanation. Incomplete makeup work linked to a dismissed strike becomes “No longer needed,” without deleting history or awarding unnecessary credit.
3. Fixed the imported-member status filter that hid actual pledges from “Manage pledges.”
4. Removed archived pledges' chats, submissions, and makeup work from current totals/queues while retaining the source records. Blocked actions from archived actors.
5. Reporting actives can see makeup credit applied to their own report without seeing another task owner's private completion evidence.
6. Corrected master-specific wording for coffee pairs, makeup publication, strike shortcuts, and question responses. The welcome setting now appears in the pledge overview.
7. Replaced demo submission placeholder links with authenticated, readable sample-work pages. Other members cannot open someone else's sample submission.
8. Corrected demo activity-history actor references to actual member IDs and labeled imported email separately from real Google sign-in identity.
9. Prevented editing/saving a profile before its latest data finishes loading. Saved class and profile values override import defaults.
10. Prioritized website headshots, including face crops, while keeping Notion covers. Improved phone-sized profile spacing/tabs and removed unnecessary tab-strip vertical scrolling.

## Evidence and coverage

- `tests/role-audit.test.ts`: 39 permission/workflow checks, including every master-only process action, pledge-only actions, denied impersonation, ownership, private questions, review stages, archival, and credit visibility.
- `tests/role-views.test.ts`: 9 rendered-view checks verifying master/active/pledge controls for calendar, deliverables, coffee chats, profiles, and strikes.
- Existing process, profile, authentication, routing, roster, private-directory, and concurrent-write tests also pass (83 total).
- Live API checks: anonymous state/directory rejected; each role receives its own authenticated state/profile; active/pledge profile-management and settings writes denied; sample work opens for masters; pledge strikes stay scoped.
- Desktop browser: master and active primary navigation and actions inventoried; pledge calendar, coffee, deliverables, strikes, and profile paths inspected. Profile edits saved and persisted. Remove/restore was exercised with a demo pledge.
- Browser workflow: active report → master approval → master dismissal → zero additional pledge points. A clearly labeled dismissed QA record is retained.
- Browser workflow: pledge coffee log → pending → matching active's approval → removed from that active's approval queue. This record is labeled as demo QA activity.
- Mobile: 390px viewport, strike grid, profile editor, sticky save/cancel, all three editor tabs, and More/navigation checked. No horizontal page overflow in the measured strike screen. Viewport restored afterward.
- Existing user changes to Recruitment.tsx preserved. No commits, pushes, messages, or production mutations.

## Remaining validation boundaries

- Google OAuth and the production database are not configured in this preview. Real sign-in, production sessions/migrations, and deployed private-photo storage still need live verification after setup.
- Legacy chapter tools (updates, chapter tasks, resources, connections, alumni, and chapter administration) explicitly show their live-data requirement in the demo. Their production CRUD is not exercised by this local process audit.
- Text/email links were inspected as links; no messages were sent. Real Google consent, external social accounts, calendar-provider imports, and every device/browser combination were not exercised.
- The existing production bundle-size warning remains; build succeeds.
