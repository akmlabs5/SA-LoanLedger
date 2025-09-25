import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Filter, Download, Eye, Trash2, Edit, FileText, Image, File, Grid, List, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import DocumentCard from './DocumentCard';

interface DocumentListProps {
  entityType: 'bank' | 'loan' | 'facility' | 'collateral';
  entityId: string;
  showUpload?: boolean;
  className?: string;
}

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description?: string;
  entityType: string;
  entityId: string;
  uploadedAt: string;
  url: string;
  thumbnailUrl?: string;
}

const CATEGORY_LABELS = {
  general: 'General',
  agreement: 'Agreement',
  license: 'License',
  contact: 'Contact Information',
  terms: 'Terms & Conditions',
  promissory_note: 'Promissory Note',
  financial_statement: 'Financial Statement',
  payment_schedule: 'Payment Schedule',
  correspondence: 'Correspondence',
  credit_agreement: 'Credit Agreement',
  facility_letter: 'Facility Letter',
  amendment: 'Amendment',
  compliance: 'Compliance Document',
  valuation: 'Valuation Report',
  insurance: 'Insurance Certificate',
  deed: 'Property Deed',
  appraisal: 'Appraisal Report',
  legal: 'Legal Document',
};

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
} as const;

export default function DocumentList({
  entityType,
  entityId,
  showUpload = true,
  className = '',
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<keyof typeof VIEW_MODES>('GRID');
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Use intersection observer to detect when component becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`document-list-${entityType}-${entityId}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [entityType, entityId]);

  // Fetch documents (only when visible)
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/attachments', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/attachments?ownerType=${entityType}&ownerId=${entityId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    },
    enabled: !!entityId && isVisible,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('DELETE', `/api/attachments/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attachments', entityType, entityId] });
      toast({
        title: 'Document deleted',
        description: 'The document has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Download document
  const downloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download the document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Preview document
  const previewDocument = (doc: Document) => {
    window.open(doc.url, '_blank');
  };

  // Handle document delete
  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         CATEGORY_LABELS[doc.category as keyof typeof CATEGORY_LABELS]?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc: Record<string, Document[]>, doc: Document) => {
    const category = doc.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});

  // Get unique categories from documents
  const availableCategories = [...new Set(documents.map((doc: Document) => doc.category))];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} id={`document-list-${entityType}-${entityId}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
            <Badge variant="secondary">{documents.length}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'GRID' ? 'LIST' : 'GRID')}
            >
              {viewMode === 'GRID' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Document Display */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {documents.length === 0 ? 'No documents uploaded' : 'No documents match your search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {documents.length === 0 
                ? 'Upload your first document to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {viewMode === 'GRID' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc: Document) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDownload={() => downloadDocument(doc)}
                      onPreview={() => previewDocument(doc)}
                      onDelete={() => handleDelete(doc.id)}
                      isDeleting={deleteDocumentMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc: Document) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(doc.mimeType)}
                          <div>
                            <p className="font-medium text-sm">{doc.originalName}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{formatDate(doc.uploadedAt)}</span>
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[doc.category as keyof typeof CATEGORY_LABELS] || doc.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => previewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => previewDocument(doc)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                  .slice(0, 6)
                  .map((doc: Document) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDownload={() => downloadDocument(doc)}
                      onPreview={() => previewDocument(doc)}
                      onDelete={() => handleDelete(doc.id)}
                      isDeleting={deleteDocumentMutation.isPending}
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="mt-6">
              <div className="space-y-6">
                {Object.entries(documentsByCategory).map(([category, docs]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium mb-3">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                      <Badge variant="secondary" className="ml-2">{docs.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map((doc: Document) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onDownload={() => downloadDocument(doc)}
                          onPreview={() => previewDocument(doc)}
                          onDelete={() => handleDelete(doc.id)}
                          isDeleting={deleteDocumentMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}