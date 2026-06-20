function getGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  return {
    owner: match[1],
    repo: match[2].replace(".git", ""),
  };
}

export async function getReadmeContent(owner: string, repo: string) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: getGitHubHeaders(),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string
) {
  try {
    const safePath = path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${safePath}`,
      {
        headers: getGitHubHeaders(),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    if (!data.content) {
      return null;
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    console.error("Failed to fetch file content:", path, error);
    return null;
  }
}

export function getImportantFiles(tree: any[]) {
  const importantFileNames = [
    "README.md",
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.ts",
    "vite.config.js",
    "vite.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "app.json",
    "app.config.js",
    "app.config.ts",
    "expo/app.json",
    "pubspec.yaml",
  ];

  return tree
    .filter((file) => {
      const path = file.path;

      return (
        file.type === "blob" &&
        (
          importantFileNames.includes(path) ||
          path === "src/app/page.tsx" ||
          path === "src/app/layout.tsx" ||
          path === "app/page.tsx" ||
          path === "app/layout.tsx" ||
          path === "src/index.ts" ||
          path === "src/index.tsx" ||
          path.includes("/api/") ||
          path.includes("/lib/") ||
          path.includes("/components/")
        )
      );
    })
    .slice(0, 12);
}

export async function getRepoTree(owner: string, repo: string) {
  const repoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (!repoRes.ok) {
    throw new Error("Repository not found");
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${defaultBranch}`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (!branchRes.ok) {
    throw new Error("Branch not found");
  }

  const branchData = await branchRes.json();
  const sha = branchData.commit.sha;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (!treeRes.ok) {
    throw new Error("Failed to fetch repository tree");
  }

  const treeData = await treeRes.json();

  return treeData.tree;
}