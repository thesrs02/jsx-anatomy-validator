import { parse } from "@babel/parser";
import type { JSXElement, JSXIdentifier, JSXAttribute } from "@babel/types";

/**
 * Parses JSX string and returns the root JSXElement
 */
export const parseJsx = (jsx: string): JSXElement => {
  const ast = parse(jsx, { plugins: ["jsx"] });
  const expr = ast.program.body[0];

  if (expr?.type !== "ExpressionStatement") {
    throw new Error("Invalid JSX: expected expression statement");
  }

  if (expr.expression.type !== "JSXElement") {
    throw new Error("Invalid JSX: expected JSX element");
  }

  return expr.expression;
};

/**
 * Gets the component name from a JSXElement
 */
export const getName = (node: JSXElement): string => {
  const name = node.openingElement.name;
  if (name.type === "JSXIdentifier") {
    return name.name;
  }
  // Handle JSXMemberExpression (e.g., <Foo.Bar />)
  if (name.type === "JSXMemberExpression") {
    const obj = name.object as JSXIdentifier;
    const prop = name.property as JSXIdentifier;
    return `${obj.name}.${prop.name}`;
  }
  return "unknown";
};

/**
 * Gets JSXElement children of a node
 */
export const getChildren = (node: JSXElement): JSXElement[] =>
  node.children.filter((c): c is JSXElement => c.type === "JSXElement");

/**
 * Gets prop names from a JSXElement
 */
export const getProps = (node: JSXElement): string[] =>
  node.openingElement.attributes
    .filter((a): a is JSXAttribute => a.type === "JSXAttribute")
    .map((a) => (a.name as JSXIdentifier).name)
    .filter(Boolean);
