import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { repairService } from '../services/dataService';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import AuthenticatedImage from '../components/AuthenticatedImage';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────
   Small presentational helpers
───────────────────────────────────────────────────────────────*/
const R = ({ label, value }) => (
    <div className="report-row">
        <span className="report-label">{label}</span>
        <span className="report-value">{value || '—'}</span>
    </div>
);

const SectionHeading = ({ n, title }) => (
    <div className="section-heading">
        <span className="section-num">{n}.</span>
        <span>{title}</span>
    </div>
);

const SubHeading = ({ n, title }) => (
    <h3 className="sub-heading">{n} {title}</h3>
);

const ObsText = ({ children }) =>
    children ? <p className="obs-text">{children}</p> : null;

/* ─────────────────────────────────────────────────────────────
   State badge (Good / Warning / Faulty)
───────────────────────────────────────────────────────────────*/
const StateBadge = ({ state }) => {
    const map = {
        Good: { label: 'OK', cls: 'badge-ok' },
        Warning: { label: 'ADVERTENCIA', cls: 'badge-warn' },
        Faulty: { label: 'DEFECTUOSO', cls: 'badge-fault' },
    };
    const info = map[state] || { label: state || '—', cls: '' };
    return <span className={`state-badge ${info.cls}`}>{info.label}</span>;
};

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────*/
const ReportView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: repair, isLoading } = useQuery({
        queryKey: ['repair', id],
        queryFn: () => repairService.getById(id),
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading report...</p>
        </div>
    );
    if (!repair) return <div className="p-20 text-center text-red-500 font-bold">Report Not Found</div>;

    const issueDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    const entryDate = repair.entry_date
        ? new Date(repair.entry_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    const hasEntryNums = repair.age || repair.run_hours != null || repair.connection_hours != null;
    const hasProcedure = repair.disassembly_obs || repair.measurement_obs || repair.testing_obs;

    return (
        <>
            {/* ═══════════════════════════════════════════════════════
                REPORT PRINT STYLES
                We use a <style> block so these are self-contained
                and not polluted by Tailwind purging.
            ═══════════════════════════════════════════════════════ */}
            <style>{`
                /* ── Screen wrapper ── */
                .report-shell {
                    max-width: 820px;
                    margin: 0 auto 60px;
                    background: #fff;
                    padding: 56px 64px;
                    box-shadow: 0 4px 48px rgba(0,0,0,0.10);
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    font-size: 13px;
                    color: #1e293b;
                    line-height: 1.6;
                }

                /* ── Section headings ── */
                .section-heading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    color: #94a3b8;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 8px;
                    margin: 36px 0 18px;
                }
                .section-heading:first-of-type { margin-top: 0; }
                .section-num { color: #1e293b; font-size: 11px; }
                .sub-heading {
                    font-size: 11px;
                    font-weight: 800;
                    color: #334155;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin: 20px 0 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .sub-heading::before {
                    content: '';
                    display: inline-block;
                    width: 3px;
                    height: 12px;
                    background: #3b82f6;
                    border-radius: 2px;
                    flex-shrink: 0;
                }

                /* ── Info rows ── */
                .report-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 7px 0;
                    border-bottom: 1px solid #f1f5f9;
                    gap: 16px;
                }
                .report-label {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .report-value {
                    color: #0f172a;
                    font-size: 12px;
                    font-weight: 700;
                    text-align: right;
                    word-break: break-word;
                }

                /* ── Generic observation text ── */
                .obs-text {
                    font-size: 13px;
                    color: #334155;
                    line-height: 1.75;
                    white-space: pre-wrap;
                    background: #f8fafc;
                    border-left: 3px solid #e2e8f0;
                    border-radius: 0 8px 8px 0;
                    padding: 14px 18px;
                    margin: 0 0 16px;
                }

                /* ── Spec / data tables ── */
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                .data-table th {
                    background: #1e293b;
                    color: #fff;
                    text-align: left;
                    padding: 9px 14px;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                }
                .data-table td {
                    padding: 9px 14px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: top;
                }
                .data-table tr:nth-child(even) td { background: #f8fafc; }
                .data-table tr:last-child td { border-bottom: none; }

                /* ── Stat boxes row (hours) ── */
                .stat-boxes {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .stat-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 16px;
                    text-align: center;
                }
                .stat-label {
                    font-size: 9px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 4px;
                }
                .stat-value {
                    font-size: 18px;
                    font-weight: 900;
                    color: #0f172a;
                }

                /* ── State badges ── */
                .state-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .badge-ok   { background: #d1fae5; color: #065f46; }
                .badge-warn { background: #fef3c7; color: #92400e; }
                .badge-fault{ background: #fee2e2; color: #991b1b; }

                /* ── Photo grid ── */
                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                .photo-cell {
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    break-inside: avoid;
                }
                .photo-cap {
                    text-align: center;
                    font-size: 8px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 6px 0 8px;
                }

                /* ── Conclusion box ── */
                .conclusion-box {
                    border: 3px solid #1e293b;
                    border-radius: 4px;
                    padding: 28px 32px;
                    background: #f8fafc;
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.75;
                    font-style: italic;
                }

                /* ── Signatures ── */
                .sig-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 32px;
                    margin-top: 56px;
                }
                .sig-block { text-align: center; }
                .sig-line {
                    width: 180px;
                    border-bottom: 2px solid #1e293b;
                    margin: 0 auto 8px;
                }
                .sig-role {
                    font-size: 9px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    margin-bottom: 4px;
                }
                .sig-name {
                    font-size: 13px;
                    font-weight: 800;
                    color: #0f172a;
                }

                /* ═══════════════════════════════════════════════════
                   @media print
                   The Export PDF button calls window.print().
                   IMPORTANT: Do NOT use body > * { display: none } tricks.
                   Hidden parents make all children invisible in CSS.
                   Instead, simply hide .no-print elements and reset layout.
                ═══════════════════════════════════════════════════ */
                @media print {
                    @page {
                        size: A4;
                        margin: 14mm 16mm 16mm 16mm;
                    }

                    /* Hide chrome elements — sidebar, header, action bar */
                    .no-print { display: none !important; }

                    /* Reset the main content wrapper (removes ml-64 and h-screen) */
                    main {
                        margin-left: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    main > div {
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* Reset the report shell for clean A4 output */
                    .report-shell {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        background: transparent !important;
                        font-size: 11pt !important;
                    }

                    /* Page break control */
                    .section-heading          { page-break-before: auto; }
                    .page-break-before-always { page-break-before: always; }
                    .photo-cell               { break-inside: avoid; }
                    .data-table tr            { break-inside: avoid; }
                    .conclusion-box           { break-inside: avoid; }
                    .sig-row                  { break-inside: avoid; }
                    .stat-boxes               { break-inside: avoid; }

                    /* Force background colors and images to print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

            `}</style>

            {/* ── Action bar (hidden on print) ── */}
            <div className="no-print flex justify-between items-center mb-8 sticky top-0 z-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
                <button
                    onClick={() => navigate(`/repair/${id}`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-accent font-bold transition-colors group"
                >
                    <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    Back to Detail
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm text-sm"
                    >
                        <Printer size={17} />
                        Print
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                toast.loading('Generating PDF...', { id: 'pdf-gen' });
                                const blob = await repairService.downloadPDF(id);
                                const url = window.URL.createObjectURL(new Blob([blob]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `Informe_${repair.internal_number || repair.serial_number}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                toast.success('PDF downloaded successfully', { id: 'pdf-gen' });
                            } catch (err) {
                                console.error('PDF download error:', err);
                                toast.error('Failed to generate PDF', { id: 'pdf-gen' });
                            }
                        }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 active:scale-95"
                    >
                        <Download size={17} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                REPORT DOCUMENT
            ══════════════════════════════════════════════════════ */}
            <div className="print-target report-shell">

                {/* ── HEADER ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #1e293b', paddingBottom: '28px', marginBottom: '0' }}>
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '6px' }}>
                            DMD Compresores · Depto. de Desarrollo
                        </p>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
                            Informe<br />Técnico
                        </h1>
                    </div>
                    <div style={{ textAlign: 'right', paddingTop: '4px' }}>
                        <div style={{
                            display: 'inline-block',
                            background: repair.type === 'Approval' ? '#d1fae5' : '#fef3c7',
                            borderRadius: '6px', padding: '3px 12px', marginBottom: '12px'
                        }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: repair.type === 'Approval' ? '#065f46' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                {repair.type || 'Servicio'}
                            </span>
                        </div>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>N° de Informe</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', margin: '0 0 12px' }}>
                            #{String(id).padStart(5, '0')}
                        </p>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Fecha de Emisión</p>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{issueDate}</p>
                    </div>
                </div>

                {/* ── Meta strip (Responsable / Cliente / Ingreso) ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0', background: '#1e293b', marginBottom: '0',
                    borderRadius: '0 0 8px 8px', overflow: 'hidden'
                }}>
                    {[
                        { label: 'Responsable', value: repair.technician_name },
                        { label: 'Cliente', value: repair.client_name },
                        { label: 'Fecha de Ingreso', value: entryDate },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '12px 20px', borderRight: '1px solid #334155' }}>
                            <p style={{ fontSize: '8px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px' }}>{label}</p>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{value || '—'}</p>
                        </div>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════
                    SECTION 1 — ESTADO DEL DISPOSITIVO
                ══════════════════════════════════════════════════ */}
                <SectionHeading n="1" title="Estado del Dispositivo" />

                {/* 1.1 Características eléctricas */}
                <SubHeading n="1.1" title="Características Eléctricas" />
                <table className="data-table">
                    <tbody>
                        <tr><td className="report-label">Marca</td><td style={{ fontWeight: 700 }}>{repair.brand || '—'}</td></tr>
                        <tr><td className="report-label">Modelo</td><td style={{ fontWeight: 700 }}>{repair.model || '—'}</td></tr>
                        {repair.power && <tr><td className="report-label">Potencia</td><td style={{ fontWeight: 700 }}>{repair.power}</td></tr>}
                        {repair.input_voltage && <tr><td className="report-label">Tensión de Alimentación</td><td style={{ fontWeight: 700 }}>{repair.input_voltage}</td></tr>}
                        <tr><td className="report-label">N° de Serie</td><td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{repair.serial_number || '—'}</td></tr>
                        {repair.internal_number && <tr><td className="report-label">N° Interno</td><td style={{ fontWeight: 700 }}>{repair.internal_number}</td></tr>}
                    </tbody>
                </table>

                {/* 1.2 Estado de ingreso */}
                {hasEntryNums && (
                    <>
                        <SubHeading n="1.2" title="Estado de Ingreso" />
                        <div className="stat-boxes">
                            {repair.age && (
                                <div className="stat-box">
                                    <div className="stat-label">Antigüedad</div>
                                    <div className="stat-value">{repair.age}</div>
                                </div>
                            )}
                            {repair.run_hours != null && repair.run_hours !== '' && (
                                <div className="stat-box">
                                    <div className="stat-label">Hs. de Marcha</div>
                                    <div className="stat-value">{Number(repair.run_hours).toLocaleString('es-AR')}</div>
                                </div>
                            )}
                            {repair.connection_hours != null && repair.connection_hours !== '' && (
                                <div className="stat-box">
                                    <div className="stat-label">Hs. de Conexión</div>
                                    <div className="stat-value">{Number(repair.connection_hours).toLocaleString('es-AR')}</div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 1.3 Historial de fallas */}
                {repair.fault_history && (
                    <>
                        <SubHeading n="1.3" title="Historial de Fallas" />
                        <ObsText>{repair.fault_history}</ObsText>
                    </>
                )}

                {/* 1.4 Reporte de falla */}
                {repair.reported_fault && (
                    <>
                        <SubHeading n={repair.fault_history ? '1.4' : '1.3'} title="Falla Reportada" />
                        <div style={{
                            background: '#fffbeb', borderLeft: '4px solid #f59e0b',
                            borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'
                        }}>
                            <p style={{ fontSize: '13px', color: '#78350f', fontStyle: 'italic', margin: 0, lineHeight: 1.7 }}>
                                "{repair.reported_fault}"
                            </p>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    SECTION 2 — PROCEDIMIENTO TÉCNICO
                ══════════════════════════════════════════════════ */}
                {hasProcedure && (
                    <>
                        <SectionHeading n="2" title="Procedimiento Técnico" />

                        {repair.disassembly_obs && (
                            <>
                                <SubHeading n="2.1" title="Desarmado y Verificación Visual" />
                                <ObsText>{repair.disassembly_obs}</ObsText>
                            </>
                        )}

                        {repair.measurement_obs && (
                            <>
                                <SubHeading n={repair.disassembly_obs ? '2.2' : '2.1'} title="Mediciones y Pruebas Electrónicas" />
                                <ObsText>{repair.measurement_obs}</ObsText>
                            </>
                        )}

                        {repair.testing_obs && (
                            <>
                                <SubHeading n={
                                    (repair.disassembly_obs && repair.measurement_obs) ? '2.3'
                                        : (repair.disassembly_obs || repair.measurement_obs) ? '2.2'
                                            : '2.1'
                                } title="Prueba de Funcionamiento" />
                                <ObsText>{repair.testing_obs}</ObsText>
                            </>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    SECTION 3 — COMPONENTES
                ══════════════════════════════════════════════════ */}
                {repair.component_states && repair.component_states.length > 0 && (
                    <>
                        <SectionHeading n="3" title="Estado de Componentes" />
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '22%' }}>Componente</th>
                                    <th style={{ width: '14%', textAlign: 'center' }}>Estado</th>
                                    <th>Observaciones</th>
                                    <th>Solución Propuesta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repair.component_states.map(comp => (
                                    <tr key={comp.id}>
                                        <td style={{ fontWeight: 700 }}>{comp.component_name}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <StateBadge state={comp.state} />
                                        </td>
                                        <td style={{ color: '#475569', fontStyle: comp.observations ? 'normal' : 'italic' }}>
                                            {comp.observations || '—'}
                                        </td>
                                        <td style={{ color: '#475569', fontStyle: comp.proposed_solution ? 'normal' : 'italic' }}>
                                            {comp.proposed_solution || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    SECTION 4 — EVIDENCIA FOTOGRÁFICA
                ══════════════════════════════════════════════════ */}
                {repair.images && repair.images.length > 0 && (
                    <>
                        <SectionHeading n="4" title="Evidencia Fotográfica" />
                        <div className="photo-grid">
                            {repair.images.map(img => (
                                <div key={img.id} className="photo-cell">
                                    <AuthenticatedImage
                                        src={img.file_path}
                                        alt={img.step_name}
                                        style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                                        className=""
                                    />
                                    <div className="photo-cap">{img.step_name}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    SECTION 5 — CONCLUSIÓN FINAL
                ══════════════════════════════════════════════════ */}
                <SectionHeading
                    n={repair.images && repair.images.length > 0 ? '5' : '4'}
                    title="Conclusión Final"
                />
                <div className="conclusion-box">
                    {repair.final_conclusion
                        || 'El equipo fue revisado siguiendo los procedimientos estándar del departamento de Desarrollo de DMD Compresores.'}
                </div>

                {/* ── SIGNATURES ── */}
                <div className="sig-row">
                    <div className="sig-block">
                        <div className="sig-line" />
                        <div className="sig-role">Responsable Técnico</div>
                        <div className="sig-name">{repair.technician_name}</div>
                    </div>
                    <div className="sig-block">
                        <div className="sig-line" />
                        <div className="sig-role">Firma — DMD Compresores</div>
                        <div className="sig-name" style={{ color: '#94a3b8' }}>Depto. de Desarrollo</div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{
                    marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <p style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 600, margin: 0 }}>
                        Documento generado por el sistema de gestión de variadores — DMD Compresores
                    </p>
                    <p style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 600, margin: 0 }}>
                        Informe #{String(id).padStart(5, '0')}
                    </p>
                </div>

            </div>{/* /report-shell */}
        </>
    );
};

export default ReportView;
