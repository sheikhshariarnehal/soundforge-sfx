#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { SoundCatalogService } from "./catalog.js";

const server = new Server(
  {
    name: "soundforge-sfx-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const catalog = new SoundCatalogService();

const TOOLS: Tool[] = [
  {
    name: "search_sounds",
    description:
      "Search 1,400+ curated royalty-free sound effects in the SoundForge library. Supports fuzzy text search, category filtering, duration limits, and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Keywords to search for (e.g. 'whoosh', 'metal hit', 'sci-fi laser', 'footsteps', 'magic spell', 'bell').",
        },
        category: {
          type: "string",
          description:
            "Specific sound category filter (e.g. 'whoosh', 'swoosh', 'foley', 'glitch', 'comedy', 'horror', 'transition', 'aggression'). Use 'list_categories' to inspect available categories.",
        },
        minDuration: {
          type: "number",
          description: "Minimum duration in seconds.",
        },
        maxDuration: {
          type: "number",
          description: "Maximum duration in seconds (e.g., 3 for short UI sounds).",
        },
        limit: {
          type: "number",
          description: "Number of sound effects to return (default: 10, max: 50).",
        },
        offset: {
          type: "number",
          description: "Pagination offset for skipping initial results (default: 0).",
        },
      },
    },
  },
  {
    name: "get_sound_details",
    description:
      "Get detailed metadata and public streaming URL for a specific sound effect by ID.",
    inputSchema: {
      type: "object",
      required: ["soundId"],
      properties: {
        soundId: {
          type: "string",
          description: "The unique identifier of the sound effect (e.g. '487669').",
        },
      },
    },
  },
  {
    name: "list_categories",
    description:
      "List all available sound categories in the SoundForge SFX library with their sound counts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "download_sound",
    description:
      "Download a sound effect directly to a specified local directory on disk. Ideal for game engines, video editing pipelines, web assets, or mobile apps.",
    inputSchema: {
      type: "object",
      required: ["soundId", "targetDirectory"],
      properties: {
        soundId: {
          type: "string",
          description: "The unique identifier of the sound effect to download.",
        },
        targetDirectory: {
          type: "string",
          description:
            "Local file system path where the sound file will be saved (e.g. './assets/audio', './public/sounds'). Will be created if it does not exist.",
        },
        filename: {
          type: "string",
          description:
            "Optional custom file name (e.g. 'laser_hit.mp3'). Defaults to the original sound filename.",
        },
      },
    },
  },
  {
    name: "get_sound_audio_base64",
    description:
      "Fetch a sound effect as a base64-encoded MP3 string. Allows AI agents to directly embed or inspect the raw audio payload without saving to disk first.",
    inputSchema: {
      type: "object",
      required: ["soundId"],
      properties: {
        soundId: {
          type: "string",
          description: "The unique ID of the sound effect.",
        },
      },
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// List prompts handler
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "find_audio_for_scene",
        description:
          "Help choose and recommend sound effects for a video scene, game event, or UI interaction.",
        arguments: [
          {
            name: "description",
            description: "Description of the scene, game mechanic, or UI action.",
            required: true,
          },
        ],
      },
    ],
  };
});

// Get prompt handler
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "find_audio_for_scene") {
    const desc = request.params.arguments?.description || "UI interaction";
    return {
      description: "Audio selection guide for scene",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need sound effects for the following scene or interaction:\n\n"${desc}"\n\nPlease use the 'search_sounds' tool to find 3-5 suitable candidates from SoundForge SFX, explain why each fits the scene, and provide their durations and streaming URLs.`,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_sounds": {
        const result = await catalog.searchSounds({
          query: args?.query as string | undefined,
          category: args?.category as string | undefined,
          minDuration:
            typeof args?.minDuration === "number" ? args.minDuration : undefined,
          maxDuration:
            typeof args?.maxDuration === "number" ? args.maxDuration : undefined,
          limit: typeof args?.limit === "number" ? args.limit : 10,
          offset: typeof args?.offset === "number" ? args.offset : 0,
        });

        const simplified = result.sounds.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          duration: `${s.duration}s`,
          creator: s.creator,
          tags: s.tags,
          audioUrl: s.audioUrl,
          pixabayUrl: s.pixabayUrl,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalMatches: result.total,
                  returned: result.sounds.length,
                  offset: result.offset,
                  sounds: simplified,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_sound_details": {
        const soundId = String(args?.soundId || "");
        if (!soundId) {
          throw new Error("Missing required argument: 'soundId'");
        }
        const sound = await catalog.getSoundById(soundId);
        if (!sound) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Sound effect with ID '${soundId}' was not found.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(sound, null, 2),
            },
          ],
        };
      }

      case "list_categories": {
        const categories = await catalog.listCategories();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalCategories: categories.length,
                  categories,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "download_sound": {
        const soundId = String(args?.soundId || "");
        const targetDir = String(args?.targetDirectory || "");
        const customFilename = args?.filename ? String(args.filename) : undefined;

        if (!soundId || !targetDir) {
          throw new Error("Missing required arguments: 'soundId' and 'targetDirectory'");
        }

        const downloadInfo = await catalog.downloadSoundFile(
          soundId,
          targetDir,
          customFilename
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  message: `Downloaded sound '${downloadInfo.sound.title}' successfully.`,
                  filePath: downloadInfo.filePath,
                  bytesWritten: downloadInfo.bytesWritten,
                  sound: {
                    id: downloadInfo.sound.id,
                    title: downloadInfo.sound.title,
                    category: downloadInfo.sound.category,
                    duration: `${downloadInfo.sound.duration}s`,
                    audioUrl: downloadInfo.sound.audioUrl,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_sound_audio_base64": {
        const soundId = String(args?.soundId || "");
        if (!soundId) {
          throw new Error("Missing required argument: 'soundId'");
        }

        const audio = await catalog.getSoundAudioBase64(soundId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: audio.sound.id,
                  title: audio.sound.title,
                  mimeType: audio.mimeType,
                  sizeBytes: audio.sizeBytes,
                  base64Audio: audio.base64,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool '${name}': ${err?.message || String(err)}`,
        },
      ],
    };
  }
});

// Start transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SoundForge SFX MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running SoundForge SFX MCP Server:", error);
  process.exit(1);
});
