import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children, title }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden transition-colors duration-500">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar title={title} setIsOpen={setIsOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none dark:bg-emerald-500/10"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none dark:bg-blue-500/10"></div>
      </div>
    </div>
  )
}