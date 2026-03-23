#!/usr/bin/env bun
import { load as parseYaml } from 'js-yaml';

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
\x1b[1;36mSyncra v1.0.5\x1b[0m
\x1b[1;36mAuthor:\x1b[0m https://github.com/nousidis
\x1b[1;36mDescription:\x1b[0m A simple replacement for Concurrently using Bun runtime

\x1b[1;36mUsage:\x1b[0m
  syncra "command1" "command2" ...
  syncra [-f syncra.yaml]

\x1b[1;36mExamples:\x1b[0m
  syncra "docker compose up" "bunx --bun vite"
  syncra "container,docker compose up" "bun-cli,bunx --bun vite"
  syncra "backend,red,bun run server.ts" "frontend,cyan,bunx --bun vite"
  syncra -f syncra.yaml

\x1b[1;36mYAML file (syncra.yaml):\x1b[0m
  services:
    backend:
      command: bun run server.ts
      color: blue
    frontend:
      command: bun run dev
      color: cyan
      wait: 2
  cleanup:
    - docker compose down
    - echo "done"

\x1b[1;36mColors:\x1b[0m ${COLOR_NAMES.join(', ')}
`);
}

// Parse command argument into label, color, and command parts
interface ParsedCommand {
    label: string;
    color: number;
    command: string;
    wait?: number; // seconds to delay before starting
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

    return { label, color, command: commandStr };
}

// YAML file schema
interface SyncraService {
    command: string;
    color?: ColorName;
    wait?: number; // seconds to delay before starting
}

interface SyncraYaml {
    services: Record<string, SyncraService>;
    cleanup?: string[];
}

interface ResolvedConfig {
    commands: ParsedCommand[];
    cleanupCommands: string[];
}

async function loadYamlFile(filePath: string): Promise<ResolvedConfig> {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
        console.error(`\x1b[1;31mError: File not found: ${filePath}\x1b[0m`);
        process.exit(1);
    }

    const text = await file.text();
    let parsed: unknown;

    try {
        parsed = parseYaml(text);
    } catch (err) {
        console.error(`\x1b[1;31mError: Failed to parse YAML: ${(err as Error).message}\x1b[0m`);
        process.exit(1);
    }

    const config = parsed as SyncraYaml;

    if (!config?.services || typeof config.services !== 'object') {
        console.error('\x1b[1;31mError: YAML file must have a "services" map\x1b[0m');
        process.exit(1);
    }

    const entries = Object.entries(config.services);

    if (entries.length === 0) {
        console.error('\x1b[1;31mError: No services defined in YAML file\x1b[0m');
        process.exit(1);
    }

    const commands = entries.map(([name, service], index) => {
        if (!service?.command) {
            console.error(`\x1b[1;31mError: Service "${name}" is missing a "command"\x1b[0m`);
            process.exit(1);
        }

        if (service.wait !== undefined && (typeof service.wait !== 'number' || service.wait < 0)) {
            console.error(`\x1b[1;31mError: Service "${name}" has an invalid "wait" value (must be a non-negative number of seconds)\x1b[0m`);
            process.exit(1);
        }

        const colorName = service.color;
        const color = colorName && COLOR_NAMES.includes(colorName)
            ? COLORS[colorName]
            : COLOR_CODES[index % COLOR_CODES.length];

        return { label: name, color, command: service.command, wait: service.wait };
    });

    const cleanupCommands = Array.isArray(config.cleanup)
        ? config.cleanup.filter(cmd => typeof cmd === 'string' && cmd.trim())
        : [];

    return { commands, cleanupCommands };
}

// Resolve config from CLI args or YAML file
async function resolveConfig(): Promise<ResolvedConfig> {
    // Check for help flag
    if (args.length === 0 || args.some(arg => ['-h', '--help'].includes(arg))) {
        // If no args, check for default yaml files before showing help
        if (args.length === 0) {
            for (const candidate of ['syncra.yaml', 'syncra.yml']) {
                if (await Bun.file(candidate).exists()) {
                    return loadYamlFile(candidate);
                }
            }
        }
        showHelp();
        process.exit(0);
    }

    // Handle -f / --file flag
    const fileFlag = args.findIndex(a => a === '-f' || a === '--file');
    if (fileFlag !== -1) {
        const filePath = args[fileFlag + 1];
        if (!filePath) {
            console.error('\x1b[1;31mError: -f requires a file path\x1b[0m');
            process.exit(1);
        }
        return loadYamlFile(filePath);
    }

    // Fall back to positional CLI args (no cleanup support for inline args)
    return {
        commands: args.map((arg, index) => parseCommandArg(arg, index)),
        cleanupCommands: [],
    };
}

const { commands, cleanupCommands } = await resolveConfig();

// Spawn all processes, supporting optional per-service startup delays
const processes: ReturnType<typeof Bun.spawn>[] = [];
const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

function spawnService(label: string, color: number, command: string): void {
    try {
        const shellCommand = process.platform === 'win32'
            ? ['cmd', '/c', command]
            : ['/bin/sh', '-c', command];

        const proc = Bun.spawn(shellCommand, {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        logWithPrefix(label, color, proc.stdout);
        logWithPrefix(label, color, proc.stderr);

        processes.push(proc);
    } catch (error) {
        console.error(`\x1b[1;31mFailed to spawn process [${label}]:\x1b[0m`, error);
        process.exit(1);
    }
}

for (const { label, color, command, wait } of commands) {
    if (wait && wait > 0) {
        const timeout = setTimeout(() => spawnService(label, color, command), wait * 1000);
        pendingTimeouts.push(timeout);
    } else {
        spawnService(label, color, command);
    }
}

// Cleanup handler — kills services then runs cleanup commands sequentially
let isCleaningUp = false;

async function cleanup(): Promise<void> {
    if (isCleaningUp) return;
    isCleaningUp = true;

    for (const timeout of pendingTimeouts) {
        clearTimeout(timeout);
    }

    console.log('\n\x1b[1;33mKilling all processes...\x1b[0m');
    for (const proc of processes) {
        try {
            proc.kill();
        } catch {
            // Process may already be dead
        }
    }

    if (cleanupCommands.length > 0) {
        console.log('\x1b[1;33mRunning cleanup commands...\x1b[0m');
        for (const cmd of cleanupCommands) {
            const shellCommand = process.platform === 'win32'
                ? ['cmd', '/c', cmd]
                : ['/bin/sh', '-c', cmd];

            const proc = Bun.spawn(shellCommand, {
                stdout: 'pipe',
                stderr: 'pipe',
            });

            logWithPrefix('cleanup', COLORS.yellow, proc.stdout);
            logWithPrefix('cleanup', COLORS.yellow, proc.stderr);

            await proc.exited;
        }
    }

    process.exit(0);
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
