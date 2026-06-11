import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sintetizar bip sonoro usando a Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá (A5)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume controlado
      
      oscillator.start();
      // Bip curto de 150ms
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error('Falha ao reproduzir bip sonoro:', err);
    }
  };

  // Listar as câmeras disponíveis
  const loadCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Preferir a câmera traseira padrão na primeira inicialização
      if (videoDevices.length > 0) {
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('traseira') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
      } else {
        setError('Nenhuma câmera de vídeo foi detectada no dispositivo.');
      }
    } catch (err: any) {
      console.error('Erro ao listar câmeras:', err);
      // Se falhar listando antes de pedir permissão, não joga erro impeditivo pois tentaremos dar play direto
    }
  };

  // Iniciar stream da câmera
  const startCamera = async () => {
    setLoading(true);
    setError('');
    
    // Parar stream anterior se houver
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Atributos cruciais para reprodução em iOS Safari
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
      
      // Carregar a lista de câmeras de verdade agora que temos permissão concedida
      if (cameras.length === 0) {
        await loadCameras();
      }
      
      setLoading(false);
      
      // Iniciar loop de decodificação de QR Code
      startDecodingLoop();
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      setLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permissão de acesso à câmera negada. Ative a permissão nas configurações do seu navegador.');
      } else {
        setError(`Erro ao iniciar a câmera: ${err.message || 'Câmera indisponível no momento'}`);
      }
    }
  };

  // Parar stream e limpar referências
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Loop de renderização do canvas e detecção do QR Code
  const startDecodingLoop = () => {
    const tick = () => {
      if (
        videoRef.current && 
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          // Ajusta tamanho do canvas ao tamanho do vídeo
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Desenha frame atual do vídeo
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Captura dados dos pixels
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decodifica QR Code usando jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code && code.data) {
            playBeep();
            onScan(code.data);
            onClose();
            return; // Interrompe o loop
          }
        }
      }
      
      // Continua o loop se estiver aberto
      if (streamRef.current) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedCameraId]);

  // Se trocar a câmera no dropdown, recarrega a câmera
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCameraId(e.target.value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay de fundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0F172A] text-slate-100 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#2563EB]/15 p-2 rounded-xl text-[#3B82F6]">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-headline">Escanear QR Code</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leitor de Câmera</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Camera View Area */}
            <div className="relative aspect-square sm:aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {/* Vídeo da Câmera */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Canvas oculto para extração de frames pelo jsQR */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay de Scanner Visual */}
              {!loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Máscara semi-transparente com buraco central */}
                  <div className="absolute inset-0 bg-black/45" />
                  
                  {/* Área alvo do QR Code */}
                  <div className="relative w-64 h-64 border-2 border-dashed border-white/40 rounded-3xl z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    
                    {/* Cantoneiras Estilizadas */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#3B82F6] rounded-tl-xl -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#3B82F6] rounded-tr-xl -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#3B82F6] rounded-bl-xl -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#3B82F6] rounded-br-xl -mb-1 -mr-1" />

                    {/* Linha laser de scan animada */}
                    <div className="w-[90%] h-0.5 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent animate-[scan_2s_ease-in-out_infinite] absolute shadow-[0_0_10px_#3B82F6]" />
                  </div>
                  
                  <span className="absolute bottom-4 text-xs font-bold text-white bg-black/60 px-4 py-2 rounded-full uppercase tracking-wider backdrop-blur-sm z-10">
                    Aponte para o QR Code
                  </span>
                </div>
              )}

              {/* Estado de Carregamento */}
              {loading && !error && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 z-20">
                  <Loader2 className="animate-spin text-[#3B82F6] size-10" />
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Iniciando Câmera...</p>
                </div>
              )}

              {/* Estado de Erro / Sem permissão */}
              {error && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4 z-20">
                  <div className="bg-red-500/10 p-3 rounded-full text-red-500">
                    <AlertCircle size={32} />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-bold text-white text-base">Acesso à Câmera Negado</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} /> Tentar Novamente
                  </button>
                </div>
              )}
            </div>

            {/* Footer com Seleção de Câmera se houver múltiplas */}
            <div className="px-6 py-5 bg-slate-900 border-t border-slate-800 flex flex-col gap-4">
              {cameras.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Selecionar Câmera
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCameraId}
                      onChange={handleCameraChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-[#2563EB]/50 focus:ring-2 focus:ring-[#2563EB]/15 transition-all appearance-none cursor-pointer"
                    >
                      {cameras.map((camera, i) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Câmera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    {/* Ícone de seta no select */}
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                      <RefreshCw size={12} className="animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Os QR Codes de Baias ou Raças contêm links para esta página que são decodificados instantaneamente.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Adicionar animação keyframes para o scanner se não existir no tailwind config */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% {
            transform: translateY(-110px);
          }
          50% {
            transform: translateY(110px);
          }
        }
      ` }} />
    </AnimatePresence>
  );
}
