import axios from 'axios';

// 🟢 [설정] 백엔드 API 주소 (Spring Boot 서버 주소)
const GUEST_API_BASE_URL = "https://port-0-cloudtype-backend-template-mg2vve8668cb34cb.sel3.cloudtype.app/api/guests";

class GuestService {
    // 모든 예약 조회
    getGuests() {
        return axios.get(GUEST_API_BASE_URL);
    }

    // 예약 생성
    createGuest(guest) {
        return axios.post(GUEST_API_BASE_URL, guest);
    }

    // ID로 예약 조회
    getGuestById(guestId) {
        return axios.get(GUEST_API_BASE_URL + '/' + guestId);
    }

    // 예약 수정
    updateGuest(guestId, guest) {
        return axios.put(GUEST_API_BASE_URL + '/' + guestId, guest);
    }

    // 예약 삭제
    deleteGuest(guestId) {
        return axios.delete(GUEST_API_BASE_URL + '/' + guestId);
    }
}

export default new GuestService();
