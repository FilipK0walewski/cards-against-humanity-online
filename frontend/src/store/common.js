import { createSlice } from '@reduxjs/toolkit'
import instance from '../services/Common'

export const commonSlice = createSlice({
  name: 'common',
  initialState: {
    loggedIn: localStorage.getItem('token') ? true : false,
    username: null,
    notifications: [],
  },
  reducers: {
    logIn: (state, data) => {
      instance.defaults.headers.common['token'] = data.payload.token
      localStorage.setItem('token', data.payload.token)
      state.loggedIn = true
      state.username = data.payload.username
      state.notifications.push({ text: `Logged in as ${data.payload.username}.`, type: 0 })
    },
    logOut: (state) => {
      delete instance.defaults.headers.common['token']
      localStorage.removeItem('token')
      state.loggedIn = false
      state.username = null
      state.notifications.push({ text: 'Logged out.', type: 0 })
    },
    setUsername: (state, username) => {
      state.username = username.payload
    },
    addNotification: (state, data) => {
      state.notifications.push({ text: data.payload.text, type: data.payload.type })
    },
    removeNotification(state) {
      state.notifications.shift()
    }
  },
})

export const { logIn, logOut, setUsername, addNotification, removeNotification } = commonSlice.actions
export default commonSlice.reducer
