import type { DocumentVisibility, Role } from "@prisma/client";

export interface AccessContext {
  role: Role;
  userId: string;
  departmentId?: string | null;
}

export interface AccessSubject {
  visibility: DocumentVisibility;
  departmentId?: string | null;
  ownerId?: string | null;
}

/**
 * Politique d'accès par visibilité (RG-07 : jamais d'accès à une information
 * hors permission). Les niveaux exacts (ex. qui exactement peut lire du
 * CONFIDENTIAL) ne sont pas détaillés dans les documents projet — choix
 * technique raisonnable, documenté dans ARCHITECTURE_DECISIONS.md, à
 * confirmer si le LC a une politique plus précise.
 */
export function canAccess(subject: AccessSubject, ctx: AccessContext): boolean {
  if (ctx.role === "SUPER_ADMIN" || ctx.role === "LCP") {
    return true;
  }

  switch (subject.visibility) {
    case "PUBLIC":
    case "INTERNAL":
      return true;
    case "DEPARTMENT":
      return !!subject.departmentId && subject.departmentId === ctx.departmentId;
    case "CONFIDENTIAL":
      return (
        (["VP", "TEAM_LEADER"].includes(ctx.role) && subject.departmentId === ctx.departmentId) ||
        subject.ownerId === ctx.userId
      );
    case "RESTRICTED":
      return subject.ownerId === ctx.userId;
    default:
      return false;
  }
}

/**
 * Traduction de `canAccess()` en filtre Prisma pour les listes paginées
 * (nécessaire pour que `meta.total` reste exact — un filtrage en mémoire
 * après pagination fausserait la pagination). Les deux fonctions expriment
 * la même politique ; toute évolution doit être répercutée dans les deux.
 */
export function buildVisibilityWhere(
  ctx: AccessContext,
  ownerField: "authorId" | "ownerId",
): Record<string, unknown> | undefined {
  if (ctx.role === "SUPER_ADMIN" || ctx.role === "LCP") {
    return undefined;
  }

  const clauses: Record<string, unknown>[] = [{ visibility: "PUBLIC" }, { visibility: "INTERNAL" }];

  if (ctx.departmentId) {
    clauses.push({ visibility: "DEPARTMENT", departmentId: ctx.departmentId });
    if (ctx.role === "VP" || ctx.role === "TEAM_LEADER") {
      clauses.push({ visibility: "CONFIDENTIAL", departmentId: ctx.departmentId });
    }
  }

  clauses.push({ visibility: "CONFIDENTIAL", [ownerField]: ctx.userId });
  clauses.push({ visibility: "RESTRICTED", [ownerField]: ctx.userId });

  return { OR: clauses };
}
