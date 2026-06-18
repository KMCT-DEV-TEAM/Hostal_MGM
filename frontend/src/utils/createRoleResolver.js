// utils/createRoleResolver.js
export function createRoleResolver(fetchersByRole, entityName = 'resource') {
  return function resolve(role, ...args) {
    const fetcher = fetchersByRole[role];
    if (!fetcher) {
      throw new Error(`No ${entityName} fetcher registered for role: ${role}`);
    }
    return fetcher(...args);
  };
}