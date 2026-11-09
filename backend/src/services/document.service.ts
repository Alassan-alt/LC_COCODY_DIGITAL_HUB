import { documentRepository, documentVersionRepository } from "../repositories/document.repository";
import { folderRepository } from "../repositories/folder.repository";
import { AppError } from "../utils/AppError";
import { buildVisibilityWhere, canAccess, type AccessContext } from "../utils/documentAccess";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  ListDocumentsQuery,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "../validators/document.validator";
import { recordAuditLog } from "./audit.service";
import { notificationService } from "./notification.service";
import { storageDriver } from "./storage";

type UploadedFile = Express.Multer.File;

interface DocumentSubject {
  visibility: string;
  departmentId?: string | null;
  authorId: string;
}

function toAccessSubject(document: DocumentSubject) {
  return {
    visibility: document.visibility,
    departmentId: document.departmentId,
    ownerId: document.authorId,
  } as Parameters<typeof canAccess>[0];
}

function canModify(document: DocumentSubject, ctx: AccessContext): boolean {
  return ctx.role === "SUPER_ADMIN" || ctx.role === "LCP" || document.authorId === ctx.userId;
}

export const documentService = {
  async list(query: ListDocumentsQuery, ctx: AccessContext) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await documentRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      folderId: query.folderId,
      departmentId: query.departmentId,
      mandateId: query.mandateId,
      category: query.category,
      tag: query.tag,
      visibility: query.visibility,
      visibilityWhere: buildVisibilityWhere(ctx, "authorId"),
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string, ctx: AccessContext) {
    const document = await documentRepository.findById(id);
    if (!document || document.isDeleted) {
      throw new AppError("Document introuvable", 404);
    }
    if (!canAccess(toAccessSubject(document), ctx)) {
      throw new AppError("Accès refusé à ce document", 403);
    }
    return document;
  },

  async upload(input: UploadDocumentInput, file: UploadedFile, authorId: string) {
    if (input.folderId) {
      const folder = await folderRepository.findById(input.folderId);
      if (!folder) {
        throw new AppError("Dossier introuvable", 404);
      }
    }

    const stored = await storageDriver.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    const document = await documentRepository.create({
      name: input.name,
      description: input.description,
      category: input.category,
      tags: input.tags,
      visibility: input.visibility,
      author: { connect: { id: authorId } },
      ...(input.folderId ? { folder: { connect: { id: input.folderId } } } : {}),
      ...(input.departmentId ? { department: { connect: { id: input.departmentId } } } : {}),
      ...(input.mandateId ? { mandate: { connect: { id: input.mandateId } } } : {}),
    });

    const version = await documentVersionRepository.create({
      versionNumber: 1,
      storageKey: stored.key,
      originalName: file.originalname,
      mimeType: stored.mimeType,
      size: stored.size,
      documentId: document.id,
      uploadedById: authorId,
    });

    const updated = await documentRepository.update(document.id, { currentVersionId: version.id });

    await recordAuditLog({
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document.id,
      userId: authorId,
      metadata: { name: input.name, versionNumber: 1 },
    });

    // Diffusion limitée aux visibilités largement partagées du département
    // (pas CONFIDENTIAL/RESTRICTED, cohérent avec la politique d'accès Phase 6).
    if (input.visibility === "PUBLIC" || input.visibility === "INTERNAL" || input.visibility === "DEPARTMENT") {
      await notificationService.notifyDepartment(
        input.departmentId,
        "DOCUMENT_NEW",
        `Nouveau document ajouté : « ${input.name} »`,
        { relatedEntityType: "Document", relatedEntityId: document.id, excludeUserId: authorId },
      );
    }

    return updated;
  },

  async addVersion(
    documentId: string,
    file: UploadedFile,
    changeNote: string | undefined,
    userId: string,
    ctx: AccessContext,
  ) {
    const document = await this.getById(documentId, ctx);
    if (!canModify(document, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut ajouter une version", 403);
    }

    const stored = await storageDriver.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    const versionCount = await documentVersionRepository.countByDocument(documentId);
    const version = await documentVersionRepository.create({
      versionNumber: versionCount + 1,
      storageKey: stored.key,
      originalName: file.originalname,
      mimeType: stored.mimeType,
      size: stored.size,
      changeNote,
      documentId,
      uploadedById: userId,
    });

    const updated = await documentRepository.update(documentId, { currentVersionId: version.id });

    await recordAuditLog({
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: documentId,
      userId,
      metadata: { versionNumber: version.versionNumber },
    });

    return updated;
  },

  async listVersions(documentId: string, ctx: AccessContext) {
    await this.getById(documentId, ctx);
    return documentVersionRepository.findByDocument(documentId);
  },

  async restoreVersion(documentId: string, versionId: string, userId: string, ctx: AccessContext) {
    const document = await this.getById(documentId, ctx);
    if (!canModify(document, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut restaurer une version", 403);
    }

    const version = await documentVersionRepository.findById(versionId);
    if (!version || version.documentId !== documentId) {
      throw new AppError("Version introuvable pour ce document", 404);
    }

    const updated = await documentRepository.update(documentId, { currentVersionId: version.id });

    await recordAuditLog({
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: documentId,
      userId,
      metadata: { restoredVersionNumber: version.versionNumber },
    });

    return updated;
  },

  async updateMetadata(documentId: string, input: UpdateDocumentInput, userId: string, ctx: AccessContext) {
    const document = await this.getById(documentId, ctx);
    if (!canModify(document, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut modifier ce document", 403);
    }

    const updated = await documentRepository.update(documentId, input);

    await recordAuditLog({
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: documentId,
      userId,
      metadata: { fields: Object.keys(input) },
    });

    return updated;
  },

  async remove(documentId: string, userId: string, ctx: AccessContext) {
    const document = await this.getById(documentId, ctx);
    if (!canModify(document, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut supprimer ce document", 403);
    }

    await documentRepository.softDelete(documentId);

    await recordAuditLog({
      action: "DOCUMENT_DELETED",
      entityType: "Document",
      entityId: documentId,
      userId,
    });
  },

  async download(documentId: string, versionId: string | undefined, userId: string, ctx: AccessContext) {
    const document = await this.getById(documentId, ctx);

    const targetVersionId = versionId ?? document.currentVersionId;
    const version = targetVersionId ? await documentVersionRepository.findById(targetVersionId) : null;

    if (!version || version.documentId !== documentId) {
      throw new AppError("Version introuvable pour ce document", 404);
    }

    const buffer = await storageDriver.read(version.storageKey);

    await recordAuditLog({
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Document",
      entityId: documentId,
      userId,
      metadata: { versionNumber: version.versionNumber },
    });

    return { buffer, version };
  },
};
