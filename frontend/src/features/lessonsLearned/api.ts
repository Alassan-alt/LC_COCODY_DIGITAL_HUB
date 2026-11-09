import axios from "axios";
import { api } from "../../services/api";

export interface LessonLearned {
  id: string;
  whatWorked: string | null;
  whatDidNotWork: string | null;
  difficulties: string | null;
  recommendations: string | null;
  lessonsLearned: string | null;
  projectId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLessonLearned(projectId: string): Promise<LessonLearned | null> {
  try {
    const { data } = await api.get<{ success: boolean; data: LessonLearned }>(
      `/projects/${projectId}/lessons-learned`,
    );
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface LessonLearnedInput {
  whatWorked?: string;
  whatDidNotWork?: string;
  difficulties?: string;
  recommendations?: string;
  lessonsLearned?: string;
}

export async function upsertLessonLearned(
  projectId: string,
  input: LessonLearnedInput,
): Promise<LessonLearned> {
  const { data } = await api.put<{ success: boolean; data: LessonLearned }>(
    `/projects/${projectId}/lessons-learned`,
    input,
  );
  return data.data;
}
