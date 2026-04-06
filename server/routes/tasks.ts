import { Router } from 'express';
import { nanoid } from 'nanoid';
import { sql } from '../db.js';
import { requireAuth, requireExec } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = req.user!;
  const isPrivileged = user.role === 'exec' || user.role === 'admin';

  const rows = isPrivileged
    ? await sql`
        SELECT t.*, p.name AS assigned_to_name, u.email AS assigned_to_email
        FROM tasks t
        LEFT JOIN profiles p ON p.user_id = t.assigned_to
        LEFT JOIN users u ON u.id = t.assigned_to
        ORDER BY t.created_at DESC
      `
    : await sql`
        SELECT t.*, p.name AS assigned_to_name, u.email AS assigned_to_email
        FROM tasks t
        LEFT JOIN profiles p ON p.user_id = t.assigned_to
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.assigned_to = ${user.id}
        ORDER BY t.created_at DESC
      `;

  res.json(rows.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    assignedTo: t.assigned_to,
    assignedToName: t.assigned_to_name || t.assigned_to_email || t.assigned_to,
    assignedBy: t.assigned_by,
    assignedByName: t.assigned_by_name,
    dueDate: t.due_date,
    status: t.status,
    createdAt: t.created_at,
  })));
});

router.post('/', requireExec, async (req, res) => {
  const { title, description, assignedTo, dueDate } = req.body;
  if (!title || !assignedTo) { res.status(400).json({ error: 'Title and assignedTo required' }); return; }

  const user = req.user!;
  const assignerRows = await sql`SELECT name FROM profiles WHERE user_id = ${user.id} LIMIT 1`;
  const assignerName = assignerRows[0]?.name || user.email;

  const id = nanoid();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO tasks (id, title, description, assigned_to, assigned_by, assigned_by_name, due_date, status, created_at)
    VALUES (${id}, ${title}, ${description || null}, ${assignedTo}, ${user.id}, ${assignerName}, ${dueDate || null}, 'pending', ${now})
  `;

  res.json({ id, title, description: description || null, assignedTo, assignedBy: user.id, assignedByName: assignerName, dueDate: dueDate || null, status: 'pending', createdAt: now });
});

router.put('/:id', requireAuth, async (req, res) => {
  const user = req.user!;
  const rows = await sql`SELECT * FROM tasks WHERE id = ${req.params.id} LIMIT 1`;
  if (rows.length === 0) { res.status(404).json({ error: 'Task not found' }); return; }
  const task = rows[0];

  if (user.role === 'active') {
    if (task.assigned_to !== user.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const { status } = req.body;
    if (!['pending', 'in_progress', 'done'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
    await sql`UPDATE tasks SET status = ${status} WHERE id = ${req.params.id}`;
    res.json({ ...task, status });
    return;
  }

  const { title, description, assignedTo, dueDate, status } = req.body;
  await sql`
    UPDATE tasks SET
      title = ${title ?? task.title},
      description = ${description ?? task.description},
      assigned_to = ${assignedTo ?? task.assigned_to},
      due_date = ${dueDate ?? task.due_date},
      status = ${status ?? task.status}
    WHERE id = ${req.params.id}
  `;

  const updated = await sql`SELECT * FROM tasks WHERE id = ${req.params.id} LIMIT 1`;
  const t = updated[0];
  res.json({ id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, assignedBy: t.assigned_by, assignedByName: t.assigned_by_name, dueDate: t.due_date, status: t.status, createdAt: t.created_at });
});

router.delete('/:id', requireExec, async (req, res) => {
  await sql`DELETE FROM tasks WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

export default router;
