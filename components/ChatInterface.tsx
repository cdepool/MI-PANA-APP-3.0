
import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { ChatMessage, UserRole } from '../types';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserRole: UserRole;
  title: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage, 
  currentUserRole,
  title
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 md:relative md:h-[500px] md:rounded-xl md:shadow-2xl md:border md:border-gray-200 dark:md:border-gray-700 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 bg-mipana-darkBlue text-white flex justify-between items-center shadow-md md:rounded-t-xl">
        <div>
          <h3 className="font-bold text-sm">Chat del Viaje</h3>
          <p className="text-xs text-gray-300">{title}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-800 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
             <p>Inicia la conversación con tu pana.</p>
             <p className="text-xs mt-1">Este chat es monitoreado por seguridad.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentUserRole;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-2 shadow-sm ${
                  isMe 
                    ? 'bg-mipana-mediumBlue text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-700 dark:text-white text-gray-800 rounded-tl-none'
                }`}>
                  {!isMe && <p className="text-[10px] font-bold opacity-70 mb-0.5">{msg.senderName}</p>}
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[9px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 md:rounded-b-xl">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mipana-mediumBlue text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="bg-mipana-mediumBlue hover:bg-cyan-600 disabled:opacity-50 text-white p-2 rounded-full shadow-sm transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
