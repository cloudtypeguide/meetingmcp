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

// 🟢 [설정] 백엔드 API 주소
const SPRING_API_URL = "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

// 🟢 [설정] 프론트엔드 배포 주소 (ChatGPT 내에서 리소스 로딩용)
const BASE_URL = "https://port-0-meetingmcp-mg2vve8668cb34cb.sel3.cloudtype.app/";

// 🟢 [설정] 실제 회의실 이름 및 정보
const AVAILABLE_ROOMS = ["Focus Room", "Creative Lab", "Board Room"];
const ROOM_DETAILS = {
  "Focus Room": "정원 4명, 소규모 집중 회의용",
  "Creative Lab": "정원 8명, 중규모 창의 회의용",
  "Board Room": "정원 20명, 대규모 임원 회의용"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "build")));

// MCP 요청 처리 (Stateless 방식)
app.post("/mcp", async (req, res) => {
  try {
    const mcpServer = new McpServer({
      name: "Booking MCP",
      version: "1.0.0",
    });

    // 1. UI 리소스 등록 (여기가 핵심!)
    mcpServer.registerResource(
      "booking-ui",
      "ui://widget/index.html",
      { mimeType: "text/html" },
      async () => {
        const indexPath = path.join(__dirname, "build", "index.html");
        let html = fs.readFileSync(indexPath, "utf8");

        // 🔴 [마법의 코드] 
        // ChatGPT에게 줄 때만 <base> 태그와 IS_MCP 변수를 심습니다.
        // - <base>: 흰 화면 방지 (경로 해결)
        // - window.IS_MCP = true: App.js가 이걸 보고 '예약 폼'을 먼저 띄움
        if (BASE_URL) {
          html = html.replace(
            "<head>", 
            `<head>
             <base href="${BASE_URL}">
             <script>window.IS_MCP = true;</script>` 
          );
        }

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

    // 2. 회의실 정보 조회 도구
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

    // 3. 스케줄 조회 도구 (UI 연동됨)
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

    // 4. 예약 도구 (UI 연동 + 검증 로직)
    mcpServer.registerTool(
      "book_guest",
      {
        title: "회의실 예약하기",
        description: "회의실을 예약합니다.",
        inputSchema: {
          deptName: z.string().describe("부서명"),
          bookerName: z.string().describe("예약자명"),
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
          // 방어 로직: 엉뚱한 회의실 이름 차단
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
