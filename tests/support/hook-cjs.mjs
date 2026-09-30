/**
 * The resolve/load hooks, in their own file because Node loads hooks in a
 * dedicated thread (`module.register()` requirement), separate from the thread
 * that calls `register()`.
 *
 * Every URL below is derived from `import.meta.url` — never from joined,
 * stripped, re-filed path strings. A directory URL's trailing separator and a
 * Windows backslash both silently break prefix comparison, and one of those
 * two cost a real debugging session; relative-to-self URLs cannot have either
 * problem.
 *
 * See `load-ts.mjs` for what these hooks deliberately do and do not do.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

/** The store module under test, by URL relative to this file. */
const SOURCE_URL = new URL("../../src/storage/careStore.ts", import.meta.url).href;
/** The storage double that replaces `src/storage/fileStore.ts` for tests. */
const DOUBLE_URL = new URL("./fileStore-double.mjs", import.meta.url).href;

async function resolve(specifier, context, nextResolve) {
  // The storage double, in place of the real platform file, only for the
  // store itself — nothing else is remapped. The parent check is a prefix
  // test because the store is imported with a `?storage=double` query, so
  // parentURL is the file URL plus that suffix.
  if (specifier === "./fileStore" && context.parentURL?.startsWith(SOURCE_URL)) {
    return { url: DOUBLE_URL, shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    // The app's imports are extensionless (`../data/care`), which Metro
    // resolves and Node does not. Retry with the real extension appended.
    if (
      error?.code === "ERR_MODULE_NOT_FOUND" &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !path.extname(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    // `care.ts` calls `require("../../assets/<name>.png")` for portraits.
    // Resolution of that throws under ESM, so it is answered here with an
    // opaque, stable identity; the load hook turns it into a harmless object.
    if (specifier.includes("assets/") && specifier.endsWith(".png")) {
      return { url: `collos-asset:${specifier}`, shortCircuit: true };
    }
    throw error;
  }
}

async function load(url, context, nextLoad) {
  if (url.startsWith("collos-asset:")) {
    return {
      format: "module",
      source: "export default Object.freeze({ testAsset: true });",
      shortCircuit: true,
    };
  }
  // A module can be imported with a query (`?storage=double`), which changes
  // its identity but not its file; the extension check must look past it.
  const filePathFull = url.split("?")[0];
  if (!url.startsWith("file:") || !filePathFull.endsWith(".ts")) return nextLoad(url, context);

  const filePath = fileURLToPath(filePathFull);
  let source = await readFile(filePath, "utf8");

  // `care.ts` uses CommonJS `require()` for portrait assets. Under ESM that
  // throws `ReferenceError: require is not defined` at import time, so the
  // calls are replaced before transpile: a plain function stands in, and the
  // portrait is never dereferenced in a test, only carried.
  if (filePath.endsWith(`src${path.sep}data${path.sep}care.ts`)) {
    source = source.replace(
      /require\((["'])([^"']*assets\/[^"']*\.png)\1\)/g,
      'COLLOS_TEST_ASSET("$2")',
    );
    source =
      "const COLLOS_TEST_ASSET = (specifier) => ({ testAsset: specifier });\n" + source;
  }

  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
    fileName: filePath,
  }).outputText;

  return {
    format: "module",
    source: `${output}\n//# sourceURL=${url}`,
    shortCircuit: true,
  };
}

export { resolve, load };
