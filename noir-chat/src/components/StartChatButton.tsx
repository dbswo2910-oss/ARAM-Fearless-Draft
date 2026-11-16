'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './client-api';

export default function StartChatButton({ characterId, label = '대화하기', className = 'btn btn-sm btn-primary' }: { characterId: string; label?: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const c = await api<{ id: string }>('/api/conversations', { body: { characterId } });
          router.push(`/chat/${c.id}`);
        } catch (e) {
          alert((e as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? '…' : label}
    </button>
  );
}
