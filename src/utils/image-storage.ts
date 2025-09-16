import { GeneratedImage, LocalStorageImageData, STORAGE_KEYS } from '@/types/image-generation';

export class ImageStorage {
  private static instance: ImageStorage;
  private images: GeneratedImage[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ImageStorage {
    if (!ImageStorage.instance) {
      ImageStorage.instance = new ImageStorage();
    }
    return ImageStorage.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GENERATED_IMAGES);
      if (stored) {
        const parsedData = JSON.parse(stored);
        
        // Data migration: handle both old format (array) and new format (object)
        if (Array.isArray(parsedData)) {
          // Old format: direct array of images
          console.log('Migrating old format image data to new format');
          this.images = parsedData;
          // Save in new format
          this.saveToStorage();
        } else if (parsedData && typeof parsedData === 'object' && 'images' in parsedData) {
          // New format: object with images and lastUpdated
          const data: LocalStorageImageData = parsedData;
          this.images = data.images || [];
        } else {
          // Invalid format
          console.warn('Invalid image storage format, resetting to empty array');
          this.images = [];
        }
      }
    } catch (error) {
      console.error('Error loading images from storage:', error);
      this.images = [];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data: LocalStorageImageData = {
        images: this.images,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.GENERATED_IMAGES, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving images to storage:', error);
    }
  }

  public add(image: GeneratedImage): void {
    this.images.unshift(image); // Add to beginning for newest first
    this.saveToStorage();
  }

  public getAll(): GeneratedImage[] {
    return [...this.images];
  }

  public getById(id: string): GeneratedImage | undefined {
    return this.images.find(img => img.id === id);
  }

  public delete(id: string): boolean {
    const index = this.images.findIndex(img => img.id === id);
    if (index !== -1) {
      this.images.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public deleteMultiple(ids: string[]): number {
    let deletedCount = 0;
    ids.forEach(id => {
      if (this.delete(id)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }

  public clear(): void {
    this.images = [];
    this.saveToStorage();
  }

  public getPaginated(page: number, itemsPerPage: number): {
    images: GeneratedImage[];
    totalPages: number;
    totalItems: number;
  } {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedImages = this.images.slice(startIndex, endIndex);
    
    return {
      images: paginatedImages,
      totalPages: Math.ceil(this.images.length / itemsPerPage),
      totalItems: this.images.length,
    };
  }

  public search(query: string): GeneratedImage[] {
    const lowercaseQuery = query.toLowerCase();
    return this.images.filter(img => 
      img.prompt.toLowerCase().includes(lowercaseQuery) ||
      (img.negative_prompt && img.negative_prompt.toLowerCase().includes(lowercaseQuery))
    );
  }

  public getByDateRange(startDate: Date, endDate: Date): GeneratedImage[] {
    return this.images.filter(img => {
      const imgDate = new Date(img.created_at);
      return imgDate >= startDate && imgDate <= endDate;
    });
  }

  public exportData(): LocalStorageImageData {
    return {
      images: this.images,
      lastUpdated: new Date().toISOString(),
    };
  }

  public importData(data: LocalStorageImageData): void {
    this.images = data.images || [];
    this.saveToStorage();
  }
}

// Export singleton instance
export const imageStorage = ImageStorage.getInstance();