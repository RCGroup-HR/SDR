import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { carnetFederacionService, catalogosService } from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './ImpresionCarnets.css';

/* ═══════════════════════════════════════
   TIPOS
═══════════════════════════════════════ */
interface CarnetRow {
  Id: number;
  Carnet: number;
  Nombre: string;
  Apellidos: string;
  NombreFederacion: string;
  NombrePais: string;
  Estatus: number | string;
  TieneFoto: number;
}

interface CarnetPrintData {
  Id: number;
  Carnet: number;
  Token: string;
  Nombre: string;
  Apellidos: string;
  Estatus: number | string;
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

interface Federacion { Id: number; Nombre: string; }
interface Pais      { Id: number; Pais: string; }

/* ═══════════════════════════════════════
   COMPONENTES PARA EL CARNET IMPRESO
═══════════════════════════════════════ */
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
    fetch(`/api/public/carnet/foto/${jugadorId}`)
      .then(res => { if (res.ok) return res.blob(); throw new Error('no photo'); })
      .then(blob => { if (!cancelled) { setPhotoUrl(URL.createObjectURL(blob)); setLoading(false); } })
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

const getLogoUrl = (ruta: string): string => {
  const uploadsIdx = ruta.indexOf('/uploads/');
  if (uploadsIdx !== -1) return ruta.substring(uploadsIdx);
  const assetsIdx = ruta.indexOf('/assets/');
  if (assetsIdx !== -1) return ruta.substring(assetsIdx);
  return `/uploads/logos/${ruta.split('/').pop()}`;
};

const PrintCard: React.FC<{ data: CarnetPrintData }> = ({ data }) => {
  const primaryColor   = data.Color_Primario   || '#003366';
  const secondaryColor = data.Color_Secundario || '#FFFFFF';
  const cardUrl  = `${window.location.origin}/verificar-carnet/${data.Token}`;
  const isActive = data.Estatus === 'A' || data.Estatus === 'Activo' || data.Estatus === 1 || data.Estatus === '1';
  const logoUrl  = data.Logo_Ruta ? getLogoUrl(data.Logo_Ruta) : null;
  const flagUrl  = data.ImagenPais ? `/assets/flags/${data.ImagenPais}` : null;

  return (
    <div className="cv2-card">
      <div className="cv2-header" style={{ background: primaryColor, color: secondaryColor }}>
        {logoUrl ? (
          <div className="cv2-logo-circle" style={{ borderColor: secondaryColor }}>
            <img src={logoUrl} alt="Logo" onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
          </div>
        ) : (
          <div className="cv2-logo-circle cv2-logo-placeholder" style={{ borderColor: secondaryColor, color: secondaryColor }}>
            {(data.Nombre_Institucion || data.NombreFederacion || 'F').charAt(0)}
          </div>
        )}
        <div className="cv2-header-text">
          <h2 style={{ color: secondaryColor }}>{(data.Nombre_Institucion || data.NombreFederacion || '').toUpperCase()}</h2>
          <span style={{ color: secondaryColor }}>CARNET OFICIAL</span>
        </div>
      </div>

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
              {flagUrl && <img src={flagUrl} className="cv2-flag" alt={data.NombrePais} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              {data.NombrePais || '-'}
            </span>
          </div>
        </div>
        <div className="cv2-qr-corner">
          <QRCodeSVG value={cardUrl} size={72} bgColor="#ffffff" fgColor={primaryColor} level="M" />
          <span className="cv2-qr-label">Escanear para verificar</span>
        </div>
      </div>

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

/* ═══════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════ */
const PAGE_SIZE = 100;

const ImpresionCarnets: React.FC = () => {
  const { puedeVer } = usePermisos('impresion_carnets');

  /* ── Data ── */
  const [carnets,      setCarnets]      = useState<CarnetRow[]>([]);
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
  const [paises,       setPaises]       = useState<Pais[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [printData,    setPrintData]    = useState<CarnetPrintData[]>([]);
  const [printing,     setPrinting]     = useState(false);

  /* ── Selección ── */
  const [selected, setSelected] = useState<Set<number>>(new Set());

  /* ── Filtros ── */
  const [filterFed,        setFilterFed]        = useState('');
  const [filterPais,       setFilterPais]       = useState('');
  const [filterEstatus,    setFilterEstatus]    = useState('');
  const [filterFoto,       setFilterFoto]       = useState('');
  const [filterRangeStart, setFilterRangeStart] = useState('');
  const [filterRangeEnd,   setFilterRangeEnd]   = useState('');

  /* ── Paginación (client-side) ── */
  const [page, setPage] = useState(1);

  const printAreaRef = useRef<HTMLDivElement>(null);

  /* ── Cargar catalogos ── */
  useEffect(() => {
    catalogosService.getFederaciones().then(r => setFederaciones(r.data || [])).catch(() => {});
    catalogosService.getPaises().then(r => setPaises(r.data || [])).catch(() => {});
  }, []);

  /* ── Cargar carnets ── */
  const loadCarnets = async () => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);
    try {
      const data = await carnetFederacionService.getWithFilters({
        federacion:  filterFed,
        pais:        filterPais,
        estatus:     filterEstatus,
        tieneFoto:   filterFoto,
        rangeStart:  filterRangeStart,
        rangeEnd:    filterRangeEnd,
      });
      setCarnets(data);
    } catch {
      alert('Error al cargar carnets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCarnets(); }, []);

  /* ── Paginación ── */
  const totalPages   = Math.max(1, Math.ceil(carnets.length / PAGE_SIZE));
  const pageStart    = (page - 1) * PAGE_SIZE;
  const pageCarnets  = carnets.slice(pageStart, pageStart + PAGE_SIZE);

  /* ── Selección ── */
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allPageSelected = pageCarnets.length > 0 && pageCarnets.every(c => selected.has(c.Id));

  const toggleSelectPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageCarnets.forEach(c => next.delete(c.Id));
      } else {
        pageCarnets.forEach(c => next.add(c.Id));
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(carnets.map(c => c.Id)));
  const clearAll  = () => setSelected(new Set());

  /* ── Imprimir ── */
  const handlePrint = async () => {
    if (selected.size === 0) return;
    setPrinting(true);
    try {
      const ids  = [...selected];
      const data = await carnetFederacionService.printBatch(ids);
      setPrintData(data);

      // Esperar a que React renderice los carnets en el área oculta
      await new Promise<void>(r => setTimeout(r, 500));
      if (!printAreaRef.current) throw new Error('Print area not available');

      // Esperar a que todas las imágenes terminen de cargar
      const origImgs = Array.from(printAreaRef.current.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        origImgs.map(img =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); })
        )
      );

      // Clonar el área de impresión
      const clone     = printAreaRef.current.cloneNode(true) as HTMLElement;
      const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));

      // Convertir blob: URLs → data: URLs en el clon
      // (las blob URLs no son accesibles en otra ventana sin este paso)
      for (let i = 0; i < origImgs.length; i++) {
        const orig   = origImgs[i];
        const cloned = cloneImgs[i];
        if (!cloned) continue;
        if (orig.src.startsWith('blob:') && orig.naturalWidth > 0) {
          try {
            const canvas  = document.createElement('canvas');
            canvas.width  = orig.naturalWidth;
            canvas.height = orig.naturalHeight;
            canvas.getContext('2d')?.drawImage(orig, 0, 0);
            cloned.src = canvas.toDataURL('image/jpeg', 0.85);
          } catch { /* si falla canvas (tainted) se muestra sin foto */ }
        }
      }

      const origin    = window.location.origin;
      const cardsHtml = clone.innerHTML;

      // Abrir ventana limpia (sin árbol React) → @page funciona correctamente
      const pw = window.open('', '_blank', 'width=300,height=200');
      if (!pw) {
        alert('El navegador bloqueó la ventana emergente.\nHabilita las ventanas emergentes para este sitio e intenta de nuevo.');
        setPrinting(false);
        return;
      }

      pw.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Carnets</title>
<base href="${origin}/">
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:85.6mm 54mm;margin:0}
body{background:#fff;margin:0;padding:0}
.ic-print-page{width:85.6mm;height:54mm;overflow:hidden;page-break-after:always;break-after:page}
.ic-print-page:last-child{page-break-after:avoid;break-after:avoid}
.cv2-card{border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;background:#fff}
.cv2-header{padding:7px 10px;display:flex;align-items:center;gap:8px;min-height:46px}
.cv2-logo-circle{width:34px;height:34px;border-radius:50%;overflow:hidden;background:white;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.cv2-logo-circle img{width:100%;height:100%;object-fit:cover}
.cv2-logo-placeholder{font-size:14px;font-weight:700;background:rgba(255,255,255,0.2)}
.cv2-header-text{flex:1}
.cv2-header-text h2{margin:0 0 3px;font-size:10px;font-weight:800;letter-spacing:.5px;line-height:1.2}
.cv2-header-text span{font-size:7px;opacity:.8;letter-spacing:1px;text-transform:uppercase}
.cv2-body{background:#fff;padding:7px 10px;display:flex;align-items:flex-start;gap:8px;border-top:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8}
.cv2-foto{width:52px;height:65px;border:1px solid #ccc;flex-shrink:0;background:#f5f5f5;overflow:hidden;display:flex;align-items:center;justify-content:center}
.cv2-foto img{width:100%;height:100%;object-fit:cover}
.cv2-foto-silhouette{color:#aab;width:30px;height:30px}
.cv2-foto-silhouette svg{width:100%;height:100%}
.cv2-info{flex:1;display:flex;flex-direction:column;gap:0;padding-top:2px}
.cv2-info-row{display:flex;align-items:center;gap:5px;font-size:8.5px;border-bottom:1px solid #f0f0f0;padding:4px 0}
.cv2-info-row:last-child{border-bottom:none}
.cv2-label{font-weight:700;color:#333;min-width:58px;font-size:8.5px}
.cv2-value{color:#444;font-size:8.5px}
.cv2-pais-row{display:flex;align-items:center;gap:6px}
.cv2-flag{width:16px;height:11px;object-fit:cover;border:1px solid #ddd;flex-shrink:0}
.cv2-qr-corner{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:2px}
.cv2-qr-corner svg{border-radius:4px;border:1px solid #e0e0e0;padding:2px;background:white;width:50px!important;height:50px!important}
.cv2-qr-label{font-size:5.5px;color:#888;text-transform:uppercase;letter-spacing:.5px;text-align:center;max-width:56px;line-height:1.3}
.cv2-footer{background:#f9f9f9;padding:4px 10px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e8e8e8;min-height:22px}
.cv2-pie{font-size:7px;color:#888;font-style:italic}
.cv2-status-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border-radius:50px;font-size:7.5px;font-weight:700;letter-spacing:.5px}
.cv2-status-badge.activo{background:rgba(34,197,94,.15);color:#16a34a;border:1.5px solid rgba(34,197,94,.35)}
.cv2-status-badge.inactivo{background:rgba(239,68,68,.12);color:#dc2626;border:1.5px solid rgba(239,68,68,.3)}
</style>
</head><body>${cardsHtml}</body></html>`);

      pw.document.close();
      pw.focus();

      // Esperar al render, imprimir y cerrar
      setTimeout(() => {
        pw.print();
        setTimeout(() => {
          pw.close();
          setPrintData([]);
          setPrinting(false);
        }, 1000);
      }, 600);

    } catch (err: any) {
      alert('Error al preparar la impresión: ' + (err?.message || ''));
      setPrinting(false);
    }
  };

  /* ── Estatus badge ── */
  const estatusBadge = (estatus: number | string) => {
    const active = estatus === 1 || estatus === '1' || estatus === 'A' || estatus === 'Activo';
    return (
      <span className={`ic-badge ${active ? 'ic-badge-active' : 'ic-badge-inactive'}`}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  /* ── Sin permiso ── */
  if (!puedeVer) {
    return (
      <div className="ic-no-access">
        <div className="ic-no-access-icon">🚫</div>
        <h2>Sin acceso</h2>
        <p>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <>
      {/* ── Área oculta de impresión ── */}
      <div ref={printAreaRef} id="ic-print-area">
        {printData.map(d => (
          <div key={d.Id} className="ic-print-page">
            <PrintCard data={d} />
          </div>
        ))}
      </div>

      {/* ── Contenido principal ── */}
      <div className="ic-page">

        {/* Header */}
        <div className="ic-header">
          <div className="ic-header-left">
            <h1 className="ic-title">🖨️ Impresión de Carnets</h1>
            <span className="ic-subtitle">
              {carnets.length} carnet{carnets.length !== 1 ? 's' : ''} encontrado{carnets.length !== 1 ? 's' : ''}
              {selected.size > 0 && ` · ${selected.size} seleccionado${selected.size !== 1 ? 's' : ''}`}
            </span>
          </div>
          <button
            className="ic-btn-print"
            onClick={handlePrint}
            disabled={selected.size === 0 || printing}
          >
            {printing
              ? '⏳ Preparando...'
              : `🖨️ Imprimir ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </button>
        </div>

        {/* Filtros */}
        <div className="ic-filters">
          <div className="ic-filters-grid">
            <div className="ic-filter-group">
              <label>Federación</label>
              <select value={filterFed} onChange={e => setFilterFed(e.target.value)}>
                <option value="">Todas</option>
                {federaciones.map(f => <option key={f.Id} value={f.Id}>{f.Nombre}</option>)}
              </select>
            </div>
            <div className="ic-filter-group">
              <label>País</label>
              <select value={filterPais} onChange={e => setFilterPais(e.target.value)}>
                <option value="">Todos</option>
                {paises.map(p => <option key={p.Id} value={p.Id}>{p.Pais}</option>)}
              </select>
            </div>
            <div className="ic-filter-group">
              <label>Estatus</label>
              <select value={filterEstatus} onChange={e => setFilterEstatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </div>
            <div className="ic-filter-group">
              <label>Foto</label>
              <select value={filterFoto} onChange={e => setFilterFoto(e.target.value)}>
                <option value="">Todas</option>
                <option value="1">Con foto</option>
                <option value="0">Sin foto</option>
              </select>
            </div>
            <div className="ic-filter-group">
              <label>No. Carnet desde</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 100"
                value={filterRangeStart}
                onChange={e => setFilterRangeStart(e.target.value)}
              />
            </div>
            <div className="ic-filter-group">
              <label>No. Carnet hasta</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 500"
                value={filterRangeEnd}
                onChange={e => setFilterRangeEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="ic-filters-actions">
            <button className="ic-btn-apply" onClick={loadCarnets} disabled={loading}>
              {loading ? '⏳ Cargando...' : '🔍 Aplicar filtros'}
            </button>
            <button className="ic-btn-clear" onClick={() => {
              setFilterFed(''); setFilterPais(''); setFilterEstatus('');
              setFilterFoto(''); setFilterRangeStart(''); setFilterRangeEnd('');
            }}>
              ✕ Limpiar
            </button>
          </div>
        </div>

        {/* Barra de selección masiva */}
        {carnets.length > 0 && (
          <div className="ic-selection-bar">
            <div className="ic-selection-info">
              <span>{selected.size} de {carnets.length} seleccionados</span>
            </div>
            <div className="ic-selection-actions">
              <button className="ic-btn-select-all" onClick={selectAll}>
                ☑ Seleccionar todos ({carnets.length})
              </button>
              <button className="ic-btn-select-page" onClick={toggleSelectPage}>
                {allPageSelected ? '☐ Deseleccionar página' : '☑ Seleccionar página'}
              </button>
              {selected.size > 0 && (
                <button className="ic-btn-clear-sel" onClick={clearAll}>
                  ✕ Limpiar selección
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="ic-table-container">
          {loading ? (
            <div className="ic-loading">
              <div className="ic-spinner" />
              <span>Cargando carnets...</span>
            </div>
          ) : carnets.length === 0 ? (
            <div className="ic-empty">
              <div className="ic-empty-icon">🃏</div>
              <p>No se encontraron carnets con los filtros aplicados.</p>
            </div>
          ) : (
            <table className="ic-table">
              <thead>
                <tr>
                  <th className="ic-th-check">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectPage}
                      title="Seleccionar/deseleccionar página"
                    />
                  </th>
                  <th>No.</th>
                  <th>Nombre Completo</th>
                  <th>Federación</th>
                  <th>País</th>
                  <th>Foto</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {pageCarnets.map(c => (
                  <tr
                    key={c.Id}
                    className={selected.has(c.Id) ? 'ic-row-selected' : ''}
                    onClick={() => toggleSelect(c.Id)}
                  >
                    <td className="ic-td-check" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.Id)}
                        onChange={() => toggleSelect(c.Id)}
                      />
                    </td>
                    <td className="ic-td-num">{c.Carnet}</td>
                    <td className="ic-td-name">{c.Nombre} {c.Apellidos}</td>
                    <td>{c.NombreFederacion || '-'}</td>
                    <td>{c.NombrePais || '-'}</td>
                    <td className="ic-td-foto">
                      {c.TieneFoto
                        ? <span className="ic-foto-yes" title="Tiene foto">📷</span>
                        : <span className="ic-foto-no"  title="Sin foto">—</span>}
                    </td>
                    <td>{estatusBadge(c.Estatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="ic-pagination">
            <button onClick={() => setPage(1)}        disabled={page === 1}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            <span className="ic-page-info">
              Página {page} de {totalPages}
              <span className="ic-page-range">
                &nbsp;({pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, carnets.length)} de {carnets.length})
              </span>
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            <button onClick={() => setPage(totalPages)}  disabled={page === totalPages}>»</button>
          </div>
        )}

      </div>
    </>
  );
};

export default ImpresionCarnets;
