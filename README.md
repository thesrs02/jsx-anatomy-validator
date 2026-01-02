# jsx-anatomy-validator

Validate JSX component structure, hierarchy, props, and children.

## Installation

```bash
npm install @rehan-h/jsx-anatomy-validator
```

## Usage

```typescript
import { validateJsx } from "@rehan-h/jsx-anatomy-validator";

const jsx = `
<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Title</AlertDialogTitle>
      <AlertDialogDescription>Description</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
`;

const rules = {
  paths: [
    "AlertDialog",
    "AlertDialog>AlertDialogTrigger",
    "AlertDialog>AlertDialogContent",
    "AlertDialog>AlertDialogContent>AlertDialogHeader",
    "AlertDialog>AlertDialogContent>AlertDialogFooter",
  ],
  noDuplicates: true,
  sequence: {
    AlertDialog: ["AlertDialogTrigger", "AlertDialogContent"],
  },
  children: {
    AlertDialog: { min: 2, max: 2 },
  },
};

const result = validateJsx(jsx, rules);
// { valid: true, errors: [] }
```

## Rules

| Rule | Type | Description |
|------|------|-------------|
| `paths` | `string[]` | Required component paths (e.g., `["App", "App>Header"]`) |
| `noDuplicates` | `boolean` | Disallow duplicate component paths |
| `sequence` | `Record<string, string[]>` | Required child order per parent |
| `props` | `Record<string, string[]>` | Required props per component |
| `children` | `Record<string, { min?, max? }>` | Child count constraints |

## Examples

### Validate paths

```typescript
validateJsx("<App><Header /><Footer /></App>", {
  paths: ["App", "App>Header", "App>Footer"],
});
```

### Require props

```typescript
validateJsx("<Button>Click</Button>", {
  props: { Button: ["onClick", "disabled"] },
});
// { valid: false, errors: ["Button: missing props onClick, disabled"] }
```

### Enforce child order

```typescript
validateJsx("<Form><Submit /><Input /></Form>", {
  sequence: { Form: ["Input", "Submit"] },
});
// { valid: false, errors: ["Form: wrong sequence, expected Input -> Submit"] }
```

### Limit children

```typescript
validateJsx("<List><Item /><Item /><Item /></List>", {
  children: { List: { max: 2 } },
});
// { valid: false, errors: ["List: max 2 children, got 3"] }
```

### No duplicates

```typescript
validateJsx("<App><Item /><Item /></App>", {
  noDuplicates: true,
});
// { valid: false, errors: ["Duplicates: App>Item"] }
```

## API

### `validateJsx(jsx: string, rules: ValidationRules): ValidationResult`

Main validation function.

### Types

```typescript
interface ValidationRules {
  paths?: string[];
  noDuplicates?: boolean;
  sequence?: Record<string, string[]>;
  props?: Record<string, string[]>;
  children?: Record<string, { min?: number; max?: number }>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Utilities

Lower-level functions are also exported for advanced usage:

```typescript
import {
  parseJsx,      // Parse JSX string to AST
  flatten,       // Get all component paths
  flattenWithMeta, // Get paths with metadata (props, children)
} from "@rehan-h/jsx-anatomy-validator";
```

## License

MIT
