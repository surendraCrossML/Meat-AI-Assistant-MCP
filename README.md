# Document Query MCP Server

This is a Model Context Protocol (MCP) server that provides a `document_query` tool to search internal documents using natural language. It is designed to act as an intermediary, connecting an MCP client (such as n8n or Postman) to an existing FastAPI backend.

---

## 🚀 How It Works

This Express.js application exposes an SSE (Server-Sent Events) interface over HTTP. When a client connects via MCP, they are provided with the `document_query` tool.

### Backend Connection

When the `document_query` tool is invoked, this MCP server makes a `POST` request to your backend processing server (defaulting to a local FastAPI server):

- **Target Backend API**: `${DOC_API_URL}/document/query` (Default: `http://127.0.0.1:8000/document/query`)
- **Payload Sent**: `{ "query": "..." }`
- **Response Structure**: The backend returns the generated answer and matching document metadata, which is then formatted in a clean JSON structure and returned to the MCP client.

### Endpoints

This server exposes two primary URLs for MCP communication:

1. **`GET /sse`**: The initial connection endpoint. Clients connect here to establish a persistent streaming session. Upon connection, the server registers the available MCP tools.
2. **`POST /message`**: The endpoint where the MCP client sends JSON-RPC messages (such as tool execution requests). It uses the `sessionId` query parameter to route messages to the correct SSE connection.

---

## 💻 Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- Your FastAPI backend running and accessible

### Setup Instructions

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   You can optionally create a `.env` file in the root directory to override default parameters:

   ```env
   PORT=3000
   DOC_API_URL=http://127.0.0.1:8000
   ```

3. **Start the server**:
   ```bash
   npm start
   # or: node server.js
   ```

The server will log that it is running on `http://localhost:3000/sse` and `http://localhost:3000/message`.

---

## 🌐 Exposing to the Internet (ngrok)

To use your local MCP server with external tools like n8n, you need to expose your local port (`3000`) to the public internet using [ngrok](https://ngrok.com/).

Run the following command in a new terminal window:

```bash
ngrok http 3000
```

Ngrok will provide you with a public forwarding URL that looks like `https://<random-id>.ngrok-free.app`. Keep this terminal running.

---

## ⚙️ How to Use in n8n

Follow these steps to integrate this MCP server directly into n8n:

1. Open your n8n workflow or navigate to **Settings > Model Context Protocol (MCP) Servers**.
2. Click **Add Server**.
3. Select **HTTP (SSE)** as the connection type.
4. Set the **Server URL** to your ngrok `/sse` endpoint:
   `https://<random-id>.ngrok-free.app/sse`
5. Click **Connect**.

Once connected, n8n will automatically discover the `document_query` tool. You can now add an **Agent node** or **Tool node** in your n8n workflows and select the `document_query` tool to search your internal documents dynamically!
