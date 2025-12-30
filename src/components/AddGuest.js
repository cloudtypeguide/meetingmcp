import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const AddGuest = () => {
    const ROOMS = [
        { name: "Focus Room", capacity: 4 },
        { name: "Creative Lab", capacity: 8 },
        { name: "Board Room", capacity: 20 }
    ];

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 9; hour <= 19; hour++) {
            for (let min = 0; min < 60; min += 30) {
                if (hour === 19 && min > 0) continue;
                const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                const label = hour < 12 ? `오전 ${timeString}` : `오후 ${timeString}`;
                slots.push({ value: timeString, label: label });
            }
        }
        return slots;
    };
    const TIME_SLOTS = generateTimeSlots();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { id } = useParams();

    // 🔴 본인의 백엔드 주소가 맞는지 확인하세요!
    const API_URL = "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

    const [deptName, setDeptName] = useState(searchParams.get('dept') || '');   
    const [bookerName, setBookerName] = useState(searchParams.get('booker') || ''); 
    const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(searchParams.get('start') || "09:00");
    const [endTime, setEndTime] = useState(searchParams.get('end') || "10:00");
    const [selectedRoom, setSelectedRoom] = useState(searchParams.get('room') || ROOMS[0].name);

    const saveOrUpdateGuest = (e) => {
        e.preventDefault();

        if (startTime >= endTime) {
            alert("종료 시간은 시작 시간보다 뒤여야 합니다!");
            return;
        }

        const finalTimeInfo = `${date} (${startTime} ~ ${endTime})`;

        const guest = { 
            deptName: deptName,
            bookerName: bookerName,
            roomName: selectedRoom,
            date: date,           
            startTime: startTime, 
            endTime: endTime,     
            timeInfo: finalTimeInfo 
        };

        const requestOptions = {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guest)
        };

        const url = id ? `${API_URL}/${id}` : API_URL;

        fetch(url, requestOptions)
            .then(async response => {
                // 1. 성공(200 OK)이면 JSON으로 변환해서 다음으로 넘김
                if (response.ok) {
                    return response.json();
                }
                
                // 2. 실패(400 Bad Request 등)면 백엔드가 보낸 '문자열 메시지'를 읽어서 에러로 던짐
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            })
            .then(() => {
                alert("✅ 예약이 확정되었습니다!");
                navigate('/');
            })
            .catch(error => {
                console.error("실패:", error);
                // 3. 여기서 깔끔한 메시지만 출력됨 (예: "이미 예약된 시간입니다! ...")
                alert(error.message);
            });
    };

    useEffect(() => {
        if (id) {
            fetch(`${API_URL}/${id}`)
                .then(res => res.json())
                .then(data => {
                    setDeptName(data.deptName);
                    setBookerName(data.bookerName);
                    setSelectedRoom(data.roomName);
                    if(data.date) setDate(data.date);
                    if(data.startTime) setStartTime(data.startTime);
                    if(data.endTime) setEndTime(data.endTime);
                })
                .catch(error => console.log(error));
        }
    }, [id]);

    const title = id ? "예약 정보 수정" : "새로운 회의실 예약";

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-6 col-md-8">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <h2 className="text-center mb-5 fw-bold">{title}</h2>
                            <form>
                                <div className="mb-4">
                                    <label className="form-label text-muted small">부서명</label>
                                    <input type="text" placeholder="예: 개발팀" className="form-control form-control-lg" 
                                           value={deptName} onChange={(e) => setDeptName(e.target.value)} />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small">예약자 성함</label>
                                    <input type="text" placeholder="예: 홍길동" className="form-control form-control-lg" 
                                           value={bookerName} onChange={(e) => setBookerName(e.target.value)} />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small">회의실 선택</label>
                                    <select className="form-select form-select-lg" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                                        {ROOMS.map(room => (
                                            <option key={room.name} value={room.name}>
                                                {room.name} (정원: {room.capacity}명)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                    <label className="form-label text-muted small d-block mb-3">📅 일시 선택</label>
                                    <input type="date" className="form-control form-control-lg mb-3" 
                                           value={date} onChange={(e) => setDate(e.target.value)} />

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="form-label text-muted small">시작</label>
                                            <select className="form-select" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                                                {TIME_SLOTS.map(slot => (
                                                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label text-muted small">종료</label>
                                            <select className="form-select" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                                                {TIME_SLOTS.map(slot => (
                                                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-grid gap-2 mt-5">
                                    <button className="btn btn-primary btn-lg py-3" onClick={(e) => saveOrUpdateGuest(e)}>예약 확정하기</button>
                                    <Link to="/" className="btn btn-outline-secondary">취소</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddGuest;
