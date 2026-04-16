import { Router } from 'express';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { requireAdmin, requireExec } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendBlastEmail } from '../email.js';

const LI_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

async function fetchLinkedinPhoto(linkedinUrl: string): Promise<string | null> {
  const match = linkedinUrl.match(/linkedin\.com\/in\/([\w\-\.]+)/i);
  if (!match) return null;
  const slug = match[1].replace(/\/$/, '');
  if (!/^[\w\-\.]+$/.test(slug)) return null;
  try {
    const pageRes = await fetch(`https://www.linkedin.com/in/${slug}`, {
      headers: { 'User-Agent': LI_UA, 'Accept': 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await pageRes.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!m) return null;
    const imgRes = await fetch(m[1], {
      headers: { 'User-Agent': LI_UA, 'Referer': 'https://www.linkedin.com/' },
      signal: AbortSignal.timeout(8000),
    });
    if (!imgRes.ok) return null;
    const ct = imgRes.headers.get('content-type') || 'image/jpeg';
    const buf = await imgRes.arrayBuffer();
    return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
  } catch { return null; }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuote = false;
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') { field += ch; }
    }
    i++;
  }
  if (row.length > 0 || field) { row.push(field); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

const router = Router();

router.get('/users', requireAdmin, async (_req, res) => {
  const rows = await sql`
    SELECT u.id, u.email, u.role, u.is_editor, u.created_at, p.name AS profile_name, p.pledge_class
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at ASC
  `;
  res.json(rows.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    is_editor: u.is_editor === 1,
    createdAt: u.created_at,
    name: u.profile_name || null,
    pledgeClass: u.pledge_class || null,
  })));
});

// Update role/email/pledgeClass — no password field exposed to admin
router.put('/users/:id', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email, role, is_editor FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

  const { role, email, is_editor, pledgeClass } = req.body;
  const u = rows[0];

  if (req.user!.id === req.params.id && role && role !== u.role) {
    res.status(403).json({ error: 'Cannot change your own role' }); return;
  }
  if (role && !['active', 'exec', 'admin', 'pnm'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }
  if (email && email !== u.email) {
    const conflict = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${req.params.id} LIMIT 1`;
    if (conflict.length > 0) { res.status(409).json({ error: 'Email already in use' }); return; }
  }

  const newRole = role ?? u.role;
  const newEmail = email?.trim() || u.email;
  const newIsEditor = typeof is_editor === 'boolean' ? (is_editor ? 1 : 0) : (u.is_editor ?? 0);
  await sql`UPDATE users SET role = ${newRole}, email = ${newEmail}, is_editor = ${newIsEditor} WHERE id = ${req.params.id}`;

  let newPledgeClass: string | null | undefined;
  if (pledgeClass !== undefined) {
    newPledgeClass = pledgeClass?.trim() || null;
    await sql`UPDATE profiles SET pledge_class = ${newPledgeClass} WHERE user_id = ${req.params.id}`;
  }
  res.json({ id: u.id, email: newEmail, role: newRole, is_editor: newIsEditor === 1, pledgeClass: newPledgeClass });
});

// Send password reset email
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  const rows = await sql`SELECT id, email FROM users WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
  const user = rows[0];

  // Invalidate old tokens
  await sql`UPDATE password_reset_tokens SET used = 1 WHERE user_id = ${req.params.id} AND used = 0`;

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await sql`INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used) VALUES (${nanoid()}, ${req.params.id}, ${token}, ${expiresAt}, 0)`;

  try {
    await sendPasswordResetEmail(user.email, token);
    res.json({ success: true, message: `Password reset email sent to ${user.email}` });
  } catch (e: any) {
    console.error('Failed to send password reset email:', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user!.id) { res.status(403).json({ error: 'Cannot delete yourself' }); return; }
  await sql`DELETE FROM profiles WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM tasks WHERE assigned_to = ${req.params.id}`;
  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${req.params.id}`;
  await sql`DELETE FROM users WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

// Email blast — exec or admin
// recipient: 'actives' | 'pnms' | 'exec' | 'all' | 'individual'
// recipientId: userId (only when recipient === 'individual')
router.post('/email-blast', requireExec, async (req, res) => {
  const { subject, content, recipient = 'actives', recipientId } = req.body;
  if (!subject?.trim() || !content?.trim()) { res.status(400).json({ error: 'Subject and content required' }); return; }

  const user = req.user!;
  const senderRows = await sql`SELECT name FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  const senderName = senderRows[0]?.name || user.email;

  let rows: { email: string }[];
  if (recipient === 'individual') {
    if (!recipientId) { res.status(400).json({ error: 'recipientId required for individual send' }); return; }
    rows = await sql`SELECT email FROM users WHERE id = ${recipientId} LIMIT 1`;
  } else if (recipient === 'pnms') {
    rows = await sql`SELECT email FROM users WHERE role = 'pnm'`;
  } else if (recipient === 'exec') {
    rows = await sql`SELECT email FROM users WHERE role = 'exec'`;
  } else if (recipient === 'all') {
    rows = await sql`SELECT email FROM users WHERE role IN ('active', 'pnm', 'exec')`;
  } else {
    // default: actives
    rows = await sql`SELECT email FROM users WHERE role = 'active'`;
  }

  const emails = rows.map(r => r.email as string);
  if (emails.length === 0) { res.json({ success: true, sent: 0, message: 'No recipients found' }); return; }

  try {
    await sendBlastEmail(emails, subject.trim(), content.trim(), senderName);
    res.json({ success: true, sent: emails.length, message: `Email sent to ${emails.length} recipient${emails.length === 1 ? '' : 's'}` });
  } catch (e: any) {
    console.error('Blast email failed:', e);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Active members extracted from Notion CSV export (Status = Active only)
const NOTION_ACTIVE_MEMBERS = [
  { name: 'Piam Parekh',          email: 'jparekh@ucsb.edu',           birthday: '',                  pledgeClass: '',        hometown: 'Bay Area',                    instagram: 'cursorboy',           linkedin: 'https://www.linkedin.com/in/piamparekh',                          major: 'Mathematics',                                          phone: '5105098139' },
  { name: 'Sally Hu',             email: 'shu971@ucsb.edu',            birthday: 'October 17, 2007',  pledgeClass: '',        hometown: 'Alhambra',                    instagram: 'sa.llyhu',            linkedin: 'https://www.linkedin.com/in/sally-huu/',                          major: 'Economics',                                            phone: '626-554-9476' },
  { name: 'Saloni Singhal',       email: 'salonisinghal@ucsb.edu',     birthday: 'October 11, 2005',  pledgeClass: '',        hometown: 'Cupertino, CA',               instagram: '_saloni_s',           linkedin: 'www.linkedin.com/in/ssaloni-singhal',                             major: 'Accounting, Economics, Statistics and Data Science',   phone: '4088396173' },
  { name: 'Julia Jimenea',        email: 'juliajimenea@ucsb.edu',      birthday: 'July 13, 2006',     pledgeClass: 'Founder', hometown: 'Irvine, California',          instagram: 'juliajimenea',        linkedin: 'www.linkedin.com/in/julia-jimenea-b7725a246',                     major: 'Statistics and Data Science',                          phone: '7145992816' },
  { name: 'Stina Sfatcu',         email: 'sfatcu@ucsb.edu',            birthday: '',                  pledgeClass: '',        hometown: 'Orange County',               instagram: '',                    linkedin: 'https://www.linkedin.com/in/christina-sfatcu/',                   major: 'Statistics and Data Science',                          phone: '7142220611' },
  { name: 'Huy Nguyen',           email: 'huy_nguyen@ucsb.edu',        birthday: '',                  pledgeClass: '',        hometown: 'Ho Chi Minh City, VN',        instagram: '',                    linkedin: 'https://www.linkedin.com/in/huynguyen06/',                        major: 'Electrical Engineering',                               phone: '559 905 2116' },
  { name: 'Shiv Dutta',           email: 'shiv749@ucsb.edu',           birthday: 'December 3, 2005',  pledgeClass: '',        hometown: '',                            instagram: '',                    linkedin: 'https://www.linkedin.com/in/shiv-dutta/',                         major: 'Accounting, Economics, Statistics and Data Science',   phone: '(661)755-5155' },
  { name: 'Kate Heidenga',        email: 'kheidenga@ucsb.edu',         birthday: 'September 17, 2005',pledgeClass: '',        hometown: 'Boulder, CO',                 instagram: 'Kate_heidenga_',      linkedin: '',                                                                major: 'Biopsychology',                                        phone: '720-483-7101' },
  { name: 'Amaya Bratcher',       email: 'amayaabratcher@gmail.com',   birthday: 'November 8, 2006',  pledgeClass: '',        hometown: 'Hemet, California',           instagram: 'amayabratcher',       linkedin: 'www.linkedin.com/in/aabratcher',                                  major: 'Computer Science',                                     phone: '951-474-7499' },
  { name: 'Brooke Bradley',       email: 'bnbradley@ucsb.edu',         birthday: 'December 7, 2005',  pledgeClass: '',        hometown: 'Simi Valley',                 instagram: 'brookee.bradleyy',    linkedin: 'www.linkedin.com/in/brooke-bradley-562183395',                    major: 'Biology',                                              phone: '(805)-428-6985' },
  { name: 'Matthew Chang',        email: 'matthewchang011@gmail.com',  birthday: 'November 22, 2004', pledgeClass: '',        hometown: 'Lake Forest, California',     instagram: '',                    linkedin: 'www.linkedin.com/in/matthewzchang',                               major: 'Economics and Accounting',                             phone: '949-922-0678' },
  { name: 'Daysi Recinos',        email: 'drecinos@ucsb.edu',          birthday: 'June 24, 2002',     pledgeClass: '',        hometown: 'Paramount, California',       instagram: 'amore.daysi',         linkedin: 'http://linkedin.com/in/recinosd',                                 major: 'Accounting, Economics',                                phone: '5624401297' },
  { name: 'Ryan Nguyen',          email: 'r_nguyen@ucsb.edu',          birthday: 'November 4, 2005',  pledgeClass: 'Founding Class',hometown: 'Irvine, CA',                  instagram: 'rryan.nn',            linkedin: 'www.linkedin.com/in/ryannguyen224',                               major: 'Communication, Economics, TMP',                        phone: '949-462-4778' },
  { name: 'Nina Rossi',           email: 'ninarossi@ucsb.edu',         birthday: 'August 22, 2005',   pledgeClass: '',        hometown: 'Paris, France',               instagram: 'ninaross.i',          linkedin: '',                                                                major: 'Economics and Accounting, Political Science',          phone: '901-949-5176' },
  { name: 'Noah de la Rionda',    email: 'noahdelarionda@ucsb.edu',    birthday: 'July 17, 2005',     pledgeClass: '',        hometown: 'Thousand Oaks',               instagram: 'noahdelarionda',      linkedin: 'www.linkedin.com/in/noah-de-la-rionda-41a27b303',                 major: 'Economics',                                            phone: '8055010421' },
  { name: 'Preston Chung',        email: 'preston_chung@ucsb.edu',     birthday: 'October 23, 2005',  pledgeClass: 'Founding Class',hometown: 'Danville',                    instagram: 'preston_chung_',      linkedin: 'www.linkedin.com/in/prestonchung',                                major: 'Accounting, Economics',                                phone: '628-233-0820' },
  { name: 'Mariana Franca Pires', email: 'marianafrancapires@ucsb.edu',birthday: 'May 20, 2005',      pledgeClass: '',        hometown: 'Santa Cruz',                  instagram: '',                    linkedin: 'https://www.linkedin.com/in/mariana-franca-pires-33b001280/',     major: 'Communication',                                        phone: '(831) 428-6933' },
  { name: 'Kai Abutin',           email: 'kaiabutin@ucsb.edu',         birthday: 'July 16, 2007',     pledgeClass: '',        hometown: 'Camarillo, CA',               instagram: 'kaill0uu',            linkedin: 'www.linkedin.com/in/kai-abutin',                                  major: 'Electrical Engineering',                               phone: '8053122307' },
  { name: 'Om Kulkarni',          email: 'om77@ucsb.edu',              birthday: 'June 7, 2006',      pledgeClass: '',        hometown: 'Santa Clarita, California',   instagram: 'omskulk',             linkedin: 'https://www.linkedin.com/in/om77/',                               major: 'Computer Science',                                     phone: '(661) 229-6644' },
  { name: 'Vaibhava Sri Rajesh Khanna', email: 'vaibhavaraja@gmail.com', birthday: '',                pledgeClass: '',        hometown: '',                            instagram: '',                    linkedin: '',                                                                major: 'Communication',                                        phone: '9165309022' },
  { name: 'Jean Kalaw',           email: 'kalaw@ucsb.edu',             birthday: 'January 18, 2005',  pledgeClass: '',        hometown: '',                            instagram: 'jeankalaw0118',       linkedin: 'https://www.linkedin.com/in/jean-merrill-kalaw-716290361/',       major: 'Biopsychology',                                        phone: '6618039641' },
  { name: 'Luke Patterson',       email: 'lukepatterson@ucsb.edu',     birthday: 'November 11, 2006', pledgeClass: '',        hometown: 'Saunderstown, Rhode Island',  instagram: '',                    linkedin: 'https://www.linkedin.com/in/luke-patterson-b836aa373/',           major: 'Chemistry',                                            phone: '4012491105' },
  { name: 'Julio Bermudez',       email: '',                           birthday: 'November 21, 2004', pledgeClass: '',        hometown: '',                            instagram: '',                    linkedin: '',                                                                major: 'Economics',                                            phone: '8184053463' },
  { name: 'Rohan Kamdar',         email: 'rohankamdar@ucsb.edu',       birthday: 'March 30, 2005',    pledgeClass: '',        hometown: 'Tustin, CA',                  instagram: 'rohan_kamdar1',       linkedin: '',                                                                major: 'Financial Mathematics and Statistics',                 phone: '714-478-8291' },
  { name: 'Matthew Vasquez',      email: 'mrvasquez@ucsb.edu',         birthday: 'November 9, 2004',  pledgeClass: '',        hometown: 'Duarte, CA',                  instagram: 'matthewvsqz',         linkedin: 'https://www.linkedin.com/in/matthewrvasquez/',                    major: 'Economics',                                            phone: '6262722897' },
  { name: 'Kyra Chagarlamudi',    email: 'kchagarlamudi@ucsb.edu',     birthday: 'November 22, 2006', pledgeClass: '',        hometown: 'Dallas, TX',                  instagram: 'k.t.chagarlamudi',    linkedin: 'https://www.linkedin.com/in/kyra-chagarlamudi-54428138a/',        major: 'Economics',                                            phone: '2142180036' },
  { name: 'Madigan Escobar',      email: 'madigan@ucsb.edu',           birthday: 'July 4, 2007',      pledgeClass: '',        hometown: 'Palm Springs',                instagram: 'madiganesco',         linkedin: 'https://www.linkedin.com/in/madigan-escobar-b6b2b628b',          major: 'Accounting, Economics',                                phone: '7602856420' },
  { name: 'Nirvaan Patel',        email: 'nirvaan.patel@icloud.com',   birthday: 'September 8, 2006', pledgeClass: '',        hometown: 'Charleston, SC',              instagram: 'npatel_06',           linkedin: 'www.linkedin.com/in/nirvaan-patel',                               major: 'Economics',                                            phone: '8033519064' },
  { name: 'Jack Larson',          email: 'jacklarson@ucsb.edu',        birthday: 'January 28, 2005',  pledgeClass: '',        hometown: '',                            instagram: 'jjacklarson',         linkedin: 'http://linkedin.com/in/jacklarsonucsb',                           major: 'Economics',                                            phone: '7074838233' },
  { name: 'Henry Snow',           email: 'hhs@ucsb.edu',               birthday: '',                  pledgeClass: '',        hometown: 'Grand Rapids, Michigan',      instagram: 'henryhsnow',          linkedin: 'https://www.linkedin.com/in/henry-snow-787892381/',               major: 'Economics, TMP',                                       phone: '(616) 251-8383' },
  { name: 'Tyler Pintor',         email: '',                           birthday: 'August 16, 2007',   pledgeClass: '',        hometown: '',                            instagram: 'tyler.pintor',        linkedin: '',                                                                major: 'Accounting, Economics',                                phone: '925-854-7299' },
  { name: 'Ariana Tran',          email: 'arianatran@ucsb.edu',        birthday: 'October 1, 2006',   pledgeClass: '',        hometown: 'Fountain Valley, CA',         instagram: 'aaritran',            linkedin: 'https://www.linkedin.com/in/ariana-tran/',                        major: 'Economics and Accounting, TMP',                        phone: '7147974443' },
  { name: 'Samrita Sivakumar',    email: 'samrita@ucsb.edu',           birthday: 'August 21, 2006',   pledgeClass: '',        hometown: 'Mountain House, CA',          instagram: 'samrita._s',          linkedin: 'www.linkedin.com/in/samrita-sivakumar-40642626a',                 major: 'Economics, Political Science',                         phone: '408-747-9232' },
  { name: 'Clay Griffin',         email: 'claygriffin@ucsb.edu',       birthday: 'April 18, 2007',    pledgeClass: '',        hometown: 'Menlo Park, CA',              instagram: 'claygriffinn',        linkedin: 'www.linkedin.com/in/clay-griffin-aaa567363',                      major: 'Economics',                                            phone: '6505075545' },
  { name: 'Raiyan Khan',          email: 'raiyan@ucsb.edu',            birthday: 'February 7, 2006',  pledgeClass: '',        hometown: 'Aliso Viejo',                 instagram: 'rraiyankhann',        linkedin: 'https://www.linkedin.com/in/raiyankhan1/',                        major: 'Statistics and Data Science',                          phone: '9493017798' },
  { name: 'Aaron Ramirez',        email: 'aaronramirez@ucsb.edu',      birthday: '',                  pledgeClass: '',        hometown: 'Fullerton, CA',               instagram: 'aaron.ram11',         linkedin: 'https://www.linkedin.com/in/aaron-ramirez-2701a9207',             major: 'Accounting, Economics',                                phone: '7142967563' },
  { name: 'Savannah Rivera',      email: 'savannah_rivera@ucsb.edu',   birthday: 'April 13, 2007',    pledgeClass: '',        hometown: 'Oakdale, CA',                 instagram: 'savannah_rivera413',  linkedin: 'https://www.linkedin.com/in/savannah-rivera-6885bb3a9',          major: 'Communication, Financial Mathematics and Statistics',  phone: '(209)840-1377' },
  { name: 'Sudiksha Kaushika',    email: 'skaushik@ucsb.edu',          birthday: 'March 1, 2006',     pledgeClass: '',        hometown: 'Seattle, WA',                 instagram: 'sudikaushik',         linkedin: 'www.linkedin.com/in/sudikshakaushik',                             major: 'Accounting, Economics',                                phone: '9362428484' },
  { name: 'Deepthy Mukkara',      email: 'deepthymukkara@ucsb.edu',    birthday: 'July 10, 2006',     pledgeClass: '',        hometown: 'Mountain House, CA',          instagram: 'deepthymukkara_',     linkedin: 'www.linkedin.com/in/deepthymukkara',                              major: 'Financial Mathematics and Statistics, TMP',            phone: '4088191795' },
  { name: 'Katelyn Nguyen',       email: 'katelyntnguyen@ucsb.edu',    birthday: 'August 19, 2005',   pledgeClass: '',        hometown: 'Orange County, CA',           instagram: 'nguyenxkatelyn',      linkedin: 'https://www.linkedin.com/in/katelyn-nguyen-0l819/',               major: 'Communication',                                        phone: '7143915669' },
];

// One-time Notion data import — matches Active members by email (fallback: name), updates profile fields
router.post('/import-notion', requireAdmin, async (_req, res) => {
  try {
    const results: { name: string; status: string; fields?: string }[] = [];
    const now = new Date().toISOString();

    for (const m of NOTION_ACTIVE_MEMBERS) {
      const { name, email, birthday, pledgeClass, hometown, instagram, linkedin, major, phone } = m;

      let profileId: string | null = null;
      if (email) {
        const ur = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
        if (ur.length > 0) {
          const pr = await sql`SELECT id FROM profiles WHERE user_id = ${ur[0].id} LIMIT 1`;
          if (pr.length > 0) profileId = pr[0].id;
        }
      }
      if (!profileId) {
        const pr = await sql`SELECT id FROM profiles WHERE LOWER(TRIM(name)) = LOWER(${name}) LIMIT 1`;
        if (pr.length > 0) profileId = pr[0].id;
      }
      if (!profileId) { results.push({ name, status: 'not_found' }); continue; }

      const updated = ['name', phone && 'phone', linkedin && 'linkedin', instagram && 'instagram', hometown && 'hometown', major && 'major', birthday && 'birthday', pledgeClass && 'pledge_class'].filter(Boolean);

      await sql`
        UPDATE profiles SET
          name         = ${name},
          phone        = COALESCE(NULLIF(${phone}, ''), phone),
          linkedin     = COALESCE(NULLIF(${linkedin}, ''), linkedin),
          instagram    = COALESCE(NULLIF(${instagram}, ''), instagram),
          hometown     = COALESCE(NULLIF(${hometown}, ''), hometown),
          major        = COALESCE(NULLIF(${major}, ''), major),
          birthday     = COALESCE(NULLIF(${birthday}, ''), birthday),
          pledge_class = COALESCE(NULLIF(${pledgeClass}, ''), pledge_class),
          updated_at   = ${now}
        WHERE id = ${profileId}
      `;
      results.push({ name, status: 'updated', fields: updated.join(', ') || 'none' });
    }

    res.json({ success: true, total: NOTION_ACTIVE_MEMBERS.length, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk LinkedIn photo fetch — stores in linkedin_photo_url (separate from user-uploaded photo_url).
router.post('/fetch-linkedin-photos', requireAdmin, async (_req, res) => {
  try {
    const rows = await sql`
      SELECT p.id, p.linkedin FROM profiles p
      WHERE p.linkedin IS NOT NULL AND p.linkedin != ''
    `;

    const results: { id: string; linkedin: string; status: string }[] = [];
    const now = new Date().toISOString();

    await Promise.all(rows.map(async (r: any) => {
      const url = await fetchLinkedinPhoto(r.linkedin);
      if (url) {
        await sql`UPDATE profiles SET linkedin_photo_url = ${url}, updated_at = ${now} WHERE id = ${r.id}`;
        results.push({ id: r.id, linkedin: r.linkedin, status: 'fetched' });
      } else {
        results.push({ id: r.id, linkedin: r.linkedin, status: 'not_found' });
      }
    }));

    res.json({ success: true, total: rows.length, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
