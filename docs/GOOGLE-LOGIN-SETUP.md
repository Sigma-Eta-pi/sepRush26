# Activate Google login for UCSB SEP

The website code is ready locally. Google sign-in is not activated on the live site yet. The local `preview:process` command uses imported chapter profiles with fictional activity and cannot sign in real members. This guide applies to the real website server (`pnpm dev` or the Vercel deployment).

## 1. Create the Google Web client

Use the chapter-controlled Google Cloud project `UCSB SEP Member Platform` (`peak-castle-511502-i0`), created under `ucsbsep.org`. In **Google Auth Platform → Branding**, enter Sigma Eta Pi · UCSB, a chapter support email, and the chapter's actual homepage and published privacy-policy URL. Configure the audience to allow your UCSB users; a personal project's “Internal” audience would not automatically mean UCSB. While testing, add any test accounts requested by the Google console.

In **Clients → Create client → Web application**, add these **Authorized JavaScript origins**:

- `https://www.ucsbsep.com`
- `https://ucsbsep.com` only if it serves the app instead of redirecting to www
- `http://localhost`
- `http://localhost:3000` for local real-auth development

Add `.org` origins only if the chapter controls them and actually serves login there. Prefer redirecting all alternate domains to `https://www.ucsbsep.com` so members have one consistent session. Configure the actual staging origin if testing on a hosted preview.

This implementation uses the Google Identity Services JavaScript callback. It does **not** need a redirect URI or a client secret. Request only sign-in identity (openid, email, profile), not Gmail, Drive, or Calendar access. Copy the Web client ID ending in `.apps.googleusercontent.com`.

Google's [Web client setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) covers these configuration fields and origin requirements.

## 2. Configure the existing website host

Set these server environment variables on the Vercel project that actually serves `www.ucsbsep.com`:

```dotenv
DATABASE_URL=<the existing chapter Neon database connection>
GOOGLE_CLIENT_ID=<the Web client ID>
APP_ORIGIN=https://www.ucsbsep.com
```

The database connection must stay server-side. Do not put secrets into chat, source control, or `VITE_*` variables. This implementation no longer uses `JWT_SECRET` or password login. Keep unrelated existing deployment settings.

For local real-auth testing, use an isolated Neon development branch, set `APP_ORIGIN=http://localhost:3000`, and run `pnpm dev`. Visit `http://localhost:3000/login`. The sample preview on port 4317 deliberately does not use Google or the live database.

## 3. Confirm the roster before switching production login

Back up the database and review the current roster in the hosting/database console. New schema creation is additive; automatic account rewriting, account deletion, profile-photo clearing, and the old shared-password admin bootstrap were removed.

Before deployment, make sure **at least one authorized administrator has a rostered Google login**. Per chapter instruction, `exec@ucsbsep.org` is the only non-UCSB email allowed. Its verified Google Workspace hosted domain must be `ucsbsep.org`. The existing production account is already `admin`, which includes pledge-master oversight; its account ID and role are retained. No other `@ucsbsep.org` account is automatically allowed. Do not automatically promote every active or guess which person should own that account.

Use the existing member's user ID when correcting a roster email or assigning a role, so their profile and history remain connected. Check for duplicate emails ignoring case. The Google callback refuses ambiguous duplicates. If the Google account returns `name@umail.ucsb.edu`, register that exact address; the app accepts both domains but does not guess that two addresses belong to the same person.

After the first administrator signs in, use **Chapter tools → Admin** to add school addresses and assign roles:

| Role | Portal access |
|---|---|
| `pledge_master` | Full process oversight, schedule, deliverables, reports, makeup credit, private questions |
| `pledge` | Own work, chats, strikes, makeup claims, questions, member directory |
| `active` / `exec` | Own chat confirmation, strike reports, task offers and verification, class progress |
| `admin` | Process oversight plus existing chapter account administration |
| `pnm` | Applicant role; no new-member process access until explicitly promoted |

Existing site editor permissions remain separate. Chapter administrators control membership; merely having a school address does not grant member access. No invitations or emails are sent automatically by the new registration endpoint.

## 4. Deploy and verify real accounts

Deploy the reviewed changes to the actual chapter project after configuration. No commit, push, production deployment, or live database migration was performed during this implementation.

Verify the following using real test accounts before onboarding the class:

1. Public desktop and mobile navigation show **LOGIN**; Google is the only sign-in option.
2. A rostered `@ucsb.edu` account and a rostered `@umail.ucsb.edu` account both sign in. Confirm their existing name and profile are retained.
3. An unregistered school account, personal Gmail account, wrong-domain account, and expired credential cannot enter the member portal.
4. Pledge masters land at `/dashboard`, with review counts and the full class list. Actives and pledges see their respective views.
5. A pledge logs a chat; its active confirms it; both see the updated progress after refresh. A different active cannot confirm it.
6. A strike requires master review. An active's makeup verification does not award credit until master approval.
7. A private question and a pledge's submission are not visible to other pledges. Sign out invalidates the session.
8. Refresh works on mobile. A second browser/device sees saved process changes. The portal refreshes on window focus and every 30 seconds.

The server validates Google's signed ID token, its client audience, verified email, hosted-domain claim, and login nonce, then matches the existing member account. Sessions are random, stored hashed in Neon, and delivered in an HttpOnly cookie. Legacy password tokens are not accepted. See Google's [server token verification guide](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

If Google shows `origin_mismatch`, compare the browser origin with the exact authorized origin. If no Google button appears, check `/api/auth/config` for the client ID and allow `https://accounts.google.com/gsi/client` through any CSP. If a popup is blank, inspect the host's Cross-Origin-Opener-Policy; Google's setup guide documents the compatible popup policy. If UCSB blocks the app, a Workspace administrator may need to approve it.

Several individual UCSB accounts may hold `pledge_master` simultaneously. The executive login is not a limit of one pledge master. All logins still require verified Google identity, matching nonce, and exact roster membership; an email-domain match never grants a role.
