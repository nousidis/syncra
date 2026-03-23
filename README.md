# Syncra

**A lightweight, fast alternative to Concurrently built for the Bun runtime**

[![Version](https://img.shields.io/badge/version-1.0.5-blue.svg)](https://github.com/nousidis/syncra)
[![Bun](https://img.shields.io/badge/bun-%3E=1.0.0-black)](https://bun.sh)

**Author:** Noah Pickle
**Version:** v1.0.5

## 📖 Description

Syncra is a simple, efficient tool for running multiple commands concurrently using the Bun runtime. It's designed as a streamlined alternative to tools like `concurrently`, leveraging Bun's speed and built-in features for optimal performance.

Perfect for development workflows where you need to run multiple processes simultaneously - like starting a backend server, frontend dev server, and database all at once.

## ✨ Features

- 🚀 **Fast** - Built on Bun for maximum performance
- 🎨 **Color-coded output** - Each process gets its own color for easy identification
- 🏷️ **Custom labels** - Name your processes for clarity
- 📄 **YAML config** - Define your processes in a `syncra.yaml` file
- 🧹 **Cleanup commands** - Run teardown commands automatically on exit
- 🎯 **Simple syntax** - Easy to use command format
- 🔄 **Concurrent execution** - Run multiple commands simultaneously
- 🛑 **Graceful shutdown** - Properly handles SIGINT/SIGTERM signals

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher

### Install Syncra

```bash
bun add syncra
```

Or with npm:

```bash
npm install syncra
```

Or with yarn:

```bash
yarn add syncra
```

## 🚀 Usage

### YAML File (Recommended)

The easiest way to use Syncra is with a `syncra.yaml` file in your project root. Just run `syncra` with no arguments and it will be picked up automatically.

```yaml
# syncra.yaml
services:
  backend:
    command: bun run server.ts
    color: blue
  frontend:
    command: bun run dev
    color: cyan
  db:
    command: docker compose up postgres
    color: green
```

```bash
syncra
```

You can also point to a specific file with `-f`:

```bash
syncra -f path/to/config.yaml
# or
syncra --file path/to/config.yaml
```

#### YAML Service Options

| Field     | Required | Description                                      |
|-----------|----------|--------------------------------------------------|
| `command` | Yes      | The shell command to run                         |
| `color`   | No       | Output color: `red`, `magenta`, `cyan`, `blue`, `green`, `yellow` |

Colors are auto-assigned in order if not specified.

### Cleanup Commands

Add a top-level `cleanup` key with a list of shell commands to run automatically when Syncra exits (on `Ctrl+C` or `SIGTERM`). Commands run sequentially after all services are killed, and their output is printed under a `[cleanup]` label.

```yaml
services:
  backend:
    command: bun run server.ts
    color: blue
  frontend:
    command: bun run dev
    color: cyan

cleanup:
  - docker compose down
  - rm -rf .tmp
  - echo "All done"
```

Cleanup commands run in the order listed and each one completes before the next starts.

#### Real-World Example

```yaml
# syncra.yaml
services:
  api:
    command: bun run src/api/server.ts
    color: blue
  web:
    command: bun run dev
    color: magenta
  db:
    command: docker compose up postgres
    color: green
  redis:
    command: docker compose up redis
    color: red

cleanup:
  - docker compose down
```

---

### CLI Arguments

You can also pass commands directly as arguments without a config file.

#### Basic Syntax

```bash
syncra "command1" "command2" "command3"
```

Or using bunx (no installation required):

```bash
bunx syncra "command1" "command2" "command3"
```

Or using npx:

```bash
npx syncra "command1" "command2" "command3"
```

#### Examples

##### 1. Run Multiple Commands

```bash
syncra "docker compose up" "bunx --bun vite"
```

##### 2. Custom Labels

```bash
syncra "container,docker compose up" "vite-dev,bunx --bun vite"
```

Output will show:
- `[container]` for the Docker command
- `[vite-dev]` for the Vite command

##### 3. Custom Colors and Labels

```bash
syncra "backend,red,bun run server.ts" "frontend,cyan,bunx --bun vite" "db,green,docker compose up postgres"
```

##### 4. Quoted Arguments (Complex Commands)

```bash
syncra "ticker,red,bun -e \"setInterval(() => console.log('Tick'), 1000)\""
```

##### 5. Real-World Development Setup

```bash
syncra \
  "api,blue,bun run src/api/server.ts" \
  "web,magenta,bun run dev" \
  "db,green,docker compose up -d postgres" \
  "redis,red,docker compose up -d redis"
```

#### CLI Command Format

Commands can be specified in three formats:

1. **Command only**: `'command arg1 arg2'`
   - Uses default label: `Process 1`, `Process 2`, etc.
   - Uses auto-assigned colors

2. **Label and command**: `'label,command arg1 arg2'`
   - Custom label with auto-assigned color

3. **Label, color, and command**: `'label,color,command arg1 arg2'`
   - Full customization

#### Quoting Rules

- **Outer quotes:** Always use double quotes (`"`)
- **Inner quotes:** Use single quotes, when needed only inside (`'`)

```bash
# Good
syncra "test,bun -e \"console.log('Hello')\""

# Avoid - single quotes outside break parsing
syncra 'test,bun -e "console.log('Hello')"'
```

---

## 🎨 Available Colors

- `red`
- `magenta`
- `cyan`
- `blue`
- `green`
- `yellow`

## 🛠️ Common Use Cases

### Full-Stack Development

```yaml
services:
  backend:
    command: bun run server.ts
    color: blue
  frontend:
    command: bun run dev
    color: cyan
  tailwind:
    command: bunx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
    color: green
```

### Microservices

```yaml
services:
  auth:
    command: bun run services/auth/index.ts
    color: red
  api:
    command: bun run services/api/index.ts
    color: blue
  worker:
    command: bun run services/worker/index.ts
    color: green
```

### Docker + Development Server

```yaml
services:
  containers:
    command: docker compose up
    color: yellow
  dev:
    command: bun --hot index.ts
    color: magenta

cleanup:
  - docker compose down
```

## 🆘 Help

```bash
syncra --help
# or
syncra -h
```

## 🧪 Testing

```bash
bun test
```

## 🛑 Stopping Processes

Press `Ctrl+C` to gracefully stop all running processes. Syncra handles cleanup automatically.

## 🔧 Development

### Project Structure

```
syncra/
├── index.ts          # Main CLI script
├── index.test.ts     # Integration tests
├── package.json      # Project configuration
└── README.md         # Documentation
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by Noah Pickle using [Bun](https://bun.sh)
