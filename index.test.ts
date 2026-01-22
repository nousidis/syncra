import { test, expect, describe } from "bun:test";
import { spawn } from "bun";

describe("Syncra CLI", () => {
  test("should display help message with --help flag", async () => {
    const proc = spawn(["bun", "index.ts", "--help"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    expect(output).toContain("Syncra v1.0.2");
    expect(output).toContain("Vine Harvest Group LLC");
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

    expect(output).toContain("Syncra v1.0.2");
    expect(proc.exitCode).toBe(0);
  });

  test("should run a simple command and capture output", async () => {
    const proc = spawn(["bun", "index.ts", "echo 'Hello from test'"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();

    // Kill the process after a short delay
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

    // Should have different default colors (cycling through palette)
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