import { User } from '@/types';

/**
 * Check if the given user or userId is the Super Admin (full permissions)
 */
export function isSuperAdmin(userOrId?: User | string | null): boolean {
  if (!userOrId) return false;
  const id = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.username || userOrId.email || '');
  const normalized = id.toLowerCase().trim();
  return (
    normalized === 'usr-admin-lead' ||
    normalized === 'admin' ||
    normalized === 'admin@mitramegahinterior.com' ||
    normalized === 'admin@homecraft3d.com' ||
    normalized === 'admin@atelier3d.com'
  );
}

/**
 * Check if user has permission to delete projects or library models.
 * user01 and user02 cannot delete projects. Only Super Admin can.
 */
export function canUserDelete(userOrId?: User | string | null): boolean {
  return isSuperAdmin(userOrId);
}

/**
 * Check if user has permission to share projects (copy link, share modal).
 * user01 and user02 cannot share projects. Only Super Admin can.
 */
export function canUserShare(userOrId?: User | string | null): boolean {
  return isSuperAdmin(userOrId);
}
