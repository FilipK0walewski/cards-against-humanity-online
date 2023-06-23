import { createSlice } from '@reduxjs/toolkit'
import instance from '../services/Common'

export const commonSlice = createSlice({
  name: 'common',
  initialState: {
    loggedIn: localStorage.getItem('token') ? true : false,
    username: null,
    guest: null,
    notifications: [],
  },
  reducers: {
    logIn: (state, data) => {
      localStorage.setItem('token', data.payload.token)
      for (let key of Object.keys(localStorage)) {
        if (key !== 'token') {
          localStorage.removeItem(key)
        }
      }
      state.loggedIn = true
      state.username = data.payload.username
      state.guest = false
      state.notifications.push({ text: `Logged in as ${data.payload.username}.`, type: 0 })
    },
    setUserData: (state, data) => {
      state.loggedIn = true
      state.guest = data.payload.guest
      state.username = data.payload.username
    },
    setUsername: (state, data) => {
      state.username = data.payload.username
    },
    logOut: (state) => {
      localStorage.removeItem('token')
      state.loggedIn = false
      state.username = null
      state.guest = null
      state.notifications.push({ text: 'Logged out.', type: 0 })
    },
    addNotification: (state, data) => {
      state.notifications.push({ text: data.payload.text, type: data.payload.type })
    },
    removeNotification(state) {
      state.notifications.shift()
    }
  },
})

export const { logIn, logOut, setUserData, setUsername, addNotification, removeNotification } = commonSlice.actions
export default commonSlice.reducer
