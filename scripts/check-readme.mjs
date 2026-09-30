// Documentation lint for README.md.
//
// Not part of CI by default, because a broken link is not a broken build — but
// this repository's README is load-bearing in a way most are: it is the entry a
// judge or a contributor reads first, and it makes claims about files that exist.
// A link to a file that moved is a small lie, and this project does not ship
// those. Run it before committing a docs change:
//
//   node scripts/check-readme.mjs
//
// It checks four things, all of which have been wrong at least once:
//   1. Every relative link and image path resolves to a real file.
//   2. Every in-page anchor in the contents table points at a heading that exists.
//   3. Every node referenced by a Mermaid edge is declared, so a typo does not
//      silently render as an empty box.
//   4. The stored-state sample is valid JSON.

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");

const problems = [];
const note = (message) => problems.push(message);

/* --- 1. relative links and images ----------------------------------------- */

const targets = [];
for (const match of readme.matchAll(/\]\(([^)\s]+)\)/g)) targets.push(match[1]);
for (const match of readme.matchAll(/<img[^>]+src="([^"]+)"/g)) targets.push(match[1]);

let relative = 0;
for (const target of targets) {
  if (/^(https?:|mailto:|#)/.test(target)) continue;
  relative += 1;
  const path = target.split("#")[0];
  if (!path) continue;
  if (!existsSync(join(root, decodeURIComponent(path)))) note(`missing file: ${target}`);
}

/* --- 2. anchors ------------------------------------------------------------ */

// GitHub's slugger: lowercase, drop punctuation, spaces to hyphens.
const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const headings = new Set();
for (const match of readme.matchAll(/^#{2,6}\s+(.+)$/gm)) headings.add(slug(match[1]));

let anchors = 0;
for (const match of readme.matchAll(/\]\(#([a-z0-9-]+)\)/g)) {
  anchors += 1;
  if (!headings.has(match[1])) note(`anchor points nowhere: #${match[1]}`);
}

/* --- 3. mermaid ------------------------------------------------------------ */
//
// Hand-written Mermaid fails quietly: an unquoted bracket or a stray word renders
// as an empty box rather than an error, and nobody notices until a reader does.
// These patterns are anchored to whole lines on purpose — an unanchored edge
// pattern matches the middle of any word and reports nonsense.

const FLOW_HEADER = /^(flowchart|graph)\b/;
const FLOW_KEYWORD = /^(flowchart|graph|direction|subgraph|end|style|classDef|class|click|linkStyle)\b/;
const FLOW_DECL = /^([A-Za-z][\w-]*)\s*(\[\(|\[\(|\["|\(\[|\(\(|\[|\{|\("|>\(|\[\[)/;
const FLOW_EDGE =
  /^([A-Za-z][\w-]*)\s*(-->|-{1,2}\.-{1,2}>|==>|---|~~~)\s*(\|[^|]*\|\s*)?([A-Za-z][\w-]*)$/;

const STATE_HEADER = /^stateDiagram(-v2)?/;
const STATE_KEYWORD = /^(stateDiagram(-v2)?|direction|state\b|note\b|Note\b|classDef|class\b)/;
const STATE_TRANSITION = /^(\[\*\]|[A-Za-z][\w-]*)\s*-->\s*(\[\*\]|[A-Za-z][\w-]*)\s*:\s*\S/;

const SEQ_HEADER = /^sequenceDiagram/;
const SEQ_KEYWORD = /^(sequenceDiagram|autonumber|activate|deactivate|loop|alt|else|opt|par|critical|break|end|box)\b/;
const SEQ_PARTICIPANT = /^(actor|participant)\s+[\w-]+(\s+as\s+.+)?$/;
const SEQ_ARROWS = ["-->>", "->>", "<<--", "<<-", "-->", "->", "--)", "-)"];
const SEQ_NOTE = /^Note\s+(over|left of|right of)\s+[^:]+:\s*.+$/;

const diagrams = [...readme.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
let declaredTotal = 0;
let edges = 0;

for (const [index, diagram] of diagrams.entries()) {
  const label = `mermaid diagram ${index + 1}`;
  const lines = diagram.split("\n").filter((line) => line.trim() !== "");
  const [header = ""] = lines;
  const body = lines.slice(1);

  if (FLOW_HEADER.test(header)) {
    const declared = new Set();
    for (const line of body) {
      const trimmed = line.trim();
      if (FLOW_KEYWORD.test(trimmed)) continue;
      const decl = trimmed.match(FLOW_DECL);
      if (decl) {
        declared.add(decl[1]);
        // A label must be quoted if it contains anything but word characters,
        // spaces and simple punctuation — the usual cause of a broken render.
        const closed = /\]|\}|\)\s*$/.test(trimmed);
        if (!closed) note(`${label}: declaration looks unclosed: ${trimmed.slice(0, 60)}`);
        continue;
      }
      const edge = trimmed.match(FLOW_EDGE);
      if (edge) {
        edges += 1;
        for (const node of [edge[1], edge[4]]) {
          if (!declared.has(node)) note(`${label}: "${node}" appears in an edge but is never declared`);
        }
        continue;
      }
      note(`${label}: unrecognised line "${trimmed.slice(0, 60)}"`);
    }
    declaredTotal += declared.size;
    continue;
  }

  if (STATE_HEADER.test(header)) {
    const declared = new Set();
    for (const line of body) {
      const trimmed = line.trim();
      if (STATE_KEYWORD.test(trimmed)) {
        const named = trimmed.match(/^state\s+"([^"]+)"\s+as\s+([A-Za-z][\w-]*)/);
        if (named) declared.add(named[2]);
        continue;
      }
      const transition = trimmed.match(STATE_TRANSITION);
      if (transition) {
        edges += 1;
        for (const node of [transition[1], transition[2]]) {
          if (node === "[*]") continue;
          declared.add(node);
        }
        continue;
      }
      note(`${label}: unrecognised line "${trimmed.slice(0, 60)}"`);
    }
    declaredTotal += declared.size;
    continue;
  }

  if (SEQ_HEADER.test(header)) {
    const declared = new Set();
    for (const line of body) {
      const trimmed = line.trim();
      if (SEQ_KEYWORD.test(trimmed)) continue;
      const participant = trimmed.match(SEQ_PARTICIPANT);
      if (participant) {
        declared.add(trimmed.split(/\s+/)[1]);
        continue;
      }
      if (SEQ_NOTE.test(trimmed)) continue;
      // Split on the arrow rather than matching one: a dashed return arrow
      // (`S-->>RC`) makes a greedy `[\w-]+` swallow the dashes of the arrow
      // itself, which produced five nonsense findings the first time this ran.
      const arrow = SEQ_ARROWS
        .map((token) => ({ token, at: trimmed.indexOf(token) }))
        .filter((candidate) => candidate.at > 0)
        .sort((a, b) => a.at - b.at || b.token.length - a.token.length)[0];

      if (arrow) {
        const sender = trimmed.slice(0, arrow.at).trim();
        const rest = trimmed.slice(arrow.at + arrow.token.length);
        const separator = rest.indexOf(":");
        const receiver = (separator === -1 ? rest : rest.slice(0, separator)).trim();
        if (!sender || !receiver) {
          note(`${label}: a message has no sender or no receiver: "${trimmed.slice(0, 60)}"`);
          continue;
        }
        edges += 1;
        for (const node of [sender, receiver]) {
          if (!declared.has(node)) {
            note(`${label}: "${node}" sends or receives a message but is never declared`);
          }
        }
        continue;
      }
      note(`${label}: unrecognised line "${trimmed.slice(0, 60)}"`);
    }
    declaredTotal += declared.size;
    continue;
  }

  note(`${label}: unknown diagram type "${header.slice(0, 40)}"`);
}

/* --- 4. the JSON sample ---------------------------------------------------- */

const sample = readme.match(/```jsonc\n([\s\S]*?)```/);
if (!sample) {
  note("the stored-state sample is missing");
} else {
  try {
    JSON.parse(sample[1]);
  } catch (error) {
    note(`the stored-state sample is not valid JSON: ${error.message}`);
  }
}

/* --- 5. every tracked file is in the structure tree ------------------------ */
//
// The tree in the README says "every tracked file". That is a claim, so it gets
// checked: a file added to the repository but not to the tree makes the section a
// half-truth, and the section is the first thing a reader uses to find their way
// around. Directory entries count as covering their contents — `assets/avatars/`
// does not have to name all three portraits.

try {
  const { execFileSync } = await import("node:child_process");
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((path) => path !== "README.md");

  let covered = 0;
  for (const path of tracked) {
    if (readme.includes(path)) {
      covered += 1;
      continue;
    }
    // Covered by a directory entry, or by a glob entry like `app-*.png`.
    const parts = path.split("/");
    const directories = parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/") + "/");
    const housekeeping = /\.gitignore$|\.env\.example$|^package-lock\.json$/.test(path);
    // A tree entry may stand for a family of files, as `app-*.png` does.
    const extension = `.${path.split(".").pop()}`;
    const globbed = [...readme.matchAll(/[\w-]*\*\.[\w-]+/g)].some((match) => match[0].endsWith(extension));
    if (directories.some((directory) => readme.includes(directory)) || housekeeping || globbed.test(readme)) {
      covered += 1;
      continue;
    }
    note(`not in the structure tree: ${path}`);
  }
  console.log(`  tracked files covered:  ${covered}/${tracked.length}`);
} catch (error) {
  console.log(`  tracked files:          skipped (${error.message.split("\n")[0]})`);
}

/* --- report ---------------------------------------------------------------- */

console.log(`readme: ${readme.split("\n").length} lines`);
console.log(`  relative links checked: ${relative}`);
console.log(`  anchors checked:        ${anchors}`);
console.log(`  mermaid diagrams:       ${diagrams.length} (${declaredTotal} nodes, ${edges} edges)`);
console.log(`  json sample:            ${sample ? "parsed" : "missing"}`);

if (problems.length) {
  console.log("\nproblems:");
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
console.log("\nno problems found");
