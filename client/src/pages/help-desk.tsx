import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export default function HelpDeskPage() {
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  const quickQuestions = [
    "How do I create a new loan?",
    "What is SIBOR and how is it calculated?",
    "Where can I find my loan reports?",
    "How do I set up daily alerts?",
    "What is LTV ratio and why is it important?",
    "How do I track bank concentration risk?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 mb-4">
            <HelpCircle className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3" data-testid="text-page-title">
            Help Desk
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="text-page-description">
            Get instant answers about Morouna Loans features and how to use them
          </p>
        </div>

        {/* Main Help Chat Card */}
        <Card className="mb-6 shadow-xl border-cyan-200 dark:border-cyan-800">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Powered Help Assistant
            </CardTitle>
            <CardDescription className="text-cyan-100">
              Ask any question - each gets a fresh, focused answer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Answer Display */}
            {isLoading || answer ? (
              <ScrollArea className="h-[400px] mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Finding the answer...</p>
                    </div>
                  </div>
                ) : answer ? (
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 rounded-lg p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {answer}
                      </div>
                    </div>
                  </div>
                ) : null}
              </ScrollArea>
            ) : (
              <div className="mb-6 text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ask a question below or choose from popular topics
                </p>
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about Morouna Loans..."
                  disabled={isLoading}
                  data-testid="input-help-question"
                  className="flex-1 h-12 text-base"
                />
                <Button
                  onClick={handleAsk}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  data-testid="button-send-help-question"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 lg:hover:from-cyan-700 lg:hover:to-blue-700 text-white px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Ask
                    </>
                  )}
                </Button>
              </div>
              
              {answer && (
                <Button
                  onClick={() => {
                    setAnswer('');
                    setInput('');
                    inputRef.current?.focus();
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-new-question"
                >
                  Ask Another Question
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        {!answer && !isLoading && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Popular Questions</CardTitle>
              <CardDescription>Click any question to get instant answers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    data-testid={`button-quick-question-${index}`}
                    className="text-left px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 lg:hover:from-cyan-100 lg:hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-lg transition-all duration-200 border border-cyan-200 dark:border-gray-600 lg:hover:border-cyan-400 dark:hover:border-cyan-600"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {question}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            💡 Tip: For executing actions like creating loans or analyzing data, use the{' '}
            <span className="font-semibold text-green-600 dark:text-green-400">AI Assistant</span>{' '}
            (green button at bottom right)
          </p>
        </div>
      </div>
    </div>
  );
}
