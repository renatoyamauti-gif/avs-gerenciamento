export function normalizeBreed(name: string): string {
  if (!name) return '';
  const n = name.trim().toLowerCase();
  if (n === 'rir' || n.includes('rhode island') || n.includes('rhode')) return 'RIR';
  if (n.includes('gsb')) return 'GSB';
  if (n.includes('brama') || n.includes('bhrama') || n.includes('bhama') || n.includes('bhrma')) return 'Brama';
  if (n.includes('fenix') || n.includes('fênix')) return 'Fênix';
  if (n.includes('polonesa')) return 'Polonesa';
  if (n.includes('sedosa')) return 'Sedosa';
  
  // Custom breeds: trim and Title Case
  return name.trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeBaia(name: string): string {
  if (!name) return '';
  return name.trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function isBreedMatchingBaia(breed: string, baia: string): boolean {
  if (!breed || !baia) return false;
  const br = breed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ba = baia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (br.includes(ba) || ba.includes(br)) return true;
  
  // Handle brama/bhrama/bhama/bhrma spelling variations
  const isBramaBreed = br.includes('brama') || br.includes('bhrama') || br.includes('bhama') || br.includes('bhrma');
  const isBramaBaia = ba.includes('brama') || ba.includes('bhrama') || ba.includes('bhama') || ba.includes('bhrma');
  if (isBramaBreed && isBramaBaia) return true;

  // Handle RIR/Rhode spelling variations
  const isRIRBreed = br === 'rir' || br.includes('rhode');
  const isRIRBaia = ba.includes('rir') || ba.includes('rhode');
  if (isRIRBreed && isRIRBaia) return true;
  
  return false;
}

export function getRacaBaiaMapping(birds: any[]) {
  const baiaToRacas: Record<string, Set<string>> = {};
  const racaToBaias: Record<string, Set<string>> = {};

  (birds || []).forEach(bird => {
    if (bird.baia && bird.raca) {
      const bName = normalizeBaia(bird.baia);
      const normalizedR = normalizeBreed(bird.raca);

      if (!baiaToRacas[bName]) {
        baiaToRacas[bName] = new Set();
      }
      baiaToRacas[bName].add(normalizedR);

      if (!racaToBaias[normalizedR]) {
        racaToBaias[normalizedR] = new Set();
      }
      racaToBaias[normalizedR].add(bName);
    }
  });

  return { baiaToRacas, racaToBaias };
}

interface StockItem {
  collected: number;
  incubated: number;
  sold: number;
  available: number;
  dailyAvg: number;
  daysCollected: number;
}

export function calculateEggStock({
  eggLogs,
  incubators,
  orders,
  products,
  birds,
  racas,
  baias
}: {
  eggLogs: any[];
  incubators: any[];
  orders: any[];
  products: any[];
  birds: any[];
  racas?: any[];
  baias?: any[];
}) {
  const { baiaToRacas, racaToBaias } = getRacaBaiaMapping(birds);

  const racaMap: Record<string, StockItem> = {};
  const baiaMap: Record<string, StockItem> = {};

  const racaDays: Record<string, Set<string>> = {};
  const baiaDays: Record<string, Set<string>> = {};

  const initRaca = (breed: string) => {
    const normR = normalizeBreed(breed);
    if (!racaMap[normR]) {
      racaMap[normR] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
    }
    return normR;
  };

  const initBaia = (bName: string) => {
    const b = normalizeBaia(bName);
    if (!baiaMap[b]) {
      baiaMap[b] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
    }
    return b;
  };

  // Pre-initialize all breeds from racas
  (racas || []).forEach(r => {
    const name = typeof r === 'string' ? r : r?.name;
    if (name) {
      initRaca(name);
    }
  });

  // Pre-initialize all baias from baias
  (baias || []).forEach(b => {
    const name = typeof b === 'string' ? b : b?.name;
    if (name) {
      initBaia(name);
    }
  });

  const getRacasForBaia = (bName: string): string[] => {
    if (!bName) return [];
    const b = normalizeBaia(bName);
    const allBreeds = baiaToRacas[b] ? Array.from(baiaToRacas[b]) : [];
    if (allBreeds.length <= 1) return allBreeds;
    
    const matchingBreeds = allBreeds.filter(r => isBreedMatchingBaia(r, bName));
    if (matchingBreeds.length > 0) return matchingBreeds;
    
    return allBreeds;
  };

  const getBaiasForRaca = (breed: string): string[] => {
    if (!breed) return [];
    const r = normalizeBreed(breed);
    const allBaias = racaToBaias[r] ? Array.from(racaToBaias[r]) : [];
    if (allBaias.length <= 1) return allBaias;
    
    const matchingBaias = allBaias.filter(b => isBreedMatchingBaia(breed, b));
    if (matchingBaias.length > 0) return matchingBaias;
    
    return allBaias;
  };

  // 1. Process Egg Logs (Collected)
  (eggLogs || []).forEach(log => {
    const qty = Number(log.count) || 0;
    if (qty <= 0) return;

    const dateKey = `${log.year}-${log.month}-${log.day}`;
    const logBaias = log.baia ? log.baia.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const logRacas = log.raca ? log.raca.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

    logBaias.forEach((b: string) => {
      const activeB = initBaia(b);
      baiaMap[activeB].collected += qty;
      if (!baiaDays[activeB]) baiaDays[activeB] = new Set();
      baiaDays[activeB].add(dateKey);

      getRacasForBaia(b).forEach(r => {
        const normR = initRaca(r);
        racaMap[normR].collected += qty;
        if (!racaDays[normR]) racaDays[normR] = new Set();
        racaDays[normR].add(dateKey);
      });
    });

    logRacas.forEach((r: string) => {
      const normR = initRaca(r);
      racaMap[normR].collected += qty;
      if (!racaDays[normR]) racaDays[normR] = new Set();
      racaDays[normR].add(dateKey);

      getBaiasForRaca(normR).forEach(b => {
        const activeB = initBaia(b);
        baiaMap[activeB].collected += qty;
        if (!baiaDays[activeB]) baiaDays[activeB] = new Set();
        baiaDays[activeB].add(dateKey);
      });
    });
  });

  // 2. Subtract incubated eggs
  (incubators || []).forEach(inc => {
    (inc.incubator_batches || []).forEach((batch: any) => {
      if (batch.baia_details) {
        Object.entries(batch.baia_details).forEach(([bName, qtyStr]) => {
          const qty = Number(qtyStr) || 0;
          if (qty <= 0) return;
          const activeB = initBaia(bName);
          baiaMap[activeB].incubated += qty;

          getRacasForBaia(bName).forEach(r => {
            const normR = initRaca(r);
            racaMap[normR].incubated += qty;
          });
        });
      }
      if (batch.raca_details) {
        Object.entries(batch.raca_details).forEach(([breed, qtyStr]) => {
          const qty = Number(qtyStr) || 0;
          if (qty <= 0) return;
          const normR = initRaca(breed);
          racaMap[normR].incubated += qty;

          getBaiasForRaca(normR).forEach(b => {
            const activeB = initBaia(b);
            baiaMap[activeB].incubated += qty;
          });
        });
      }
    });
  });

  // 3. Subtract sold eggs (from orders)
  (orders || []).forEach(ord => {
    if (ord.status !== 'Cancelado') {
      const orderItems = ord.items && Array.isArray(ord.items) && ord.items.length > 0
        ? ord.items
        : [{ origem_type: ord.origem_type || 'raca', raca: ord.raca || '', baia: ord.baia || '', quantity: ord.quantity || 0 }];

      orderItems.forEach((item: any) => {
        if (item.origem_type === 'embalagem') return;
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) return;

        if (item.origem_type === 'raca' && item.raca) {
          const normR = initRaca(item.raca);
          const totalEggsSold = (qty * 12) + (Number(item.gift_eggs) || 0);
          racaMap[normR].sold += totalEggsSold;

          getBaiasForRaca(normR).forEach(b => {
            const activeB = initBaia(b);
            baiaMap[activeB].sold += totalEggsSold;
          });
        } else if (item.origem_type === 'baia' && item.baia) {
          const bName = item.baia;
          const activeB = initBaia(bName);
          const totalEggsSold = (qty * 12) + (Number(item.gift_eggs) || 0);
          baiaMap[activeB].sold += totalEggsSold;

          getRacasForBaia(bName).forEach(r => {
            const normR = initRaca(r);
            racaMap[normR].sold += totalEggsSold;
          });
        } else if (item.origem_type === 'produto' && item.product_id) {
          const prod = (products || []).find((p: any) => p.id === item.product_id);
          if (prod) {
            const eggsPerUnit = Number(prod.eggs_per_unit) || 0;
            const totalEggsSold = qty * eggsPerUnit;
            if (totalEggsSold <= 0) return;

            if (prod.egg_raca) {
              const normR = initRaca(prod.egg_raca);
              racaMap[normR].sold += totalEggsSold;

              getBaiasForRaca(normR).forEach(b => {
                const activeB = initBaia(b);
                baiaMap[activeB].sold += totalEggsSold;
              });
            }
            if (prod.egg_baia) {
              const bName = prod.egg_baia;
              const activeB = initBaia(bName);
              baiaMap[activeB].sold += totalEggsSold;

              getRacasForBaia(bName).forEach(r => {
                const normR = initRaca(r);
                racaMap[normR].sold += totalEggsSold;
              });
            }
          }
        }
      });
    }
  });

  // 4. Calculate Available and Averages for Racas
  Object.keys(racaMap).forEach(r => {
    const item = racaMap[r];
    item.available = item.collected - item.incubated - item.sold;
    const days = racaDays[r]?.size || 1;
    item.daysCollected = days;
    item.dailyAvg = item.collected / days;
  });

  // 5. Calculate Available and Averages for Baias
  Object.keys(baiaMap).forEach(b => {
    const item = baiaMap[b];
    item.available = item.collected - item.incubated - item.sold;
    const days = baiaDays[b]?.size || 1;
    item.daysCollected = days;
    item.dailyAvg = item.collected / days;
  });

  return { racas: racaMap, baias: baiaMap };
}
