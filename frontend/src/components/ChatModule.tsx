import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Bookmark } from 'lucide-react';
import type { DocumentItem, ChatMessage } from '../types';
import { sendChatStreaming } from '../lib/api';

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

  // Set greeting saat dokumen aktif berganti
  useEffect(() => {
    if (document) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Halo! Saya Asisten Akademis Konco-Sinauku. Dokumen **${document.filename}** (${document.page_count} halaman) telah siap dipelajari. Silakan tanyakan konsep, pembuktian rumus, atau materi apa pun yang ada pada dokumen ini.`,
          citations: [],
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [document?.id]);

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

  // Helper untuk merender tag [Halaman X] menjadi tombol yang bisa diklik
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
            className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs transition cursor-pointer border border-blue-300"
            title={`Buka Halaman ${pageNum} di PDF`}
          >
            <Bookmark className="w-3 h-3 text-blue-600" />
            <span>Halaman {pageNum}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 text-xs">
        Pilih materi terlebih dahulu untuk memulai sesi Tanya Jawab.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Area Obrolan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {renderMessageContent(msg.content)}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {/* Badge Sitasi Footer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">Validasi Sumber:</span>
                    {msg.citations.map((p) => (
                      <button
                        key={p}
                        onClick={() => onJumpToPage(p)}
                        className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold transition cursor-pointer"
                      >
                        📍 Halaman {p}
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

      {/* Input Pertanyaan */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Tanyakan materi (misal: 'Jelaskan konsep utama di Bab 1')..."
            className="flex-1 py-2.5 px-3.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer shrink-0 shadow-xs"
            title="Kirim Pertanyaan"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Jawaban diground secara ketat pada dokumen materi dan dilengkapi sitasi halaman.
        </p>
      </div>
    </div>
  );
};
