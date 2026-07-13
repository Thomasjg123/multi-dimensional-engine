// Line-count checker. Lists every .html/.js/.css/.json in this folder
// and warns if any file exceeds MAX lines (default 100).
// Run: node check-lines.js
const fs = require("fs");
const path = require("path");

const MAX = 100;
const exts = [".html", ".js", ".css", ".json"];
const dir = __dirname;

const files = fs
  .readdirSync(dir)
  .filter((f) => exts.includes(path.extname(f)))
  .sort();

let bad = 0;
console.log("file                        lines  status");
console.log("----------------------------------------");
for (const f of files) {
  const n = fs.readFileSync(path.join(dir, f), "utf8").split("\n").length;
  const over = n > MAX;
  if (over) bad++;
  const flag = over ? "OVER 100" : "ok";
  console.log(f.padEnd(26), String(n).padStart(4), "  " + flag);
}

console.log("----------------------------------------");
console.log(bad === 0 ? "All files within line limit." : bad + " file(s) over limit.");
