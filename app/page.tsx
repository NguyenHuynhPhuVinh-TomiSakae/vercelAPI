'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const savedUsername = localStorage.getItem('username')
    const savedPassword = localStorage.getItem('password')
    if (savedUsername) setUsername(savedUsername)
    if (savedPassword) setPassword(savedPassword)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setPasswordError('')

    if (username === process.env.USERNAME && password === process.env.PASSWORD) {
      localStorage.setItem('username', username)
      localStorage.setItem('password', password)
      router.push('/admin')
    } else {
      setUsernameError('Sai tên đăng nhập hoặc mật khẩu')
      setPasswordError('Sai tên đăng nhập hoặc mật khẩu')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Đăng nhập</h2>
        <div className="mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {usernameError && <p className="mt-1 text-sm text-red-500">{usernameError}</p>}
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}
        </div>
        <button type="submit" className="w-full py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          Đăng nhập
        </button>
      </form>
    </div>
  )
}