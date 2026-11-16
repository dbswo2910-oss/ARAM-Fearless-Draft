import { json } from '@/lib/api';
import { authed } from '@/lib/route';
import { stopGeneration } from '@/lib/generate';

export const POST = authed<{ id: string }>((_req, { id }) => json({ stopped: stopGeneration(id) }));
