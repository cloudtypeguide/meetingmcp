import axios from "axios";

class WaitlistService{

    getAllGuests() {
        return axios.get(process.env.REACT_APP_WAITLIST_API_URL)
    }

    createGuest(guest) {
        return axios.post(process.env.REACT_APP_WAITLIST_API_URL, guest)
    }

    getGuestById(guestId) {
        return axios.get(process.env.REACT_APP_WAITLIST_API_URL + "/" + guestId)
    }

    updateGuest(guestId, guest) {
        return axios.put(process.env.REACT_APP_WAITLIST_API_URL + "/" + guestId, guest)
    }

    deleteGuest(guestId) {
        return axios.delete(process.env.REACT_APP_WAITLIST_API_URL + "/" + guestId)
    }
}

export default new WaitlistService();
