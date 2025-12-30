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
const SPRING_API_URL = "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

// 🟢 [신규 추가] 실제 회의실 이름 목록 (AI가 이 이름만 쓰도록 강제함)
const AVAILABLE_ROOMS = [
  "Focus Room",
  "Creative Lab",
  "Board Room"
];

// 🟢 [신규 추가] AI에게 줄 상세 정보 (인원수 등)
const ROOM_DETAILS = {
  "Focus Room": "정원 4명, 소규모 집중 회의용",
  "Creative Lab": "정원 8명, 중규모 창의 회의용",
  "Board Room": "정원 20명, 대규모 임원 회의용"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "build")));

app.post("/mcp", async (req, res) => {
  try {
    const mcpServer = new McpServer({
      name: "Booking MCP",
      version: "1.0.0",
    });

    // 1. UI 리소스 등록 (기존 유지)
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
            text: html,
            _meta: { "openai/widgetPrefersBorder": true } 
          }]
        };
      }
    );

    // 🟢 [신규 추가] 2. 회의실 정보 조회 도구
    mcpServer.registerTool(
      "get_rooms_info",
      {
        title: "회의실 목록 조회",
        description: "예약 가능한 회의실 목록과 정원 정보를 조회합니다. 예약 전에 반드시 확인해야 합니다.",
        inputSchema: {}
      },
      async () => {
        return {
          content: [{ 
            type: "text", 
            text: `현재 예약 가능한 회의실 목록: ${JSON.stringify(ROOM_DETAILS, null, 2)}` 
          }]
        };
      }
    );

    // 3. 스케줄 조회 도구 (기존 유지 + UI 연결)
    mcpServer.registerTool(
      "check_schedule",
      {
        title: "예약 현황 조회",
        description: "현재 잡혀있는 예약 목록을 조회합니다.",
        inputSchema: {},
        _meta: {
          "openai/outputTemplate": "ui://widget/index.html",
          "openai/toolInvocation/invoking": "스케줄을 조회하고 있습니다...",
          "openai/toolInvocation/invoked": "스케줄 조회 완료",
        }
      },
      async () => {
        try {
          console.log("👀 스케줄 조회 요청");
          const response = await fetch(SPRING_API_URL);
          if (!response.ok) throw new Error("데이터 조회 실패");
          const data = await response.json();
          return { 
            content: [{ type: "text", text: JSON.stringify(data) }],
            structuredContent: { tasks: data } 
          };
        } catch (error) {
          return { content: [{ type: "text", text: `에러: ${error.message}` }], isError: true };
        }
      }
    );

    // 4. 예약 도구 (검증 로직 추가됨)
    mcpServer.registerTool(
      "book_guest",
      {
        title: "회의실 예약하기",
        description: "회의실을 예약합니다.",
        inputSchema: {
          deptName: z.string().describe("부서명"),
          bookerName: z.string().describe("예약자명"),
          // 🟢 [수정됨] 정확한 이름 목록을 AI에게 설명으로 전달
          roomName: z.string().describe(`회의실 이름 (반드시 다음 중 하나: ${AVAILABLE_ROOMS.join(", ")})`),
          date: z.string().describe("날짜 (YYYY-MM-DD)"),
          startTime: z.string().describe("시작 시간 (HH:mm)"),
          endTime: z.string().describe("종료 시간 (HH:mm)"),
          timeInfo: z.string().describe("회의 내용")
        },
        _meta: {
          "openai/outputTemplate": "ui://widget/index.html",
          "openai/toolInvocation/invoking": "예약을 진행 중입니다...",
          "openai/toolInvocation/invoked": "예약 처리 완료",
        }
      },
      async (args) => {
        try {
          // 🟢 [신규 추가] AI가 없는 방을 예약하려고 하면 에러 발생
          if (!AVAILABLE_ROOMS.includes(args.roomName)) {
             throw new Error(`'${args.roomName}'은(는) 존재하지 않습니다. 정확한 이름: ${AVAILABLE_ROOMS.join(", ")}`);
          }

          console.log("📤 예약 요청:", args);
          const response = await fetch(SPRING_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            return { 
              content: [{ type: "text", text: `예약 실패: ${errorText}` }],
              isError: true 
            };
          }
          
          return { content: [{ type: "text", text: "성공적으로 예약되었습니다." }] };
        } catch (error) {
          return { content: [{ type: "text", text: `오류 발생: ${error.message}` }], isError: true };
        }
      }
    );

    const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);

  } catch (error) {
    console.error("MCP Error:", error);
    if (!res.headersSent) res.status(500).send("Server Error");
  }
});

const httpServer = createServer(app);
httpServer.listen(PORT, () => console.log(`🚀 MCP Server running on port ${PORT}`));
