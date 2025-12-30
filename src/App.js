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
                <Routes>
                    <Route path = "/" element={<ListGuests />}></Route>
                    <Route path = "/waitlist" element={<ListGuests />}></Route>
                    <Route path = "/add-guest" element={<AddGuest />}></Route>
                    <Route path = "/edit-guest/:id" element={<AddGuest />}></Route>
                </Routes>
        </Router>
    </div>
  );
}

export default App;
