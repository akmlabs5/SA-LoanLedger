import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = messages.concat(userMessage);
      
      const response = await apiRequest('POST', '/api/agent/chat', { 
        messages: apiMessages 
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Agent chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again or contact support if the issue persists."
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* Floating Button - Repositioned on mobile to avoid bottom tab bar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-testid="button-open-agent-chat"
          className={cn(
            "fixed z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg transition-all duration-200 group",
            isMobile 
              ? "bottom-24 right-4 active:from-green-700 active:to-emerald-700 active:scale-95" 
              : "bottom-6 right-6 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
          )}
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="font-medium hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {/* Chat Window - Repositioned on mobile to avoid bottom tab bar */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden",
            isMobile ? "bottom-24 right-4" : "bottom-6 right-6"
          )}
          data-testid="container-agent-chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Loan Assistant</h3>
                <p className="text-xs text-green-100">Powered by DeepSeek</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  data-testid="button-new-chat"
                  className={cn(
                    "text-white h-8 px-2",
                    isMobile ? "active:bg-white/20" : "hover:bg-white/20"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-agent-chat"
                className={cn(
                  "text-white h-8 w-8 p-0",
                  isMobile ? "active:bg-white/20" : "hover:bg-white/20"
                )}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    Hello! How can I help you today?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    I can help you manage loans, check balances, set reminders, and more.
                  </p>
                </div>
                <div className="space-y-2 w-full max-w-xs">
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">Try asking:</p>
                  <button
                    onClick={() => setInput("Show me all my active loans")}
                    data-testid="button-quick-action-1"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors",
                      isMobile 
                        ? "active:bg-gray-200 dark:active:bg-gray-700" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    "Show me all my active loans"
                  </button>
                  <button
                    onClick={() => setInput("What's my total debt?")}
                    data-testid="button-quick-action-2"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors",
                      isMobile 
                        ? "active:bg-gray-200 dark:active:bg-gray-700" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    "What's my total debt?"
                  </button>
                  <button
                    onClick={() => setInput("I took a 100K loan from Al Rajhi Bank today")}
                    data-testid="button-quick-action-3"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors",
                      isMobile 
                        ? "active:bg-gray-200 dark:active:bg-gray-700" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    "I took a 100K loan from Al Rajhi Bank today"
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    data-testid={`message-${message.role}-${index}`}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">You</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start" data-testid="loading-indicator">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                data-testid="input-agent-message"
                className="flex-1 bg-white dark:bg-gray-900"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                data-testid="button-send-message"
                className={cn(
                  "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
                  isMobile 
                    ? "active:from-green-700 active:to-emerald-700 active:scale-95" 
                    : "hover:from-green-700 hover:to-emerald-700"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
