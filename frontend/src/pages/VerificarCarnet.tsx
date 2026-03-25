import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import './VerificarCarnet.css';

interface CarnetData {
  Id: number;
  Carnet: number;
  Token: string;
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Genero: string;
  FechaRegistro: string;
  Estatus: string | number;
  NombreFederacion: string;
  NombrePais: string;
  ImagenPais: string | null;
  Color_Primario: string;
  Color_Secundario: string;
  Nombre_Institucion: string;
  Logo_Ruta: string | null;
  Texto_Pie: string | null;
  TieneFoto: number;
}

const SilhouetteIcon: React.FC = () => (
  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <circle cx="50" cy="30" r="22" />
    <path d="M10 110 C10 74 28 58 50 58 C72 58 90 74 90 110 Z" />
  </svg>
);

const PlayerPhoto: React.FC<{ jugadorId: number }> = ({ jugadorId }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPhotoUrl(null);

    fetch(`/api/public/carnet/foto/${jugadorId}`)
      .then(res => { if (res.ok) return res.blob(); throw new Error('no photo'); })
      .then(blob => {
        if (!cancelled) {
          setPhotoUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [jugadorId]);

  return (
    <div className="cv2-foto">
      {loading && <div className="cv2-foto-silhouette" style={{ opacity: 0.25 }}><SilhouetteIcon /></div>}
      {!loading && photoUrl && <img src={photoUrl} alt="Foto jugador" />}
      {!loading && !photoUrl && <div className="cv2-foto-silhouette"><SilhouetteIcon /></div>}
    </div>
  );
};

// Convierte ruta absoluta del servidor a URL web (/uploads/... o /assets/...)
const getLogoUrl = (ruta: string): string => {
  const uploadsIdx = ruta.indexOf('/uploads/');
  if (uploadsIdx !== -1) return ruta.substring(uploadsIdx);
  const assetsIdx = ruta.indexOf('/assets/');
  if (assetsIdx !== -1) return ruta.substring(assetsIdx);
  return `/uploads/logos/${ruta.split('/').pop()}`;
};

const CarnetCard: React.FC<{ data: CarnetData }> = ({ data }) => {
  const primaryColor = data.Color_Primario || '#003366';
  const secondaryColor = data.Color_Secundario || '#FFFFFF';
  const cardUrl = `${window.location.origin}/verificar-carnet/${data.Token}`;

  const isActive =
    data.Estatus === 'A' || data.Estatus === 'Activo' ||
    data.Estatus === 1   || data.Estatus === '1';

  const logoUrl = data.Logo_Ruta ? getLogoUrl(data.Logo_Ruta) : null;
  const flagUrl = data.ImagenPais ? `/assets/flags/${data.ImagenPais}` : null;

  return (
    <div className="cv2-card">

      {/* ── HEADER idéntico al carnet impreso ── */}
      <div className="cv2-header" style={{ background: primaryColor, color: secondaryColor }}>
        {logoUrl ? (
          <div className="cv2-logo-circle" style={{ borderColor: secondaryColor }}>
            <img
              src={logoUrl}
              alt="Logo federación"
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="cv2-logo-circle cv2-logo-placeholder" style={{ borderColor: secondaryColor, color: secondaryColor }}>
            {(data.Nombre_Institucion || data.NombreFederacion || 'F').charAt(0)}
          </div>
        )}
        <div className="cv2-header-text">
          <h2 style={{ color: secondaryColor }}>
            {(data.Nombre_Institucion || data.NombreFederacion || '').toUpperCase()}
          </h2>
          <span style={{ color: secondaryColor }}>CARNET OFICIAL</span>
        </div>
      </div>

      {/* ── CUERPO idéntico al carnet impreso ── */}
      <div className="cv2-body">
        <PlayerPhoto jugadorId={data.Id} />

        <div className="cv2-info">
          <div className="cv2-info-row">
            <span className="cv2-label">Carnet No.:</span>
            <span className="cv2-value">{data.Carnet}</span>
          </div>
          <div className="cv2-info-row">
            <span className="cv2-label">Nombre:</span>
            <span className="cv2-value">{data.Nombre} {data.Apellidos}</span>
          </div>
          <div className="cv2-info-row">
            <span className="cv2-label">País:</span>
            <span className="cv2-value cv2-pais-row">
              {flagUrl && (
                <img
                  src={flagUrl}
                  className="cv2-flag"
                  alt={data.NombrePais}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {data.NombrePais || '-'}
            </span>
          </div>
        </div>

        {/* QR en la esquina derecha del cuerpo */}
        <div className="cv2-qr-corner">
          <QRCodeSVG
            value={cardUrl}
            size={72}
            bgColor="#ffffff"
            fgColor={primaryColor}
            level="M"
          />
          <span className="cv2-qr-label">Escanear para verificar</span>
        </div>
      </div>

      {/* ── FOOTER idéntico al carnet impreso ── */}
      <div className="cv2-footer">
        <span className="cv2-pie">{data.Texto_Pie || ''}</span>
        <div className={`cv2-status-badge ${isActive ? 'activo' : 'inactivo'}`}>
          <span>{isActive ? '✓' : '✗'}</span>
          <span>{isActive ? 'ACTIVO' : 'INACTIVO'}</span>
        </div>
      </div>

    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE VERIFICACIÓN
═══════════════════════════════════════════════════════ */
const VerificarCarnet: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [carnet, setCarnet] = useState<CarnetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) fetchCarnetByToken(token);
  }, [token]);

  const fetchCarnetByToken = async (t: string) => {
    setLoading(true);
    setError('');
    setCarnet(null);
    try {
      const res = await fetch(`/api/public/carnet/${t}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Carnet no encontrado.');
      } else {
        setCarnet(await res.json());
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setCarnet(null);

    try {
      const res = await fetch(`/api/public/carnet/buscar?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se encontró ningún carnet.');
      } else {
        setCarnet(data);
        navigate(`/verificar-carnet/${data.Token}`, { replace: true });
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaBusqueda = () => {
    setCarnet(null);
    setError('');
    setQuery('');
    navigate('/verificar-carnet', { replace: true });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verificar-carnet/${carnet?.Token}`;
    if (navigator.share) {
      await navigator.share({ title: 'Carnet SDR Web', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !carnet) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `carnet-${carnet.Nombre}-${carnet.Apellidos}.png`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').toLowerCase();
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error descargando carnet:', err);
      alert('Error al generar la imagen. Intenta nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="verificar-page">
      <header className="verificar-header">
        <div className="verificar-header-brand">
          <div className="verificar-header-title">SDR Web</div>
          <div className="verificar-header-subtitle">Sistema de Gestión de Dominó</div>
        </div>
        <Link to="/login" className="verificar-header-login">Iniciar Sesión</Link>
      </header>

      <main className="verificar-main">
        <div className="verificar-hero">
          <h1>🎴 Verificación de Carnet</h1>
          <p>Ingresa tu número de identificación para consultar tu carnet</p>
        </div>

        {!carnet && (
          <div className="verificar-search-box">
            <label htmlFor="search-input">Número de Identificación</label>
            <form className="verificar-search-row" onSubmit={handleSearch}>
              <input
                id="search-input"
                ref={inputRef}
                type="text"
                className="verificar-search-input"
                placeholder="Ej: RD-261"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                autoComplete="off"
              />
              <button
                type="submit"
                className="verificar-search-btn"
                disabled={loading || query.trim().length < 2}
              >
                {loading ? '...' : '🔍 Buscar'}
              </button>
            </form>
            {error && <div className="verificar-error">{error}</div>}
          </div>
        )}

        {loading && (
          <div className="verificar-loading">
            <div className="spinner" />
            <span>Consultando...</span>
          </div>
        )}

        {carnet && !loading && (
          <div className="carnet-card-wrapper">
            <div ref={cardRef}>
              <CarnetCard data={carnet} />
            </div>
            <div className="carnet-actions">
              <button
                className="btn-action btn-download"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? '⏳ Generando...' : '⬇ Descargar'}
              </button>
              <button className="btn-action btn-share" onClick={handleShare}>
                🔗 Compartir
              </button>
              <button className="btn-action btn-nueva-busqueda" onClick={handleNuevaBusqueda}>
                ← Nueva búsqueda
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="verificar-footer">
        SDR Web — Sistema de Gestión de Dominó · FEMUNDO
      </footer>
    </div>
  );
};

export default VerificarCarnet;
