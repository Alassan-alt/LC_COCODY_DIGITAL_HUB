import { LocalDiskStorage } from "./localDiskStorage";
import type { StorageDriver } from "./storage.types";

export const storageDriver: StorageDriver = new LocalDiskStorage();

export type { StorageDriver, StoredFileRef, UploadedFileInput } from "./storage.types";
