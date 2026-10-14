# Google Voice → AI → SEP strike reports

The importer is implemented locally. Production relay configuration is partially prepared, with SMS still disabled. No chapter number, Gmail access, scheduled cloud job, AI credential or live deployment has been activated by this work. Synthetic tests and the explicit local demo pass; a real Google Voice notification must still pass the live verification below.

## How it works

1. An active texts the chapter's Google Voice number in ordinary language, for example: “Give Alex Example a strike for arriving 20 minutes late to today's meeting.”
2. Voice forwards the notification to the chapter Gmail. An Apps Script job checks candidate messages every five minutes.
3. The job signs its request to `/api/sms/ingest`. SEP verifies that signature, then verifies the email's Google DKIM signature and receiving mailbox before interpreting anything.
4. The authenticated Voice From address supplies the sender number. A pledge master must have independently verified and linked that number to a current active/master. Editable profile phone fields never grant reporting access.
5. Claude Haiku 4.5 extracts intent, the name as written, reason, date and optional points. The server matches exactly one current pledge and validates the fields. Missing points default to one. Missing dates, first-name-only matches, multiple reports, unclear meaning or unverified senders need manual clarification.
6. Valid reports enter the existing strike system as **reported**, including texts from masters. Their balance stays unchanged until a master approves them. Masters can dismiss reports through the same review screen.

The original decoded email text and AI proposal are retained in a master-only **Text reports** panel under **Strikes & makeups**. Successfully converted strikes appear in the usual strike views, progress and MCP reads. Raw MIME is verified transiently and is not stored in the process document. Failed authentication/unsupported email formats remain in Gmail under `sep-sms-attention`, rather than being treated as trusted chapter reports.

## What's included

- `server/sms`: signed relay authentication, cryptographic Voice email verification, bounded AI extraction, database-backed duplicate protection, processing leases, review/retry endpoints and verified-number management.
- `client/src/member-portal/components/TextReports.tsx`: master-only inbox, original text, clarification form, pending-strike approval/dismissal and verified-number controls.
- `scripts/google-voice/Code.gs` and `appsscript.json`: chapter-owned incoming-only Gmail job. No outgoing email or SMS methods.
- `.env.example`: disabled-by-default production configuration.
- Five SMS test files: service/role/concurrency/budget tests, real cryptographic signatures with synthetic DNS, HTTP relay tests, mocked provider request/response tests, and an executed Apps Script job with mocked Gmail/HTTP services.

## Google account setup

Google lists US **Voice Basic** at **$0/month**, with an existing mobile number required. Use the chapter-controlled Gmail selected by the user. Open [Google Voice](https://workspace.google.com/products/voice/), choose **Just for me → Basic**, select an available number and complete verification. Eligibility and number availability are determined by Google. Do not substitute a paid Workspace plan.

Google explicitly documents **Settings → Messages → Forward messages to email** in its [forwarding instructions](https://support.google.com/voice/answer/165221?co=GENIE.Platform%3DDesktop&hl=en). Enable it for the chapter account. [Apps Script](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers) provides the scheduled processing. Google prohibits automated outgoing calls/messages in its [Voice acceptable-use policy](https://www.google.com/googlevoice/program-policies.html?hl=en-US); this implementation processes incoming email only. These component capabilities do not constitute Google certification of this combined integration or guaranteed delivery.

## Server configuration

Use the confirmed live SEP project, with its production database and Google sign-in already configured. Keep all secrets out of source control, browser code and chat.

- `SMS_ENABLED=true` only when ready for the real-message test.
- `SMS_GMAIL_ADDRESS`: exact chapter Gmail address, lowercase.
- `SMS_VOICE_NUMBER`: the assigned number in `+1XXXXXXXXXX` format.
- `SMS_RELAY_SECRET`: a fresh random secret of at least 32 characters, copied into the chapter Apps Script properties below. Generate locally with a password manager or cryptographic random generator.
- `ANTHROPIC_API_KEY`: server-side Anthropic key with billing configured.
- `SMS_DAILY_AI_LIMIT=100`: global daily extraction-attempt cap, including retries. Allowed values 1–1000; resets at UTC midnight.

Use Node 22.19+ (the inspected Vercel project uses Node 24). Allow sufficient function duration for the 25-second AI timeout plus email verification/database access. No new SQL table is needed: inbox, verified bindings, receipts and budgets are stored in the existing process document under `sms` with optimistic concurrency. The report and handled receipt commit atomically.

## Install the chapter-owned Apps Script job

1. Sign into [Apps Script](https://script.google.com/) using the **same chapter Gmail** as Voice. Create a standalone project and paste `scripts/google-voice/Code.gs` into `Code.gs`.
2. Enable showing the manifest in Project Settings, then use the included `appsscript.json`. It enables the Gmail v1 advanced service. If a standard Cloud project is linked, also enable its Gmail API.
3. Set these **Script Properties** (not source-code constants): `SEP_ENDPOINT=https://www.ucsbsep.com/api/sms/ingest` using the actual canonical deployment, `SEP_RELAY_SECRET` matching the server secret, and `SEP_START_DATE=YYYY/MM/DD` for the first day of intended imports. Set that date to the day before the first test so the Gmail date filter includes it.
4. Review Google's authorization screen. The script needs Gmail read/label access, external requests to SEP and permission to manage its own timer. The manifest requests `gmail.modify` because the job labels individual messages; it does not send or delete mail. Install it only in the dedicated chapter mailbox.
5. Run `pollSepTexts` manually and complete the real-message test below before enabling recurring imports.
6. Run `installSepTextJob` once. It creates one five-minute trigger and avoids duplicate triggers. Run `stopSepTextJob` to stop it.

The job processes at most ten messages per run and stops starting new work after four minutes. It uses a script lock to prevent overlapping runs. Each Gmail message is labeled only after durable SEP acknowledgement, so a new text in an existing thread is not skipped. Delivery errors remain queued. Unsupported/authentication-failing emails get the `sep-sms-attention` label. Read Apps Script Executions for errors; source texts/secrets are never logged. `SEP_LAST_SUCCESS` records completion of the last poll, not proof that every received SMS reached Gmail.

## Reliability and cost

Receipts use the chapter mailbox plus the authenticated email Message-ID, preventing duplicates even when Gmail delivery is retried. Reservations cap concurrent paid calls and use a 90-second lease to recover after interruption. AI calls time out after 25 seconds, return at most 700 tokens and receive at most 6000 characters of email text. No full member directory, phone-number list or account credentials are sent to the model. After three unsuccessful extraction attempts, review manually; ordinary conversation remains in handled history and can be manually reconsidered.

[Haiku pricing](https://platform.claude.com/docs/en/about-claude/pricing) is $1/million input tokens and $5/million output tokens at verification time. A 2,000-input/200-output-token extraction is about $0.003, or $3 per 1,000 calls before retries and infrastructure costs. Actual token use must be measured after activation. Google consumer [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) include 20,000 email read/write operations/day, 20,000 URL Fetch calls/day and 90 minutes/day of trigger runtime. Forwarding/polling introduces variable delay; it is not an instant SMS webhook.

The notification adapter deliberately accepts only single-recipient, plain-text-compatible Voice notifications from `@txt.voice.google.com` with a full valid Google-domain DKIM signature covering identity/MIME headers. It rejects attachments and oversized messages. Voice's From-address encoding is not a stable public API: the parser accepts exactly one US/Canadian number token other than the chapter number. Unreadable sender numbers require adapter validation; never use AI to guess sender identity or weaken signature checks to make a message pass.

## Verification and rollout

Local: `pnpm check`, `pnpm test:process`, `pnpm build`. Open the pledge-master **Strikes & makeups → Text reports → Try a sample text** preview. This creates a visibly marked fictional pending report with simulated extraction, not a paid API call. Demo delivery is disabled externally.

Live, before inviting actives:

1. Independently confirm a test active's number and register it in **Verify a member's number**.
2. Have that active send one clearly marked test report with the pledge's full name, reason and “today.” Run one poll manually. Confirm Gmail receipt and then correct reporter, pledge and original text in SEP.
3. Confirm the pending report does not count in the balance. Approve or dismiss the test deliberately and verify the outcome.
4. Retry delivery of that same notification: no second strike or paid extraction. Send another text in the same thread: it must import separately.
5. Test a non-report, ambiguous name, unknown sender, and model outage; verify no guessed/approved strike and recoverable review states.
6. Inspect the actual authenticated notification format if it is quarantined. Update only the verified adapter assumptions and regression fixture. Synthetic cryptographic tests do not establish compatibility with Google's live email format.

The live Google/AI/SEP chain remains unverified until these steps succeed. This implementation has not sent any real member text to an AI provider, installed a Gmail job, purchased a number, deployed, committed or pushed code.

## Setup checkpoint — October 12, 2026

- Google Voice rejected the managed `exec@ucsbsep.org` account with “Your account isn't ready for Google Voice yet.” A Workspace Voice license is required for that account. The user subsequently selected `piamparekh17@gmail.com` for free Basic; Google confirms $0/month for that account. The user approved the Basic terms. Google selected `(424) 248-7775`, but signup is awaiting phone-code and government-ID verification before calling/texting can be enabled. The number is not yet confirmed active; no paid subscription was purchased.
- Verified Vercel target: `sepexecs-projects/sep-rush26`. `SMS_RELAY_SECRET` is set as a sensitive production variable, `SMS_DAILY_AI_LIMIT=100`, and `SMS_ENABLED=false`. The relay secret is retained only in ignored mode-600 `.private/sms-relay-secret.txt` for installation into the chapter's Script Properties; do not print it or paste it into chat.
- `SMS_GMAIL_ADDRESS=piamparekh17@gmail.com` is now configured per explicit user choice. The assigned number, Anthropic billing credential, authorized Apps Script installation, and real-message test are still outstanding. A secret and passing synthetic tests are not a working number or text importer.
- The website Google-login/deployment chat retains deployment ownership. These environment changes take effect only on a subsequent deployment. Activate SMS and the five-minute job only as part of the live verification sequence above.

Because the selected Voice owner is a personal Gmail account, Google’s relay authorization would cover read/label access to that mailbox. The code filters only Voice notifications, but the OAuth permission itself is broader. Review that consent before installing; do not silently authorize it.
