import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ListGuests = () => {
    const API_URL = "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

    // 🏢 마스터 데이터
    const ROOMS = ["Focus Room", "Creative Lab", "Board Room"];

    // ⏰ 시간표용 헤더 생성 (09:00 ~ 19:00, 30분 단위)
    const generateTimeHeaders = () => {
        const slots = [];
        for (let hour = 9; hour < 19; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };
    const TIME_HEADERS = generateTimeHeaders();

    const [guests, setGuests] = useState([]);
    
    // 📅 시간표 조회용 날짜 상태 (기본값: 오늘)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const getAllGuests = () => {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) throw new Error(`통신 오류! (${response.status})`);
                return response.json();
            })
            .then(data => setGuests(data))
            .catch(error => console.error("로딩 실패:", error));
    };

    useEffect(() => {
        getAllGuests();
        const handleMessage = (event) => {
            if (event.data?.type === 'refresh_ui') getAllGuests();
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const deleteGuest = (guestId) => {
        if(window.confirm("정말 예약을 취소하시겠습니까?")) {
            fetch(`${API_URL}/${guestId}`, { method: 'DELETE' })
                .then(() => getAllGuests())
                .catch(error => console.log(error));
        }
    }

    // 🔍 특정 방, 특정 시간 슬롯에 예약이 있는지 확인하는 함수
    const getBookingInSlot = (roomName, timeSlot) => {
        return guests.find(guest => {
            if (guest.date !== selectedDate) return false;
            if (guest.roomName !== roomName) return false;
            return timeSlot >= guest.startTime && timeSlot < guest.endTime;
        });
    };

    return (
        <>
            {/* 🟢 [추가됨] 최상단 네비게이션 헤더 */}
            <nav className="navbar navbar-dark mb-5" style={{backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <div className="container py-2">
                    <span className="navbar-brand mb-0 h1 fw-bold fs-4">
                        <i className="bi bi-calendar-check me-2"></i>회의실 예약시스템
                    </span>
                </div>
            </nav>

            <div className="container pb-5">
                {/* 상단 버튼 영역 */}
                <div className="d-flex justify-content-between align-items-end mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">예약 현황</h2>
                        <p className="text-muted mb-0">회의실 이용 일정을 한눈에 확인하세요.</p>
                    </div>
                    <Link to="/add-guest" className="btn btn-primary px-4">
                        <i className="bi bi-plus-lg me-2"></i>새 예약
                    </Link>
                </div>

                {/* 📋 1. 전체 예약 목록 */}
                <h5 className="fw-bold mb-3 px-2 text-white">전체 예약 목록</h5>
                <div className="card shadow-lg overflow-hidden border-0 mb-5">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light bg-opacity-10">
                                <tr>
                                    <th className="ps-4 py-3">부서</th>
                                    <th className="py-3">예약자</th>
                                    <th className="py-3">회의실</th>
                                    <th className="py-3">일시</th>
                                    <th className="text-end pe-4 py-3">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guests.map(guest => (
                                    <tr key={guest.id}>
                                        <td className="ps-4 fw-bold">{guest.deptName}</td>
                                        <td>{guest.bookerName}</td> 
                                        <td>
                                            <span className="badge bg-primary bg-opacity-25 text-primary fw-normal px-3 py-2 rounded-pill border border-primary border-opacity-25">
                                                {guest.roomName}
                                            </span>
                                        </td>
                                        <td className="text-muted small">
                                            {guest.timeInfo}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Link className="btn btn-sm btn-outline-secondary me-2" to={`/edit-guest/${guest.id}`}>수정</Link>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteGuest(guest.id)}>취소</button>
                                        </td>
                                    </tr>
                                ))}
                                {guests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            현재 예약된 내역이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 📊 2. 일별 스케줄 시간표 */}
                <div className="card shadow-lg border-0">
                    <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-4 px-4">
                        {/* 🟢 [수정됨] text-white 클래스 추가하여 글씨를 흰색으로 변경 */}
                        <h5 className="fw-bold mb-0 text-white">📅 일별 스케줄</h5>
                        <input 
                            type="date" 
                            className="form-control" 
                            style={{width: 'auto', backgroundColor: '#2c2c2c', color: 'white', border: '1px solid #444'}}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="card-body p-4">
                        <div className="table-responsive">
                            <table className="table table-bordered text-center align-middle" style={{tableLayout: 'fixed', minWidth: '800px'}}>
                                <thead>
                                    <tr>
                                        <th style={{width: '120px', backgroundColor: '#2c2c2c', color: '#aaa'}}>회의실</th>
                                        {TIME_HEADERS.map(time => (
                                            <th key={time} style={{fontSize: '0.75rem', padding: '5px', backgroundColor: '#2c2c2c', color: '#aaa'}}>
                                                {time}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ROOMS.map(room => (
                                        <tr key={room}>
                                            <td className="fw-bold bg-dark text-white">{room}</td>
                                            {TIME_HEADERS.map(time => {
                                                const booking = getBookingInSlot(room, time);
                                                return (
                                                    <td key={time} className="p-0" style={{height: '40px', position: 'relative'}}>
                                                        {booking ? (
                                                            <div 
                                                                className="w-100 h-100 d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    backgroundColor: '#4e73df', 
                                                                    color: 'white', 
                                                                    fontSize: '0.7rem',
                                                                    borderRight: '1px solid rgba(255,255,255,0.1)'
                                                                }}
                                                                title={`${booking.deptName} - ${booking.bookerName}`}
                                                            >
                                                                <span className="d-none d-md-inline text-truncate" style={{maxWidth: '100%'}}>
                                                                    {booking.bookerName}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div style={{backgroundColor: 'transparent'}}></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ListGuests;
