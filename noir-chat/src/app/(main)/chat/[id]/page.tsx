import { requirePageAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ChatView from '@/components/ChatView';
import { getCharacter, getConversation, listConversations, listMessages } from '@/lib/repo';
import { getSettings } from '@/lib/settings';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAuth();
  const { id } = await params;
  const conversation = getConversation(id);
  if (!conversation) notFound();
  const character = getCharacter(conversation.character_id)!;
  const s = getSettings();
  return (
    <ChatView
      key={conversation.id}
      conversation={conversation}
      character={character}
      initialMessages={listMessages(id)}
      conversations={listConversations(character.id)}
      defaultModel={s.defaultModel}
      userName={s.userName}
    />
  );
}
