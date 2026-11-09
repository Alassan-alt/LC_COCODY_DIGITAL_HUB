import { lessonLearnedRepository } from "../repositories/lessonLearned.repository";
import { projectRepository } from "../repositories/project.repository";
import { AppError } from "../utils/AppError";
import type { UpsertLessonLearnedInput } from "../validators/lessonLearned.validator";

export const lessonLearnedService = {
  async getByProject(projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Projet introuvable", 404);
    }
    const lessonLearned = await lessonLearnedRepository.findByProject(projectId);
    if (!lessonLearned) {
      throw new AppError("Aucune leçon apprise enregistrée pour ce projet", 404);
    }
    return lessonLearned;
  },

  async upsert(projectId: string, input: UpsertLessonLearnedInput, authorId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Projet introuvable", 404);
    }
    return lessonLearnedRepository.upsert(projectId, authorId, input);
  },
};
