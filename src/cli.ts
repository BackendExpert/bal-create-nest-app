#!/usr/bin/env node

import { Command } from "commander";
import { getProjectOptions } from "./prompts.js";
import { generateProject } from "./generator.js";
const program = new Command();

program
    .name("bal-nest")
    .description("BlackAlphaLabs NestJS project generator")
    .version("0.1.0")
    .argument("[project-name]", "Project directory name")
    .action(
        async (projectName?: string) => {
            try {
                const options = await getProjectOptions(projectName);

                await generateProject(options);
            } catch (error) {
                console.error("");

                console.error(
                    error instanceof Error
                        ? error.message
                        : error
                );

                process.exit(1);
            }
        }
    );

await program.parseAsync(
    process.argv
);