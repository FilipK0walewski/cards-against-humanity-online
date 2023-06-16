import store from "../store/store"
import axios from "axios";
import { addNotification } from "../store/common";

const addLog = (text, n) => {
    store.dispatch(addNotification({ text, type: n }))
}

const token = localStorage.getItem('token')
const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    // baseURL: import.meta.env.VITE_API_BASE_URL,
})

if (token) instance.defaults.headers.common['token'] = token
instance.interceptors.response.use((res) => {
    if (res.data && res.data.message) {
        addLog(res.data.message, 0)
    }
    return res
}, (err) => {
    if (!err) {
        addLog('error', 1)
    }
    else if ('message' in err) {
        addLog(err.message, 1)
    }
    else if (err.response && err.response.data && 'detail' in err.response.data) {
        addLog(err.response.data.detail, 1)
    }
    else {
        addLog('something no yes', 1)
    }
    return Promise.reject(err)
})

export default instance