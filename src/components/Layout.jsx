import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children, title }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} setIsOpen={setIsOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}