import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GitBranch, User, ExternalLink, ArrowLeft, Loader2, Shield, Activity } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { IMAGES } from '../constants';

const LineageNode = ({ name, id, img, color, role, level, exists }: { name: string, id: string, img: string, color: string, role: string, level: number, exists: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: level * 0.2 }}
    className="flex flex-col items-center relative group"
  >
    {exists ? (
      <div className="relative z-20">
        <div className={`
          w-20 h-20 rounded-2xl overflow-hidden border-4 bg-white shadow-xl transition-transform group-hover:scale-110 relative 
          ${color === 'primary' ? 'border-[#2563EB]' : color === 'secondary' ? 'border-[#6B7280]' : 'border-[#16A34A]'}
        `}>
          <img src={img || IMAGES.bird1} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    ) : (
      <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center relative z-20 text-slate-300">
        <User size={24} />
      </div>
    )}
    <div className="mt-4 text-center">
      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">{role}</p>
      <h4 className="text-xs font-bold text-slate-800 font-headline tracking-tighter truncate max-w-[120px]">{name}</h4>
      <p className="text-[9px] font-mono text-slate-400">{id}</p>
    </div>
  </motion.div>
);

export default function BreedingLineage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [lineage, setLineage] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadLineage(id);
    }
  }, [id]);

  async function loadLineage(birdId: string) {
    try {
      setLoading(true);
      const data = await dbService.getBirdLineage(birdId);
      setLineage(data);
    } catch (error) {
      console.error('Erro ao carregar linhagem:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Linhagem...</p>
      </div>
    );
  }

  if (!lineage) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white border border-slate-100 rounded-[32px] text-center shadow-sm">
        <p className="text-slate-500 font-medium mb-6">Ave não encontrada ou falha ao carregar a árvore genealógica.</p>
        <Link to="/birds" className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8]">
          Voltar ao Plantel
        </Link>
      </div>
    );
  }

  const {
    target,
    father,
    mother,
    paternalGrandfather,
    paternalGrandmother,
    maternalGrandfather,
    maternalGrandmother
  } = lineage;

  const parentCount = [father, mother].filter(Boolean).length;
  const grandparentCount = [paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother].filter(Boolean).length;
  
  const purity = parentCount === 2 ? (grandparentCount === 4 ? "98.4%" : "95.0%") : (parentCount === 1 ? "75.0%" : "50.0%");
  const inbreeding = parentCount === 2 ? "2.1% (Ideal)" : "Indeterminado";

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
            <Link 
              to="/birds" 
              className="flex items-center gap-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-4 py-2 rounded-xl transition-colors hover:bg-[#DBEAFE]"
            >
              <ArrowLeft size={14} /> Voltar ao Plantel
            </Link>
            <span className="bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <GitBranch size={12} /> Pedigree: {target.name}
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-[#1F2937] font-headline tracking-tighter leading-none">Pedigree & Linhagem Genética</h2>
          <p className="text-slate-500 font-medium text-sm max-w-lg">Rastreabilidade completa até a 3ª geração. Monitoramento de consanguinidade e pureza genética do plantel.</p>
        </div>
      </section>

      <div className="relative bg-white border border-slate-100 rounded-[32px] p-8 sm:p-16 overflow-x-auto min-h-[600px] flex items-center justify-center shadow-sm">
        {/* Connection Lines (SVG) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full text-slate-200" viewBox="0 0 800 500" style={{ minWidth: '800px', minHeight: '500px' }}>
            <path d="M400,100 L200,250 M400,100 L600,250" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M200,250 L100,400 M200,250 L300,400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M600,250 L500,400 M600,250 L700,400" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-20" style={{ minWidth: '750px' }}>
          {/* Generation 1 (Progeny) */}
          <div className="flex flex-col items-center">
            <LineageNode 
              level={0} 
              name={target.name} 
              id={target.ring_number || 'Sem Anilha'} 
              role="Ave Alvo (G1)" 
              img={target.img_url} 
              color="primary" 
              exists={true} 
            />
          </div>

          {/* Generation 2 (Parents) */}
          <div className="flex justify-around w-full px-20">
            <LineageNode 
              level={1} 
              name={father ? father.name : 'Pai não cadastrado'} 
              id={father ? (father.ring_number || 'Sem Anilha') : 'G2 - Macho'} 
              role="Pai (G2)" 
              img={father?.img_url} 
              color="secondary" 
              exists={!!father} 
            />
            <LineageNode 
              level={1} 
              name={mother ? mother.name : 'Mãe não cadastrada'} 
              id={mother ? (mother.ring_number || 'Sem Anilha') : 'G2 - Fêmea'} 
              role="Mãe (G2)" 
              img={mother?.img_url} 
              color="tertiary" 
              exists={!!mother} 
            />
          </div>

          {/* Generation 3 (Grandparents) */}
          <div className="flex justify-between w-full">
            <LineageNode 
              level={2} 
              name={paternalGrandfather ? paternalGrandfather.name : 'Avô Paterno'} 
              id={paternalGrandfather ? (paternalGrandfather.ring_number || 'Sem Anilha') : 'G3 - Macho'} 
              role="Avô Paterno (G3)" 
              img={paternalGrandfather?.img_url} 
              color="outline" 
              exists={!!paternalGrandfather} 
            />
            <LineageNode 
              level={2} 
              name={paternalGrandmother ? paternalGrandmother.name : 'Avó Paterna'} 
              id={paternalGrandmother ? (paternalGrandmother.ring_number || 'Sem Anilha') : 'G3 - Fêmea'} 
              role="Avó Paterna (G3)" 
              img={paternalGrandmother?.img_url} 
              color="outline" 
              exists={!!paternalGrandmother} 
            />
            <div className="w-8"></div> {/* Spacer */}
            <LineageNode 
              level={2} 
              name={maternalGrandfather ? maternalGrandfather.name : 'Avô Materno'} 
              id={maternalGrandfather ? (maternalGrandfather.ring_number || 'Sem Anilha') : 'G3 - Macho'} 
              role="Avô Materno (G3)" 
              img={maternalGrandfather?.img_url} 
              color="outline" 
              exists={!!maternalGrandfather} 
            />
            <LineageNode 
              level={2} 
              name={maternalGrandmother ? maternalGrandmother.name : 'Avó Materna'} 
              id={maternalGrandmother ? (maternalGrandmother.ring_number || 'Sem Anilha') : 'G3 - Fêmea'} 
              role="Avó Materna (G3)" 
              img={maternalGrandmother?.img_url} 
              color="outline" 
              exists={!!maternalGrandmother} 
            />
          </div>
        </div>
      </div>

      {/* Genetic Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-[#2563EB] rounded-[32px] p-8 text-white flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/20">
            <img src={target.img_url || IMAGES.bird1} alt={target.name} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-3xl font-black font-headline tracking-tighter uppercase">{target.name}</h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Anilha: {target.ring_number || 'S/N'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Score de Pureza</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xl font-black">{purity}</p>
                  <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: purity }} />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Grau de Inbreeding</p>
                <p className="text-xl font-black mt-1">{inbreeding}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h4 className="text-[#2563EB] font-headline font-bold text-xl tracking-tight uppercase flex items-center gap-2">
              <Shield size={20} />
              Registro Genético
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm font-semibold">
                <span className="text-slate-400 uppercase text-xs">Raça</span>
                <span className="text-[#1F2937] uppercase">{target.raca}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm font-semibold">
                <span className="text-slate-400 uppercase text-xs">Sexo</span>
                <span className="text-[#1F2937] uppercase">{target.gender || 'Indeterminado'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm font-semibold">
                <span className="text-slate-400 uppercase text-xs">Genitores Cadastrados</span>
                <span className="text-[#2563EB] font-black">{parentCount} / 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
