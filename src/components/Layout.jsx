import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children, title }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar title={title} setIsOpen={setIsOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-160px)]">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}