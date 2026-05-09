import { motion } from 'motion/react';
import { GitBranch, User, Plus, Info, ExternalLink } from 'lucide-react';
import { IMAGES } from '../constants';

const LineageNode = ({ name, id, img, color, role, level }: { name: string, id: string, img: string, color: string, role: string, level: number }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: level * 0.2 }}
    className="flex flex-col items-center relative group"
  >
    <div className={`
      w-20 h-20 rounded-2xl overflow-hidden border-4 bg-white shadow-xl transition-transform group-hover:scale-110 relative z-20 
      ${color === 'primary' ? 'border-primary' : color === 'secondary' ? 'border-secondary' : 'border-tertiary'}
    `}>
      <img src={img} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ExternalLink size={16} className="text-white" />
      </div>
    </div>
    <div className="mt-4 text-center">
      <p className="text-sm font-black uppercase text-outline tracking-wider mb-0.5">{role}</p>
      <h4 className="text-sm font-bold text-primary font-headline tracking-tighter">{name}</h4>
      <p className="text-sm font-mono text-on-surface-variant">{id}</p>
    </div>
  </motion.div>
);

export default function BreedingLineage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-12"
    >
      <section className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest">Active Pair #04</span>
            <GitBranch size={16} className="text-outline" />
          </div>
          <h2 className="text-5xl font-extrabold text-primary font-headline tracking-tighter leading-none">Pedigree & Genetic Lineage</h2>
          <p className="text-on-surface-variant font-medium text-sm max-w-lg">Rastreabilidade completa até a 3ª geração. Monitoramento de consanguinidade e pureza genética.</p>
        </div>
        <div className="flex bg-surface-container-low p-2 rounded-2xl shadow-sm">
          <button className="px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm uppercase tracking-widest shadow-sm">Map View</button>
          <button className="px-6 py-3 rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest">List Analysis</button>
        </div>
      </section>

      <div className="relative bg-surface-container-low/50 rounded-3xl p-16 overflow-hidden min-h-[600px] flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${IMAGES.featherBg})`, backgroundSize: '400px' }}></div>
        
        {/* Connection Lines (Simulated with simple divs) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full text-outline-variant/30" viewBox="0 0 800 500">
            <path d="M400,100 L200,250 M400,100 L600,250" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M200,250 L100,400 M200,250 L300,400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M600,250 L500,400 M600,250 L700,400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-20">
          {/* Generation 1 */}
          <div className="flex flex-col items-center">
            <LineageNode level={0} name="Target Specimen" id="MC-2024-001" role="Progeny" img={IMAGES.targetMacaw} color="primary" />
          </div>

          {/* Generation 2 */}
          <div className="flex gap-40">
            <LineageNode level={1} name="Crimson King" id="MC-22-12" role="Father" img={IMAGES.specimen2} color="secondary" />
            <LineageNode level={1} name="Forest Spirit" id="AM-21-08" role="Mother" img={IMAGES.amazonParrot} color="tertiary" />
          </div>

          {/* Generation 3 */}
          <div className="flex gap-20">
            <LineageNode level={2} name="Blue Sea" id="G3-A-01" role="Grandfather" img={IMAGES.blueGoldMacaw} color="outline" />
            <LineageNode level={2} name="Ruby Wing" id="G3-A-02" role="Grandmother" img={IMAGES.specimen1} color="outline" />
            <div className="w-20"></div> {/* Gap */}
            <LineageNode level={2} name="Emerald Eye" id="G3-B-01" role="Grandfather" img={IMAGES.macaw1} color="outline" />
            <LineageNode level={2} name="Gold Crest" id="G3-B-02" role="Grandmother" img={IMAGES.macaw2} color="outline" />
          </div>
        </div>
      </div>

      {/* Genetic Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-primary rounded-3xl p-8 text-white flex flex-col md:flex-row gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/10 shrink-0">
            <img src={IMAGES.targetMacaw} alt="Target" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-3xl font-black font-headline tracking-tighter">Genetic Profile: #MC-2024-001</h3>
              <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-1">Classification: High Fidelity Breeder</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Purity Score</p>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black">98.4%</p>
                  <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[98%]"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Inbreeding Coeff.</p>
                <p className="text-xl font-black">2.1% (Ideal)</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-3xl flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-primary font-headline font-bold text-xl tracking-tight">Health Records</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-outline-variant/10 text-sm font-medium">
                <span className="text-on-surface-variant">Last DNA Sexing</span>
                <span className="text-primary font-bold">Confirmed Male</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/10 text-sm font-medium">
                <span className="text-on-surface-variant">Vaccinations</span>
                <span className="text-secondary font-bold">Up to date</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-surface-container-highest rounded-xl text-sm font-black uppercase tracking-widest text-primary hover:bg-white transition-all shadow-sm">Download Cert.</button>
        </div>
      </div>
    </motion.div>
  );
}
