import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import express from "express";
import {
  documentQueryTool,
  handleDocumentQuery,
} from "./tools/documentQuery.js";

// Load environment variables
dotenv.config();

const app = express();
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
const PORT = process.env.PORT || 3001;

// Store transports by session ID
const transports = new Map();

// SSE endpoint for clients to connect
app.get("/sse", async (req, res) => {
  console.log("New SSE connection established");

  // Create a new MCP Server instance per connection
  const server = new Server(
    {
      name: "document-query-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register Tool List handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [documentQueryTool],
    };
  });

  // Register Tool Call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "document_query") {
      return await handleDocumentQuery(request.params.arguments);
    }
    throw new Error(`Tool not found: ${request.params.name}`);
  });

  const transport = new SSEServerTransport("/message", res);

  // Store the transport using its generated sessionId
  transports.set(transport.sessionId, transport);

  // Clean up when the connection is closed
  res.on("close", () => {
    console.log(`SSE connection closed for session: ${transport.sessionId}`);
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

// Message endpoint for clients to send requests
app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);

  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send("Session not found");
  }
});

app.listen(PORT, () => {
  console.log(`MCP Server running on HTTP SSE at http://localhost:${PORT}/sse`);
  console.log(`Message endpoint at http://localhost:${PORT}/message`);
});
