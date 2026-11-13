import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bookmark, Trash2, ArrowUpRight } from 'lucide-react';
import type { DocumentItem, ChatMessage } from '../types';
import { sendChatStreaming, fetchChatHistory, clearChatHistory } from '../lib/api';

interface ChatModuleProps {
  document: DocumentItem | null;
  onJumpToPage: (pageNumber: number) => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({ document, onJumpToPage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    if (document) {
      const loadHistory = async () => {
        try {
          const history = await fetchChatHistory(document.id);
          if (isMounted) {
            if (history && history.length > 0) {
              setMessages(history);
            } else {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: `Halo! Saya Asisten Akademis Konco-Sinauku. Dokumen **${document.filename}** (${document.page_count} halaman) telah siap dipelajari. Silakan tanyakan konsep, pembuktian rumus, atau materi apa pun yang ada pada dokumen ini.`,
                  citations: [],
                },
              ]);
            }
          }
        } catch (err) {
          console.error('Error fetching chat history:', err);
        }
      };
      loadHistory();
    } else {
      setMessages([]);
    }
    return () => {
      isMounted = false;
    };
  }, [document?.id]);

  const handleClearChat = async () => {
    if (!document) return;
    if (window.confirm('Bersihkan riwayat percakapan untuk materi ini?')) {
      await clearChatHistory(document.id);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru seputar dokumen **${document.filename}**.`,
          citations: [],
        },
      ]);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() || !document || isLoading) return;

    const userText = inputQuestion.trim();
    setInputQuestion('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    await sendChatStreaming(
      document.id,
      userText,
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      (citations) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, citations, isStreaming: false }
              : msg
          )
        );
        setIsLoading(false);
      },
      (errorMsg) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: `Terjadi kendala: ${errorMsg}`, isStreaming: false }
              : msg
          )
        );
        setIsLoading(false);
      }
    );
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[Halaman\s+\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[Halaman\s+(\d+)\]/);
      if (match) {
        const pageNum = parseInt(match[1]);
        return (
          <button
            key={i}
            onClick={() => onJumpToPage(pageNum)}
            className="hm-citation-tag"
            title={`Buka Halaman ${pageNum} di PDF`}
          >
            <Bookmark className="w-2.5 h-2.5 text-hm-accent" />
            <span>Hal {pageNum}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-hm-muted text-xs">
        Pilih materi terlebih dahulu untuk memulai sesi Tanya Jawab.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-hm-sheet">
      {/* Sub-bar Riwayat Chat */}
      <div className="px-4 py-2 bg-hm-paper-2 border-b border-hm-rule flex items-center justify-between text-xs text-hm-muted select-none">
        <span className="font-display font-semibold text-hm-ink text-[11px] truncate max-w-[200px]">
          Sesi Tanya Jawab ({messages.filter(m => m.id !== 'welcome').length} pesan)
        </span>
        {messages.filter(m => m.id !== 'welcome').length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 text-hm-muted hover:text-rose-700 transition-colors cursor-pointer text-[11px] font-medium"
            title="Bersihkan riwayat percakapan materi ini"
          >
            <Trash2 className="w-3 h-3" />
            <span>Bersihkan Chat</span>
          </button>
        )}
      </div>

      {/* Area Percakapan */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Monogram Badge */}
              <div
                className={`w-6 h-6 rounded-xs flex items-center justify-center shrink-0 text-[10px] font-mono font-bold select-none ${
                  isUser
                    ? 'bg-hm-accent text-hm-paper'
                    : 'bg-hm-ink text-hm-paper'
                }`}
              >
                {isUser ? 'U' : 'AI'}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[86%] rounded-sm p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-hm-ink text-hm-paper font-sans'
                    : 'bg-hm-paper border border-hm-rule text-hm-ink shadow-subtle'
                }`}
              >
                <div className={`whitespace-pre-wrap ${!isUser ? 'font-reading text-[14.5px] leading-[1.65]' : 'font-sans'}`}>
                  {renderMessageContent(msg.content)}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-hm-accent ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {/* Badge Sitasi Footer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-hm-rule flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-hm-muted font-mono uppercase tracking-wider">
                      Sumber Faktual:
                    </span>
                    {msg.citations.map((p) => (
                      <button
                        key={p}
                        onClick={() => onJumpToPage(p)}
                        className="hm-citation-tag"
                      >
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        <span>Halaman {p}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Intake Bench */}
      <div className="p-3 border-t border-hm-rule bg-hm-sheet">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Tanyakan materi (misal: 'Jelaskan konsep utama di Bab 1')..."
            className="flex-1 py-2 px-3 text-xs border border-hm-rule rounded-sm bg-hm-paper focus:bg-hm-sheet focus:border-hm-accent focus:outline-none disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="hm-btn-primary text-xs py-2 px-3 shrink-0 disabled:opacity-40"
            title="Kirim Pertanyaan"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
        <p className="text-[10px] font-mono text-hm-subtle mt-1.5 text-center">
          Pencarian semantik berdasar Cosine Distance pgvector · 100% didukung sitasi
        </p>
      </div>
    </div>
  );
};
