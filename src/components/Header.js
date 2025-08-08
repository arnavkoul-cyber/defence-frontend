import React from 'react';
import { User } from 'lucide-react';

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 shadow-lg py-4 px-6 flex items-center justify-between w-full sticky top-0 z-50">
       <div className="flex items-center gap-4">
         <div className="flex items-center justify-center">
           {/* Use screen blend with invert so the emblem appears white and the white box disappears */}
           <img src={require('../assets/emblem.png')} alt="Emblem" className="w-12 h-12 object-contain mix-blend-screen invert contrast-125 brightness-90" />
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
         {/* <div className="relative">
          
           <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200">
             <User className="w-6 h-6 text-white" />
           </div>
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
         </div> */}
       </div>
     </header>
  );
}

export default Header;