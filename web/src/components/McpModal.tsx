"use client";

import React, { useState } from "react";
import { X, Check, Copy, Terminal, Bot, Sparkles, ExternalLink } from "lucide-react";

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function McpModal({ isOpen, onClose }: McpModalProps) {
  const [activeTab, setActiveTab] = useState<"cli" | "claude" | "cursor" | "vscode">("cli");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cliCommand = "npx -y soundforge-sfx-mcp install";

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        "soundforge-sfx": {
          command: "npx",
          args: ["-y", "soundforge-sfx-mcp"],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "soundforge-sfx": {
          command: "npx",
          args: ["-y", "soundforge-sfx-mcp"],
        },
      },
    },
    null,
    2
  );

  const vscodeConfig = JSON.stringify(
    {
      mcpServers: {
        "soundforge-sfx": {
          command: "npx",
          args: ["-y", "soundforge-sfx-mcp"],
          disabled: false,
          autoApprove: ["search_sounds", "get_sound_details", "list_categories"],
        },
      },
    },
    null,
    2
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="SoundForge MCP Configuration"
    >
      <div
        className="relative w-full max-w-2xl bg-studio-surface rounded-2xl shadow-2xl p-6 sm:p-7 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-studio-primary/20 flex items-center justify-center text-studio-primary">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Connect SoundForge to AI Agents
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-studio-primary/20 text-studio-primary font-bold">
                  MCP Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Let Claude, Cursor, Antigravity, or Cline query & download 1,400+ SFX on demand.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-studio-bg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-studio-bg rounded-xl mt-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("cli")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "cli"
                ? "bg-studio-surface text-studio-primary shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            1-Click Auto Install
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("claude")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "claude"
                ? "bg-studio-surface text-studio-primary shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Claude Desktop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cursor")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "cursor"
                ? "bg-studio-surface text-studio-primary shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Cursor / Antigravity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vscode")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "vscode"
                ? "bg-studio-surface text-studio-primary shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            VS Code (Cline)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "cli" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-300">
              Run this single command in your terminal. It auto-detects Claude Desktop, Cursor, and VS Code configs on Windows and macOS, and installs the MCP server with 0 setup:
            </p>
            <div className="relative flex items-center justify-between p-3 rounded-xl bg-studio-bg font-mono text-xs text-studio-primary">
              <span className="truncate pr-4">{cliCommand}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(cliCommand, "cli")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-surface hover:bg-studio-surface/80 text-white text-[11px] font-sans font-medium transition-colors flex-shrink-0"
              >
                {copiedKey === "cli" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-studio-primary" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === "claude" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-300">
              Paste this snippet into your{" "}
              <code className="text-studio-primary font-mono text-[11px]">
                claude_desktop_config.json
              </code>
              :
            </p>
            <div className="relative p-3 rounded-xl bg-studio-bg font-mono text-xs text-neutral-300 overflow-x-auto max-h-48">
              <button
                type="button"
                onClick={() => copyToClipboard(claudeConfig, "claude")}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-studio-surface hover:bg-studio-surface/80 text-white text-[10px] font-sans transition-colors"
              >
                {copiedKey === "claude" ? (
                  <Check className="w-3.5 h-3.5 text-studio-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{copiedKey === "claude" ? "Copied" : "Copy JSON"}</span>
              </button>
              <pre>{claudeConfig}</pre>
            </div>
          </div>
        )}

        {activeTab === "cursor" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-300">
              In Cursor, go to <strong>Settings → Features → MCP Servers</strong>, or paste this into your MCP settings:
            </p>
            <div className="relative p-3 rounded-xl bg-studio-bg font-mono text-xs text-neutral-300 overflow-x-auto max-h-48">
              <button
                type="button"
                onClick={() => copyToClipboard(cursorConfig, "cursor")}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-studio-surface hover:bg-studio-surface/80 text-white text-[10px] font-sans transition-colors"
              >
                {copiedKey === "cursor" ? (
                  <Check className="w-3.5 h-3.5 text-studio-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{copiedKey === "cursor" ? "Copied" : "Copy JSON"}</span>
              </button>
              <pre>{cursorConfig}</pre>
            </div>
          </div>
        )}

        {activeTab === "vscode" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-300">
              Paste this into your{" "}
              <code className="text-studio-primary font-mono text-[11px]">
                cline_mcp_settings.json
              </code>
              :
            </p>
            <div className="relative p-3 rounded-xl bg-studio-bg font-mono text-xs text-neutral-300 overflow-x-auto max-h-48">
              <button
                type="button"
                onClick={() => copyToClipboard(vscodeConfig, "vscode")}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-studio-surface hover:bg-studio-surface/80 text-white text-[10px] font-sans transition-colors"
              >
                {copiedKey === "vscode" ? (
                  <Check className="w-3.5 h-3.5 text-studio-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{copiedKey === "vscode" ? "Copied" : "Copy JSON"}</span>
              </button>
              <pre>{vscodeConfig}</pre>
            </div>
          </div>
        )}

        {/* Example prompts footer */}
        <div className="mt-5 pt-4 bg-studio-bg/50 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-studio-primary" />
            <span>Example Chat Prompts with Your AI Agent:</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-neutral-400">
            <p className="hover:text-neutral-200 transition-colors">
              💬 <em>&ldquo;Find 3 fast whoosh sounds under 2 seconds for my video transition.&rdquo;</em>
            </p>
            <p className="hover:text-neutral-200 transition-colors">
              💬 <em>&ldquo;Search for a retro 8-bit jump sound and download it into ./assets/audio/.&rdquo;</em>
            </p>
          </div>
        </div>

        {/* GitHub Docs Link */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span>Zero API keys or signups required.</span>
          <a
            href="https://github.com/sheikhshariarnehal/soundforge-sfx/tree/main/packages/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-studio-primary hover:underline font-medium"
          >
            View MCP GitHub Docs
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
