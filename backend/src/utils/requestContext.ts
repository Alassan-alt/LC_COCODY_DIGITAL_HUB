import { memberRepository } from "../repositories/member.repository";
import type { AccessContext } from "./documentAccess";
import type { AuthTokenPayload } from "./jwt";

export async function resolveAccessContext(user: AuthTokenPayload): Promise<AccessContext> {
  const profile = await memberRepository.findByUserId(user.sub);
  return { role: user.role, userId: user.sub, departmentId: profile?.departmentId ?? null };
}
