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
  const packageJsonFile = tree.find(
    (file: any) =>
      file.type === "blob" &&
      (file.path === "package.json" ||
        file.path.endsWith("/package.json"))
  );

  const packageJsonContent = packageJsonFile
    ? await getFileContent(owner, repo, packageJsonFile.path)
    : null;

  if (packageJsonContent) {
    const packageJson = JSON.parse(packageJsonContent);

    projectInfo = {
      name: packageJson.name,
      version: packageJson.version,
      packageManager: packageJson.packageManager,
      packagePath: packageJsonFile.path,
      scripts: Object.keys(packageJson.scripts || {}),
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(
        packageJson.devDependencies || {}
      ).slice(0, 20),
    };
  }
} catch (error) {
  console.error("Failed to parse package.json", error);
} 

    const readme = await getReadmeContent(owner, repo);

    const importantFileContents = await Promise.all(
      importantFiles.slice(0, 8).map(async (file: any) => {
        const content = await getFileContent(owner, repo, file.path);

        return {
          path: file.path,
          content: content ? content.slice(0, 4000) : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      owner,
      repo,
      totalFiles: tree.length,
      importantFiles,
      importantFileContents,
      projectInfo,
      readmePreview: readme?.slice(0, 3000),
      tree: tree.map((file: any) => file.path),
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