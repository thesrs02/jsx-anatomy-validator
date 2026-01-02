import type { JSXElement } from "@babel/types";
import type { NodeMeta } from "./types";
import { getName, getChildren, getProps } from "./parser";

/**
 * Flattens JSX tree into an array of component paths
 * @example ["App", "App>Header", "App>Header>Logo", "App>Footer"]
 */
export const flatten = (node: JSXElement, path = ""): string[] => {
  const current = path ? `${path}>${getName(node)}` : getName(node);
  return [current, ...getChildren(node).flatMap((c) => flatten(c, current))];
};

/**
 * Flattens JSX tree into an array of node metadata objects
 */
export const flattenWithMeta = (node: JSXElement, path = ""): NodeMeta[] => {
  const name = getName(node);
  const current = path ? `${path}>${name}` : name;
  const kids = getChildren(node);

  return [
    {
      path: current,
      name,
      props: getProps(node),
      childCount: kids.length,
      children: kids.map(getName),
    },
    ...kids.flatMap((c) => flattenWithMeta(c, current)),
  ];
};
