import { GeneratedImage, LocalStorageImageData, STORAGE_KEYS } from '@/types/image-generation';
import { SupabaseImageStorage } from '@/services/supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export class ImageStorage {
  private static instance: ImageStorage;
  private supabaseStorage: SupabaseImageStorage;
  private useSupabase: boolean;
  private localImages: GeneratedImage[] = [];

  private constructor() {
    this.supabaseStorage = new SupabaseImageStorage();
    this.useSupabase = isSupabaseConfigured();
    
    if (!this.useSupabase) {
      console.warn('Supabase not configured, falling back to local storage');
      this.loadFromLocalStorage();
    }
  }

  public static getInstance(): ImageStorage {
    if (!ImageStorage.instance) {
      ImageStorage.instance = new ImageStorage();
    }
    return ImageStorage.instance;
  }

  // Check if Supabase is available
  public isAvailable(): boolean {
    return this.supabaseStorage.isAvailable();
  }

  // Load from localStorage (fallback)
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('generatedImages')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.localImages = Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      this.localImages = []
    }
  }

  // Save to localStorage (fallback)
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('generatedImages', JSON.stringify(this.localImages))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Load all images from Supabase
  public async loadImages(): Promise<GeneratedImage[]> {
    if (this.useSupabase) {
      return await this.supabaseStorage.loadImages()
    } else {
      return this.localImages
    }
  }

  // Save image
  public async saveImage(image: GeneratedImage): Promise<void> {
    if (this.useSupabase) {
      await this.supabaseStorage.saveImage(image);
    } else {
      const existingIndex = this.localImages.findIndex(img => img.id === image.id);
      if (existingIndex >= 0) {
        this.localImages[existingIndex] = image;
      } else {
        this.localImages.unshift(image);
      }
      this.saveToLocalStorage();
    }
  }

  // Delete image
  public async deleteImage(id: string): Promise<void> {
    if (this.useSupabase) {
      await this.supabaseStorage.deleteImage(id);
    } else {
      this.localImages = this.localImages.filter(img => img.id !== id);
      this.saveToLocalStorage();
    }
  }

  // Update image
  public async updateImage(image: GeneratedImage): Promise<void> {
    if (this.useSupabase) {
      await this.supabaseStorage.updateImage(image);
    } else {
      const index = this.localImages.findIndex(img => img.id === image.id);
      if (index >= 0) {
        this.localImages[index] = image;
        this.saveToLocalStorage();
      }
    }
  }

  // Get paginated images
  public async getImages(page: number = 1, pageSize: number = 12): Promise<{ images: GeneratedImage[], total: number }> {
    if (this.useSupabase) {
      return await this.supabaseStorage.getImages(page, pageSize);
    } else {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return {
        images: this.localImages.slice(start, end),
        total: this.localImages.length
      };
    }
  }

  // Search images
  public async searchImages(query: string): Promise<GeneratedImage[]> {
    if (this.useSupabase) {
      return await this.supabaseStorage.searchImages(query);
    } else {
      const lowerQuery = query.toLowerCase();
      return this.localImages.filter(img => 
        img.prompt.toLowerCase().includes(lowerQuery) ||
        img.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
  }

  // Get favorite images
  public async getFavoriteImages(): Promise<GeneratedImage[]> {
    if (this.useSupabase) {
      return await this.supabaseStorage.getFavoriteImages();
    } else {
      return this.localImages.filter(img => img.isFavorite);
    }
  }

  // Clear all images
  public async clearAllImages(): Promise<void> {
    if (this.useSupabase) {
      await this.supabaseStorage.clearAllImages();
    } else {
      this.localImages = [];
      this.saveToLocalStorage();
    }
  }

  // Legacy synchronous methods for backward compatibility (deprecated)
  public add(image: GeneratedImage): void {
    console.warn('add() method is deprecated. Use saveImage() instead.');
    this.saveImage(image).catch(console.error);
  }

  public getAll(): GeneratedImage[] {
    console.warn('getAll() method is deprecated. Use loadImages() instead.');
    return [];
  }

  public getById(id: string): GeneratedImage | undefined {
    console.warn('getById() method is deprecated. Use loadImages() and filter instead.');
    return undefined;
  }

  public delete(id: string): boolean {
    console.warn('delete() method is deprecated. Use deleteImage() instead.');
    this.deleteImage(id).catch(console.error);
    return true;
  }

  public deleteMultiple(ids: string[]): number {
    console.warn('deleteMultiple() method is deprecated. Use deleteImage() for each id instead.');
    ids.forEach(id => this.deleteImage(id).catch(console.error));
    return ids.length;
  }

  public clear(): void {
    console.warn('clear() method is deprecated. Use clearAllImages() instead.');
    this.clearAllImages().catch(console.error);
  }

  public getPaginated(page: number, itemsPerPage: number): {
    images: GeneratedImage[];
    totalPages: number;
    totalItems: number;
  } {
    console.warn('getPaginated() method is deprecated. Use getImages() instead.');
    return { images: [], totalPages: 0, totalItems: 0 };
  }

  public search(query: string): GeneratedImage[] {
    console.warn('search() method is deprecated. Use searchImages() instead.');
    return [];
  }

  public getByDateRange(startDate: Date, endDate: Date): GeneratedImage[] {
    console.warn('getByDateRange() method is deprecated.');
    return [];
  }

  public exportData(): LocalStorageImageData {
    console.warn('exportData() method is deprecated.');
    return { images: [], lastUpdated: new Date().toISOString() };
  }

  public importData(data: LocalStorageImageData): void {
    console.warn('importData() method is deprecated.');
  }


}

// Export singleton instance
export const imageStorage = ImageStorage.getInstance();