# Portal motion and interface audit

October 5, 2026. Implemented and checked against the local SEP website and integrated member portal. No deployment, commit, or push.

## Reference research

Mobbin was used to inspect real product screenshots and a multi-step flow:

- [Linear workspace](https://mobbin.com/screens/212fda35-366e-4dc0-a1d1-3b679659d6ab): stable sidebar, compact page controls, structured information with restrained separators.
- [Linear assigned work](https://mobbin.com/screens/671d22cf-69d7-4289-886c-f4e2f288f058): simple selection tabs and predictable list alignment.
- [Slack profile panel](https://mobbin.com/screens/4d8b5d48-c3b7-4e45-9752-d483971c4bf2): profile photo, compact actions, and contact information beside the main workspace.
- [Notion property flow](https://mobbin.com/flows/bf3b6310-ab67-4eec-8634-45bdb84719c6): contextual editing with the underlying workspace preserved.

These screenshots informed layout decisions; they do not establish those products' animation timings. SEP's motion was implemented separately using the installed Framer Motion library and its [layout animation](https://motion.dev/docs/react-layout-animations) and [performance](https://motion.dev/docs/performance) guidance. No new animation dependency was installed.

## Implemented motion coverage

- A shared spring system for route entrances, selection indicators, dialogs, drawers, and content changes.
- Sidebar selection travels between destinations. Mobile quick navigation has the same behavior.
- Calendar, coffee, strike/makeup, question, deliverable, and profile-section controls use sliding selection indicators. Filter buttons retain immediate state changes.
- Routes replace content immediately with a brief entrance; there is no outgoing interactive page left behind and no wait before the next task becomes available.
- Forms retain native modal behavior and animate both opening and dismissal. Backdrop clicks distinguish the actual backdrop from empty padding. Closing dialogs cannot submit another action.
- Profiles open as a right drawer on desktop and a sheet on phones, preserving headers, official headshots, contact details, and edit permissions.
- Member filtering animates card positions. New cards fade in together, without a long stagger across the full roster.
- Deliverables reflow between list and grid; expanded submissions enter gently. Adjacent cards no longer stretch into empty panels.
- Calendar navigation and week/agenda changes transition as a surface; horizontal scrolling stays inside the weekly calendar.
- Coffee list/matrix and question list/detail transitions share the same short movement.
- Buttons have restrained press/hover feedback; touch users do not depend on hover.
- Progress changes animate with scale transforms. Notifications enter and leave with motion; their horizontal centering is independent of their animated transform.
- Login has a restrained entrance. Google configuration and domain restrictions are unchanged.

## Optimization and accessibility

- Transform and opacity are the motion primitives; no continuously animated blur, full-screen filters, pointer-following effects, or decorative loops.
- No permanent `will-change` layer promotion on 55 member cards or the 624 coffee cells. Grid measurements depend on filter/view changes rather than every background refresh.
- Coffee records are indexed once per state update. Matrix rendering and summary counts use the same unique pairs, with completed records taking precedence over duplicate pending history.
- Avatar images use native lazy loading and asynchronous decoding. Member photo cards retain their existing lazy image loading.
- Skeletons animate opacity only while loading. Reduced-motion CSS disables skeletons, transitions and backdrop animations; MotionConfig follows the user's OS preference, with explicit layout/entrance suppression where applicable.
- Native dialogs keep focus inside the modal and restore it after exit. Profile editor tabs support Left/Right/Home/End keyboard navigation.
- The mobile menu isolates the underlying page, traps Tab, closes with Escape, restores its trigger, and releases scrolling. Resizing to desktop closes the mobile menu state.
- Background polling pauses in hidden documents. Sequenced refreshes prevent an older read from overwriting the response to a newer update or role change.

## Iterative review and fixes

1. **Reference and implementation pass:** retained SEP navy/cream, existing page order, the simplified strike table, and the all-members default. Added shared motion rather than unrelated per-page effects.
2. **Desktop interaction pass:** inspected navigation, member cards/drawer, strike form dismissal, makeup tabs, coffee matrix, deliverable reflow/expansion, questions, settings and login. Corrected dialog focus restoration, toast transform/positioning interaction, and stretched deliverable cards.
3. **Phone pass (390 × 844):** checked strike table, menu, profile sheet, profile editor/photos section, calendar agenda/week/week navigation. Corrected menu focus timing and visibility transitions. Calendar width remained contained in its scroller rather than overflowing the document.
4. **Role pass:** exercised pledge-master, active and pledge views through the actual demo selector. The active sees Report a strike / Request a makeup / Approve chats; its strike form says reports require master review. The pledge sees their own progress. Restored Piam's pledge-master view.
5. **Clean server reload:** restarted the local preview to load server reliability changes, re-entered the master demo and checked directory filtering: Founder = 8, Everyone = 55. Existing two removed pledges stayed removed.

No chapter activity was created, approved, deleted, or reset during these visual checks. Role switching and directory filters do not change chapter records.

## Validation and limits

- TypeScript check, all 114 tests across 18 files, and production client/server build passed.
- Reliability findings and 17 added regression cases are described in [DATA-RELIABILITY-AUDIT.md](./DATA-RELIABILITY-AUDIT.md).
- The build still reports a large shared public-site entry chunk (about 544 kB minified / 164 kB gzip); the portal remains a separate lazy dashboard chunk (about 191 kB / 51 kB gzip). Further public-site bundle splitting is a separate optimization, not a measured animation-frame improvement.
- Browser interactions and screenshots verify rendering and behavior, not a guaranteed frame rate. No hardware frame-time trace, low-end physical-phone test, or OS-level reduced-motion emulation was available in this browser tool. Reduced-motion paths were reviewed in code.
- Google OAuth, production database behavior and remote ChatGPT/Claude connectivity remain unconfigured/unverified locally; motion work does not change those deployment requirements.
