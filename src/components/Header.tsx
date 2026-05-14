/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, CheckCircle2, Settings, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../constants';

const Header = () => (
  <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 backdrop-blur-xl hidden lg:flex justify-between items-center px-10 py-4 border-b border-slate-100 shadow-sm">
    <div className="flex items-center gap-6">
      <div className="text-xl font-black text-[#1F2937] font-headline tracking-tighter italic">
        AVS <span className="text-sm text-[#2563EB] tracking-[0.2em] font-bold not-italic">GERENCIAMENTO</span>
      </div>
      <div className="relative group hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
        <input 
          type="text" 
          placeholder="Buscar no sistema..." 
          className="bg-[#F8FAFC] text-[#1F2937] rounded-full pl-10 pr-4 py-2 text-sm border border-slate-200 focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 w-64 transition-all placeholder-slate-400 font-medium outline-none"
        />
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="bg-[#EFF6FF] px-3 py-1 rounded-full text-xs font-bold text-[#2563EB] border border-[#DBEAFE] uppercase tracking-widest">
        System Status: <span className="text-[#16A34A] ml-1">Optimized</span>
      </div>
      <div className="relative group">
        <Bell className="text-slate-400 cursor-pointer hover:text-[#2563EB] transition-colors size-5" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full border border-white"></span>
      </div>
      <Link to="/settings" className="h-10 w-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm hover:border-[#2563EB] transition-colors cursor-pointer block">
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
