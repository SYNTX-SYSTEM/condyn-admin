import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as http from "http";

// Helper to create a minimal valid ASCII PDF buffer in memory
function createMinimalPdfBuffer(text: string): Buffer {
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length ${text.length + 22} >>
stream
BT /F1 24 Tf 100 700 Td (${text}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000216 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`;
  return Buffer.from(pdfString, "utf-8");
}

describe("CONDYN Career Analysis Protocol v1.0 - BUG 009: Next.js Runtime PDF Worker Resolution", () => {
  let nextProcess: ChildProcess;
  let PORT = 0;
  let baseUrl = "";
  let serverStdout = "";
  let serverStderr = "";
  let lastCheckpoint = "INIT";

  beforeAll(async () => {
    lastCheckpoint = "FIND_PORT";
    // Find a dynamic free port
    const getFreePort = () => new Promise<number>((resolve, reject) => {
      const srv = http.createServer();
      srv.listen(0, () => {
        const port = (srv.address() as any).port;
        srv.close(() => resolve(port));
      });
      srv.on("error", reject);
    });
    
    PORT = await getFreePort();
    baseUrl = `http://localhost:${PORT}`;
    
    lastCheckpoint = "SPAWNING_SERVER";
    // Start Next.js dev server isolated from providers
    // Use the local Next executable directly to avoid `npx` wrapper process ownership issues.
    const nextPath = path.resolve(__dirname, "../node_modules/.bin/next");
    nextProcess = spawn(nextPath, ["dev", "-p", PORT.toString()], {
      env: {
        ...process.env,
        USE_OPENAI_PROVIDER: "false",
        USE_ANTHROPIC_PROVIDER: "false",
        USE_GEMINI_PROVIDER: "false",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
        GEMINI_API_KEY: "",
      },
      stdio: "pipe",
    });

    // Independent HTTP polling for readiness
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 30000;
      let isResolved = false;

      nextProcess.stdout?.on("data", (data) => {
        serverStdout += data.toString();
      });
      nextProcess.stderr?.on("data", (data) => {
        serverStderr += data.toString();
      });
      
      nextProcess.on("exit", (code) => {
        if (!isResolved) {
          reject(new Error(`Next dev server exited prematurely with code ${code}. Checkpoint: ${lastCheckpoint}\nStdout:\n${serverStdout}\nStderr:\n${serverStderr}`));
        }
      });
      nextProcess.on("error", (err) => {
        if (!isResolved) {
          reject(new Error(`Next dev server spawn error: ${err.message}`));
        }
      });

      const poll = async () => {
        if (isResolved) return;
        if (nextProcess.exitCode !== null) return; // handled by exit listener

        if (Date.now() > deadline) {
          reject(new Error(`Next dev server start timeout after 30s. Checkpoint: ${lastCheckpoint}\nStdout:\n${serverStdout}\nStderr:\n${serverStderr}`));
          return;
        }

        lastCheckpoint = "HTTP_PROBE_START";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        try {
          await fetch(`${baseUrl}`, { method: "GET", signal: controller.signal });
          clearTimeout(timeoutId);

          if (nextProcess.exitCode !== null) {
            reject(new Error(`Server exited after probe. Code: ${nextProcess.exitCode}\nStdout:\n${serverStdout}\nStderr:\n${serverStderr}`));
            return;
          }

          isResolved = true;
          lastCheckpoint = "SERVER_READY";
          resolve();
        } catch (e: any) {
          clearTimeout(timeoutId);
          // Connection refused or aborted, retry
          setTimeout(poll, 300);
        }
      };

      // Start polling
      setTimeout(poll, 500);
    });
    
    // Give it a brief moment to stabilize
    await new Promise(r => setTimeout(r, 1000));
  }, 35000);

  afterAll(async () => {
    if (nextProcess && nextProcess.exitCode === null) {
      const killPromise = new Promise<void>((resolve) => {
        nextProcess.on("exit", () => resolve());
        setTimeout(() => {
          if (nextProcess.exitCode === null) {
            nextProcess.kill("SIGKILL");
          }
          resolve();
        }, 5000); // 5s timeout before SIGKILL
      });
      nextProcess.kill("SIGTERM");
      await killPromise;
    }
  });

  it("should successfully parse PDF in Next.js Turbopack runtime without pdf.worker.mjs resolution errors", async () => {
    if (nextProcess.exitCode !== null) {
      throw new Error(`Child process exited prematurely before test POST. ExitCode: ${nextProcess.exitCode}, Signal: ${nextProcess.signalCode}\nStdout:\n${serverStdout}\nStderr:\n${serverStderr}`);
    }

    const validPdfBuffer = createMinimalPdfBuffer("Senior Systems Engineer with 10 years experience.");
    const minimalPdfBase64 = validPdfBuffer.toString("base64");
    
    const reqBody = {
      documents: [{ type: "pdf", title: "Test PDF", content: minimalPdfBase64 }]
    };

    lastCheckpoint = "POST_STARTED";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s request timeout

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/career/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });
      lastCheckpoint = "POST_RESPONSE_RECEIVED";
    } catch (e: any) {
      const cause = e.cause ? `\nCause: ${e.cause}` : '';
      throw new Error(`FETCH FAILED: ${e.message}${cause}\nLast checkpoint: ${lastCheckpoint}\nExitCode: ${nextProcess.exitCode}\nSignal: ${nextProcess.signalCode}\n--- Server Stdout ---\n${serverStdout}\n--- Server Stderr ---\n${serverStderr}`);
    } finally {
      clearTimeout(timeoutId);
    }

    const body = await res.json();
    lastCheckpoint = "BODY_RECEIVED";
    
    // The RED test boundary: we expect it NOT to fail at the PDF extraction phase due to missing worker
    if (body.issues && body.issues.length > 0) {
      const isParseFailure = body.issues[0]?.code === "ERR_PDF_PARSE_FAILURE";
      if (isParseFailure) {
        throw new Error(`BUG 009 Reproduced: PDF Parse Failure in Next.js Runtime - ${body.issues[0].message}`);
      }
    }

    lastCheckpoint = "ASSERTIONS_REACHED";

    // Expect successful completion of the route returning a 200 via the MockInferenceProvider
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
  }, 15000);
});
