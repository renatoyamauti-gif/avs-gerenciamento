export interface TrackingTimelineEvent {
  date: string;
  location: string;
  desc: string;
  status: 'success' | 'posted' | 'info';
  rawDate?: string;
}

export interface TrackingServiceResult {
  code: string;
  status: 'delivered' | 'posted' | 'in_transit' | 'pre_posted';
  statusLabel: string;
  deliveredAt: string | null;
  postedAt: string | null;
  events: TrackingTimelineEvent[];
  error?: string | null;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const formatTrackingDate = (isoStr: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoStr;
  }
};

const formatLocation = (evt: any): string => {
  if (evt.location?.city || evt.location?.state) {
    const parts = [evt.location.city, evt.location.state].filter(Boolean);
    return parts.join(' / ');
  }
  if (evt.from) {
    return String(evt.from).replace(/^\d+\s*-\s*/, '').trim();
  }
  return 'Unidade dos Correios';
};

const getEventStatus = (title: string, desc?: string | null): 'success' | 'posted' | 'info' => {
  const fullText = `${title} ${desc || ''}`.toLowerCase();
  if (fullText.includes('entregue') || fullText.includes('entrega efetuada')) {
    return 'success';
  }
  if (fullText.includes('postado') || fullText.includes('recebido') || fullText.includes('etiqueta emitida')) {
    return 'posted';
  }
  return 'info';
};

export const correiosTrackingService = {
  isCorreiosFormat(code: string): boolean {
    if (!code) return false;
    const clean = code.trim().toUpperCase();
    return /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(clean);
  },

  async track(trackingCode: string): Promise<TrackingServiceResult | null> {
    const cleanCode = trackingCode.trim().toUpperCase();
    if (!cleanCode) return null;

    const endpoints = [
      '/api/melhorrastreio/graphql',
      'https://api.melhorrastreio.com.br/graphql'
    ];

    // Queries: 1. searchParcel (ativa busca em tempo real), 2. findByTrackingCode (busca no banco indexado)
    const queries = [
      `mutation {
        searchParcel(tracker: { type: correios, trackingCode: "${cleanCode}" }) {
          id
          lastStatus
          postedAt
          deliveredAt
          trackingEvents {
            createdAt
            status
            title
            description
            location {
              city
              state
            }
            from
            to
          }
        }
      }`,
      `query {
        findByTrackingCode(tracker: { trackingCode: "${cleanCode}" }) {
          id
          lastStatus
          postedAt
          deliveredAt
          trackingEvents {
            createdAt
            status
            title
            description
            location {
              city
              state
            }
            from
            to
          }
        }
      }`
    ];

    for (const endpoint of endpoints) {
      for (const query of queries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ query }),
            signal: controller.signal
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (!response || !response.ok) {
            continue;
          }

          const json = await response.json().catch(() => null);
          const parcel = json?.data?.searchParcel || json?.data?.findByTrackingCode;
          if (!parcel) {
            continue;
          }

          const rawEvents = Array.isArray(parcel.trackingEvents) ? parcel.trackingEvents : [];
          const sorted = [...rawEvents].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const events: TrackingTimelineEvent[] = sorted.map((e: any) => {
            const toDest = e.to ? ` (Destino: ${String(e.to).replace(/^\d+\s*-\s*/, '')})` : '';
            const desc = `${e.title || 'Atualização'}${toDest}`;
            return {
              date: formatTrackingDate(e.createdAt),
              rawDate: e.createdAt,
              location: formatLocation(e),
              desc,
              status: getEventStatus(e.title || '', e.description)
            };
          });

          // Determinar status exato com base em eventos e lastStatus
          const hasDeliveredEvent = events.some(e => e.status === 'success');
          const isDelivered = !!parcel.deliveredAt || parcel.lastStatus === 'DELIVERED' || hasDeliveredEvent;

          const hasTransitEvent = events.some(e => {
            const d = e.desc.toLowerCase();
            return d.includes('trânsito') || d.includes('transferência') || d.includes('saiu para entrega');
          });
          const isInTransit = parcel.lastStatus === 'ONROUTE' || parcel.lastStatus === 'IN_TRANSIT' || hasTransitEvent;

          const hasPostedEvent = events.some(e => {
            const d = e.desc.toLowerCase();
            return d.includes('postado') || d.includes('recebido');
          });
          const isPosted = parcel.lastStatus === 'POSTED' || hasPostedEvent;

          let status: 'delivered' | 'posted' | 'in_transit' | 'pre_posted' = 'pre_posted';
          let statusLabel = 'Etiqueta Emitida';

          if (isDelivered) {
            status = 'delivered';
            statusLabel = 'Entregue';
          } else if (isInTransit) {
            status = 'in_transit';
            statusLabel = 'Em Trânsito';
          } else if (isPosted) {
            status = 'posted';
            statusLabel = 'Postado';
          } else {
            status = 'pre_posted';
            statusLabel = 'Etiqueta Emitida / Aguardando Envio';
          }

          const deliveredAt = parcel.deliveredAt || (isDelivered && sorted.length > 0 ? sorted[0].createdAt : null);

          // Se não houver eventos cadastrados ainda no Melhor Rastreio, gerar evento inicial condizente
          if (events.length === 0) {
            const initialDate = formatTrackingDate(parcel.postedAt || new Date().toISOString());
            if (status === 'posted' || status === 'in_transit') {
              events.push({
                date: initialDate || 'Hoje',
                location: 'Correios',
                desc: 'Objeto postado e em trânsito no fluxo dos Correios.',
                status: 'posted'
              });
            } else {
              events.push({
                date: initialDate || 'Hoje',
                location: 'Remetente / Agência Postal',
                desc: 'Etiqueta de envio gerada. Aguardando postagem e primeira leitura no fluxo postal dos Correios.',
                status: 'posted'
              });
            }
          }

          return {
            code: cleanCode,
            status,
            statusLabel,
            deliveredAt,
            postedAt: parcel.postedAt || null,
            events
          };
        } catch (err) {
          console.debug(`Falha ao rastrear via ${endpoint}:`, err);
        }
      }
    }

    // Se ainda não encontrou no Melhor Rastreio, tentar registrar tracker no Melhor Rastreio para sincronização futura
    try {
      const registerQuery = `mutation {
        createParcelWithTracker(tracker: { type: correios, trackingCode: "${cleanCode}", shippingService: sedex }) {
          id
          lastStatus
          trackingEvents {
            createdAt
          }
        }
      }`;
      for (const endpoint of endpoints) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ query: registerQuery })
        }).catch(() => null);
      }
    } catch {}

    return null;
  }
};

