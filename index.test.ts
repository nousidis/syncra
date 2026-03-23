import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { spawn } from "bun";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Syncra CLI", () => {
  test("should display help message with --help flag", async () => {
    const proc = spawn(["bun", "index.ts", "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("Syncra v1.0.5");
    expect(output).toContain("Examples:");
    expect(output).toContain("Colors:");
    expect(proc.exitCode).toBe(0);
  });

  test("should display help message with -h flag", async () => {
    const proc = spawn(["bun", "index.ts", "-h"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("Syncra v1.0.5");
    expect(proc.exitCode).toBe(0);
  });

  test("should run a simple command and capture output", async () => {
    const proc = spawn(["bun", "index.ts", "echo 'Hello from test'"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("Hello from test");
    expect(output).toContain("[Process 1]");
  });

  test("should run multiple commands concurrently", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "echo 'First command'",
      "echo 'Second command'",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("First command");
    expect(output).toContain("Second command");
    expect(output).toContain("[Process 1]");
    expect(output).toContain("[Process 2]");
  });

  test("should use custom labels", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "mylabel,echo 'Custom label test'",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[mylabel]");
    expect(output).toContain("Custom label test");
  });

  test("should use custom colors and labels", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "testlabel,red,echo 'Red output'",
      "another,blue,echo 'Blue output'",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[testlabel]");
    expect(output).toContain("[another]");
    expect(output).toContain("Red output");
    expect(output).toContain("Blue output");
    // Check for ANSI color codes (31 = red, 34 = blue)
    expect(output).toContain("\x1b[1;31m");
    expect(output).toContain("\x1b[1;34m");
  });

  test("should handle processes with arguments", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "echo Hello World",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("Hello World");
    expect(output).toContain("[Process 1]");
  });

  test("should assign different colors to multiple processes", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "echo First",
      "echo Second",
      "echo Third",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[Process 1]");
    expect(output).toContain("[Process 2]");
    expect(output).toContain("[Process 3]");
    expect(output).toContain("First");
    expect(output).toContain("Second");
    expect(output).toContain("Third");
  });

  test("should handle quoted arguments with special characters", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      'test,blue,echo "Hello, World!"',
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[test]");
    expect(output).toContain("Hello, World!");
  });

  test("should handle complex quoted commands", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "ticker,red,bun -e \"console.log('Tick')\"",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(200);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[ticker]");
    expect(output).toContain("Tick");
  });

  test("should handle single-word commands with label and color", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "mydir,blue,pwd",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[mydir]");
    expect(output).toContain("syncra");
  });

  test("should handle single-word commands with only label", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "list,ls",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[list]");
    expect(output).toContain("index.ts");
  });

  test("should handle single-word commands with only color", async () => {
    const proc = spawn([
      "bun",
      "index.ts",
      "green,pwd",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[Process 1]");
    expect(output).toContain("syncra");
    // Check for green color code
    expect(output).toContain("\x1b[1;32m");
  });
});

describe("Syncra YAML support", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "syncra-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("should load services from a YAML file via -f flag", async () => {
    const yamlPath = join(tmpDir, "syncra.yaml");
    writeFileSync(yamlPath, `
services:
  backend:
    command: echo "backend ok"
    color: blue
  frontend:
    command: echo "frontend ok"
    color: cyan
`);

    const proc = spawn(["bun", "index.ts", "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[backend]");
    expect(output).toContain("[frontend]");
    expect(output).toContain("backend ok");
    expect(output).toContain("frontend ok");
  });

  test("should load services from a YAML file via --file flag", async () => {
    const yamlPath = join(tmpDir, "custom.yaml");
    writeFileSync(yamlPath, `
services:
  worker:
    command: echo "worker running"
`);

    const proc = spawn(["bun", "index.ts", "--file", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[worker]");
    expect(output).toContain("worker running");
  });

  test("should apply correct ANSI color codes from YAML", async () => {
    const yamlPath = join(tmpDir, "syncra.yaml");
    writeFileSync(yamlPath, `
services:
  svc:
    command: echo "colored"
    color: red
`);

    const proc = spawn(["bun", "index.ts", "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("\x1b[1;31m"); // red = 31
    expect(output).toContain("[svc]");
  });

  test("should auto-assign colors when color is omitted in YAML", async () => {
    const yamlPath = join(tmpDir, "syncra.yaml");
    writeFileSync(yamlPath, `
services:
  alpha:
    command: echo "alpha"
  beta:
    command: echo "beta"
`);

    const proc = spawn(["bun", "index.ts", "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[alpha]");
    expect(output).toContain("[beta]");
    expect(output).toContain("alpha");
    expect(output).toContain("beta");
  });

  test("should auto-detect syncra.yaml in the current directory", async () => {
    writeFileSync(join(tmpDir, "syncra.yaml"), `
services:
  autoloaded:
    command: echo "auto detected"
    color: green
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: tmpDir,
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[autoloaded]");
    expect(output).toContain("auto detected");
  });

  test("should auto-detect syncra.yml (without a) in the current directory", async () => {
    writeFileSync(join(tmpDir, "syncra.yml"), `
services:
  dotyml:
    command: echo "yml extension"
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: tmpDir,
    });

    const output = await new Response(proc.stdout).text();
    await Bun.sleep(100);
    proc.kill();
    await proc.exited;

    expect(output).toContain("[dotyml]");
    expect(output).toContain("yml extension");
  });

  test("should exit with error when -f file does not exist", async () => {
    const proc = spawn(["bun", "index.ts", "-f", "/nonexistent/path.yaml"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    expect(stderr).toContain("Error");
    expect(proc.exitCode).toBe(1);
  });

  test("should exit with error when YAML has no services key", async () => {
    const yamlPath = join(tmpDir, "bad.yaml");
    writeFileSync(yamlPath, `
processes:
  svc:
    command: echo "wrong key"
`);

    const proc = spawn(["bun", "index.ts", "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    expect(stderr).toContain("Error");
    expect(proc.exitCode).toBe(1);
  });

  test("should exit with error when a service is missing a command", async () => {
    const yamlPath = join(tmpDir, "bad.yaml");
    writeFileSync(yamlPath, `
services:
  broken:
    color: red
`);

    const proc = spawn(["bun", "index.ts", "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    expect(stderr).toContain("broken");
    expect(proc.exitCode).toBe(1);
  });

  test("should exit with error when -f flag is missing a path argument", async () => {
    const proc = spawn(["bun", "index.ts", "-f"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    expect(stderr).toContain("Error");
    expect(proc.exitCode).toBe(1);
  });

  test("should show help when no args and no yaml file present", async () => {
    const proc = spawn(["bun", `${process.cwd()}/index.ts`], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: tmpDir, // empty dir, no syncra.yaml
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("Syncra v1.0.5");
    expect(proc.exitCode).toBe(0);
  });
});

describe("Syncra cleanup commands", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "syncra-cleanup-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("should run cleanup commands after SIGTERM", async () => {
    const markerFile = join(tmpDir, "cleanup-ran.txt");
    const yamlPath = join(tmpDir, "syncra.yaml");

    writeFileSync(yamlPath, `
services:
  svc:
    command: sleep 60
cleanup:
  - echo "cleanup executed" > ${markerFile}
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`, "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // Give the service time to start
    await Bun.sleep(300);
    proc.kill("SIGTERM");
    await proc.exited;

    const marker = Bun.file(markerFile);
    expect(await marker.exists()).toBe(true);
    const content = await marker.text();
    expect(content.trim()).toBe("cleanup executed");
  });

  test("should run multiple cleanup commands in order", async () => {
    const logFile = join(tmpDir, "order.txt");
    const yamlPath = join(tmpDir, "syncra.yaml");

    writeFileSync(yamlPath, `
services:
  svc:
    command: sleep 60
cleanup:
  - echo "first" >> ${logFile}
  - echo "second" >> ${logFile}
  - echo "third" >> ${logFile}
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`, "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await Bun.sleep(300);
    proc.kill("SIGTERM");
    await proc.exited;

    const content = await Bun.file(logFile).text();
    const lines = content.trim().split("\n");
    expect(lines).toEqual(["first", "second", "third"]);
  });

  test("should print cleanup output with [cleanup] prefix", async () => {
    const yamlPath = join(tmpDir, "syncra.yaml");

    writeFileSync(yamlPath, `
services:
  svc:
    command: sleep 60
cleanup:
  - echo "tearing down"
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`, "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await Bun.sleep(300);
    proc.kill("SIGTERM");

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("[cleanup]");
    expect(output).toContain("tearing down");
    expect(output).toContain("Running cleanup commands...");
  });

  test("should work fine with no cleanup section defined", async () => {
    const yamlPath = join(tmpDir, "syncra.yaml");

    writeFileSync(yamlPath, `
services:
  svc:
    command: sleep 60
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`, "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await Bun.sleep(300);
    proc.kill("SIGTERM");

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("Killing all processes...");
    expect(output).not.toContain("Running cleanup commands...");
    expect(proc.exitCode).toBe(0);
  });

  test("should not run cleanup twice on repeated signals", async () => {
    const logFile = join(tmpDir, "count.txt");
    const yamlPath = join(tmpDir, "syncra.yaml");

    writeFileSync(yamlPath, `
services:
  svc:
    command: sleep 60
cleanup:
  - echo "ran" >> ${logFile}
`);

    const proc = spawn(["bun", `${process.cwd()}/index.ts`, "-f", yamlPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await Bun.sleep(300);
    proc.kill("SIGTERM");
    proc.kill("SIGTERM");
    await proc.exited;

    const content = await Bun.file(logFile).text();
    const lines = content.trim().split("\n").filter(Boolean);
    expect(lines.length).toBe(1);
  });
});
