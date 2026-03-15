import axios from "axios";

export const documentQueryTool = {
  name: "document_query",
  description:
    "End-to-end knowledge retrieval tool. Provide a natural language question, and it will: 1) use an AI model to extract optimal search keywords, 2) search the internal database for matching documents, 3) download the actual internal document contents from secure S3 storage in parallel, and 4) use a powerful AI (Gemini) to read those documents and summarize a precise, grounded answer. Use this for ANY question regarding internal rules, recipes, cooking guides, or domain-specific documentation.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Your raw, natural language question (e.g., 'What are the best beef recipes for a healthy diet?')",
      },
    },
    required: ["query"],
  },
};

export async function handleDocumentQuery(args) {
  const query = args.query;

  // Use environment variable or fallback to localhost
  const apiUrl = process.env.DOC_API_URL || "http://127.0.0.1:8000";

  if (!query) {
    throw new Error("Query parameter is required");
  }

  try {
    const response = await axios.post(`${apiUrl}/documents/query`, {
      query: query,
    });

    const data = response.data;

    // Extract answer and matching documents
    const answer = data.agent_response || "No answer generated.";
    const matchingDocuments = data.matching_documents || [];

    // Get document names as used by the API
    const documentsUsed = matchingDocuments.map(
      (doc) => doc.document_name || doc.name || doc.title || "Unknown Document",
    );
    const documentCount = matchingDocuments.length;

    // Return the simplified, agent-friendly JSON structure
    const result = {
      answer: answer,
      documents_used: documentsUsed,
      document_count: documentCount,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error calling FastAPI backend:", error.message);

    let errorMessage = "Failed to process query.";
    if (error.response) {
      errorMessage = `Backend API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      errorMessage = "No response received from Backend API.";
    } else {
      errorMessage = error.message;
    }

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
}
