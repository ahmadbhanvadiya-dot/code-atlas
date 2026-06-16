import { NextResponse } from "next/server";
import {
  parseGitHubUrl,
  getRepoTree,
  getImportantFiles,
  getFileContent,
  getReadmeContent,
} from "@/lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { owner, repo } = parseGitHubUrl(body.repoUrl);

    const tree = await getRepoTree(owner, repo);
    const importantFiles = getImportantFiles(tree);
    

    let projectInfo = null;

try {
  const packageJsonContent = await getFileContent(
    owner,
    repo,
    "package.json"
  );

  const packageJson = JSON.parse(packageJsonContent);

  projectInfo = {
    name: packageJson.name,
    version: packageJson.version,
    packageManager: packageJson.packageManager,
    scripts: Object.keys(packageJson.scripts || {}),
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(
      packageJson.devDependencies || {}
    ).slice(0, 20),
  };
} catch (error) {
  console.error("Failed to parse package.json", error);
}

const readme = await getReadmeContent(
  owner,
  repo
);

return NextResponse.json({
  success: true,
  owner,
  repo,
  totalFiles: tree.length,
  importantFiles,
  projectInfo,
  readmePreview: readme?.slice(0, 1000)
});
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze repository",
      },
      { status: 500 }
    );
  }
}