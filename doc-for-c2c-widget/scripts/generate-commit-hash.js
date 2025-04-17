const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const getCommitHash = () => {
  return execSync("git rev-parse HEAD").toString().trim();
};

const generateCommitHashDoc = () => {
  const commitHash = getCommitHash();
  const commitUrl = `https://github.com/signalwire/call-widget/commit/${commitHash}`;
  const content = `[${commitHash}](${commitUrl})`;

  const outputPath = path.join(__dirname, "../docs/_generated/commit_hash.mdx");
  fs.writeFileSync(outputPath, content);
};

const generateCdnCommitHashDoc = () => {
  const commitHash = getCommitHash();
  const commitUrl = `https://github.com/signalwire/call-widget/commit/${commitHash}`;
  const content = `[${commitHash}](${commitUrl})`;

  const outputPath = path.join(
    __dirname,
    "../docs/_generated/cdn_commit_hash.mdx"
  );
  fs.writeFileSync(outputPath, content);
};

if (process.argv[2] === "--cdn") {
  generateCdnCommitHashDoc();
} else {
  generateCommitHashDoc();
}
