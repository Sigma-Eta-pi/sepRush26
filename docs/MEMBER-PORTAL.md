# SEP member process

The whole platform is the existing chapter website’s authenticated `/dashboard`. Public navigation, login, onboarding, member profiles, process screens, and existing chapter tools now connect through the same application. The previous second dashboard shell was removed; old `/dashboard/process#...` bookmarks resolve to website dashboard routes. Its default pledge-master view emphasizes strike reports, makeup reviews, and progress across the class. Rush stays in the existing public recruitment area; a new application/interview/decision workflow has not been implemented in this change.

## Local preview

```sh
pnpm install
pnpm preview:process
```

Open `http://127.0.0.1:4317/login`, choose **Pledge master view**, and switch sample members from the top bar. With the private Notion import available, the preview opens as **Piam Parekh, pledge master**, with the 57 imported/website profiles: 39 actives including Piam and 18 Alpha pledges (702 required pairs). The earlier fictional workspace is backed up before this one-time migration. Without the import, the fallback remains 70 fictional profiles (55 actives and 15 pledges). The preview binds only to loopback, saves to ignored `.local-preview/workspace.json`, and never imports the production database. The demo endpoint does not exist in production. Chapter profile/contact details come from the import; process activity is explicitly fictional. This demo does not change real account roles or send messages.

The chapter directory defaults to photo cards using the website's existing roster, enriched with the private Notion import when present. The chapter demo uses the same member IDs across every process screen and the directory. Its activity includes 6 events, 4 deliverables, 31 submissions, 362 coffee records, 12 strikes, 6 makeup stages, and 4 questions. In production, cards use authenticated member profiles. Website headshots (face crops where available) are the default portraits; Notion portraits are the fallback and Notion cover photos remain headers. Explicitly edited photos override defaults.

Directory titles share the main website's `EXEC_BOARD` source in `client/src/data/chapter-roster.ts`, so leadership edits update both views. Existing full-name variants resolve to the same member. Founders without a current board position display **Founder**, not their historical executive title. These display titles do not change account permissions. Classes use the website's eight **Founder** and 31 **Founding** members; everyone outside those lists is **Alpha**, per the chapter's requested rule. Notion position/role fields are ignored. These class values are initial defaults; saved profile edits override them without changing access roles.

## Private Notion profile import

Run `python3 scripts/import-notion-members.py /path/to/downloaded-notion-html-export` to parse every exported member page and copy its original images plus resized JPEG versions into ignored `.private/member-import/`. The importer preserves populated properties and supplemental images, skips unnamed empty pages, records missing assets, and retains the previous imported JSON on a subsequent import. The raw source is kept locally for provenance; it is never bundled into the frontend.

The October 5 import contains 56 named profiles (38 marked Active and 18 marked Potential New Member in Notion), 56 phone numbers, 51 emails, 56 covers, and 57 image files. One unnamed empty page was skipped. Mariana França Pires was absent from the export; her existing website profile remains. The combined directory has 57 people: 8 Founder, 31 Founding, and 18 Alpha. Missing source fields stay empty.

Only authenticated members can request `/api/process/directory` and its `/assets/:file` images. Potential-new-member accounts and anonymous visitors cannot read these routes. The local loopback preview uses its sample-session login. Vite denies direct access to `.private` and `.local-preview`; `.private` is gitignored. Photos appear as the member's portrait overlapping their imported cover; profile dialogs include contact details, class, interests, and other populated properties. Matching live member accounts also receive these photos through the process API. Importing does not create accounts or assign permissions.

Production now reads private directory profiles and images from Neon (`member_directory_imports` and `member_directory_assets`), behind the same member authentication. Run `pnpm publish:directory` for an offline validation, then `pnpm publish:directory --apply` only after confirming the target database and backup. The tool uploads validated JPEGs before atomically publishing the directory, retains previous import snapshots, and does not create accounts or change roles. Local preview continues to read `.private/member-import`. Set `MEMBER_IMPORT_STORAGE=database` on the deployed host; production defaults to this. A persistent self-hosted filesystem can explicitly use `MEMBER_IMPORT_STORAGE=filesystem` and `MEMBER_IMPORT_DIR`. The private export and preview files are excluded by `.vercelignore`. No directory data has been uploaded yet.

## Role-focused home screens

Actives see five primary actions: report a strike, request a makeup task, approve coffee chats, view the calendar, and find member profiles. Their own pending chats and makeup tasks appear below. Pledge masters retain class-wide oversight. Pledges see their personal progress, deliverables, strikes, and questions.

Existing updates, chapter calendar, tasks, connections, alumni, resources, and account administration load inside the same dashboard navigation, with their existing permissions and data sources. These live chapter tools are clearly identified as unavailable in the fictional local preview.

## Working flows

- **Coffee chats:** Search actives, text using their profile contact, meet externally, log the actual date, get the matching active's confirmation. Masters can review the 55-by-15 completion grid or one pledge at a time. No in-app coffee scheduling.
- **Strikes:** Pledge masters issue strikes directly and see an 18-person class grid with outstanding points, makeup credit, review counts, and quick profile/strike controls. Actives report with context; masters approve or dismiss those reports. Pledges can submit a response for review. Only approved points count.
- **Makeups:** Actives offer their own tasks. Masters approve opportunities; a pledge links a claim to an outstanding strike. The owner verifies completed work and the master awards credit. Duplicate claims and excess assigned credit are rejected.
- **Calendar:** Chapter events, RSVP, deliverable deadlines, weekly/agenda views, calendar-file export. Masters can move events by dragging on desktop or edit their dates through the form on mobile.
- **Deliverables:** Master-created instructions and deadlines, pledge link submissions, review feedback and resubmission.
- **Questions:** Class questions and private questions to masters; replies and resolution.
- **Profiles:** Searchable photo-card directory, tap-to-open profile details, text/email shortcuts, and a tabbed profile editor for contact details, editable class tags, custom tags, supplemental details, portraits, and headers. Members edit themselves; masters can edit pledges and remove/restore them while retaining process history. Removed accounts cannot authenticate until restored. Profile overrides are stored in `member_profile_edits`; changing a class or tag never grants permissions. New-member onboarding is a single page.

## Data and access

Real identities and profiles remain in existing `users` and `profiles` tables. The process document is stored in `member_process_state`; optimistic compare-and-swap retries validate concurrent changes before saving the document and audit entry together. Polling refreshes other members' views every 30 seconds and on window focus. Session roles are checked against the database on authenticated requests.

Only masters receive private class records and review history. Actives can see their own reports, their task evidence, coffee progress, and aggregate deliverable completion. Pledges receive their own strike records/submissions and permitted class questions. Phone numbers and birthdays were removed from unauthenticated profile responses.

The current release supports one current cohort. Roster roles determine coffee requirements. Historical multi-cohort archiving, calendar-provider sync, native notifications, and a native app are not included. The web layout and home-screen manifest are ready for mobile use; it requires an internet connection.

## Validation

Run `pnpm check`, `pnpm test:process`, and `pnpm build`. The 83 unit/route/rendered-view tests also cover direct master strikes, profile-edit ownership, rejected role changes, reversible pledge removal, and cross-section demo references. Tests cover Google-domain and nonce validation, exact roster linking, retired password paths, old session rejection, cross-origin mutations, process permissions, makeup credit, duplicate chats, and concurrent writes. Google verification is mocked in route tests; real Google and Neon production round-trips require the configuration in [GOOGLE-LOGIN-SETUP.md](./GOOGLE-LOGIN-SETUP.md).

Browser checks on the integrated local site: phone-sized overview and coffee lists have no horizontal page overflow; a strike dismissal saves and updates the queue; a pledge's logged chat remains pending until the matching active confirms, then the completed count updates.

The existing uncommitted Recruitment.tsx edits were preserved. No commits, pushes, external messages, or production mutations were performed.

See [ROLE-AUDIT.md](./ROLE-AUDIT.md) for the role/action matrix, verified fixes, browser checks, and production validation boundaries.
