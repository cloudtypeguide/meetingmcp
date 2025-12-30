import express from "express";
import { createServer } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

// 백엔드 주소
const SPRING_API_URL = process.env.SPRING_API_URL || "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 리액트 빌드 결과물(build 폴더) 정적 파일 서빙
app.use(cors());
app.use(express.static(path.join(__dirname, "build")));

const mcpServer = new McpServer({
  name: "Booking MCP",
  version: "1.0.0",
});

// 1. UI 제공 (ChatGPT 아이프레임용)
mcpServer.registerResource(
  "booking-ui",
  "ui://widget/index.html",
  { mimeType: "text/html" },
  async () => {
    const indexPath = path.join(__dirname, "build", "index.html");
    const html = fs.readFileSync(indexPath, "utf8");
    return {
      contents: [{
        uri: "ui://widget/index.html",
        mimeType: "text/html",
        text: html
      }]
    };
  }
);

// 2. 예약 도구 등록 (실제 기능)
mcpServer.registerTool(
  "book_guest",
  {
    title: "회의실 예약하기",
    description: "회의실을 예약합니다.",
    inputSchema: {
      deptName: z.string(),
      bookerName: z.string(),
      roomName: z.string(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      timeInfo: z.string()
    }
  },
  async (args) => {
    try {
      console.log("📤 예약 요청:", args);
      const response = await fetch(SPRING_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return { content: [{ type: "text", text: "예약이 성공적으로 완료되었습니다!" }] };
    } catch (error) {
      console.error("❌ 예약 실패:", error);
      return { content: [{ type: "text", text: `에러 발생: ${error.message}` }], isError: true };
    }
  }
);

const httpServer = createServer(app);
const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });

app.post("/mcp", async (req, res) => {
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
});

httpServer.listen(PORT, () => console.log(`🚀 MCP Server running on port ${PORT}`));
