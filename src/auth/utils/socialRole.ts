import { LoginSocialPrecheckResponse } from "../types";

const parseBooleanLike = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  return undefined;
};

export const shouldSelectRoleForSocialLogin = (
  precheckResponse: LoginSocialPrecheckResponse,
  hasRoleOptions: boolean
): boolean => {
  if (!hasRoleOptions) {
    return false;
  }

  const userExists =
    parseBooleanLike((precheckResponse as any).userExists) ??
    parseBooleanLike((precheckResponse as any).user_exists);
  if (typeof userExists === "boolean") {
    return !userExists;
  }

  const wouldCreateUser =
    parseBooleanLike((precheckResponse as any).wouldCreateUser) ??
    parseBooleanLike((precheckResponse as any).would_create_user);
  if (typeof wouldCreateUser === "boolean") {
    return wouldCreateUser;
  }

  const socialAccountExists =
    parseBooleanLike((precheckResponse as any).socialAccountExists) ??
    parseBooleanLike((precheckResponse as any).social_account_exists);
  if (socialAccountExists === true) {
    return false;
  }

  const linkedExistingUser =
    parseBooleanLike((precheckResponse as any).linkedExistingUser) ??
    parseBooleanLike((precheckResponse as any).linked_existing_user);
  if (linkedExistingUser === true) {
    return false;
  }

  return hasRoleOptions;
};
