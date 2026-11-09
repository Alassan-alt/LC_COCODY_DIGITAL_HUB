import { folderRepository } from "../repositories/folder.repository";
import { AppError } from "../utils/AppError";
import { buildVisibilityWhere, canAccess, type AccessContext } from "../utils/documentAccess";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateFolderInput,
  ListFoldersQuery,
  UpdateFolderInput,
} from "../validators/folder.validator";

export const folderService = {
  async list(query: ListFoldersQuery, ctx: AccessContext) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await folderRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      parentFolderId: query.parentFolderId,
      departmentId: query.departmentId,
      visibilityWhere: buildVisibilityWhere(ctx, "ownerId"),
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string, ctx: AccessContext) {
    const folder = await folderRepository.findById(id);
    if (!folder) {
      throw new AppError("Dossier introuvable", 404);
    }
    if (!canAccess(folder, ctx)) {
      throw new AppError("Accès refusé à ce dossier", 403);
    }
    return folder;
  },

  async create(input: CreateFolderInput, ownerId: string) {
    if (input.parentFolderId) {
      const parent = await folderRepository.findById(input.parentFolderId);
      if (!parent) {
        throw new AppError("Dossier parent introuvable", 404);
      }
    }
    return folderRepository.create({ ...input, ownerId });
  },

  async update(id: string, input: UpdateFolderInput, ctx: AccessContext) {
    await this.getById(id, ctx);
    return folderRepository.update(id, input);
  },

  async remove(id: string, ctx: AccessContext) {
    await this.getById(id, ctx);
    const [childCount, documentCount] = await Promise.all([
      folderRepository.countChildren(id),
      folderRepository.countDocuments(id),
    ]);
    if (childCount > 0 || documentCount > 0) {
      throw new AppError("Impossible de supprimer un dossier non vide", 409);
    }
    await folderRepository.delete(id);
  },
};
