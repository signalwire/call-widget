const fs = require("fs");
const path = require("path");

// before any publication, this script checks
// if all the most important files are in sync.

const filePaths = [
  "./doc-for-c2c-widget/docs/_usage.mdx",
  "./embed-script/README.md",
  "./README.md",
];

function verifyFiles() {
  const contents = filePaths.map((filePath) => {
    try {
      return fs.readFileSync(path.join(__dirname, filePath), "utf8");
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      process.exit(1);
    }
  });

  const firstContent = contents[0];
  const mismatchedFiles = filePaths.filter(
    (filePath, index) => contents[index] !== firstContent
  );

  if (mismatchedFiles.length > 0) {
    console.error("Documentation files are not in sync:");
    console.error(mismatchedFiles.join("\n"));
    process.exit(1);
  }

  console.log("Documentation files are in sync");
}

verifyFiles();
