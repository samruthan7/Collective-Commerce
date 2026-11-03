import { execFileSync } from "node:child_process";

// Names of all files staged for this commit.
const staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

// A real env file is ".env" or ".env.<anything>", except ".env.example".
function isSecretEnvFile(path) {
  const name = path.split("/").pop() ?? "";
  return name === ".env" || (name.startsWith(".env.") && name !== ".env.example");
}

const offenders = staged.filter(isSecretEnvFile);

if (offenders.length > 0) {
  console.error("\nCommit blocked: environment files may contain secrets.\n");
  for (const file of offenders) {
    console.error(`  - ${file}`);
  }
  console.error("\nUnstage them with:  git restore --staged <file>");
  console.error("Only .env.example files (with fake values) may be committed.\n");
  process.exit(1);
}
