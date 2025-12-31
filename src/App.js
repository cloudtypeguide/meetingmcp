import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import ListGuests from "./components/ListGuests";
import Header from "./components/Header";
import AddGuest from "./components/AddGuest";

function App() {
  
  // 🟢 [스마트 라우팅] 현재 접속자가 MCP(ChatGPT)인지 확인
  // server.mjs에서 심어준 변수(window.IS_MCP)가 있으면 true, 없으면 false
  const isMcpWidget = window.IS_MCP === true;

  return (
    <div>
        <Router>
            <Header />
            <div className="container"> 
                <Routes>
                    {/* 🔴 [핵심] 상황에 따라 첫 화면을 다르게 보여줍니다! */}
                    <Route 
                        path="/" 
                        element={isMcpWidget ? <AddGuest /> : <ListGuests />} 
                    />

                    {/* 나머지 경로는 그대로 유지 */}
                    <Route path="/list" element={<ListGuests />}></Route>
                    <Route path="/waitlist" element={<ListGuests />}></Route>
                    <Route path="/add-guest" element={<AddGuest />}></Route>
                    <Route path="/edit-guest/:id" element={<AddGuest />}></Route>
                </Routes>
            </div>
        </Router>
    </div>
  );
}

export default App;
