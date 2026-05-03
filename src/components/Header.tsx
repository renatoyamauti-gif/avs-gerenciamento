/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, CheckCircle2, Settings, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../constants';

const Header = () => (
  <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-[#0f172a]/80 backdrop-blur-xl hidden lg:flex justify-between items-center px-10 py-4 border-b border-[#334155]">
    <div className="flex items-center gap-6">
      <div className="text-xl font-black text-white font-headline tracking-tighter italic">
        AVS <span className="text-[10px] text-[#3b82f6] tracking-[0.2em] font-bold not-italic">GERENCIAMENTO</span>
      </div>
      <div className="relative group hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] size-4" />
        <input 
          type="text" 
          placeholder="Buscar no sistema..." 
          className="bg-[#1e293b] text-white rounded-full pl-10 pr-4 py-2 text-sm border-none focus:ring-2 focus:ring-[#3b82f6]/20 w-64 transition-all placeholder-[#94a3b8]/50"
        />
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="bg-[#1e293b] px-3 py-1 rounded-full text-[10px] font-bold text-[#cbd5e1] border border-[#334155]">
        System Status: <span className="text-[#3b82f6]">Optimized</span>
      </div>
      <div className="relative group">
        <Bell className="text-[#94a3b8] cursor-pointer hover:text-[#3b82f6] transition-colors size-5" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-[#f43f5e] rounded-full"></span>
      </div>
      <Link to="/settings" className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#1e293b] shadow-sm hover:border-primary transition-colors cursor-pointer block">
        <img 
          src={IMAGES.curator} 
          alt="Curator Profile" 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer" 
        />
      </Link>
    </div>
  </header>
);

export default Header;
