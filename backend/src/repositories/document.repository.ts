import type { DocumentVisibility, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const documentRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    folderId?: string;
    departmentId?: string;
    mandateId?: string;
    category?: string;
    tag?: string;
    visibility?: DocumentVisibility;
    visibilityWhere?: Record<string, unknown>;
  }) {
    const baseWhere: Prisma.DocumentWhereInput = {
      isDeleted: false,
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.folderId ? { folderId: params.folderId } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.mandateId ? { mandateId: params.mandateId } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
    };

    const where: Prisma.DocumentWhereInput = params.visibilityWhere
      ? { AND: [baseWhere, params.visibilityWhere as Prisma.DocumentWhereInput] }
      : baseWhere;

    const [items, total] = await Promise.all([
      prisma.document.findMany({ where, skip: params.skip, take: params.take, orderBy: { updatedAt: "desc" } }),
      prisma.document.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.document.findUnique({ where: { id } });
  },

  create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({ data });
  },

  update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.document.update({ where: { id }, data: { isDeleted: true } });
  },
};

export const documentVersionRepository = {
  create(data: {
    versionNumber: number;
    storageKey: string;
    originalName: string;
    mimeType: string;
    size: number;
    changeNote?: string;
    documentId: string;
    uploadedById: string;
  }) {
    return prisma.documentVersion.create({ data });
  },

  findById(id: string) {
    return prisma.documentVersion.findUnique({ where: { id } });
  },

  findByDocument(documentId: string) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: "asc" },
    });
  },

  countByDocument(documentId: string) {
    return prisma.documentVersion.count({ where: { documentId } });
  },
};
