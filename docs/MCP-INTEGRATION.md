# SEP assistant connection

The member platform now includes an authenticated Streamable HTTP MCP server at `/api/mcp`. It gives an assistant live platform context and validated actions, backed by the same process engine and database as the website.

## What “full context” means

The assistant starts with `sep_get_context`: connected identity and role, current chapter settings, rules, section counts, available tools, and explicitly unavailable sections. It then retrieves the records relevant to the request. It can page through the entire authorized dataset; it is not limited to the first screen or a copied summary.

- Current and archived members, account role, website executive title, class, tags, phone/email, profile text, supplemental details, and image references.
- Calendar events, dates, locations, descriptions and RSVPs.
- Coffee-chat pairs, pending confirmations, completed chats, missing active/pledge pairs and progress.
- Strike reports, issued/dismissed strikes, responses, review notes and balances.
- Makeup assignments, deadlines, completion evidence, owner verification and awarded credit.
- Deliverables, submissions, reviews and questions, including private questions for authorized users.
- Process settings, announcements and retained audit history.
- Existing chapter updates, chapter calendar, chapter tasks, document links, class records, and stored public website content in production. These chapter-tool records are unavailable to pledges. Legacy chapter-task permissions follow the website: exec/admin see all, other roles see assigned tasks.

`sep_list_records` and `sep_search` return `total` and `nextOffset`. `sep_get_member_context` joins a person's visible records; `sep_get_class_progress` computes current per-pledge progress. Record IDs remain stable across reads and writes. Context is refreshed on every call.

Images and externally linked documents are references, not automatically downloaded or parsed. Embedded profile images are summarized rather than sending base64 into the model's context. Static website copy that has no stored record, source code, Google/Notion account contents beyond imported records, passwords, tokens and environment variables are not exposed. Local preview clearly labels fictional process records and unavailable legacy sections.

## Supported updates

The server publishes role-specific tools for all 24 existing process actions: event creation/update/RSVP, coffee logging and confirmation, strikes and responses, makeup offers/assignment/claims/submissions/reviews, deliverables, questions and process settings. Profile editing and reversible pledge removal/restoration are also supported.

The assistant uses the exact same validation and permissions as the website. An active's strike remains a report; only a master issues directly. Assignment does not grant makeup credit. Roles cannot be changed through profile editing. Changing website source code, external messaging, account administration, and modifying legacy chapter-tool records are outside this tool set.

Each process mutation requires a UUID `requestId`. The receipt, state change and audit entry are committed together under optimistic concurrency. Reusing the same key and payload returns the original result; changing the payload with an existing key is rejected. Receipts persist in the process document and are not part of returned context. Profile edits set fields and archival sets a desired state, so retries are idempotent in effect; profile writes and their audit entries commit together in production.

## Connection and authentication

1. Complete [Google login setup](GOOGLE-LOGIN-SETUP.md) and configure the existing production database. Publish the imported private directory through the authenticated database-backed storage described in the portal setup.
2. Set `APP_ORIGIN` to the canonical HTTPS website origin and `MCP_ENABLED=true`. No new Google permissions, Google client secret, or shared chapter API key is needed.
3. Deploy the reviewed server, additive `mcp_auth_state` schema and `vercel.json` routes. Verify the staged API before promoting it to the public domain.
4. In the assistant's custom MCP connector settings, use `https://www.ucsbsep.com/api/mcp` if that is the configured canonical host. Exact client UI and feature availability depend on the assistant's plan. The current ChatGPT requirements are documented [here](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt); Claude's instructions are [here](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).
5. The client discovers the OAuth metadata and dynamically registers as a public PKCE client. Sign in using the UCSB Google flow or the explicitly permitted chapter executive account (`exec@ucsbsep.org`). Its existing administrator role includes pledge-master access; multiple individual pledge masters are also supported. SEP shows the requesting client, callback host, connected member and data access. Update permission is an unchecked opt-in. Declining returns an OAuth denial to the client.
6. Start by asking for a read-only class summary. For updates, request a concrete change and verify the changed record in the website. The host assistant may ask for action confirmation.

The Settings page includes a connection URL card. Local preview uses `http://localhost:4317/api/mcp`; cloud assistants cannot directly reach this laptop URL. The preview intentionally uses in-memory OAuth state; server restart requires reconnecting. It never becomes public automatically.

OAuth endpoints: `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource/api/mcp`, `/authorize`, `/register`, `/token`, `/revoke`, and `/api/mcp/consent`. Vercel rewrites forward these to the API. Authorization codes are single use and expire after one minute. Access tokens expire after one hour; refresh tokens rotate and grants expire after 30 days. Token/code hashes are stored rather than their raw values. Disconnecting via token revocation revokes the entire grant. Archiving a pledge revokes connections, and membership/role are checked again on every call. Production MCP is disabled unless explicitly enabled through configuration.

## Verification

Run `pnpm check`, `pnpm test:process`, and `pnpm build`.

Tests use synthetic members and an actual MCP SDK client over both in-memory and HTTP transports. They cover tool discovery, full roster pagination, member joins, private-question isolation, role and scope restrictions, profile edits, archive history, concurrent duplicate writes, live reads after writes, consent, PKCE, one-time codes, refresh rotation, token audiences, revocation, and removed-member denial. Production OAuth with real Google accounts and live ChatGPT/Claude accounts still requires configuration and deployment; local integration tests do not claim that external connection is complete.

## Connecting both assistants

Run `pnpm check:mcp https://www.ucsbsep.com` after deployment. This check verifies JSON OAuth discovery, the advertised authorization and token routes, the resource audience, GET/POST authentication challenges, and Google login configuration. It creates no clients, grants, tokens or chapter records. HTML fallback pages fail the check. It prints no secrets and makes no updates. For the local transport only, use `pnpm check:mcp http://localhost:4317`.

- **ChatGPT:** Follow the linked OpenAI developer-mode instructions for your plan/workspace. Add the HTTPS `/api/mcp` endpoint as a custom MCP app with OAuth, complete SEP sign-in and consent, and enable the app in your conversation. As checked October 12, 2026, OpenAI documents full read/write MCP for Business, Enterprise and Edu on the web; Pro is limited to read/fetch MCP. Workspace policies may require an administrator.
- **Claude:** Open Customize → Connectors → Add custom connector and use the same HTTPS endpoint. Choose OAuth sign-in and **Register automatically** for the OAuth client (this server implements dynamic registration, not URL-based client identities). Complete SEP sign-in and consent. Claude's remote connector must reach the deployed server. Anthropic currently documents availability across Free, Pro, Max, Team and Enterprise; Free permits one custom connector, and organization accounts may require an owner to add it.

For each client independently, ask “Who am I signed in as, what is my role, and how many current pledges are there?” Compare with the website. Only then enable write access if desired and test an explicitly requested update. An active's strike report must stay pending until a pledge master reviews it.

### Deployment checkpoint (2026-10-12)

The chapter account is now authenticated through an isolated CLI configuration at `/Users/piam/.config/vercel-sep`. Project inspection confirmed `sepexecs-projects/sep-rush26` (`prj_CBIRYS9VALmN2BAg4jqPUOO6qKCm`), which owns both public SEP domains. Production configuration now contains `APP_ORIGIN=https://www.ucsbsep.com` and `MCP_ENABLED=true`.

Production is live on `https://www.ucsbsep.com/api/mcp`. The verified deployment `sep-rush26-mbs529hih-sepexecs-projects.vercel.app` (`dpl_2VM1ZfeQAeVSvTdKNZnkFkxbZWKS`) was promoted on October 12, 2026 at approximately 7:54 PM Pacific. All seven canonical public checks pass: JSON OAuth metadata, advertised authorization/token routes, protected resource discovery, unauthenticated GET/POST denial, and Google client configuration. No commit or push was performed.

Google remains in Testing; this promotion did not remove the Google test-user restriction. The executive account is an enabled test user, and its Google sign-in against the real database has been verified. Wider Google access requires the separate publishing decision in the setup chat. SMS remains disabled while Voice verification is paused.

The local preview passes all six discovery, advertised OAuth route, and GET/POST authentication challenge checks. All 10 MCP-specific tests passed again after the hosted import fixes; the prior combined MCP/SMS run passed 29 tests. ChatGPT and Claude are **not connected yet**. Complete each assistant's OAuth consent and verify live identity/read/update separately; passing public endpoint checks does not establish an assistant connection. No shared API key bypass is configured.

### Claude consent repair (2026-10-12)

Fixed the browser-only `Use the SEP connection page.` rejection. The consent response previously used `Referrer-Policy: no-referrer`, which caused HTML form submissions to carry `Origin: null`. It now uses `same-origin`; exact-origin validation and the session-bound consent cookie remain enforced. Regression coverage rejects absent, null and foreign origins even with a valid cookie. A real browser reproduced the old failure and then completed PKCE plus an authenticated MCP context read for both read-only and explicitly enabled write scopes using fictional local data.

The fix is live in `dpl_GxN3TkZf5TaNCzUzsZbXmCNeUZ4a` (`sep-rush26-hfgeg0e5g-sepexecs-projects.vercel.app`). Typecheck, build, all 173 tests and all eight canonical public checks passed. Actual Claude reconnection still needs the user to restart the connection from Claude so the browser loads the corrected policy. Google publishing restrictions were not changed.

### Hosted callback repair (2026-10-12)

A follow-up real Claude attempt exposed a hosting-specific difference: Vercel's response helper defaults `res.redirect(url)` to HTTP 307, even though local Express defaults to 302. Production request logs confirmed the consent POST returned 307. This preserved POST to Claude's GET-only callback and caused `Method Not Allowed` before any token exchange.

Consent now explicitly sends `303 See Other` through status/Location/end, independent of response helpers. The page's CSP permits only itself and the validated registered callback origin, because Chromium also applies form-action to the redirected destination. Strict origin validation, consent cookies, exact registered redirect validation and PKCE remain enforced.

Tests now emulate Vercel's own response helper, and a browser follows a real redirect between two separate local origins before exchanging the code over HTTP and reading authenticated MCP context. All 174 tests, typecheck, build, and eight live public checks pass. The fix is live in `dpl_7wpecH7jmwp97xoRMRTG6AUGS4ED` (`sep-rush26-5h6k0fwia-sepexecs-projects.vercel.app`). Actual Claude reconnect confirmation is still separate from these checks.

Claude connection confirmed after the callback fix: the user reported “it worked.” Production logs show `/token` returning 200 followed by successful `/api/mcp` calls. Read-only inspection confirms a live Claude grant with `sep:read`. This connection can read authorized records; it has not granted `sep:write`, so updates are not yet enabled for this connection.


### Assignment and update access (October 12)

Masters can assign makeup tasks with `pledgeId` before a strike exists. Completed work without a linked strike is saved as `completed` (credit pending); it does not reduce any strike balance. A master can later review it with `strikeId` to apply credit to an approved strike belonging to that pledge, subject to the same reserved-credit limits as normal assignment.

For every valid OAuth request, including an explicit `sep:read` request, the signed-in member can choose the optional **Also allow updates permitted by my chapter role** checkbox. It remains unchecked by default. Leaving it unchecked grants read-only access. Checking it explicitly grants role-permitted updates even if the client initially requested only read access (OAuth 2.0 section 3.3); the token response reports the actual approved scopes. Existing grants and refresh tokens are never upgraded automatically. To enable updates in Claude, disconnect/reconnect the SEP connector and check that option before Connect. The token exchange must then return `sep:read sep:write`; only then will role-permitted write tools be listed.

Live verification after the explicit-scope consent fix: a new Claude access grant on October 12 at approximately 8:51 p.m. Pacific requested `sep:read`, was offered both scopes on the consent page, and was issued `sep:read sep:write` for the chapter admin account. Read-only database inspection confirmed the grant is active. This confirms update permission is enabled; no production strike was created for testing. The browser regression used fictional records and successfully called the strike write tool.
