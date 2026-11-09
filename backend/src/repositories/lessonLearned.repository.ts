import { prisma } from "../config/prisma";

export const lessonLearnedRepository = {
  findByProject(projectId: string) {
    return prisma.lessonLearned.findUnique({ where: { projectId } });
  },

  upsert(
    projectId: string,
    authorId: string,
    data: {
      whatWorked?: string;
      whatDidNotWork?: string;
      difficulties?: string;
      recommendations?: string;
      lessonsLearned?: string;
    },
  ) {
    return prisma.lessonLearned.upsert({
      where: { projectId },
      create: { ...data, projectId, authorId },
      update: { ...data, authorId },
    });
  },
};
