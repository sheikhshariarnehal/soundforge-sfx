import { spawn } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function runMcpTest() {
  console.log("Starting MCP Protocol Handshake & Tool Invocation Test...");

  const serverScript = path.resolve("./dist/index.js");
  const child = spawn("node", [serverScript], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let responseBuffer = "";
  child.stdout.on("data", (data) => {
    responseBuffer += data.toString("utf-8");
  });

  child.stderr.on("data", (data) => {
    // Stdio error logging is expected from MCP server
    // console.error("[Server Log]:", data.toString("utf-8"));
  });

  const sendJsonRpc = (msg) => {
    const json = JSON.stringify(msg);
    child.stdin.write(json + "\n");
  };

  const waitForResponse = async (id, timeoutMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const lines = responseBuffer.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.id === id) {
            return parsed;
          }
        } catch {}
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timeout waiting for response to request ID: ${id}`);
  };

  // 1. Initialize
  console.log("1. Sending 'initialize' request...");
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  });

  const initRes = await waitForResponse(1);
  assert.equal(initRes.result.serverInfo.name, "soundforge-sfx-mcp");
  console.log("   ✅ Initialized successfully:", initRes.result.serverInfo);

  // Send initialized notification
  sendJsonRpc({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  });

  // 2. tools/list
  console.log("2. Requesting 'tools/list'...");
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  const toolsRes = await waitForResponse(2);
  const toolNames = toolsRes.result.tools.map((t) => t.name);
  console.log("   ✅ Available Tools:", toolNames);
  assert.ok(toolNames.includes("search_sounds"));
  assert.ok(toolNames.includes("get_sound_details"));
  assert.ok(toolNames.includes("list_categories"));
  assert.ok(toolNames.includes("download_sound"));
  assert.ok(toolNames.includes("get_sound_audio_base64"));

  // 3. Call tool: list_categories
  console.log("3. Calling tool 'list_categories'...");
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "list_categories",
      arguments: {},
    },
  });

  const catRes = await waitForResponse(3);
  const catData = JSON.parse(catRes.result.content[0].text);
  console.log(`   ✅ Total Categories: ${catData.totalCategories}`);
  assert.ok(catData.totalCategories >= 40);

  // 4. Call tool: search_sounds
  console.log("4. Calling tool 'search_sounds' for 'whoosh'...");
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "search_sounds",
      arguments: {
        query: "whoosh",
        limit: 3,
      },
    },
  });

  const searchRes = await waitForResponse(4);
  const searchData = JSON.parse(searchRes.result.content[0].text);
  console.log(`   ✅ Search Matches: ${searchData.totalMatches}, Returned: ${searchData.returned}`);
  assert.ok(searchData.sounds.length > 0);
  const testSound = searchData.sounds[0];
  console.log(`   🎯 Selected sound: "${testSound.title}" (ID: ${testSound.id}, Category: ${testSound.category})`);

  // 5. Call tool: get_sound_details
  console.log(`5. Calling tool 'get_sound_details' for ID '${testSound.id}'...`);
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "get_sound_details",
      arguments: { soundId: testSound.id },
    },
  });

  const detailsRes = await waitForResponse(5);
  const detailsData = JSON.parse(detailsRes.result.content[0].text);
  assert.equal(detailsData.id, testSound.id);
  console.log(`   ✅ Verified audioUrl: ${detailsData.audioUrl}`);

  // 6. Call tool: download_sound
  const testDownloadDir = path.resolve("./test_mcp_output");
  console.log(`6. Calling tool 'download_sound' to '${testDownloadDir}'...`);
  sendJsonRpc({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "download_sound",
      arguments: {
        soundId: testSound.id,
        targetDirectory: testDownloadDir,
        filename: "mcp_test_sound.mp3",
      },
    },
  });

  const downloadRes = await waitForResponse(6, 12000);
  const downloadData = JSON.parse(downloadRes.result.content[0].text);
  assert.equal(downloadData.status, "success");
  console.log(`   ✅ Download success: ${downloadData.filePath} (${downloadData.bytesWritten} bytes)`);

  const stat = await fs.stat(downloadData.filePath);
  assert.ok(stat.size > 0);

  // Clean up
  await fs.rm(testDownloadDir, { recursive: true, force: true });
  child.kill();

  console.log("\n🎉 ALL MCP PROTOCOL & TOOL TESTS PASSED PERFECTLY!");
}

runMcpTest().catch((err) => {
  console.error("❌ MCP Test Failed:", err);
  process.exit(1);
});
