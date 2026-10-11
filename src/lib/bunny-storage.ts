import path from 'path';

export const BUNNY_STORAGE_CONFIG = {
  zone: process.env.BUNNY_STORAGE_ZONE || 'megah',
  accessKey: process.env.BUNNY_STORAGE_KEY || 'd690b669-a954-424f-8547e60f7ff9-4ca2-4b81',
  endpoint: (process.env.BUNNY_STORAGE_ENDPOINT || 'https://sg.storage.bunnycdn.com').replace(/\/$/, ''),
  cdnUrl: (process.env.BUNNY_CDN_URL || '').replace(/\/$/, ''),
};

export interface BunnyFileItem {
  Guid: string;
  StorageZoneId: number;
  Path: string;
  ObjectName: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
  ServerId?: number;
  UserId?: string;
  ContentType?: string;
}

export class BunnyStorageService {
  private get baseUrl(): string {
    return `${BUNNY_STORAGE_CONFIG.endpoint}/${BUNNY_STORAGE_CONFIG.zone}`;
  }

  private get headers(): Record<string, string> {
    return {
      AccessKey: BUNNY_STORAGE_CONFIG.accessKey,
    };
  }

  /**
   * Upload a file buffer, Uint8Array or string to Bunny Storage
   * @param storagePath e.g. "uploads/models/house_123.glb"
   */
  async upload(storagePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const url = `${this.baseUrl}/${cleanPath}`;

    const bodyData = typeof content === 'string'
      ? content
      : (content as unknown as BodyInit);

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: bodyData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Bunny Storage upload failed (${res.status}): ${errText}`);
    }

    return this.getPublicUrl(cleanPath);
  }

  /**
   * Delete a file from Bunny Storage
   */
  async delete(storagePath: string): Promise<boolean> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const url = `${this.baseUrl}/${cleanPath}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
      });
      return res.ok || res.status === 404;
    } catch (err) {
      console.warn(`[BunnyStorage] Delete failed for ${cleanPath}:`, err);
      return false;
    }
  }

  /**
   * List files in a directory in Bunny Storage
   */
  async listFiles(storageDir: string): Promise<BunnyFileItem[]> {
    const cleanPath = storageDir.replace(/^\/+/, '').replace(/\/+$/, '');
    const url = `${this.baseUrl}/${cleanPath}/`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!res.ok) {
        if (res.status === 404) return [];
        console.warn(`[BunnyStorage] listFiles failed (${res.status}) for ${cleanPath}`);
        return [];
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`[BunnyStorage] listFiles error for ${cleanPath}:`, err);
      return [];
    }
  }

  /**
   * Download / fetch a file stream from Bunny Storage
   */
  async download(storagePath: string, rangeHeader?: string | null): Promise<Response> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const url = `${this.baseUrl}/${cleanPath}`;

    const headers: Record<string, string> = { ...this.headers };
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    return fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
  }

  /**
   * Read and parse JSON from Bunny storage
   */
  async readJson<T>(storagePath: string): Promise<T | null> {
    try {
      const res = await this.download(storagePath);
      if (!res.ok) {
        if (res.status === 404) return null;
        console.warn(`[BunnyStorage] Read JSON ${storagePath} returned status ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.warn(`[BunnyStorage] Failed reading JSON ${storagePath}:`, err);
      return null;
    }
  }

  /**
   * Write serialized JSON to Bunny storage
   */
  async writeJson(storagePath: string, data: any): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      await this.upload(storagePath, jsonStr, 'application/json');
      return true;
    } catch (err) {
      console.error(`[BunnyStorage] Failed writing JSON ${storagePath}:`, err);
      return false;
    }
  }

  /**
   * Get public accessible URL for a file in Bunny Storage
   */
  getPublicUrl(storagePath: string): string {
    const cleanPath = storagePath.replace(/^\/+/, '');
    if (BUNNY_STORAGE_CONFIG.cdnUrl) {
      return `${BUNNY_STORAGE_CONFIG.cdnUrl}/${cleanPath}`;
    }
    return `/api/storage/${cleanPath}`;
  }
}

export const bunnyStorage = new BunnyStorageService();
