import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const folderRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    parentFolderId?: string;
    departmentId?: string;
    visibilityWhere?: Record<string, unknown>;
  }) {
    const where: Prisma.FolderWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.parentFolderId ? { parentFolderId: params.parentFolderId } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.visibilityWhere ?? {}),
    };

    const [items, total] = await Promise.all([
      prisma.folder.findMany({ where, skip: params.skip, take: params.take, orderBy: { name: "asc" } }),
      prisma.folder.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.folder.findUnique({ where: { id } });
  },

  create(data: {
    name: string;
    visibility: Prisma.FolderCreateInput["visibility"];
    ownerId: string;
    parentFolderId?: string;
    departmentId?: string;
  }) {
    return prisma.folder.create({ data });
  },

  update(id: string, data: Prisma.FolderUpdateInput) {
    return prisma.folder.update({ where: { id }, data });
  },

  countChildren(folderId: string) {
    return prisma.folder.count({ where: { parentFolderId: folderId } });
  },

  countDocuments(folderId: string) {
    return prisma.document.count({ where: { folderId, isDeleted: false } });
  },

  delete(id: string) {
    return prisma.folder.delete({ where: { id } });
  },
};
