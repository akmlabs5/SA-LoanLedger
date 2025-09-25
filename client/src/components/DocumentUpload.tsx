import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  entityType: 'bank' | 'loan' | 'facility' | 'collateral';
  entityId: string;
  onUploadComplete?: (document: any) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  category?: string;
  description?: string;
}

const DOCUMENT_CATEGORIES = {
  bank: [
    { value: 'general', label: 'General' },
    { value: 'agreement', label: 'Banking Agreement' },
    { value: 'license', label: 'Banking License' },
    { value: 'contact', label: 'Contact Information' },
    { value: 'terms', label: 'Terms & Conditions' },
  ],
  loan: [
    { value: 'general', label: 'General' },
    { value: 'agreement', label: 'Loan Agreement' },
    { value: 'promissory_note', label: 'Promissory Note' },
    { value: 'financial_statement', label: 'Financial Statement' },
    { value: 'payment_schedule', label: 'Payment Schedule' },
    { value: 'correspondence', label: 'Correspondence' },
  ],
  facility: [
    { value: 'general', label: 'General' },
    { value: 'credit_agreement', label: 'Credit Agreement' },
    { value: 'facility_letter', label: 'Facility Letter' },
    { value: 'terms', label: 'Terms & Conditions' },
    { value: 'amendment', label: 'Amendment' },
    { value: 'compliance', label: 'Compliance Document' },
  ],
  collateral: [
    { value: 'general', label: 'General' },
    { value: 'valuation', label: 'Valuation Report' },
    { value: 'insurance', label: 'Insurance Certificate' },
    { value: 'deed', label: 'Property Deed' },
    { value: 'appraisal', label: 'Appraisal Report' },
    { value: 'legal', label: 'Legal Document' },
  ],
};

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png', 
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export default function DocumentUpload({
  entityType,
  entityId,
  onUploadComplete,
  maxFiles = 10,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  className = '',
}: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categories = DOCUMENT_CATEGORIES[entityType] || DOCUMENT_CATEGORIES.general;

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 25MB';
    }

    return null;
  };

  const createUploadFile = (file: File): UploadFile => ({
    file,
    id: Math.random().toString(36).substr(2, 9),
    progress: 0,
    status: 'pending',
    category: 'general',
    description: '',
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if we exceed max files
      if (uploadFiles.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Validate file
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = uploadFiles.some(uf => 
        uf.file.name === file.name && uf.file.size === file.size
      );
      if (isDuplicate) {
        errors.push(`${file.name}: File already selected`);
        continue;
      }

      newFiles.push(createUploadFile(file));
    }

    if (errors.length > 0) {
      toast({
        title: 'Upload Errors',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    if (newFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  }, [uploadFiles, maxFiles, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  const updateFileMetadata = (id: string, field: 'category' | 'description', value: string) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? { ...file, [field]: value } : file
    ));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      // Update status to uploading
      setUploadFiles(prev => prev.map(file => 
        file.id === uploadFile.id 
          ? { ...file, status: 'uploading', progress: 0 }
          : file
      ));

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('category', uploadFile.category || 'general');
      formData.append('description', uploadFile.description || '');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id && file.status === 'uploading'
            ? { ...file, progress: Math.min(file.progress + 10, 90) }
            : file
        ));
      }, 200);

      // Make the upload request
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update status to success
      setUploadFiles(prev => prev.map(file => 
        file.id === uploadFile.id 
          ? { ...file, status: 'success', progress: 100 }
          : file
      ));

      onUploadComplete?.(result);
      return true;

    } catch (error) {
      // Update status to error
      setUploadFiles(prev => prev.map(file => 
        file.id === uploadFile.id 
          ? { 
              ...file, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : file
      ));
      return false;
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter(file => file.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Please select files and configure their metadata first.',
        variant: 'destructive',
      });
      return;
    }

    // Check that all files have required metadata
    const filesWithoutCategory = pendingFiles.filter(file => !file.category);
    if (filesWithoutCategory.length > 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a category for all files before uploading.',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    for (const file of pendingFiles) {
      const success = await uploadFile(file);
      if (success) successCount++;
    }

    toast({
      title: successCount === pendingFiles.length ? 'Upload Complete' : 'Upload Finished',
      description: `${successCount} of ${pendingFiles.length} files uploaded successfully.`,
      variant: successCount === pendingFiles.length ? 'default' : 'destructive',
    });

    // Remove successful uploads after a delay
    setTimeout(() => {
      setUploadFiles(prev => prev.filter(file => file.status !== 'success'));
    }, 2000);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Documents</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary'
            }
          `}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Support for PDF, Word, Excel, Images up to 25MB
          </p>
          <Badge variant="secondary" className="mt-2">
            Max {maxFiles} files
          </Badge>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Selected Files ({uploadFiles.length})</h3>
              <Button
                onClick={uploadAllFiles}
                disabled={uploadFiles.every(f => f.status !== 'pending')}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload All Files
              </Button>
            </div>

            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <Card key={uploadFile.id} className="p-4">
                  <div className="space-y-3">
                    {/* File Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(uploadFile.file)}
                        <div>
                          <p className="font-medium text-sm">{uploadFile.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploadFile.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          disabled={uploadFile.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-2" />
                    )}

                    {/* Error Message */}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {uploadFile.error}
                      </p>
                    )}

                    {/* Metadata Form */}
                    {uploadFile.status === 'pending' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <Label htmlFor={`category-${uploadFile.id}`}>Category</Label>
                          <Select
                            value={uploadFile.category}
                            onValueChange={(value) => updateFileMetadata(uploadFile.id, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`description-${uploadFile.id}`}>Description (Optional)</Label>
                          <Input
                            id={`description-${uploadFile.id}`}
                            placeholder="Brief description..."
                            value={uploadFile.description}
                            onChange={(e) => updateFileMetadata(uploadFile.id, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}