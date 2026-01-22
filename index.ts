#!/usr/bin/env bun
const args = Bun.argv.slice(2);

// Color palette for process output
const COLORS = {
    red: 31,
    magenta: 35,
    cyan: 36,
    blue: 34,
    green: 32,
    yellow: 33
} as const;

const COLOR_NAMES = Object.keys(COLORS) as Array<keyof typeof COLORS>;
const COLOR_CODES = Object.values(COLORS);

type ColorName = keyof typeof COLORS;

// Unified parser for splitting strings while respecting quotes
function splitRespectingQuotes(str: string, delimiter: string, stripQuotes = false): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const char of str) {
        if ((char === '"' || char === "'") && !inQuote) {
            inQuote = true;
            quoteChar = char;
            if (!stripQuotes) current += char;
        } else if (char === quoteChar && inQuote) {
            inQuote = false;
            if (!stripQuotes) current += char;
            quoteChar = '';
        } else if (char === delimiter && !inQuote) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    if (current) parts.push(current);
    return parts;
}

// Stream output with colored prefix
async function logWithPrefix(name: string, color: number, stream: ReadableStream): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                console.log(`\x1b[1;${color}m[${name}]\x1b[0m ${line}`);
            }
        }

        // Print any remaining content
        if (buffer) {
            console.log(`\x1b[1;${color}m[${name}]\x1b[0m ${buffer}`);
        }
    } catch (error) {
        // Stream closed, ignore
    }
}

// Show help message
function showHelp(): void {
    console.log(`
\x1b[1;36mSyncra v1.0.0\x1b[0m
\x1b[1;36mAuthor:\x1b[0m Vine Harvest Group LLC
\x1b[1;36mDescription:\x1b[0m A simple replacement for Concurrently using Bun runtime

\x1b[1;36mUsage:\x1b[0m
  syncra "command1" "command2" ...

\x1b[1;36mExamples:\x1b[0m
  syncra "docker compose up" "bunx --bun vite"
  syncra "container,docker compose up" "bun-cli,bunx --bun vite"
  syncra "backend,red,bun run server.ts" "frontend,cyan,bunx --bun vite"

\x1b[1;36mColors:\x1b[0m ${COLOR_NAMES.join(', ')}
`);
}

// Parse command argument into label, color, and command parts
interface ParsedCommand {
    label: string;
    color: number;
    command: string[];
}

function parseCommandArg(arg: string, index: number): ParsedCommand {
    const parts = splitRespectingQuotes(arg, ',');

    let label = `Process ${index + 1}`;
    let color = COLOR_CODES[index % COLOR_CODES.length];
    let commandStr = '';

    if (parts.length === 1) {
        // Only command provided
        commandStr = parts[0].trim();
    } else {
        // Multiple parts: could be label,command or label,color,command or color,command
        // The last part is always the command
        commandStr = parts[parts.length - 1].trim();

        // Process remaining parts for label and color
        for (let i = 0; i < parts.length - 1; i++) {
            const trimmed = parts[i].trim();

            if (COLOR_NAMES.includes(trimmed as ColorName)) {
                color = COLORS[trimmed as ColorName];
            } else {
                label = trimmed;
            }
        }
    }

    if (!commandStr) {
        console.error('\x1b[1;31mError: No command found in argument\x1b[0m');
        process.exit(1);
    }

    const command = splitRespectingQuotes(commandStr, ' ', true);

    return { label, color, command };
}

// Check for help flag early
if (args.length === 0 || args.some(arg => ['-h', '--help'].includes(arg))) {
    showHelp();
    process.exit(0);
}

// Parse all command arguments
const commands = args.map((arg, index) => parseCommandArg(arg, index));

// Spawn all processes
const processes = commands.map(({ label, color, command }) => {
    try {
        const proc = Bun.spawn(command, {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        // Start logging streams (don't await, let them run in background)
        logWithPrefix(label, color, proc.stdout);
        logWithPrefix(label, color, proc.stderr);

        return proc;
    } catch (error) {
        console.error(`\x1b[1;31mFailed to spawn process [${label}]:\x1b[0m`, error);
        process.exit(1);
    }
});

// Cleanup handler
function cleanup(): void {
    console.log('\n\x1b[1;33mKilling all processes...\x1b[0m');
    for (const proc of processes) {
        try {
            proc.kill();
        } catch {
            // Process may already be dead
        }
    }
    process.exit(0);
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
