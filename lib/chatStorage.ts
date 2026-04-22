import AsyncStorage from '@react-native-async-storage/async-storage';

const CHATS_KEY = '@voyage/chats';
const MAX_CHATS = 40;

export type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: any[];
};

export type StoredChat = {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export async function listChats(): Promise<StoredChat[]> {
  const raw = await AsyncStorage.getItem(CHATS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as StoredChat[];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function getChat(id: string): Promise<StoredChat | undefined> {
  const list = await listChats();
  return list.find((c) => c.id === id);
}

export async function saveChat(chat: StoredChat): Promise<void> {
  const list = await listChats();
  const idx = list.findIndex((c) => c.id === chat.id);
  if (idx >= 0) list[idx] = chat;
  else list.unshift(chat);
  const trimmed = list.slice(0, MAX_CHATS);
  await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(trimmed));
}

export async function deleteChat(id: string): Promise<void> {
  const list = await listChats();
  const next = list.filter((c) => c.id !== id);
  await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(next));
}

export function deriveChatTitle(messages: StoredChatMessage[]): string {
  for (const m of messages) {
    if (m.role !== 'user') continue;
    const firstText = (m.parts ?? []).find((p: any) => p.type === 'text');
    if (firstText?.text) {
      const s = String(firstText.text).trim();
      return s.length > 48 ? s.slice(0, 46) + '…' : s;
    }
  }
  return 'New chat';
}

export function newChatId(): string {
  return `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
