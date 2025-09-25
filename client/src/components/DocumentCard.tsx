import { useState } from 'react';
import { Download, Eye, Trash2, FileText, Image, File, MoreVertical, Calendar, HardDrive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentCardProps {
  document: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: string;
    description?: string;
    uploadedAt: string;
    url: string;
    thumbnailUrl?: string;
  };
  onDownload: () => void;
  onPreview: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  showActions?: boolean;
  compact?: boolean;
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

export default function DocumentCard({
  document,
  onDownload,
  onPreview,
  onDelete,
  isDeleting = false,
  showActions = true,
  compact = false,
}: DocumentCardProps) {
  const [imageError, setImageError] = useState(false);

  const getFileIcon = (mimeType: string, size: 'sm' | 'lg' = 'lg') => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
    
    if (mimeType.startsWith('image/')) {
      return <Image className={`${iconSize} text-blue-500`} />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className={`${iconSize} text-red-500`} />;
    }
    return <File className={`${iconSize} text-gray-500`} />;
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

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
  };

  const isImage = document.mimeType.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';
  
  return (
    <Card className={`group hover:shadow-md transition-shadow ${compact ? 'p-3' : ''}`}>
      <CardContent className={compact ? 'p-0' : 'p-4'}>
        <div className="space-y-3">
          {/* Document Preview/Icon */}
          <div className="relative">
            <div 
              className={`
                ${compact ? 'h-16' : 'h-32'} bg-gray-50 dark:bg-gray-800 rounded-lg 
                flex items-center justify-center border-2 border-dashed border-gray-200 
                dark:border-gray-700 cursor-pointer hover:border-primary transition-colors
              `}
              onClick={onPreview}
            >
              {isImage && document.thumbnailUrl && !imageError ? (
                <img
                  src={document.thumbnailUrl}
                  alt={document.originalName}
                  className={`${compact ? 'h-14' : 'h-28'} object-cover rounded-lg`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center">
                  {getFileIcon(document.mimeType, compact ? 'sm' : 'lg')}
                  {!compact && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {document.mimeType.split('/')[1]?.toUpperCase()}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions Overlay */}
            {showActions && !compact && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" onClick={onPreview}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" onClick={onDownload}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`${compact ? 'text-sm' : 'text-base'} font-medium truncate`} title={document.originalName}>
                  {document.originalName}
                </h3>
                {document.description && !compact && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{document.description}</p>
                )}
              </div>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onPreview}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Category Badge */}
            <Badge variant="outline" className={compact ? 'text-xs' : 'text-sm'}>
              {getCategoryLabel(document.category)}
            </Badge>

            {/* File Metadata */}
            <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              <div className="flex items-center space-x-2">
                <HardDrive className="h-3 w-3" />
                <span>{formatFileSize(document.size)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(document.uploadedAt)}</span>
              </div>
            </div>

            {/* Quick Actions for Compact View */}
            {showActions && compact && (
              <div className="flex items-center space-x-1 pt-2">
                <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={onDownload} className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}