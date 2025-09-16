'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Trash2,
  Eye,
  Grid3X3,
  List,
  Calendar,
  Filter,
} from 'lucide-react';
import { GeneratedImage, PaginationData } from '@/types/image-generation';
import { ImageDisplay, ImageDisplaySkeleton } from './ImageDisplay';
import { toast } from 'sonner';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onImageClick?: (image: GeneratedImage) => void;
  onDownload?: (image: GeneratedImage) => void;
  onDelete?: (imageId: string) => void;
  itemsPerPage?: number;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'prompt';

export function ImageGallery({
  images,
  onImageClick,
  onDownload,
  onDelete,
  itemsPerPage = 12,
  className = '',
}: ImageGalleryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort images
  const filteredImages = React.useMemo(() => {
    let filtered = images;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          img.prompt.toLowerCase().includes(query) ||
          (img.negative_prompt && img.negative_prompt.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'prompt':
          return a.prompt.localeCompare(b.prompt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [images, searchQuery, sortBy]);

  // Calculate pagination
  const pagination: PaginationData = React.useMemo(() => {
    const totalItems = filteredImages.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
    };
  }, [filteredImages.length, currentPage, itemsPerPage]);

  // Get current page images
  const currentImages = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredImages.slice(startIndex, endIndex);
  }, [filteredImages, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const handleSelectImage = (imageId: string, checked: boolean) => {
    const newSelected = new Set(selectedImages);
    if (checked) {
      newSelected.add(imageId);
    } else {
      newSelected.delete(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedImages(new Set(currentImages.map((img) => img.id)));
    } else {
      setSelectedImages(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0 || !onDownload) return;

    setIsLoading(true);
    try {
      for (const imageId of Array.from(selectedImages)) {
        const image = images.find((img) => img.id === imageId);
        if (image) {
          await onDownload(image);
        }
      }
      toast.success(`Downloaded ${selectedImages.size} images`);
      setSelectedImages(new Set());
    } catch (error) {
      toast.error('Failed to download some images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.size === 0 || !onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} selected images?`
    );

    if (confirmed) {
      Array.from(selectedImages).forEach((imageId) => {
        onDelete(imageId);
      });
      setSelectedImages(new Set());
      toast.success(`Deleted ${selectedImages.size} images`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">No images yet</h3>
              <p className="text-gray-500 mt-1">
                Generate your first AI image to see it here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Image Gallery ({pagination.totalItems})
          </CardTitle>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="prompt">By Prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedImages.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDownload}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredImages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No images match your search criteria</p>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedImages.size === currentImages.length && currentImages.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select all on this page</span>
            </div>

            {/* Images Grid/List */}
            <div
              className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-4'
              }`}
            >
              {currentImages.map((image) => (
                <div key={image.id} className="relative group">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedImages.has(image.id)}
                      onCheckedChange={(checked) =>
                        handleSelectImage(image.id, checked as boolean)
                      }
                      className="bg-white/90 border-gray-300"
                    />
                  </div>

                  {viewMode === 'grid' ? (
                    <ImageDisplay
                      image={image}
                      onView={onImageClick}
                      onDownload={onDownload}
                      showMetadata={false}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    />
                  ) : (
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 flex-shrink-0">
                            <img
                              src={image.url}
                              alt={image.prompt}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-2 line-clamp-2">
                              {image.prompt}
                            </h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {image.width}×{image.height}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(image.created_at)}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {onImageClick && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onImageClick(image)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                              {onDownload && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDownload(image)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} images
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
                    }
                    disabled={currentPage === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for gallery
export function ImageGallerySkeleton({ itemsPerPage = 12 }: { itemsPerPage?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: itemsPerPage }, (_, i) => (
            <ImageDisplaySkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}