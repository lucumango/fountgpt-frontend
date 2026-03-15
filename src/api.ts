export const API_BASE = "http://localhost:8080/api/chat";

export interface Conversation {
  id: string;
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

export const fetchConversations = async (sessionId: string): Promise<Conversation[]> => {
  const res = await fetch(`${API_BASE}/conversations?sessionId=${sessionId}`);
  if (!res.ok) return [];
  return res.json();
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
  if (!res.ok) return [];
  return res.json();
};

export const sendMessage = async (
  sessionId: string,
  conversationId: string | null,
  displayName: string | null,
  message: string
) => {
  const res = await fetch(`${API_BASE}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      conversationId,
      displayName,
      message
    })
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
};
