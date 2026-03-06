/**
 * ROLE-BASED PERMISSIONS
 * Defines what each role can do in production
 */

export type UserRole = "Writer" | "Editor" | "Strategist" | "Admin";

export interface RolePermissions {
  canEditScript: boolean;
  canEditMetadata: boolean;
  canUploadAssets: boolean;
  canMoveToReview: boolean;
  canApproveHighRisk: boolean;
  canEditAllFields: boolean;
  canOverrideValidation: boolean;
  canUnlockLockedFields: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Writer: {
    canEditScript: true,
    canEditMetadata: true,
    canUploadAssets: false,
    canMoveToReview: false,
    canApproveHighRisk: false,
    canEditAllFields: false,
    canOverrideValidation: false,
    canUnlockLockedFields: false,
  },
  Editor: {
    canEditScript: true,
    canEditMetadata: true,
    canUploadAssets: true,
    canMoveToReview: false,
    canApproveHighRisk: false,
    canEditAllFields: false,
    canOverrideValidation: false,
    canUnlockLockedFields: false,
  },
  Strategist: {
    canEditScript: true,
    canEditMetadata: true,
    canUploadAssets: true,
    canMoveToReview: true,
    canApproveHighRisk: true,
    canEditAllFields: true,
    canOverrideValidation: false,
    canUnlockLockedFields: true,
  },
  Admin: {
    canEditScript: true,
    canEditMetadata: true,
    canUploadAssets: true,
    canMoveToReview: true,
    canApproveHighRisk: true,
    canEditAllFields: true,
    canOverrideValidation: true,
    canUnlockLockedFields: true,
  },
};

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Get current user role (mock - in production this would come from auth)
 */
export function getCurrentUserRole(): UserRole {
  // For demo purposes, return Strategist (has most permissions except override)
  return "Strategist";
}

/**
 * Check approval requirements
 */
export interface ApprovalRequirement {
  required: boolean;
  reason: string;
  approverRole: UserRole;
}

export function checkApprovalRequirements(
  riskLevel: string,
  hasClaimsFlags: boolean,
  currentUserRole: UserRole
): ApprovalRequirement | null {
  // High risk requires strategist approval
  if (riskLevel === "high") {
    if (currentUserRole === "Writer" || currentUserRole === "Editor") {
      return {
        required: true,
        reason: "High-risk content requires Strategist approval",
        approverRole: "Strategist",
      };
    }
  }

  // Claims require source validation and strategist review
  if (hasClaimsFlags) {
    if (currentUserRole === "Writer") {
      return {
        required: true,
        reason: "Claims-based content requires source validation and Strategist review",
        approverRole: "Strategist",
      };
    }
  }

  return null;
}
