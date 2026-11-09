export interface UploadedFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StoredFileRef {
  key: string;
  size: number;
  mimeType: string;
}

/**
 * Interface indépendante du fournisseur. Le driver disque local
 * (`LocalDiskStorage`) sert au dev/test dans cet environnement (aucun accès
 * réseau à un service cloud). En production, remplacer par un driver
 * Cloudinary/S3/Cloudflare R2 implémentant la même interface — voir
 * ARCHITECTURE_DECISIONS.md (TO_CONFIRM le fournisseur définitif).
 */
export interface StorageDriver {
  upload(input: UploadedFileInput): Promise<StoredFileRef>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
