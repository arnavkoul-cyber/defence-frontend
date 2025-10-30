import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ variant = 'blue', bgColor, isSidebarOpen, onToggleSidebar, emblemColor }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const isLoggedIn = !!(
    localStorage.getItem('auth_token') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('mobile_number')
  );

  const base = 'relative shadow-lg py-4 px-6 flex items-center justify-between w-full sticky top-0 z-50';
  const theme =
    variant === 'glass'
      ? 'bg-black/30 backdrop-blur-md border-b border-white/20'
      : bgColor
      ? ''
      : 'bg-gradient-to-r from-[#67a8f7] to-[#67a8f7]';

  const style = bgColor && variant !== 'glass' ? { backgroundColor: bgColor } : undefined;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    setMenuOpen(false);
    // Force a full page reload to reset app state
    window.location.href = '/login';
  };

  return (
    <header className={`${theme} ${base}`} style={style}>
       <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
         <div className="flex items-center justify-center flex-shrink-0">
           {/* Golden Emblem */}
           <img src={require('../assets/gold_emb.png')} alt="Emblem" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-lg" />
         </div>
         <div className="min-w-0 flex-1">
           <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-white tracking-wide drop-shadow-sm truncate">
          Directorate of Defence Labour Procurement, J&K and Ladakh
           </h1>
           <h2 className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-white/90 mt-0.5 sm:mt-1 truncate">
             Government of Jammu Kashmir and Ladakh
           </h2>
         </div>
       </div>
       
       <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
         {isLoggedIn && (
           <div className="relative" ref={menuRef}>
             <button
               type="button"
               onClick={() => setMenuOpen((v) => !v)}
               className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200 focus:outline-none"
               aria-haspopup="menu"
               aria-expanded={menuOpen}
             >
               <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
             </button>
             {/* Online indicator */}
             <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>

             {menuOpen && (
               <div className="absolute right-0 mt-2 w-48 rounded-xl z-50 overflow-hidden border border-white/10 shadow-2xl"
                    style={{ backgroundColor: bgColor || '#261d1a' }}>
                 <button
                   onClick={handleLogout}
                   className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 focus:bg-white/10 transition-colors"
                 >
                   <LogOut className="w-4 h-4 text-red-300" />
                   <span className="font-medium">Logout</span>
                 </button>
               </div>
             )}
           </div>
         )}
       </div>
     </header>
  );
}

export default Header;