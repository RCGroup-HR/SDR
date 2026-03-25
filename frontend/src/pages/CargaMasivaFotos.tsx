import React, { useState, useRef } from 'react';
import { carnetFederacionService } from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './CargaMasivaFotos.css';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface CarnetData {
  Id: number;
  Carnet?: string;
  CodigoCarnet?: string;
  Nombre: string;
  Apellidos: string;
  TieneFoto: number | boolean;
  NombreFederacion?: string;
  Id_Federacion?: number;
}

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'skipped_foto' | 'no_match';

interface FileMatch {
  file: File;
  filename: string;
  playerName: string;
  match: CarnetData | null;
  score: number;
  willUpload: boolean;
  status: UploadStatus;
  errorMsg?: string;
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const THRESHOLD = 0.75;

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Compara por tokens (palabras), ignora iniciales como "A." */
function similarity(a: string, b: string): number {
  const clean = (s: string) =>
    normalize(s)
      .replace(/\b\w\.\s*/g, '') // quita iniciales tipo "A."
      .trim();
  const tokensA = new Set(clean(a).split(' ').filter(t => t.length > 1));
  const tokensB = new Set(clean(b).split(' ').filter(t => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let matches = 0;
  for (const t of tokensA) if (tokensB.has(t)) matches++;
  return matches / Math.max(tokensA.size, tokensB.size);
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
type Step = 'idle' | 'analyzing' | 'preview' | 'uploading' | 'done';

const CargaMasivaFotos: React.FC = () => {
  const { puedeVer } = usePermisos('carga_masiva_fotos');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [matches, setMatches] = useState<FileMatch[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'upload' | 'skip' | 'nomatch'>('all');

  // ── Selección de carpeta ──────────────────────
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);
    const imageFiles = allFiles.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return IMAGE_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      alert('No se encontraron imágenes en la carpeta seleccionada.');
      return;
    }

    setStep('analyzing');

    // Obtener carnets de la API
    let carnets: CarnetData[] = [];
    try {
      const resp = await carnetFederacionService.getAll();
      carnets = Array.isArray(resp) ? resp : ((resp as any)?.data ?? []);
    } catch {
      alert('Error al obtener carnets de la API. Verifica tu conexión.');
      setStep('idle');
      return;
    }

    // Hacer match de cada imagen con un carnet
    const results: FileMatch[] = imageFiles.map(file => {
      const playerName = file.name.replace(/\.[^/.]+$/, '');

      let bestMatch: CarnetData | null = null;
      let bestScore = 0;
      for (const c of carnets) {
        const score = similarity(playerName, `${c.Nombre} ${c.Apellidos}`);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = c;
        }
      }

      if (!bestMatch || bestScore < THRESHOLD) {
        return { file, filename: file.name, playerName, match: null, score: bestScore, willUpload: false, status: 'no_match' as UploadStatus };
      }

      const hasFoto = bestMatch.TieneFoto === 1 || bestMatch.TieneFoto === true;
      return {
        file,
        filename: file.name,
        playerName,
        match: bestMatch,
        score: bestScore,
        willUpload: !hasFoto,
        status: hasFoto ? ('skipped_foto' as UploadStatus) : ('pending' as UploadStatus),
      };
    });

    setMatches(results);
    setStep('preview');
  };

  // ── Upload ────────────────────────────────────
  const handleUpload = async () => {
    const toUpload = matches.filter(m => m.willUpload && m.status === 'pending');
    if (toUpload.length === 0) return;

    setStep('uploading');
    setProgress(0);

    const token = localStorage.getItem('token');
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
    let done = 0;

    for (const item of toUpload) {
      setCurrentFile(item.filename);
      setProgress(Math.round((done / toUpload.length) * 100));
      setMatches(prev => prev.map(m => m.filename === item.filename ? { ...m, status: 'uploading' } : m));

      try {
        const formData = new FormData();
        formData.append('foto', item.file, item.filename);

        const resp = await fetch(`${apiUrl}/carnet-fotos/${item.match!.Id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (resp.ok) {
          setMatches(prev => prev.map(m => m.filename === item.filename ? { ...m, status: 'success' } : m));
        } else {
          setMatches(prev => prev.map(m => m.filename === item.filename ? { ...m, status: 'error', errorMsg: `HTTP ${resp.status}` } : m));
        }
      } catch (err: any) {
        setMatches(prev => prev.map(m => m.filename === item.filename ? { ...m, status: 'error', errorMsg: err.message } : m));
      }

      done++;
      await new Promise(r => setTimeout(r, 100));
    }

    setProgress(100);
    setCurrentFile('');
    setStep('done');
  };

  // ── Reset ─────────────────────────────────────
  const handleReset = () => {
    setStep('idle');
    setMatches([]);
    setProgress(0);
    setFilterView('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Stats ─────────────────────────────────────
  const stats = {
    total:       matches.length,
    seSubiran:   matches.filter(m => m.willUpload).length,
    yaTieneFoto: matches.filter(m => m.match && !m.willUpload).length,
    sinMatch:    matches.filter(m => !m.match).length,
    subidas:     matches.filter(m => m.status === 'success').length,
    errores:     matches.filter(m => m.status === 'error').length,
  };

  // ── Filtered rows ─────────────────────────────
  const visibleMatches = matches.filter(m => {
    if (filterView === 'upload')  return m.willUpload;
    if (filterView === 'skip')    return m.match && !m.willUpload;
    if (filterView === 'nomatch') return !m.match;
    return true;
  });

  // ── Status badge ──────────────────────────────
  const StatusBadge: React.FC<{ m: FileMatch }> = ({ m }) => {
    if (m.status === 'success')      return <span className="cmf-badge success">✅ Subida</span>;
    if (m.status === 'error')        return <span className="cmf-badge error" title={m.errorMsg}>❌ Error</span>;
    if (m.status === 'uploading')    return <span className="cmf-badge uploading">⏳ Subiendo…</span>;
    if (m.status === 'no_match')     return <span className="cmf-badge nomatch">❓ Sin match</span>;
    if (m.status === 'skipped_foto') return <span className="cmf-badge skip">⏭️ Ya tiene foto</span>;
    return <span className="cmf-badge ready">⬆️ Se subirá</span>;
  };

  // ─────────────────────────────────────────────
  if (!puedeVer) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px', color:'#666' }}>
        <div style={{ fontSize:'48px' }}>🚫</div>
        <h2 style={{ margin:0, color:'#333' }}>Sin acceso</h2>
        <p style={{ margin:0 }}>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="cmf-page">

      {/* ═══ STEP: IDLE ══════════════════════════ */}
      {step === 'idle' && (
        <div className="cmf-landing">
          <div className="cmf-landing-icon">📸</div>
          <h1>Carga Masiva de Fotos</h1>
          <p className="cmf-landing-desc">
            Selecciona la carpeta con las fotos.<br />
            Cada archivo debe tener el <strong>nombre completo del jugador</strong> como nombre de archivo.<br />
            <em>Ej: Juan Pérez González.jpg</em>
          </p>
          <div className="cmf-landing-note">
            ℹ️ Si el jugador ya tiene foto configurada, <strong>se omitirá</strong> automáticamente.
          </div>
          <button className="cmf-btn-primary" onClick={() => fileInputRef.current?.click()}>
            📁 Seleccionar carpeta
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFolderSelect}
            // @ts-ignore: webkitdirectory no está en los tipos estándar
            webkitdirectory=""
          />
        </div>
      )}

      {/* ═══ STEP: ANALYZING ═════════════════════ */}
      {step === 'analyzing' && (
        <div className="cmf-analyzing">
          <div className="cmf-spinner" />
          <p>Analizando imágenes y buscando coincidencias en la base de datos…</p>
        </div>
      )}

      {/* ═══ STEPS: PREVIEW / UPLOADING / DONE ══ */}
      {(step === 'preview' || step === 'uploading' || step === 'done') && (
        <div className="cmf-results">

          {/* Header */}
          <div className="cmf-results-header">
            <h1>📸 Carga Masiva de Fotos</h1>
            {step !== 'uploading' && (
              <button className="cmf-btn-secondary" onClick={handleReset}>
                ← Seleccionar otra carpeta
              </button>
            )}
          </div>

          {/* Stats bar */}
          <div className="cmf-stats">
            <button className={`cmf-stat ${filterView === 'all' ? 'active' : ''}`} onClick={() => setFilterView('all')}>
              <span className="cmf-stat-num">{stats.total}</span>
              <span className="cmf-stat-label">Total imágenes</span>
            </button>
            <button className={`cmf-stat blue ${filterView === 'upload' ? 'active' : ''}`} onClick={() => setFilterView('upload')}>
              <span className="cmf-stat-num">{stats.seSubiran}</span>
              <span className="cmf-stat-label">Se subirán</span>
            </button>
            <button className={`cmf-stat orange ${filterView === 'skip' ? 'active' : ''}`} onClick={() => setFilterView('skip')}>
              <span className="cmf-stat-num">{stats.yaTieneFoto}</span>
              <span className="cmf-stat-label">Ya tienen foto</span>
            </button>
            <button className={`cmf-stat red ${filterView === 'nomatch' ? 'active' : ''}`} onClick={() => setFilterView('nomatch')}>
              <span className="cmf-stat-num">{stats.sinMatch}</span>
              <span className="cmf-stat-label">Sin coincidencia</span>
            </button>
          </div>

          {/* Progress bar */}
          {step === 'uploading' && (
            <div className="cmf-progress-wrap">
              <div className="cmf-progress-track">
                <div className="cmf-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="cmf-progress-label">{progress}% — {currentFile}</p>
            </div>
          )}

          {/* Done banner */}
          {step === 'done' && (
            <div className={`cmf-done-banner ${stats.errores > 0 ? 'has-errors' : ''}`}>
              ✅ Carga completada — <strong>{stats.subidas}</strong> foto{stats.subidas !== 1 ? 's' : ''} subida{stats.subidas !== 1 ? 's' : ''}
              {stats.errores > 0 && <> · ⚠️ <strong>{stats.errores}</strong> error{stats.errores !== 1 ? 'es' : ''}</>}
            </div>
          )}

          {/* Upload button */}
          {step === 'preview' && stats.seSubiran > 0 && (
            <div className="cmf-upload-bar">
              <span className="cmf-upload-msg">
                {stats.seSubiran} foto{stats.seSubiran !== 1 ? 's' : ''} listas para subir
                {stats.yaTieneFoto > 0 && ` · ${stats.yaTieneFoto} se omitirán (ya tienen foto)`}
              </span>
              <button className="cmf-btn-primary" onClick={handleUpload}>
                ⬆️ Iniciar carga
              </button>
            </div>
          )}

          {step === 'preview' && stats.seSubiran === 0 && (
            <div className="cmf-upload-bar warning">
              ℹ️ Todos los jugadores encontrados ya tienen foto asignada. No hay nada que subir.
            </div>
          )}

          {/* Table */}
          <div className="cmf-table-wrap">
            <table className="cmf-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Jugador encontrado</th>
                  <th>Federación</th>
                  <th style={{ textAlign: 'center' }}>Match</th>
                  <th style={{ textAlign: 'center' }}>Foto actual</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibleMatches.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                      No hay registros en esta vista
                    </td>
                  </tr>
                )}
                {visibleMatches.map((m, i) => (
                  <tr key={i} className={
                    m.status === 'success' ? 'row-success' :
                    m.status === 'error' ? 'row-error' :
                    !m.match ? 'row-nomatch' : ''
                  }>
                    <td className="cmf-td-file" title={m.filename}>{m.filename}</td>
                    <td className="cmf-td-name">
                      {m.match
                        ? `${m.match.Nombre} ${m.match.Apellidos}`
                        : <span className="cmf-no-match">No encontrado</span>}
                    </td>
                    <td className="cmf-td-fed">
                      {m.match?.NombreFederacion ?? '—'}
                    </td>
                    <td className="cmf-td-score" style={{ textAlign: 'center' }}>
                      {m.match
                        ? <span className={`cmf-score-badge ${m.score >= 0.9 ? 'high' : m.score >= 0.75 ? 'mid' : 'low'}`}>
                            {Math.round(m.score * 100)}%
                          </span>
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!m.match ? '—' : (m.match.TieneFoto ? '✅' : '⚪')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge m={m} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};

export default CargaMasivaFotos;
