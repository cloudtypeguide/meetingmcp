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

// 🟢 [설정] 프론트엔드 배포 주소
const BASE_URL = "https://port-0-meetingmcp-mg2vve8668cb34cb.sel3.cloudtype.app/";

const AVAILABLE_ROOMS = ["Focus Room", "Creative Lab", "Board Room"];
const ROOM_DETAILS = {
  "Focus Room": "정원 4명, 소규모 집중 회의용",
  "Creative Lab": "정원 8명, 중규모 창의 회의용",
  "Board Room": "정원 20명, 대규모 임원 회의용"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟢 [핵심] AI가 입력한 데이터를 임시 저장하는 변수
let pendingBookingData = null;

app.use(cors());
app.use(express.static(path.join(__dirname, "build")));

app.post("/mcp", async (req, res) => {
  try {
    const mcpServer = new McpServer({
      name: "Booking MCP",
      version: "1.0.0",
    });

    // 1. UI 리소스 등록 (데이터 주입 로직 포함)
    mcpServer.registerResource(
      "booking-ui",
      "ui://widget/index.html",
      { mimeType: "text/html" },
      async () => {
        const indexPath = path.join(__dirname, "build", "index.html");
        let html = fs.readFileSync(indexPath, "utf8");

        // 📝 [로그] 서버가 데이터를 가지고 있는지 확인
        console.log("💉 UI 요청 들어옴. 주입할 데이터:", pendingBookingData);

        // 🟢 [핵심] 리액트가 읽을 수 있도록 window 객체에 데이터 심기
        const injectScript = `
          <script>
            window.IS_MCP = true;
            window.PREFILLED_DATA = ${JSON.stringify(pendingBookingData)};
            console.log("✅ 서버로부터 데이터 수신:", window.PREFILLED_DATA);
          </script>
        `;

        if (BASE_URL) {
          html = html.replace("<head>", `<head><base href="${BASE_URL}">`);
        }
        html = html.replace("</body>", `${injectScript}</body>`);

        // 데이터를 주입했으면 초기화 (다음 요청을 위해)
        pendingBookingData = null;

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

    // 2. 회의실 정보 조회
    mcpServer.registerTool(
      "get_rooms_info",
      {
        title: "회의실 목록 조회",
        description: "예약 가능한 회의실 목록을 조회합니다.",
        inputSchema: {}
      },
      async () => {
        return {
          content: [{ type: "text", text: JSON.stringify(ROOM_DETAILS, null, 2) }]
        };
      }
    );

    // 3. 스케줄 조회
    mcpServer.registerTool(
      "check_schedule",
      {
        title: "예약 현황 조회",
        description: "예약 요청 전에 반드시 스케줄을 먼저 조회해야 합니다.",
        inputSchema: {},
        _meta: {
          "openai/outputTemplate": "ui://widget/index.html",
          "openai/toolInvocation/invoking": "예약을 하기 전에 먼저 예약현황을 조회하겠습니다...",
          "openai/toolInvocation/invoked": "예약현황 조회 완료",
        }
      },
      async () => {
        try {
          pendingBookingData = null; // 조회 시에는 폼 초기화
          const response = await fetch(SPRING_API_URL);
          const data = await response.json();
          return { 
            content: [{ type: "text", text: JSON.stringify(data) }],
            structuredContent: { tasks: data } 
          };
        } catch (error) {
          return { content: [{ type: "text", text: error.message }], isError: true };
        }
      }
    );

    // 4. 예약 신청서 작성 (데이터 스테이징)
    mcpServer.registerTool(
      "open_booking_form",
      {
        title: "예약_신청서_작성",
        description: "사용자가 확정하기 전에, 예약 정보를 미리 입력한 화면을 띄워줍니다.",
        inputSchema: {
          deptName: z.string(),
          bookerName: z.string(),
          roomName: z.string(),
          date: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          timeInfo: z.string()
        },
        _meta: {
          "openai/outputTemplate": "ui://widget/index.html",
          "openai/toolInvocation/invoking": "예약 신청서를 작성 중입니다...",
          "openai/toolInvocation/invoked": "예약 화면을 준비했습니다. 확인 후 확정해주세요.",
        }
      },
      async (args) => {
        console.log("📝 [서버] 예약 데이터 저장됨:", args);
        pendingBookingData = args; // 전역 변수에 저장
        return { content: [{ type: "text", text: "예약 정보를 입력했습니다. [예약 확정하기] 버튼을 눌러주세요." }] };
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
