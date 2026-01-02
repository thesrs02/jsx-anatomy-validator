// Main export
export { validateJsx } from "./validators";

// Types
export type {
  ValidationRules,
  ValidationResult,
  NodeMeta,
  ChildConstraint,
} from "./types";

// Lower-level utilities for advanced usage
export { parseJsx, getName, getChildren, getProps } from "./parser";
export { flatten, flattenWithMeta } from "./traversal";
export { diff, dupes, seqMatch } from "./utils";
