import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import type { Conversation, Message } from './api';
import { fetchConversations, fetchMessages, sendMessage } from './api';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  
  const [sessionId, setSessionId] = useState<string>(() => {
    const savedSession = localStorage.getItem('sessionId');
    if (savedSession) {
      return savedSession;
    }
    
    let newSessionId;
    try {
      newSessionId = crypto.randomUUID();
    } catch (e) {
      newSessionId = 'session-' + Math.random().toString(36).substring(2, 15);
    }
    
    localStorage.setItem('sessionId', newSessionId);
    return newSessionId;
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Toggle theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [sessionId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConvId) {
      loadMessagesForConv(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  const loadConversations = async () => {
    const data = await fetchConversations(sessionId);
    setConversations(data);
    if (!currentConvId && data.length > 0) {
      setCurrentConvId(data[0].id);
    }
  };

  const loadMessagesForConv = async (cId: string) => {
    setIsLoading(true);
    const msgs = await fetchMessages(cId);
    setMessages(msgs);
    setIsLoading(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // Optimistic UI
    const pendingMsg: Message = {
      conversationId: currentConvId || '',
      role: 'user',
      content: inputValue
    };
    setMessages(prev => [...prev, pendingMsg]);
    setIsLoading(true);
    const sentValue = inputValue;
    setInputValue('');
    scrollToBottom();

    try {
      const data = await sendMessage(sessionId, currentConvId, "Seeker", sentValue);
      // The backend returns the new AI message and possibly the created conversationId mapping
      if (!currentConvId) {
        setCurrentConvId(data.conversationId);
        await loadConversations();
      }
      setMessages(prev => [...prev, {
        conversationId: data.conversationId,
        role: data.role,
        content: data.message
      }]);
    } catch (e) {
      console.error(e);
      // rollback could be implemented
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 600 }}>FountGPT</h2>
          <button className="new-chat-btn" onClick={startNewChat}>
            <span>+ New</span>
          </button>
        </div>
        
        <div className="conversation-list">
          {conversations.map(conv => (
            <button 
              key={conv.id} 
              className={`conversation-item ${conv.id === currentConvId ? 'active' : ''}`}
              onClick={() => setCurrentConvId(conv.id)}
            >
              {conv.title || "New Search for Truth"}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-area">
        <header className="chat-header">
          <button 
            className="theme-toggle" 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.6 }}>
              <h1 style={{ marginBottom: '1rem', fontWeight: 400, fontSize: '2rem' }}>Seek the Truth</h1>
              <p>What is it that you wish to know?</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="avatar assistant" style={{backgroundImage: 'url("https://cookie-run-kingdom.fandom.com/wiki/Shadow_Milk_Cookie")'}}>
                  🔮
                </div>
              )}
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
               <div className="avatar assistant">🔮</div>
               <div className="message-content" style={{ opacity: 0.5 }}>
                 Consulting the archives...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask the Fount of Knowledge..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              ↑
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
