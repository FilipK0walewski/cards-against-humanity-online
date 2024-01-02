import axios from "axios";
import store from "../store/store"
import { addNotification, logOut } from "../store/common";

const notification = (text, n) => {
    store.dispatch(addNotification({ text, type: n }))
}

const baseURL = import.meta.env.VITE_API_URL
const instance = axios.create({ baseURL })

const token = localStorage.getItem('token')
if (token) instance.defaults.headers.common['token'] = token

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    config.headers.Authorization = `Bearer ${token}`
    return config
})

instance.interceptors.response.use((res) => {
    if (res.data && res.data.message) {
        notification(res.data.message, 0)
    }
    return res
}, (err) => {
    if (err.response) {
        if (err.response.status === 401) {
            store.dispatch(logOut())
        } else if (err.response.data.detail) {
            notification(err.response.data.detail, 1)
        }
    } else {
        notification('something no yes', 1)
    }
    return Promise.reject(err)
})

export default instance