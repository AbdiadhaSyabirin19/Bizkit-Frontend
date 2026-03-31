import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children, title }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200 print:block print:h-auto print:bg-white print:text-black">
      <div className="print:hidden">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative print:block print:overflow-visible">
        <div className="print:hidden">
          <Navbar title={title} setIsOpen={setIsOpen} />
        </div>

        <main className="flex-1 overflow-y-auto flex flex-col scroll-smooth custom-scrollbar print:block print:overflow-visible">
          <div className="flex-1 p-4 sm:p-8 print:p-0">
            <div className="max-w-[1600px] mx-auto print:max-w-none print:m-0">
              {children}
            </div>
          </div>
          <div className="print:hidden">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}