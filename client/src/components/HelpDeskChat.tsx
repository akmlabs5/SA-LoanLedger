import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';

export function HelpDeskChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAsk = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/help/chat', { 
        question 
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Help desk error:', error);
      setAnswer("I apologize, but I encountered an error. Please try again or contact support if the issue persists.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleNewQuestion = () => {
    setAnswer('');
    setInput('');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-testid="button-open-help-desk"
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 lg:hover:from-cyan-700 lg:hover:to-blue-700 text-white rounded-full shadow-lg lg:hover:shadow-xl transition-all duration-200 group active:scale-95 active:from-cyan-700 active:to-blue-700"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Help</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 left-6 z-50 w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden"
          data-testid="container-help-desk"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Help Desk</h3>
                <p className="text-xs text-cyan-100">Get answers instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {answer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewQuestion}
                  data-testid="button-new-question"
                  className="text-white lg:hover:bg-white/20 active:bg-white/20 h-8 px-2 text-xs"
                >
                  New Question
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-help-desk"
                className="text-white lg:hover:bg-white/20 active:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-4">
            {!answer && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    How can we help you?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask me anything about Morouna Loans features and how to use them.
                  </p>
                </div>
                <div className="space-y-2 w-full max-w-xs">
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">Popular questions:</p>
                  <button
                    onClick={() => setInput("How do I create a new loan?")}
                    data-testid="button-help-quick-1"
                    className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 lg:hover:bg-gray-200 dark:lg:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors"
                  >
                    "How do I create a new loan?"
                  </button>
                  <button
                    onClick={() => setInput("What is SIBOR and how is it calculated?")}
                    data-testid="button-help-quick-2"
                    className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 lg:hover:bg-gray-200 dark:lg:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors"
                  >
                    "What is SIBOR and how is it calculated?"
                  </button>
                  <button
                    onClick={() => setInput("Where can I find my loan reports?")}
                    data-testid="button-help-quick-3"
                    className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 lg:hover:bg-gray-200 dark:lg:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors"
                  >
                    "Where can I find my loan reports?"
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Answer Display */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                  </div>
                ) : answer ? (
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {answer}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={isLoading}
                data-testid="input-help-question"
                className="flex-1"
              />
              <Button
                onClick={handleAsk}
                disabled={!input.trim() || isLoading}
                size="icon"
                data-testid="button-send-help-question"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 lg:hover:from-cyan-700 lg:hover:to-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Each question gets a fresh answer - no conversation history
            </p>
          </div>
        </div>
      )}
    </>
  );
}
