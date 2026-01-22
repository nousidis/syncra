# Syncra

**A lightweight, fast alternative to Concurrently built for the Bun runtime**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/syncra)
[![Bun](https://img.shields.io/badge/bun-%3E=1.0.0-black)](https://bun.sh)

**Author:** Vine Harvest Group LLC
**Version:** v1.0.0

## 📖 Description

Syncra is a simple, efficient tool for running multiple commands concurrently using the Bun runtime. It's designed as a streamlined alternative to tools like `concurrently`, leveraging Bun's speed and built-in features for optimal performance.

Perfect for development workflows where you need to run multiple processes simultaneously - like starting a backend server, frontend dev server, and database all at once.

## ✨ Features

- 🚀 **Fast** - Built on Bun for maximum performance
- 🎨 **Color-coded output** - Each process gets its own color for easy identification
- 🏷️ **Custom labels** - Name your processes for clarity
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

### Basic Syntax

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

### Examples

#### 1. Run Multiple Commands

```bash
syncra "docker compose up" "bunx --bun vite"
```

This will run both Docker Compose and Vite dev server concurrently, each with a default label and color.

#### 2. Custom Labels

```bash
syncra "container,docker compose up" "vite-dev,bunx --bun vite"
```

Output will show:
- `[container]` for the Docker command
- `[vite-dev]` for the Vite command

#### 3. Custom Colors and Labels

```bash
syncra "backend,red,bun run server.ts" "frontend,cyan,bunx --bun vite" "db,green,docker compose up postgres"
```

Each process gets a custom label and color for easy visual identification.

#### 4. Quoted Arguments (Complex Commands)

**Simple approach - Use double quotes outside, single quotes inside:**

```bash
syncra "ticker,red,bun -e \"console.log('Hello')\""
```

**For complex commands with nested quotes:**

```bash
syncra "ticker,red,bun -e \"setInterval(() => console.log('Tick'), 1000)\""
```

**Multiple processes with quotes:**

```bash
syncra \
  "api,blue,bun -e \"Bun.serve({ port: 3000, fetch: () => new Response('OK') })\"" \
  "log,green,bun -e \"setInterval(() => console.log('Running...'), 2000)\""
```

Syncra properly handles quoted arguments, allowing you to pass complex JavaScript code or commands with special characters.

#### 5. Real-World Development Setup

```bash
syncra \
  'api,blue,bun run src/api/server.ts' \
  'web,magenta,bun run dev' \
  'db,green,docker compose up -d postgres' \
  'redis,red,docker compose up -d redis'
```

## 🎨 Available Colors

- `red`
- `magenta`
- `cyan`
- `blue`
- `green`
- `yellow`

If you don't specify a color, Syncra will automatically cycle through the available colors for each process.

## 📝 Command Format

Commands can be specified in three formats:

1. **Command only**: `'command arg1 arg2'`
   - Uses default label: `Process 1`, `Process 2`, etc.
   - Uses auto-assigned colors

2. **Label and command**: `'label,command arg1 arg2'`
   - Custom label with auto-assigned color

3. **Label, color, and command**: `'label,color,command arg1 arg2'`
   - Full customization

## 💡 Quoting Rules

**No escaping needed!** Use this simple pattern:

- **Outer quotes:** Always use double quotes (`"`)
- **Inner quotes:** Use single quotes, when needed only inside (`'`)

### Examples:

✅ **Good - Escape Double Quotes string:**
```bash
syncra "test,bun -e \"console.log('Hello')\""
```

❌ **Avoid – Single Quotes strings:**
```bash
syncra 'test,bun -e "console.log('Hello')"' 
```
This command will not execute because bun -e requires double quotes for the command string.

### Why This Works:

When you use double quotes on the outside, your shell passes the inner double quotes to Syncra, which then properly parses them. Single quotes inside don't need escaping because they're inside double quotes.

### Real-World Example:

```bash
# Start a Bun server with inline code
syncra "server,blue,bun -e \"Bun.serve({ port: 3000, fetch: () => new Response('Hello!') })\""
```

## 🛠️ Common Use Cases

### Full-Stack Development

```bash
syncra \
  "backend,blue,bun run server.ts" \
  "frontend,cyan,bun run dev" \
  "tailwind,green,bunx tailwindcss -i ./src/input.css -o ./dist/output.css --watch"
```

### Microservices

```bash
syncra \
  "auth,red,bun run services/auth/index.ts" \
  "api,blue,bun run services/api/index.ts" \
  "worker,green,bun run services/worker/index.ts"
```

### Docker + Development Server

```bash
syncra \
  "containers,yellow,docker compose up" \
  "dev,magenta,bun --hot index.ts"
```

## 🆘 Help

Display help information:

```bash
syncra --help
# or
syncra -h
```

## 🧪 Testing

Run the test suite:

```bash
bun test
```

The test suite includes integration tests that verify:
- Help flag functionality
- Command execution and output capture
- Multiple concurrent processes
- Custom labels and colors
- ANSI color code verification

## 🛑 Stopping Processes

Press `Ctrl+C` to gracefully stop all running processes. Syncra handles cleanup automatically.

## 🔧 Development

This project was created using `bun init` in Bun v1.3.6.

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

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

Built with ❤️ by Vine Harvest Group LLC using [Bun](https://bun.sh)
