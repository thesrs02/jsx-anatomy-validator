import { test, expect, describe } from "bun:test";
import {
  validateJsx,
  parseJsx,
  flatten,
  flattenWithMeta,
  diff,
  dupes,
  seqMatch,
} from "../index";

describe("utils", () => {
  test("diff returns elements in a not in b", () => {
    expect(diff([1, 2, 3], [2, 3, 4])).toEqual([1]);
    expect(diff(["a", "b"], ["b"])).toEqual(["a"]);
    expect(diff([1, 2], [1, 2])).toEqual([]);
  });

  test("dupes returns duplicate elements", () => {
    expect(dupes([1, 2, 2, 3, 3, 3])).toEqual([2, 3, 3]);
    expect(dupes(["a", "b", "a"])).toEqual(["a"]);
    expect(dupes([1, 2, 3])).toEqual([]);
  });

  test("seqMatch checks repeating pattern", () => {
    expect(seqMatch(["A", "B", "A", "B"], ["A", "B"])).toBe(true);
    expect(seqMatch(["A", "B", "C"], ["A", "B"])).toBe(false);
    expect(seqMatch([], ["A"])).toBe(true);
  });
});

describe("parser", () => {
  test("parseJsx returns JSXElement", () => {
    const node = parseJsx("<App />");
    expect(node.type).toBe("JSXElement");
  });

  test("parseJsx throws on invalid input", () => {
    expect(() => parseJsx("const x = 1")).toThrow();
  });
});

describe("traversal", () => {
  test("flatten creates path array", () => {
    const jsx = `
      <App>
        <Header />
        <Main>
          <Content />
        </Main>
        <Footer />
      </App>
    `;
    const paths = flatten(parseJsx(jsx));
    expect(paths).toEqual([
      "App",
      "App>Header",
      "App>Main",
      "App>Main>Content",
      "App>Footer",
    ]);
  });

  test("flattenWithMeta includes metadata", () => {
    const jsx = `<App foo="bar"><Child /></App>`;
    const nodes = flattenWithMeta(parseJsx(jsx));

    expect(nodes[0]).toEqual({
      path: "App",
      name: "App",
      props: ["foo"],
      childCount: 1,
      children: ["Child"],
    });

    expect(nodes[1]).toEqual({
      path: "App>Child",
      name: "Child",
      props: [],
      childCount: 0,
      children: [],
    });
  });
});

describe("validateJsx", () => {
  const simpleJsx = `
    <App>
      <Header />
      <Main />
      <Footer />
    </App>
  `;

  test("validates correct paths", () => {
    const result = validateJsx(simpleJsx, {
      paths: ["App", "App>Header", "App>Main", "App>Footer"],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("detects missing paths", () => {
    const result = validateJsx(simpleJsx, {
      paths: ["App", "App>Header", "App>Main", "App>Footer", "App>Sidebar"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Missing");
    expect(result.errors[0]).toContain("App>Sidebar");
  });

  test("detects extra paths", () => {
    const result = validateJsx(simpleJsx, {
      paths: ["App", "App>Header"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Extra");
  });

  test("detects duplicates when noDuplicates is true", () => {
    const jsx = `
      <App>
        <Item />
        <Item />
      </App>
    `;
    const result = validateJsx(jsx, { noDuplicates: true });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Duplicates");
  });

  test("validates child sequence", () => {
    const result = validateJsx(simpleJsx, {
      sequence: { App: ["Header", "Main", "Footer"] },
    });
    expect(result.valid).toBe(true);

    const badResult = validateJsx(simpleJsx, {
      sequence: { App: ["Footer", "Main", "Header"] },
    });
    expect(badResult.valid).toBe(false);
    expect(badResult.errors[0]).toContain("wrong sequence");
  });

  test("validates required props", () => {
    const jsx = `<Button onClick={fn} disabled>Click</Button>`;
    const result = validateJsx(jsx, {
      props: { Button: ["onClick", "disabled"] },
    });
    expect(result.valid).toBe(true);

    const missingResult = validateJsx(jsx, {
      props: { Button: ["onClick", "type"] },
    });
    expect(missingResult.valid).toBe(false);
    expect(missingResult.errors[0]).toContain("missing props");
    expect(missingResult.errors[0]).toContain("type");
  });

  test("validates min children", () => {
    const jsx = `<List><Item /></List>`;
    const result = validateJsx(jsx, {
      children: { List: { min: 2 } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("needs at least 2 children");
  });

  test("validates max children", () => {
    const jsx = `<Container><A /><B /><C /></Container>`;
    const result = validateJsx(jsx, {
      children: { Container: { max: 2 } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("max 2 children");
  });

  test("combines multiple rules", () => {
    const jsx = `<Form id="login"><Input /><Submit /></Form>`;
    const result = validateJsx(jsx, {
      paths: ["Form", "Form>Input", "Form>Submit"],
      props: { Form: ["id"] },
      children: { Form: { min: 2, max: 3 } },
    });
    expect(result.valid).toBe(true);
  });

  test("validates complex AlertDialog component", () => {
    const jsx = `
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
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
        "AlertDialog>AlertDialogContent>AlertDialogHeader>AlertDialogTitle",
        "AlertDialog>AlertDialogContent>AlertDialogHeader>AlertDialogDescription",
        "AlertDialog>AlertDialogContent>AlertDialogFooter",
        "AlertDialog>AlertDialogContent>AlertDialogFooter>AlertDialogCancel",
        "AlertDialog>AlertDialogContent>AlertDialogFooter>AlertDialogAction",
      ],
      noDuplicates: true,
      sequence: {
        AlertDialog: ["AlertDialogTrigger", "AlertDialogContent"],
        AlertDialogHeader: ["AlertDialogTitle", "AlertDialogDescription"],
        AlertDialogFooter: ["AlertDialogCancel", "AlertDialogAction"],
      },
      children: {
        AlertDialog: { min: 2, max: 2 },
        AlertDialogContent: { min: 2, max: 2 },
      },
    };

    const result = validateJsx(jsx, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("AlertDialog fails with wrong sequence", () => {
    const jsx = `
      <AlertDialog>
        <AlertDialogContent>Content</AlertDialogContent>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
      </AlertDialog>
    `;

    const result = validateJsx(jsx, {
      sequence: {
        AlertDialog: ["AlertDialogTrigger", "AlertDialogContent"],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("wrong sequence");
  });
});
