const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function writeFile(filename, content) {
  const outPath = path.resolve(process.cwd(), filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
  return { ok: true, filename, bytes: Buffer.byteLength(content, "utf8") };
}

function executeCommand(cmd) {
  const stdout = execSync(cmd, { stdio: "pipe" }).toString();
  return { ok: true, cmd, stdout };
}

module.exports = { writeFile, executeCommand };

