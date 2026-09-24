import prompts from "prompts";
import type { ProjectOptions } from "./options.js";

export async function getProjectOptions(initialProjectName?: string): Promise<ProjectOptions> {
    const response = await prompts([
        {
            type: "text",
            name: "projectName",
            message: "Project name:",
            initial: initialProjectName ?? "",
            validate: (value: string) =>
                /^[a-zA-Z0-9-_]+$/.test(value)
                    ? true
                    : "Use only letters, numbers, hyphens and underscores."
        },
        {
            type: "text",
            name: "databaseName",
            message: "MongoDB database name:",
            validate: (value: string) =>
                /^[a-zA-Z0-9_-]+$/.test(value)
                    ? true
                    : "Use only letters, numbers, hyphens and underscores."
        },
        {
            type: "number",
            name: "port",
            message: "Backend port:",
            initial: 3000,
            min: 1,
            max: 65535
        },
        {
            type: "confirm",
            name: "install",
            message: "Install dependencies?",
            initial: true
        }
    ]);

    if (!response.projectName || !response.databaseName) {
        throw new Error("Project creation cancelled.");
    }

    return {
        projectName: response.projectName.trim(),
        databaseName: response.databaseName.trim(),
        port: response.port ?? 3000,
        install: response.install ?? true
    };
}