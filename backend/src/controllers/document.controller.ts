import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { resolveAccessContext } from "../utils/requestContext";
import { documentService } from "../services/document.service";
import type {
  ListDocumentsQuery,
  NewVersionInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "../validators/document.validator";

function requireFile(req: Request): Express.Multer.File {
  if (!req.file) {
    throw new AppError("Aucun fichier fourni", 400);
  }
  return req.file;
}

export const documentController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const result = await documentService.list(req.query as unknown as ListDocumentsQuery, ctx);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const document = await documentService.getById(req.params.id, ctx);
    res.status(200).json({ success: true, data: document });
  },

  async upload(req: Request, res: Response): Promise<void> {
    const file = requireFile(req);
    const document = await documentService.upload(req.body as UploadDocumentInput, file, req.user!.sub);
    res.status(201).json({ success: true, data: document });
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const document = await documentService.updateMetadata(
      req.params.id,
      req.body as UpdateDocumentInput,
      req.user!.sub,
      ctx,
    );
    res.status(200).json({ success: true, data: document });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    await documentService.remove(req.params.id, req.user!.sub, ctx);
    res.status(200).json({ success: true, message: "Document supprimé" });
  },

  async download(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const { buffer, version } = await documentService.download(
      req.params.id,
      undefined,
      req.user!.sub,
      ctx,
    );
    res.setHeader("Content-Type", version.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(version.originalName)}"`);
    res.status(200).send(buffer);
  },

  async listVersions(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const versions = await documentService.listVersions(req.params.id, ctx);
    res.status(200).json({ success: true, data: versions });
  },

  async addVersion(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const file = requireFile(req);
    const { changeNote } = req.body as NewVersionInput;
    const document = await documentService.addVersion(req.params.id, file, changeNote, req.user!.sub, ctx);
    res.status(201).json({ success: true, data: document });
  },

  async downloadVersion(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const { buffer, version } = await documentService.download(
      req.params.id,
      req.params.versionId,
      req.user!.sub,
      ctx,
    );
    res.setHeader("Content-Type", version.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(version.originalName)}"`);
    res.status(200).send(buffer);
  },

  async restoreVersion(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const document = await documentService.restoreVersion(
      req.params.id,
      req.params.versionId,
      req.user!.sub,
      ctx,
    );
    res.status(200).json({ success: true, data: document });
  },
};
