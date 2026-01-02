import type { NodeMeta, ValidationRules, ValidationResult } from "./types";
import { parseJsx } from "./parser";
import { flatten, flattenWithMeta } from "./traversal";
import { diff, dupes, seqMatch } from "./utils";

/**
 * Validates that all required paths exist
 */
const validatePaths = (
  paths: string[],
  requiredPaths: string[]
): string | null => {
  const missing = diff(requiredPaths, paths);
  return missing.length ? `Missing: ${missing.join(", ")}` : null;
};

/**
 * Validates that no extra paths exist beyond what's specified
 */
const validateExtraPaths = (
  paths: string[],
  allowedPaths: string[]
): string | null => {
  const extra = diff(paths, allowedPaths);
  return extra.length ? `Extra: ${extra.join(", ")}` : null;
};

/**
 * Validates that no duplicate paths exist
 */
const validateDuplicates = (paths: string[]): string | null => {
  const duplicates = dupes(paths);
  return duplicates.length
    ? `Duplicates: ${[...new Set(duplicates)].join(", ")}`
    : null;
};

/**
 * Validates child sequence patterns
 */
const validateSequence = (
  nodes: NodeMeta[],
  sequence: Record<string, string[]>
): string[] => {
  const errors: string[] = [];

  for (const [parent, pattern] of Object.entries(sequence)) {
    const node = nodes.find((n) => n.name === parent);
    if (node && !seqMatch(node.children, pattern)) {
      errors.push(
        `${parent}: wrong sequence, expected ${pattern.join(" -> ")}`
      );
    }
  }

  return errors;
};

/**
 * Validates required props on components
 */
const validateProps = (
  nodes: NodeMeta[],
  props: Record<string, string[]>
): string[] => {
  const errors: string[] = [];

  for (const [component, required] of Object.entries(props)) {
    const node = nodes.find((n) => n.name === component);
    if (node) {
      const missingProps = diff(required, node.props);
      if (missingProps.length) {
        errors.push(`${component}: missing props ${missingProps.join(", ")}`);
      }
    }
  }

  return errors;
};

/**
 * Validates child count constraints
 */
const validateChildren = (
  nodes: NodeMeta[],
  children: Record<string, { min?: number; max?: number }>
): string[] => {
  const errors: string[] = [];

  for (const [component, { min, max }] of Object.entries(children)) {
    const node = nodes.find((n) => n.name === component);
    if (node) {
      if (min !== undefined && node.childCount < min) {
        errors.push(
          `${component}: needs at least ${min} children, got ${node.childCount}`
        );
      }
      if (max !== undefined && node.childCount > max) {
        errors.push(
          `${component}: max ${max} children, got ${node.childCount}`
        );
      }
    }
  }

  return errors;
};

/**
 * Validates JSX structure against a set of rules
 */
export const validateJsx = (
  jsx: string,
  rules: ValidationRules
): ValidationResult => {
  const root = parseJsx(jsx);
  const paths = flatten(root);
  const nodes = flattenWithMeta(root);
  const errors: string[] = [];

  // Validate required paths
  if (rules.paths) {
    const pathError = validatePaths(paths, rules.paths);
    if (pathError) errors.push(pathError);

    const extraError = validateExtraPaths(paths, rules.paths);
    if (extraError) errors.push(extraError);
  }

  // Validate duplicates
  if (rules.noDuplicates) {
    const dupError = validateDuplicates(paths);
    if (dupError) errors.push(dupError);
  }

  // Validate sequences
  if (rules.sequence) {
    errors.push(...validateSequence(nodes, rules.sequence));
  }

  // Validate props
  if (rules.props) {
    errors.push(...validateProps(nodes, rules.props));
  }

  // Validate children
  if (rules.children) {
    errors.push(...validateChildren(nodes, rules.children));
  }

  return { valid: errors.length === 0, errors };
};
