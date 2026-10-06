#!/usr/bin/env node
/**
 * Generate a training-plan tab from a schedule exported out of a spreadsheet.
 *
 *   npm run new-plan -- schedule.tsv --name "Boston 2027" --end 2027-04-17
 *
 * The schedule is one row per week, tab- or comma-separated:
 *
 *   cycle <tab> Sun <tab> Mon <tab> Tue <tab> Wed <tab> Thu <tab> Fri <tab> Sat <tab> total
 *
 * Cells are already in calendar order — whatever day-shifting a source sheet
 * needs is done when preparing the file, not here. Cell text is carried through
 * verbatim; `src/data/plan.ts` derives effort and mileage target from it.
 *
 * Dates count backwards from `--end`, the last day of the grid, so adding or
 * removing a week moves the start and leaves race day where it is.
 *
 * Writes:
 *   src/data/<camel>.ts    the plan data
 *   src/pages/<Pascal>.tsx a page rendering it through <PlanCalendar>
 *   src/App.tsx            + one route
 *   src/components/Layout.tsx + one nav item
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src");
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const USAGE = `
Usage: npm run new-plan -- <schedule.tsv> [options]

Required (as a flag, or as a "# key: value" line at the top of the schedule):
  --name <text>          Tab label and page heading
  --end <YYYY-MM-DD>     Last day of the plan; must be a Saturday

Options:
  --eyebrow <text>       Kicker above the heading   [default: "<name> · N weeks"]
  --slug <text>          Route path                 [default: derived from name]
  --long-day <Sun..Sat>  Column holding the long run      [default: Fri]
  --recovery-day <day>   Column holding the recovery run  [default: Sat]
  --note <text>          Footnote under the calendar (repeatable)
  --dry-run              Print what would be written, change nothing
  --force                Overwrite existing generated files
`.trimStart();

/* ------------------------------------------------------------------ args -- */

const FLAGS = new Set(["--dry-run", "--force", "-h", "--help"]);

function parseArgs(argv) {
  const opts = { note: [] };
  let file = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--") && !arg.startsWith("-")) {
      if (file) die(`unexpected extra argument: ${arg}`);
      file = arg;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(USAGE);
      process.exit(0);
    }
    const key = arg.replace(/^--/, "");
    if (FLAGS.has(arg)) {
      opts[key] = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined) die(`${arg} needs a value`);
    if (key === "note") opts.note.push(value);
    else opts[key] = value;
  }

  if (!file) die("no schedule file given");
  return { file, opts };
}

function die(message) {
  process.stderr.write(`new-plan: ${message}\n\n${USAGE}`);
  process.exit(1);
}

/* -------------------------------------------------------------- schedule -- */

/** Split one delimited line, honouring double-quoted fields. */
function splitLine(line, delimiter) {
  const out = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === delimiter) {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

/** Does this row look like a `Cycle | Sun | Mon | …` header rather than a week? */
function isHeaderRow(fields) {
  const lower = fields.map((f) => f.toLowerCase());
  return lower[0] === "cycle" || lower[0] === "" || DAY_NAMES.includes(lower[1]?.slice(0, 3));
}

/**
 * Read a schedule file into `{ meta, rows }`.
 *
 * `# key: value` lines carry metadata, so a schedule can be self-describing and
 * the command line only needs the file. Any other `#` line is a comment.
 */
function readSchedule(path) {
  if (!existsSync(path)) die(`no such file: ${path}`);
  const text = readFileSync(path, "utf8");
  const delimiter = text.includes("\t") ? "\t" : ",";

  const meta = { note: [] };
  const rows = [];
  const warnings = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const lineNo = index + 1;
    if (!line.trim()) return;

    if (line.trimStart().startsWith("#")) {
      const m = /^#\s*([\w-]+)\s*:\s*(.+)$/.exec(line.trim());
      if (!m) return;
      const [, key, value] = m;
      if (key === "note") meta.note.push(value.trim());
      else meta[key] = value.trim();
      return;
    }

    const fields = splitLine(line, delimiter);
    if (rows.length === 0 && isHeaderRow(fields)) return;

    if (fields.length !== 9) {
      die(
        `line ${lineNo}: expected 9 ${delimiter === "\t" ? "tab" : "comma"}-separated fields ` +
          `(cycle, 7 days, total) but found ${fields.length}\n  ${line}`,
      );
    }

    const [cycle, ...rest] = fields;
    const cells = rest.slice(0, 7);
    const total = rest[7];

    if (!cycle) die(`line ${lineNo}: missing cycle label`);
    if (!/^\d/.test(total)) {
      die(`line ${lineNo}: weekly total must start with a number, found "${total}"`);
    }
    cells.forEach((cell, i) => {
      if (!cell) {
        cells[i] = "REST";
        warnings.push(`line ${lineNo}: empty ${DAY_NAMES[i]} cell read as REST`);
      }
    });

    rows.push({ cycle, cells, total });
  });

  if (!rows.length) die("schedule has no week rows");
  return { meta, rows, warnings };
}

/* ----------------------------------------------------------------- dates -- */

function parseISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const ok = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return ok ? date : null;
}

function toISO(d) {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Column index for a `--long-day` / `--recovery-day` value. */
function dayIndex(value, flag) {
  if (/^[0-6]$/.test(value)) return Number(value);
  const i = DAY_NAMES.indexOf(String(value).toLowerCase().slice(0, 3));
  if (i < 0) die(`${flag}: expected 0-6 or Sun…Sat, got "${value}"`);
  return i;
}

/* ----------------------------------------------------------------- names -- */

function slugify(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) die(`cannot derive a slug from name "${name}" — pass --slug`);
  return slug;
}

function names(name, slugOverride) {
  const slug = slugify(slugOverride ?? name);
  const parts = slug.split("-");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  let pascal = parts.map(cap).join("");
  let camel = parts[0] + parts.slice(1).map(cap).join("");
  let constant = parts.join("_").toUpperCase();

  // Identifiers cannot start with a digit — "50-miler" needs a prefix.
  if (/^\d/.test(slug)) {
    pascal = `Plan${pascal}`;
    camel = `plan${pascal.slice(4)}`;
    constant = `PLAN_${constant}`;
  }
  return { slug, pascal, camel, constant };
}

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/* ------------------------------------------------------------- emit data -- */

function renderRows(rows) {
  const cycleWidth = Math.max(...rows.map((r) => r.cycle.length));
  const cellWidth = Array.from({ length: 7 }, (_, i) =>
    Math.max(...rows.map((r) => r.cells[i].length)),
  );

  return rows
    .map((row) => {
      const cycle = `"${esc(row.cycle)}",`.padEnd(cycleWidth + 3);
      const cells = row.cells
        .map((cell, i) => {
          const lit = `"${esc(cell)}"`;
          return i === 6 ? lit.padEnd(cellWidth[i] + 2) : `${lit},`.padEnd(cellWidth[i] + 3);
        })
        .join(" ");
      return `  { cycle: ${cycle} cells: [${cells}], total: "${esc(row.total)}" },`;
    })
    .join("\n");
}

function renderData({ config, rows, source }) {
  const extras = [];
  if (config.longIndex !== 5) extras.push(`  longIndex: ${config.longIndex},`);
  if (config.recoveryIndex !== 6) extras.push(`  recoveryIndex: ${config.recoveryIndex},`);
  if (config.notes.length) {
    extras.push("  notes: [");
    for (const note of config.notes) extras.push(`    "${esc(note)}",`);
    extras.push("  ],");
  }

  return `/**
 * ${config.name} — ${rows.length} weeks.
 *
 * Generated by \`scripts/new-plan.mjs\` from \`${source}\`. Cells are carried
 * through verbatim; \`./plan\` derives each day's effort and mileage target from
 * the cell text, and every date counts backwards from END_DATE.
 *
 * Safe to hand-edit — regenerating overwrites it, so keep the schedule file in
 * step with any change made here.
 */

import { buildPlan, startFromEnd } from "./plan";
import type { PlanRow, TrainingPlan } from "./plan";

/** Last day of the grid. Week 1 is dated backwards from here. */
export const END_DATE = "${config.end}";

/** One row per week, Sunday → Saturday. Week numbers follow row order. */
const ROWS: PlanRow[] = [
${renderRows(rows)}
];

export const ${config.constant}: TrainingPlan = buildPlan({
  title: "${esc(config.name)}",
  eyebrow: "${esc(config.eyebrow)}",
  rows: ROWS,
  start: startFromEnd(END_DATE, ROWS.length),
${extras.length ? `${extras.join("\n")}\n` : ""}});
`;
}

function renderPage({ pascal, camel, constant }) {
  return `import PlanCalendar from "../components/PlanCalendar";
import { ${constant} } from "../data/${camel}";

export default function ${pascal}() {
  return <PlanCalendar plan={${constant}} />;
}
`;
}

/* ------------------------------------------------------------ wire it up -- */

/** Add the route and its import to App.tsx. Returns the new source, or null. */
function patchApp(source, { slug, pascal }) {
  if (source.includes(`path="${slug}"`)) return null;

  const imports = [...source.matchAll(/^import .+ from "\.\/pages\/.+";$/gm)];
  if (!imports.length) throw new Error("App.tsx: found no page imports to insert after");
  const lastImport = imports[imports.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;

  let out =
    source.slice(0, insertAt) +
    `\nimport ${pascal} from "./pages/${pascal}";` +
    source.slice(insertAt);

  // Insert as the last child of the layout route, matching its indentation.
  const closing = /^([ \t]*)<\/Route>/m.exec(out);
  if (!closing) throw new Error("App.tsx: found no </Route> to insert before");
  const route = `${closing[1]}  <Route path="${slug}" element={<${pascal} />} />\n`;
  return out.slice(0, closing.index) + route + out.slice(closing.index);
}

/** Add the nav item to Layout.tsx, after the last plan tab. Returns the new source, or null. */
function patchLayout(source, { slug, name }) {
  if (source.includes(`to: "/${slug}"`)) return null;

  const entry = `  { to: "/${slug}", label: "${esc(name)}" },\n`;
  // Plan tabs group after Training; Gear and Health stay at the bottom.
  const gear = source.indexOf('  { to: "/gear"');
  if (gear >= 0) return source.slice(0, gear) + entry + source.slice(gear);

  const end = source.indexOf("];", source.indexOf("const navItems"));
  if (end < 0) throw new Error("Layout.tsx: found no navItems array to extend");
  return source.slice(0, end) + entry + source.slice(end);
}

/* ------------------------------------------------------------------ main -- */

function main() {
  const { file, opts } = parseArgs(process.argv.slice(2));
  const { meta, rows, warnings } = readSchedule(file);

  // Command line wins over the schedule's own `# key: value` header.
  const pick = (key) => opts[key] ?? meta[key];
  const name = pick("name");
  const end = pick("end");
  if (!name) die("missing --name (or a `# name:` line in the schedule)");
  if (!end) die("missing --end (or an `# end:` line in the schedule)");

  const endDate = parseISO(end);
  if (!endDate) die(`--end: "${end}" is not a valid YYYY-MM-DD date`);
  if (endDate.getDay() !== 6) {
    const next = toISO(addDays(endDate, (6 - endDate.getDay() + 7) % 7));
    die(
      `--end must be a Saturday — a plan week runs Sunday → Saturday, so the grid ends on one.\n` +
        `  ${end} is a ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][endDate.getDay()]}. ` +
        `Did you mean --end ${next}?\n` +
        `  If race day falls mid-week, put it in that week's column and use the Saturday after it.`,
    );
  }

  const config = {
    name,
    end,
    eyebrow: pick("eyebrow") ?? `${name} · ${rows.length} weeks`,
    notes: [...meta.note, ...opts.note],
    longIndex: dayIndex(pick("long-day") ?? "fri", "--long-day"),
    recoveryIndex: dayIndex(pick("recovery-day") ?? "sat", "--recovery-day"),
    ...names(name, pick("slug")),
  };

  const dataPath = join(SRC, "data", `${config.camel}.ts`);
  const pagePath = join(SRC, "pages", `${config.pascal}.tsx`);
  const appPath = join(SRC, "App.tsx");
  const layoutPath = join(SRC, "components", "Layout.tsx");

  for (const path of [dataPath, pagePath]) {
    if (existsSync(path) && !opts.force) {
      die(`${path} already exists — pass --force to overwrite`);
    }
  }

  const writes = [
    [dataPath, renderData({ config, rows, source: basename(file) })],
    [pagePath, renderPage(config)],
  ];

  const app = patchApp(readFileSync(appPath, "utf8"), config);
  if (app) writes.push([appPath, app]);
  const layout = patchLayout(readFileSync(layoutPath, "utf8"), { slug: config.slug, name });
  if (layout) writes.push([layoutPath, layout]);

  for (const w of warnings) process.stderr.write(`  warning: ${w}\n`);

  const start = toISO(addDays(endDate, -(rows.length * 7 - 1)));
  process.stdout.write(
    `${config.name} — ${rows.length} weeks, ${start} → ${config.end}, route /${config.slug}\n`,
  );

  if (opts["dry-run"]) {
    for (const [path, content] of writes) {
      process.stdout.write(`\n--- ${path} ---\n${content}`);
    }
    process.stdout.write("\n(dry run — nothing written)\n");
    return;
  }

  for (const [path, content] of writes) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    process.stdout.write(`  wrote ${path}\n`);
  }
  if (!app) process.stdout.write(`  App.tsx already routes /${config.slug} — left alone\n`);
  if (!layout) process.stdout.write(`  Layout.tsx already links /${config.slug} — left alone\n`);

  process.stdout.write("\nNext: npm run lint && npm run build\n");
}

main();
