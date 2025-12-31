import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GuestService from '../services/GuestService'; // 경로는 본인 프로젝트에 맞게 확인 필요

const AddGuest = () => {
    // 폼 상태 관리
    const [deptName, setDeptName] = useState('');
    const [bookerName, setBookerName] = useState('');
    const [roomName, setRoomName] = useState('Focus Room'); // 기본값
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [timeInfo, setTimeInfo] = useState('');

    const navigate = useNavigate();
    const { id } = useParams();

    // 🟢 [핵심] 컴포넌트가 로드될 때 AI가 준 데이터를 낚아채는 부분
    useEffect(() => {
        // 서버에서 window.PREFILLED_DATA에 데이터를 심어줬는지 확인
        if (window.PREFILLED_DATA) {
            console.log("🖥️ 화면 로드됨. 자동입력 데이터 감지:", window.PREFILLED_DATA);
            const data = window.PREFILLED_DATA;

            if(data.deptName) setDeptName(data.deptName);
            if(data.bookerName) setBookerName(data.bookerName);
            
            // 회의실 이름은 Select 박스의 value와 정확히 일치해야 선택됨
            if(data.roomName) setRoomName(data.roomName);
            
            if(data.date) setDate(data.date);
            if(data.startTime) setStartTime(data.startTime);
            if(data.endTime) setEndTime(data.endTime);
            if(data.timeInfo) setTimeInfo(data.timeInfo);
        }
    }, []);

    // 저장 또는 수정 로직
    const saveOrUpdateGuest = (e) => {
        e.preventDefault();

        const guest = { deptName, bookerName, roomName, date, startTime, endTime, timeInfo };

        if (id) {
            GuestService.updateGuest(id, guest).then((response) => {
                navigate('/waitlist');
            }).catch(error => console.log(error));
        } else {
            GuestService.createGuest(guest).then((response) => {
                // MCP 모드일 경우 성공 알림
                if(window.IS_MCP) {
                    alert("예약이 성공적으로 확정되었습니다!");
                }
                navigate('/waitlist');
            }).catch(error => console.log(error));
        }
    };

    const cancel = () => {
        navigate('/waitlist');
    };

    return (
        <div className="container mt-5">
            <div className="card col-md-6 offset-md-3">
                <h3 className="text-center mt-3">
                    {window.IS_MCP ? "AI 예약 신청 확인" : "새로운 회의실 예약"}
                </h3>
                <div className="card-body">
                    <form>
                        <div className="form-group mb-3">
                            <label> 부서명: </label>
                            <input placeholder="부서명" name="deptName" className="form-control"
                                value={deptName} onChange={(e) => setDeptName(e.target.value)} />
                        </div>
                        <div className="form-group mb-3">
                            <label> 예약자 성명: </label>
                            <input placeholder="성명" name="bookerName" className="form-control"
                                value={bookerName} onChange={(e) => setBookerName(e.target.value)} />
                        </div>
                         <div className="form-group mb-3">
                            <label> 회의실 선택: </label>
                            <select name="roomName" className="form-control" 
                                value={roomName} onChange={(e) => setRoomName(e.target.value)}>
                                <option value="Focus Room">Focus Room (정원: 4명)</option>
                                <option value="Creative Lab">Creative Lab (정원: 8명)</option>
                                <option value="Board Room">Board Room (정원: 20명)</option>
                            </select>
                        </div>
                         <div className="form-group mb-3">
                            <label> 날짜: </label>
                            <input type="date" name="date" className="form-control"
                                value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                         <div className="form-group mb-3">
                            <div className="row">
                                <div className="col">
                                    <label> 시작 시간: </label>
                                    <input type="time" name="startTime" className="form-control"
                                        value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                </div>
                                <div className="col">
                                    <label> 종료 시간: </label>
                                    <input type="time" name="endTime" className="form-control"
                                        value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                </div>
                            </div>
                        </div>
                         <div className="form-group mb-3">
                            <label> 회의 내용: </label>
                            <input placeholder="회의 내용" name="timeInfo" className="form-control"
                                value={timeInfo} onChange={(e) => setTimeInfo(e.target.value)} />
                        </div>

                        <div className="d-grid gap-2">
                            <button className="btn btn-primary" onClick={saveOrUpdateGuest}>
                                {window.IS_MCP ? "✅ 예약 확정하기" : "예약하기"}
                            </button>
                            <button className="btn btn-secondary" onClick={cancel}>취소</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddGuest;
