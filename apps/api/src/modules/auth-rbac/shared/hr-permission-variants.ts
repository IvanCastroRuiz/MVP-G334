const HR_READ_FALLBACK_MODULES = ['hr-employees', 'hr-leaves', 'hr-access'];

const HR_PREFIX = 'hr';
const HR_CHILD_PREFIX = 'hr-';

const splitSegments = (value: string): string[] =>
  value
    .split(/[.:]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const buildLegacyHrPermission = (submodule: string | null, actions: string[]): string | null => {
  if (!submodule) {
    if (actions.length === 0) {
      return `${HR_PREFIX}:read`;
    }
    return `${HR_PREFIX}:${actions.join('.')}`;
  }
  const segments = [submodule, ...actions];
  if (segments.length === 0) {
    return null;
  }
  return `${HR_PREFIX}:${segments.join('.')}`;
};

const buildModernHrPermission = (submodule: string, actions: string[]): string | null => {
  if (!submodule) {
    return null;
  }
  const normalizedActions = actions.length > 0 ? actions : ['read'];
  return `${HR_CHILD_PREFIX}${submodule}:${normalizedActions.join(':')}`;
};

export const expandHrPermissionVariants = (permission: string): string[] => {
  if (!permission.startsWith(HR_PREFIX)) {
    return [];
  }

  const variants = new Set<string>();

  if (permission.startsWith(`${HR_PREFIX}:`)) {
    const remainder = permission.slice(HR_PREFIX.length + 1);
    const segments = splitSegments(remainder);

    if (segments.length === 0) {
      return [];
    }

    if (segments[0] === 'read' && segments.length === 1) {
      for (const moduleKey of HR_READ_FALLBACK_MODULES) {
        variants.add(`${moduleKey}:read`);
      }
      return Array.from(variants);
    }

    const [submodule, ...actionSegments] = segments;
    const modern = buildModernHrPermission(submodule, actionSegments);
    if (modern) {
      variants.add(modern);
    }
    return Array.from(variants);
  }

  if (!permission.startsWith(HR_CHILD_PREFIX)) {
    return [];
  }

  const [modulePart, ...actionParts] = permission.split(':');
  const submodule = modulePart.slice(HR_CHILD_PREFIX.length);
  if (!submodule) {
    return [];
  }
  const normalizedActions = actionParts.length > 0 ? actionParts : ['read'];
  const legacy = buildLegacyHrPermission(submodule, normalizedActions);
  if (legacy) {
    variants.add(legacy);
  }

  if (normalizedActions.length === 1 && normalizedActions[0] === 'read') {
    variants.add(`${HR_PREFIX}:read`);
  }

  return Array.from(variants);
};
