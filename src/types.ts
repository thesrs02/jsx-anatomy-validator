import type { JSXElement } from "@babel/types";

/**
 * Metadata about a JSX node in the flattened tree
 */
export interface NodeMeta {
  /** Full path from root (e.g., "Parent>Child>GrandChild") */
  path: string;
  /** Component name */
  name: string;
  /** Props defined on this element */
  props: string[];
  /** Number of JSX element children */
  childCount: number;
  /** Names of immediate JSX element children */
  children: string[];
}

/**
 * Child count constraints
 */
export interface ChildConstraint {
  min?: number;
  max?: number;
}

/**
 * Validation rules for JSX structure
 */
export interface ValidationRules {
  /** Required component paths (e.g., ["App", "App>Header", "App>Footer"]) */
  paths?: string[];
  /** Disallow duplicate paths */
  noDuplicates?: boolean;
  /** Required child sequence patterns by parent component name */
  sequence?: Record<string, string[]>;
  /** Required props by component name */
  props?: Record<string, string[]>;
  /** Child count constraints by component name */
  children?: Record<string, ChildConstraint>;
}

/**
 * Result of JSX validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of error messages */
  errors: string[];
}

/**
 * Re-export JSXElement for internal use
 */
export type { JSXElement };
