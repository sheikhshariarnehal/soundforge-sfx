import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

interface ClientTarget {
  name: string;
  configPath: string;
  snippetKey: string;
}

export async function runInstaller(): Promise<void> {
  console.log("\n=======================================================");
  console.log("  🚀 SoundForge SFX MCP — Automatic Client Installer");
  console.log("=======================================================\n");

  const homeDir = os.homedir();
  const platform = os.platform();

  const targets: ClientTarget[] = [];

  // 1. Claude Desktop
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    targets.push({
      name: "Claude Desktop",
      configPath: path.join(appData, "Claude", "claude_desktop_config.json"),
      snippetKey: "claude",
    });
  } else if (platform === "darwin") {
    targets.push({
      name: "Claude Desktop",
      configPath: path.join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      snippetKey: "claude",
    });
  }

  // 2. Cursor IDE
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    targets.push({
      name: "Cursor IDE (Global)",
      configPath: path.join(appData, "Cursor", "User", "globalStorage", "mcp.json"),
      snippetKey: "cursor",
    });
  } else if (platform === "darwin") {
    targets.push({
      name: "Cursor IDE (Global)",
      configPath: path.join(homeDir, "Library", "Application Support", "Cursor", "User", "globalStorage", "mcp.json"),
      snippetKey: "cursor",
    });
  } else {
    targets.push({
      name: "Cursor IDE (Global)",
      configPath: path.join(homeDir, ".config", "Cursor", "User", "globalStorage", "mcp.json"),
      snippetKey: "cursor",
    });
  }

  // 3. VS Code Cline Extension
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    targets.push({
      name: "VS Code (Cline Extension)",
      configPath: path.join(appData, "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
      snippetKey: "cline",
    });
    targets.push({
      name: "VS Code (Roo Code Extension)",
      configPath: path.join(appData, "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json"),
      snippetKey: "cline",
    });
  } else if (platform === "darwin") {
    targets.push({
      name: "VS Code (Cline Extension)",
      configPath: path.join(homeDir, "Library", "Application Support", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
      snippetKey: "cline",
    });
    targets.push({
      name: "VS Code (Roo Code Extension)",
      configPath: path.join(homeDir, "Library", "Application Support", "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json"),
      snippetKey: "cline",
    });
  }

  // 4. Current Workspace / Antigravity / Gemini Settings (if present)
  targets.push({
    name: "Antigravity / Workspace (.gemini)",
    configPath: path.join(process.cwd(), ".gemini", "settings.json"),
    snippetKey: "workspace",
  });

  const serverConfig = {
    command: "npx",
    args: ["-y", "soundforge-sfx-mcp"],
  };

  let configuredCount = 0;

  for (const target of targets) {
    try {
      const exists = await fs.stat(target.configPath).then(() => true).catch(() => false);
      const parentDir = path.dirname(target.configPath);
      const parentExists = await fs.stat(parentDir).then(() => true).catch(() => false);

      // Only configure if config file or its parent directory already exists
      if (!exists && !parentExists) {
        continue;
      }

      let configObj: any = { mcpServers: {} };
      if (exists) {
        try {
          const raw = await fs.readFile(target.configPath, "utf-8");
          configObj = JSON.parse(raw);
          if (!configObj.mcpServers) configObj.mcpServers = {};
        } catch {
          configObj = { mcpServers: {} };
        }
      } else {
        await fs.mkdir(parentDir, { recursive: true });
      }

      // Check if already configured
      if (configObj.mcpServers["soundforge-sfx"]) {
        console.log(`ℹ️  [${target.name}]: Already configured at:\n   ${target.configPath}`);
        configuredCount++;
        continue;
      }

      // Add soundforge-sfx server entry
      configObj.mcpServers["soundforge-sfx"] = serverConfig;
      await fs.writeFile(target.configPath, JSON.stringify(configObj, null, 2) + "\n", "utf-8");

      console.log(`✅ [${target.name}]: Successfully configured!`);
      console.log(`   Config file: ${target.configPath}`);
      configuredCount++;
    } catch (err: any) {
      console.warn(`⚠️  [${target.name}]: Skipped (${err.message})`);
    }
  }

  console.log("\n-------------------------------------------------------");
  if (configuredCount > 0) {
    console.log(`✨ Successfully installed SoundForge SFX MCP to ${configuredCount} detected client(s)!`);
  } else {
    console.log("ℹ️  No default client directories were automatically found.");
    console.log("👉 Add this snippet manually to your Claude Desktop or Cursor MCP config:\n");
    console.log(
      JSON.stringify(
        {
          mcpServers: {
            "soundforge-sfx": serverConfig,
          },
        },
        null,
        2
      )
    );
  }
  console.log("-------------------------------------------------------\n");
  console.log("Restart your AI editor or Claude Desktop to start using SoundForge SFX!\n");
}
