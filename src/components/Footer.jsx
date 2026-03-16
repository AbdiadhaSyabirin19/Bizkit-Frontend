export default function Footer() {
  const year = new Date().getFullYear()
  
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-4 px-6 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="text-gray-500 text-xs md:text-sm">
          <span className="font-bold text-gray-700">Copyright &copy; 2014-{year} AINDO.</span> All rights reserved.
        </div>
        <div className="text-gray-400 text-xs md:text-sm font-medium tracking-wide">
          BizKit
        </div>
      </div>
    </footer>
  )
}
