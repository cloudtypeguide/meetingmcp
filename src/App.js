import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import ListGuests from "./components/ListGuests";
import Header from "./components/Header";
import AddGuest from "./components/AddGuest";

function App() {
  return (
    <div>
        <Router>
            <Header />
            {/* 부트스트랩 레이아웃을 위해 container 클래스 추가 (선택사항) */}
            <div className="container"> 
                <Routes>
                    {/* 🔴 [핵심 변경] 기본 주소("/")로 들어오면 바로 '예약 폼'을 보여줍니다. */}
                    <Route path = "/" element={<AddGuest />}></Route>

                    {/* 목록을 보고 싶을 때는 명시적으로 주소를 입력하거나 메뉴를 통해 이동 */}
                    <Route path = "/list" element={<ListGuests />}></Route>
                    <Route path = "/waitlist" element={<ListGuests />}></Route>
                    
                    {/* 기존 경로들 유지 */}
                    <Route path = "/add-guest" element={<AddGuest />}></Route>
                    <Route path = "/edit-guest/:id" element={<AddGuest />}></Route>
                </Routes>
            </div>
        </Router>
    </div>
  );
}

export default App;
