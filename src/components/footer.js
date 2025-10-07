import React from 'react'

const Footer = ({ variant = 'blue', bgColor }) => {
  const theme =
    variant === 'glass'
      ? 'bg-black/30 backdrop-blur-md border-t border-white/20'
      : bgColor
      ? ''
      : 'bg-gradient-to-r from-[rgb(11,80,162)] to-[rgb(11,80,162)]';

  const style = bgColor && variant !== 'glass' ? { backgroundColor: bgColor } : undefined;

  return (
    <footer className={`w-full fixed bottom-0 left-0 ${theme} text-white py-1 text-[11px] z-50 shadow-lg`} style={style}>
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span>
            Website Designed, Developed and Hosted by
            <span className="font-semibold ml-1 text-white">Jammu & Kashmir e-Governance Agency (JaKeGA)</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Website Content and Data maintained by
            <span className="font-semibold ml-1 text-white">Directorate of Defence Labour Procurement, J&K and Ladakh</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-white">Copyright © 2025 All Rights Reserved</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer