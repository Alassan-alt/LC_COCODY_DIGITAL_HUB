import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDocumentVersion,
  deleteDocument,
  listDocumentVersions,
  listDocuments,
  restoreDocumentVersion,
  updateDocument,
  uploadDocument,
  type ListDocumentsParams,
  type UpdateDocumentInput,
  type UploadDocumentInput,
} from "./api";

const QUERY_KEY = "documents";
const VERSIONS_KEY = "document-versions";

export function useDocuments(params: ListDocumentsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listDocuments(params),
    placeholderData: (previous) => previous,
  });
}

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: [VERSIONS_KEY, documentId],
    queryFn: () => listDocumentVersions(documentId as string),
    enabled: documentId !== null,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDocumentInput }) => updateDocument(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useAddDocumentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, file, changeNote }: { documentId: string; file: File; changeNote?: string }) =>
      addDocumentVersion(documentId, file, changeNote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [VERSIONS_KEY, variables.documentId] });
    },
  });
}

export function useRestoreDocumentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, versionId }: { documentId: string; versionId: string }) =>
      restoreDocumentVersion(documentId, versionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [VERSIONS_KEY, variables.documentId] });
    },
  });
}
