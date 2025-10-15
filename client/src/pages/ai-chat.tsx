import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageCircle, Send, Bot, User, Plus, Trash2, Loader2, Paperclip, X, FileText, Download, Menu, Save, BookmarkPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileHeader } from "@/components/mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

interface TempMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  metadata?: any;
}

export default function AIChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  
  // Temporary (unsaved) chat messages
  const [tempMessages, setTempMessages] = useState<TempMessage[]>([]);
  const [isInTempMode, setIsInTempMode] = useState(true); // Start in temp mode
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch all saved conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
  });

  // Fetch selected conversation with messages
  const { data: conversationData, isLoading: messagesLoading } = useQuery<ConversationWithMessages>({
    queryKey: ['/api/chat/conversations', selectedConversationId],
    enabled: !!selectedConversationId && !isInTempMode,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages, tempMessages]);

  // Start new temporary chat
  const handleStartNewTempChat = () => {
    setIsInTempMode(true);
    setSelectedConversationId(null);
    setTempMessages([]);
    setUploadedFiles([]);
    setIsSidebarOpen(false);
    toast({
      title: "New chat started",
      description: "Your chat is temporary. Click 'Save' to keep it.",
    });
  };

  // Switch to saved conversation
  const handleSelectConversation = (conversationId: string) => {
    setIsInTempMode(false);
    setSelectedConversationId(conversationId);
    setTempMessages([]);
    setIsSidebarOpen(false);
  };

  // Save temporary conversation
  const saveConversationMutation = useMutation({
    mutationFn: async ({ title, messages }: { title: string; messages: TempMessage[] }): Promise<ChatConversation> => {
      // Bulk save conversation with all messages in one request
      const response = await apiRequest('POST', '/api/chat/conversations/bulk-save', {
        title,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
      });
      return await response.json();
    },
    onSuccess: (savedConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setIsInTempMode(false);
      setSelectedConversationId(savedConversation.id);
      setTempMessages([]);
      setIsSaveDialogOpen(false);
      setSaveTitle("");
      toast({
        title: "Conversation saved",
        description: "You can access it anytime from the conversations list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    },
  });

  // Send message in temporary mode
  const sendTempMessageMutation = useMutation({
    mutationFn: async ({ content, updatedHistory }: { content: string; updatedHistory: TempMessage[] }) => {
      // Call AI API directly without saving to database
      // Include the full conversation history including the user's new message
      const response = await apiRequest('POST', '/api/ai/chat', { 
        message: content,
        conversationHistory: updatedHistory.map(m => ({ role: m.role, content: m.content }))
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Add assistant response to temp messages
      const assistantMessage: TempMessage = {
        id: `temp-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      };
      setTempMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  // Send message in saved conversation mode
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
      if (selectedConversationId === deletedId) {
        handleStartNewTempChat();
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
  
  // Upload file (only for saved conversations)
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
    if (!inputMessage.trim()) return;
    
    const messageToSend = inputMessage;
    setInputMessage("");

    if (isInTempMode) {
      // Add user message to temp messages
      const userMessage: TempMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: messageToSend,
        createdAt: new Date(),
      };
      const updatedHistory = [...tempMessages, userMessage];
      setTempMessages(updatedHistory);
      
      // Send to AI with the updated history that includes the user's new message
      sendTempMessageMutation.mutate({ content: messageToSend, updatedHistory });
    } else if (selectedConversationId) {
      // Saved conversation mode
      const conversationId = selectedConversationId;
      const filesToSend = [...uploadedFiles];
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
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConversationId || isInTempMode) return;
    
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

  const handleSaveConversation = () => {
    if (tempMessages.length === 0) {
      toast({
        title: "No messages to save",
        description: "Start chatting before saving",
        variant: "destructive",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your conversation",
        variant: "destructive",
      });
      return;
    }
    saveConversationMutation.mutate({ title: saveTitle, messages: tempMessages });
  };

  const messages = isInTempMode ? tempMessages : (conversationData?.messages || []);
  const isLoading = isInTempMode ? false : messagesLoading;

  // Conversations sidebar component
  const ConversationsSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saved Chats</h3>
          <Button
            size="sm"
            onClick={handleStartNewTempChat}
            data-testid="button-new-temp-chat"
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
            No saved chats yet.
            <br />
            Start chatting and save your conversation!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer active:bg-accent/70 lg:hover:bg-accent transition-colors group ${
                  selectedConversationId === conv.id && !isInTempMode ? "bg-accent" : ""
                }`}
                onClick={() => handleSelectConversation(conv.id)}
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
                    className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ml-2 active:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    data-testid={`button-delete-${conv.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
      isMobile ? 'h-screen flex flex-col' : 'min-h-screen'
    }`}>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="AI Assistant"
          rightAction={
            <>
              {isInTempMode && tempMessages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveConversation}
                  className="h-9 w-9 active:bg-accent/50 active:scale-95 mr-1"
                  data-testid="button-save-mobile"
                >
                  <Save className="h-5 w-5" />
                </Button>
              )}
              {!isInTempMode && selectedConversationId && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleExportPDF}
                  className="h-9 w-9 active:bg-accent/50 active:scale-95"
                  data-testid="button-export-pdf-mobile"
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}
            </>
          }
        />
      )}

      <div className={isMobile ? 'flex-1 flex flex-col overflow-hidden' : 'p-6 max-w-7xl mx-auto'}>
        {/* Header - Desktop only */}
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
          {/* Conversations Sidebar - Desktop only */}
          <Card className="lg:col-span-1 hidden lg:block">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Saved Chats</CardTitle>
                <Button
                  size="sm"
                  onClick={handleStartNewTempChat}
                  data-testid="button-new-temp-chat"
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
                      No saved chats yet.
                      <br />
                      Start chatting and save your conversation!
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-4 cursor-pointer active:bg-accent/70 transition-colors group ${
                            selectedConversationId === conv.id && !isInTempMode ? "bg-accent" : ""
                          }`}
                          onClick={() => handleSelectConversation(conv.id)}
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
                              className="h-8 w-8 p-0 ml-2 active:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              data-testid={`button-delete-${conv.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`lg:col-span-3 flex flex-col ${
            isMobile ? 'h-[calc(100vh-4rem)] rounded-none border-0' : ''
          }`}>
            {/* Desktop Header */}
            {!isMobile && (
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-saudi" />
                    <span className="truncate">
                      {isInTempMode ? (
                        <span className="flex items-center gap-2">
                          New Chat (Unsaved)
                          {tempMessages.length > 0 && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                              Not saved
                            </span>
                          )}
                        </span>
                      ) : (
                        conversationData?.conversation.title || "Loading..."
                      )}
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {isInTempMode && tempMessages.length > 0 && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveConversation}
                        data-testid="button-save-conversation"
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Save Chat
                      </Button>
                    )}
                    {!isInTempMode && selectedConversationId && messages.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportPDF}
                        data-testid="button-export-pdf"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            )}

            {/* Mobile: Conversations menu in sheet */}
            {isMobile && (
              <div className="border-b p-3 bg-background flex-shrink-0">
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 active:bg-accent/50 active:scale-95" 
                      data-testid="button-menu"
                    >
                      <Menu className="h-4 w-4" />
                      <span className="truncate">
                        {isInTempMode ? "New Chat (Unsaved)" : (conversationData?.conversation.title || "Select conversation")}
                      </span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[280px]">
                    <ConversationsSidebar />
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <CardContent className={`flex-1 flex flex-col p-0 ${isMobile ? 'overflow-hidden' : 'overflow-hidden'}`}>
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'}`} style={isMobile ? {
                maxHeight: 'calc(100vh - 4rem - 3.5rem - 5rem)', // viewport - bottom nav - header - input area
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              } : {}}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageCircle className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-muted-foreground mb-4`} />
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>Welcome to AI Portfolio Assistant</h3>
                    <p className={`${isMobile ? 'text-sm' : ''} text-muted-foreground mb-4`}>
                      Start chatting below. Your chat is temporary until you save it.
                    </p>
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
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-saudi text-white flex items-center justify-center flex-shrink-0`}>
                            <Bot className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </div>
                        )}
                        
                        <div
                          className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} rounded-lg px-4 py-3 ${
                            message.role === "user"
                              ? "bg-saudi text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className={`${isMobile ? 'text-base' : 'text-sm'} whitespace-pre-wrap`}>{message.content}</p>
                          <span className="text-xs opacity-70 mt-2 block">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>

                        {message.role === "user" && (
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
                            <User className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </div>
                        )}
                      </div>
                    ))}

                    {(sendMessageMutation.isPending || sendTempMessageMutation.isPending) && (
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
              </div>

              {/* Input Area - Sticky to bottom */}
              <div className={`border-t bg-background flex-shrink-0 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                {uploadedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div 
                        key={file.attachmentId} 
                        className="flex items-center justify-between gap-2 bg-muted px-3 py-2 rounded-md"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={() => handleRemoveFile(file.attachmentId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {!isInTempMode && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadFileMutation.isPending || !selectedConversationId}
                        className={isMobile ? 'h-12 w-12 active:bg-accent/50 active:scale-95' : ''}
                        data-testid="button-attach-file"
                      >
                        {uploadFileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about your loans, facilities, bank exposures..."
                    className={`flex-1 ${isMobile ? 'h-12 text-base' : ''}`}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending || sendTempMessageMutation.isPending}
                    className={isMobile ? 'h-12 w-12 active:bg-accent/50 active:scale-95' : ''}
                    data-testid="button-send"
                    size={isMobile ? "icon" : "default"}
                  >
                    <Send className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </Button>
                </div>
                {isInTempMode && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Your chat is temporary. Click "Save Chat" to keep it.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Powered by DeepSeek AI • Analyzes your portfolio data only • Supports PDF, DOCX, XLSX, TXT, CSV files
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Conversation Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Conversation</DialogTitle>
            <DialogDescription>
              Give your conversation a title to save it for later access
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Conversation Title</Label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Portfolio Review with AI"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmSave();
                  }
                }}
                data-testid="input-conversation-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false);
                setSaveTitle("");
              }}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saveConversationMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveConversationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
