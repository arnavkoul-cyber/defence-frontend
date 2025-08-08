import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full fixed bottom-0 left-0 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 text-white text-center py-2 text-base z-50 shadow-lg border-t border-blue-300">
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className="flex items-center justify-center space-x-2">
          {/* JaKeGA Logo */}
         
          <span className="text-xs">
            Website Designed, Developed and Hosted by
            <span className="font-bold text-white drop-shadow-lg tracking-wider uppercase text-sm ml-1">
              Jammu & Kashmir e-Governance Agency (JaKeGA)
            </span>
          </span>
        </div>
        <div className="text-xs">
          Website Content and Data maintained by
          <span className="font-semibold ml-1">
            Directorate of Defence Labour Procurement, J&K and Ladakh
          </span>
        </div>
        <span className="text-xs">
          Copyright © 2025 All Rights Reserved
        </span>
      </div>
    </footer>
  )
}

export default Footer