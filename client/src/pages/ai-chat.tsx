import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageCircle, Send, Bot, User, Plus, Trash2, Loader2, Paperclip, X, FileText, Download, Menu } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ChatConversation, ChatMessage } from "@shared/schema";

interface ConversationWithMessages {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

interface UploadedFile {
  attachmentId: string;
  fileName: string;
  extractedText: string;
}

export default function AIChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
  });

  // Fetch selected conversation with messages
  const { data: conversationData, isLoading: messagesLoading } = useQuery<ConversationWithMessages>({
    queryKey: ['/api/chat/conversations', selectedConversationId],
    enabled: !!selectedConversationId,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (): Promise<ChatConversation> => {
      const response = await apiRequest('POST', '/api/chat/conversations', { title: 'New Conversation' });
      return await response.json();
    },
    onSuccess: (newConversation: ChatConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversationId(newConversation.id);
      setIsSidebarOpen(false);
      toast({
        title: "New conversation created",
        description: "Start chatting with your AI assistant",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: any }) => {
      const response = await apiRequest('POST', `/api/chat/conversations/${conversationId}/messages`, content);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', variables.conversationId] });
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest('DELETE', `/api/chat/conversations/${conversationId}`);
      return await response.json();
    },
    onSuccess: (_, deletedId) => {
      const remaining = conversations.filter(c => c.id !== deletedId);
      if (remaining.length > 0 && selectedConversationId === deletedId) {
        setSelectedConversationId(remaining[0].id);
      } else if (remaining.length === 0) {
        setSelectedConversationId(null);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });
  
  // Upload file
  const uploadFileMutation = useMutation({
    mutationFn: async ({ conversationId, file }: { conversationId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/chat/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setUploadedFiles(prev => [...prev, {
        attachmentId: data.attachment.id,
        fileName: data.attachment.fileName,
        extractedText: data.extractedText,
      }]);
      toast({
        title: "File uploaded",
        description: `${data.attachment.fileName} has been uploaded and analyzed`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversationId) return;
    const messageToSend = inputMessage;
    const conversationId = selectedConversationId;
    const filesToSend = [...uploadedFiles];
    setInputMessage("");
    setUploadedFiles([]);
    
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: messageToSend,
      metadata: filesToSend.length > 0 ? { attachmentIds: filesToSend.map(f => f.attachmentId) } : {},
      createdAt: new Date(),
    };
    
    queryClient.setQueryData<ConversationWithMessages>(
      ['/api/chat/conversations', conversationId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, optimisticUserMessage],
        };
      }
    );
    
    const requestBody: any = { content: messageToSend };
    if (filesToSend.length > 0) {
      requestBody.attachmentIds = filesToSend.map(f => f.attachmentId);
      requestBody.attachmentTexts = filesToSend.map(f => ({
        fileName: f.fileName,
        extractedText: f.extractedText,
      }));
    }
    
    sendMessageMutation.mutate({ conversationId, content: requestBody });
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConversationId) return;
    
    const file = files[0];
    uploadFileMutation.mutate({ conversationId: selectedConversationId, file });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (attachmentId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.attachmentId !== attachmentId));
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversationMutation.mutate(conversationId);
    }
  };
  
  const handleExportPDF = () => {
    if (!selectedConversationId) return;
    window.open(`/api/chat/conversations/${selectedConversationId}/export-pdf`, '_blank');
  };

  const messages = conversationData?.messages || [];

  // Conversations sidebar component
  const ConversationsSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Conversations</h3>
          <Button
            size="sm"
            onClick={() => createConversationMutation.mutate()}
            disabled={createConversationMutation.isPending}
            data-testid="button-new-conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet.
            <br />
            Click + to start chatting!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer hover:bg-accent transition-colors group ${
                  selectedConversationId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => {
                  setSelectedConversationId(conv.id);
                  setIsSidebarOpen(false);
                }}
                data-testid={`conversation-${conv.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{conv.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    data-testid={`button-delete-${conv.id}`}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className={`bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 ${
      isMobile ? 'h-[calc(100vh-56px)]' : 'min-h-screen'
    }`}>
      <div className={isMobile ? '' : 'p-6 max-w-7xl mx-auto'}>
        {/* Header - Hidden on mobile */}
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Portfolio Assistant</h1>
            <p className="text-muted-foreground">
              Ask questions about your loans, bank exposures, and portfolio analytics
            </p>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${
          isMobile ? 'h-full' : 'h-[calc(100vh-200px)]'
        }`}>
          {/* Conversations Sidebar - Desktop */}
          {!isMobile && (
            <Card className="lg:col-span-1">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => createConversationMutation.mutate()}
                    disabled={createConversationMutation.isPending}
                    data-testid="button-new-conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No conversations yet.
                      <br />
                      Click + to start chatting!
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-4 cursor-pointer hover:bg-accent transition-colors group ${
                            selectedConversationId === conv.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedConversationId(conv.id)}
                          data-testid={`conversation-${conv.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{conv.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              data-testid={`button-delete-${conv.id}`}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Chat Area */}
          <Card className={`lg:col-span-3 flex flex-col ${
            isMobile ? 'h-full rounded-none border-0' : ''
          }`}>
            <CardHeader className={`border-b ${isMobile ? 'py-3 px-4' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid="button-menu">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-[280px]">
                        <ConversationsSidebar />
                      </SheetContent>
                    </Sheet>
                  )}
                  <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    <MessageCircle className="h-5 w-5 text-saudi" />
                    <span className="truncate">
                      {conversationData?.conversation.title || "Select a conversation"}
                    </span>
                  </CardTitle>
                </div>
                {selectedConversationId && messages.length > 0 && (
                  <Button
                    size={isMobile ? "icon" : "sm"}
                    variant="outline"
                    onClick={handleExportPDF}
                    data-testid="button-export-pdf"
                  >
                    <Download className={`h-4 w-4 ${!isMobile && 'mr-2'}`} />
                    {!isMobile && "Export PDF"}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className={`flex-1 ${isMobile ? 'p-3 pb-24' : 'p-4'}`}>
                {!selectedConversationId ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to AI Portfolio Assistant</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a new conversation to start chatting about your portfolio
                    </p>
                    <Button onClick={() => createConversationMutation.mutate()} data-testid="button-start-chat">
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                ) : messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-saudi text-white flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === "user"
                              ? "bg-saudi text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <span className="text-xs opacity-70 mt-2 block">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}

                    {sendMessageMutation.isPending && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-saudi text-white flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area - Fixed to bottom on mobile */}
              <div className={`border-t bg-background ${
                isMobile ? 'fixed bottom-0 left-0 right-0 p-3 safe-bottom' : 'p-4'
              }`}>
                {uploadedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div 
                        key={file.attachmentId} 
                        className="flex items-center justify-between gap-2 bg-muted px-3 py-2 rounded-md"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-saudi flex-shrink-0" />
                          <span className="text-sm truncate">{file.fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveFile(file.attachmentId)}
                          data-testid={`button-remove-file-${file.attachmentId}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.xlsx,.xls,.txt,.csv"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFileMutation.isPending || !selectedConversationId}
                    data-testid="button-attach-file"
                    title="Upload file (PDF, DOCX, XLSX, TXT, CSV)"
                    className={isMobile ? 'h-12 w-12' : ''}
                  >
                    {uploadFileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isMobile ? "Ask about your loans..." : "Ask about your loans, facilities, bank exposures..."}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={sendMessageMutation.isPending || !selectedConversationId}
                    data-testid="input-ai-chat"
                    className={`flex-1 ${isMobile ? 'h-12' : ''}`}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !inputMessage.trim() || !selectedConversationId}
                    data-testid="button-send-message"
                    className={isMobile ? 'h-12 w-12' : ''}
                    size={isMobile ? 'icon' : 'default'}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isMobile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Powered by DeepSeek AI • Analyzes your portfolio data only • Supports PDF, DOCX, XLSX, TXT, CSV
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Questions - Hidden on mobile */}
        {!isMobile && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Portfolio Questions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• What is my total exposure by bank?</li>
                  <li>• Show me my portfolio LTV ratio</li>
                  <li>• Which facilities have the highest utilization?</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Risk Analysis</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• What are my concentration risks?</li>
                  <li>• Am I under-secured on any facilities?</li>
                  <li>• Which banks am I most exposed to?</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Optimization</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• How can I optimize my facility mix?</li>
                  <li>• Show me cost savings opportunities</li>
                  <li>• Suggest better collateral allocation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
