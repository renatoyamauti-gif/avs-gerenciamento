export interface TrackingTimelineEvent {
  date: string;
  location: string;
  desc: string;
  status: 'success' | 'posted' | 'info';
  rawDate?: string;
}

export interface TrackingServiceResult {
  code: string;
  status: 'delivered' | 'posted' | 'in_transit';
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

    const query = `query {
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
    }`;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        const parcel = json?.data?.findByTrackingCode;
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

        const isDelivered =
          !!parcel.deliveredAt ||
          parcel.lastStatus === 'DELIVERED' ||
          events.some(e => e.status === 'success');

        const isPosted = events.some(e => e.status === 'posted');
        const status: 'delivered' | 'posted' | 'in_transit' = isDelivered
          ? 'delivered'
          : (isPosted ? 'in_transit' : 'posted');

        const deliveredAt = parcel.deliveredAt || (isDelivered && sorted.length > 0 ? sorted[0].createdAt : null);

        return {
          code: cleanCode,
          status,
          deliveredAt,
          postedAt: parcel.postedAt || null,
          events
        };
      } catch (err) {
        console.debug(`Falha ao rastrear via ${endpoint}:`, err);
      }
    }

    return null;
  }
};
