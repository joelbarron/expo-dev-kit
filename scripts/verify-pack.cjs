#!/usr/bin/env node
const { execSync } = require("node:child_process");

const output = execSync("npm pack --dry-run --json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const pack = JSON.parse(output);
const files = (Array.isArray(pack) ? pack[0]?.files : pack.files) ?? [];
const paths = new Set(files.map((entry) => entry.path));

const requiredFiles = ["dist/index.js", "dist/index.d.ts"];
const missing = requiredFiles.filter((required) => !paths.has(required));

if (missing.length > 0) {
  console.error(`Missing required files in npm pack payload: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`npm pack payload OK. Total files: ${files.length}`);
