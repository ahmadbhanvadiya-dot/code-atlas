export function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

export async function getReadmeContent(
  owner: string,
  repo: string
) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    return Buffer.from(
      data.content,
      "base64"
    ).toString("utf-8");
  } catch {
    return null;
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string
) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const data = await res.json();

  const content = Buffer.from(
    data.content,
    "base64"
  ).toString("utf-8");

  return content;
}

export function getImportantFiles(tree: any[]) {
  const importantFiles = [
    "README.md",
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.ts",
    "vite.config.js",
    "vite.config.ts",
  ];

  return tree.filter((file) => {
    const path = file.path;

    return (
      importantFiles.includes(path) ||
      path === "src/app/page.tsx" ||
      path === "src/index.ts" ||
      path === "app/page.tsx"
    );
  });
}

export async function getRepoTree(
  owner: string,
  repo: string
) {
  // Get repository details
  const repoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`
  );

  if (!repoRes.ok) {
    throw new Error("Repository not found");
  }

  const repoData = await repoRes.json();

  const defaultBranch = repoData.default_branch;

  // Get branch info to obtain latest commit SHA
  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${defaultBranch}`
  );

  if (!branchRes.ok) {
    throw new Error("Branch not found");
  }

  const branchData = await branchRes.json();

  const sha = branchData.commit.sha;

  // Get repository tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`
  );

  if (!treeRes.ok) {
    throw new Error("Failed to fetch repository tree");
  }

  const treeData = await treeRes.json();

  return treeData.tree;
}