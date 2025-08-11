import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ variant = 'blue', bgColor }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isLoggedIn = !!(
    localStorage.getItem('auth_token') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('mobile_number')
  );

  const base = 'shadow-lg py-4 px-6 flex items-center justify-between w-full sticky top-0 z-50';
  const theme =
    variant === 'glass'
      ? 'bg-black/30 backdrop-blur-md border-b border-white/20'
      : bgColor
      ? ''
      : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400';

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
  localStorage.removeItem('mobile_number');
  localStorage.removeItem('army_unit_id');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('officer_id');
  localStorage.removeItem('userId');
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className={`${theme} ${base}`} style={style}>
       <div className="flex items-center gap-4">
         <div className="flex items-center justify-center">
           {/* Keep emblem bright and white over dark glass */}
           <img src={require('../assets/gold_emb.png')} alt="Emblem" className="w-12 h-12 object-contain mix-blend-screen " />
         </div>
         <div>
           <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
          Directorate of Defence Labour Procurement, J&K and Ladakh
           </h1>
           <h2 className="text-sm sm:text-base font-medium text-blue-100 mt-1">
             Government of J&K
           </h2>
         </div>
       </div>
       
       <div className="flex items-center gap-4">
         <div className="text-right">
           <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide drop-shadow-sm">
           
           </h1>
           <span className="block text-xs sm:text-sm text-blue-100 mt-1 font-medium">
         
           </span>
         </div>
         {isLoggedIn && (
           <div className="relative" ref={menuRef}>
             <button
               type="button"
               onClick={() => setMenuOpen((v) => !v)}
               className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200 focus:outline-none"
               aria-haspopup="menu"
               aria-expanded={menuOpen}
             >
               <User className="w-6 h-6 text-white" />
             </button>
             {/* Online indicator */}
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>

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