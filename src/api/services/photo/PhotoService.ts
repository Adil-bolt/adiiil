export class PhotoService {
  private static readonly STORAGE_KEY = 'user_photos';
  private static readonly LOGO_KEY = 'app_logo';

  public static async uploadUserPhoto(userId: string, file: File): Promise<string> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Save to localStorage
      const photos = this.getUserPhotos();
      photos[userId] = base64;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
      
      return base64;
    } catch (error) {
      console.error('Error uploading user photo:', error);
      throw error;
    }
  }

  public static async uploadLogo(file: File): Promise<string> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Save to localStorage
      localStorage.setItem(this.LOGO_KEY, base64);
      
      return base64;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  public static getUserPhoto(userId: string): string | null {
    const photos = this.getUserPhotos();
    return photos[userId] || null;
  }

  public static getLogo(): string | null {
    return localStorage.getItem(this.LOGO_KEY);
  }

  private static getUserPhotos(): Record<string, string> {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}