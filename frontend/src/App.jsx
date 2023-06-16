import { Common } from './layouts/Common'
import { Deck } from './pages/Deck'
import { Decks } from './pages/Decks'
import { DefaultLayout } from './layouts/DefaultLayout'
import { Game } from './pages/Game'
import { GameCreate } from './pages/GameCreate'
import { Home } from './pages/Home'
import { Lobby } from './pages/Lobby'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Register } from './pages/Register'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useDispatch } from 'react-redux'
import { setUsername } from './store/common'

import { useEffect } from 'react'
import instance from './services/Common'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!instance.defaults.headers.common['token']) return
    instance.get('/profile/username').then(res => {
      dispatch(setUsername(res.data.username))
    })
  }, [])

  return (
    <>
      <Routes>
        <Route element={<Common />}>
          <Route element={<DefaultLayout />} >
            <Route path='/' element={<Home />} />
            <Route path='/decks/' element={<Decks />} />
            <Route path='/decks/:id' element={<Deck />} />
            <Route path='/games/create' element={<GameCreate />} />
            <Route path='/games/:id' element={<Game />} />
            <Route path='/lobby/:id' element={<Lobby />} />
            <Route path='/profile' element={<Profile />} />
          </Route>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='*' element={<Navigate to={'/'} />} />
        </Route>
      </Routes>
    </>
  )
}
