import React from 'react'

const Footer = ({ variant = 'blue', bgColor }) => {
  const theme =
    variant === 'glass'
      ? 'bg-black/30 backdrop-blur-md border-t border-white/20'
      : bgColor
      ? ''
      : 'bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700';

  const style = bgColor && variant !== 'glass' ? { backgroundColor: bgColor } : undefined;

  return (
    <footer className={`w-full fixed bottom-0 left-0 ${theme} text-white text-center py-2 text-base z-50 shadow-lg`} style={style}>
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