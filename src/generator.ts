import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import type { ProjectOptions } from "./options.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProject(options: ProjectOptions) {
    const {
        projectName,
        databaseName,
        port,
        install
    } = options;

    const targetDirectory = path.resolve(process.cwd(), projectName);

    if (await fs.pathExists(targetDirectory)) {
        throw new Error(`Directory "${projectName}" already exists.`);
    }

    console.log("");
    console.log("Creating NestJS project...");
    console.log("");

    execSync(
        `npx @nestjs/cli new ${projectName} --package-manager npm --skip-git`,
        {
            cwd: process.cwd(),
            stdio: "inherit"
        }
    );

    console.log("");
    console.log("BlackAlphaLabs NestJS CLI");
    console.log("-------------------------");
    console.log(`Project: ${projectName}`);
    console.log(`Database: ${databaseName}`);
    console.log(`Port: ${port}`);
    console.log("");

    const templateDirectory = path.resolve(__dirname, "../templates");

    await fs.copy(
        path.join(templateDirectory, "src"),
        path.join(targetDirectory, "src"),
        {
            overwrite: true
        }
    );

    await fs.copy(
        path.join(templateDirectory, "package.json"),
        path.join(targetDirectory, "package.json"),
        {
            overwrite: true
        }
    );

    await fs.copy(
        path.join(templateDirectory, ".env.example"),
        path.join(targetDirectory, ".env.example"),
        {
            overwrite: true
        }
    );

    await replaceTemplateVariables(
        targetDirectory,
        {
            PROJECT_NAME: projectName,
            DATABASE_NAME: databaseName,
            PORT: String(port)
        }
    );

    if (install) {
        console.log("Installing dependencies...");

        execSync("npm install", {
            cwd: targetDirectory,
            stdio: "inherit"
        });
    }

    console.log("");
    console.log("Project created successfully.");
    console.log("");
    console.log(`cd ${projectName}`);

    if (!install) {
        console.log("npm install");
    }

    console.log("npm run start:dev");
    console.log("");
}

async function replaceTemplateVariables(
    directory: string,
    variables: Record<string, string>
) {
    const files = await getFiles(directory);

    for (const file of files) {
        if (
            file.endsWith("package-lock.json") ||
            file.includes("node_modules")
        ) {
            continue;
        }

        let content: string;

        try {
            content = await fs.readFile(file, "utf8");
        } catch {
            continue;
        }

        let updatedContent = content;

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;

            updatedContent = updatedContent.replaceAll(placeholder, value);
        }

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent, "utf8");
        }
    }
}

async function getFiles(directory: string): Promise<string[]> {
    const entries = await fs.readdir(
        directory,
        {
            withFileTypes: true
        }
    );

    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(
            directory,
            entry.name
        );

        if (entry.isDirectory()) {
            files.push(
                ...(await getFiles(fullPath))
            );
        } else {
            files.push(fullPath);
        }
    }

    return files;
}