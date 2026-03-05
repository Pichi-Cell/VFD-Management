import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { repairService } from '../services/dataService';
import { ArrowLeft, Printer, Download, Mail } from 'lucide-react';

const ReportView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: repair, isLoading } = useQuery({
        queryKey: ['repair', id],
        queryFn: () => repairService.getById(id)
    });

    if (isLoading) return <div className="p-20 text-center">Loading Report...</div>;
    if (!repair) return <div className="p-20 text-center text-danger">Report Not Found</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 bg-white min-h-screen shadow-2xl my-10 rounded-sm print:shadow-none print:my-0 print:max-w-none">
            {/* Action Bar (Hidden on print) */}
            <div className="flex justify-between items-center mb-10 print:hidden sticky top-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm z-10">
                <button
                    onClick={() => navigate(`/repair/${id}`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-accent font-bold transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Detail
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        <Printer size={18} /> Print / Save PDF
                    </button>
                </div>
            </div>

            {/* Report Header */}
            <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Informe Técnico</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">DMD Compresores - Departamento de Desarrollo</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Fecha de Emisión</p>
                    <p className="text-xl font-black text-slate-900">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Device Info Sections */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <section>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">1. Dispositivo</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">Equipo</span>
                            <span className="font-bold text-slate-900 text-sm">{repair.brand} {repair.model}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">N° Serie</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">{repair.serial_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">N° Interno</span>
                            <span className="font-bold text-slate-900 text-sm">{repair.internal_number || '---'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">Potencia</span>
                            <span className="font-bold text-slate-900 text-sm">{repair.power || '---'}</span>
                        </div>
                    </div>
                </section>
                <section>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">2. Cliente</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">Razón Social</span>
                            <span className="font-bold text-slate-900 text-sm">{repair.client_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium text-sm">Fecha Ingreso</span>
                            <span className="font-bold text-slate-900 text-sm">{new Date(repair.entry_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Entry State */}
            <section className="mb-12">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">3. Estado de Ingreso</h2>
                <div className="bg-slate-50 p-6 rounded-2xl mb-6">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Falla Reportada</p>
                    <p className="text-slate-800 font-medium leading-relaxed">{repair.reported_fault || 'No se reportó falla específica.'}</p>
                </div>
                {repair.fault_history && (
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Historial de Fallas</p>
                        <p className="text-slate-800 font-medium leading-relaxed">{repair.fault_history}</p>
                    </div>
                )}
            </section>

            {/* Observations / Procedure */}
            <section className="mb-12">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">4. Intervención Técnica</h2>
                <div className="space-y-8">
                    {repair.disassembly_obs && (
                        <div>
                            <h3 className="text-sm font-black text-slate-900 mb-2">Desarmado y Verificación Visual</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{repair.disassembly_obs}</p>
                        </div>
                    )}
                    {repair.measurement_obs && (
                        <div>
                            <h3 className="text-sm font-black text-slate-900 mb-2">Mediciones y Pruebas Electrónicas</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{repair.measurement_obs}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Component Status Table */}
            <section className="mb-12">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">5. Estado de Componentes</h2>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Componente</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">Estado</th>
                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {repair.component_states?.map(comp => (
                            <tr key={comp.id}>
                                <td className="p-4 text-sm font-bold text-slate-700">{comp.component_name}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${comp.state === 'Good' ? 'bg-success/10 text-success' :
                                            comp.state === 'Faulty' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {comp.state}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-500 italic">{comp.observations || '---'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Images Gallery in Report */}
            {repair.images && repair.images.length > 0 && (
                <section className="mb-12 break-before-page">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">6. Evidencia Fotográfica</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {repair.images.map(img => (
                            <div key={img.id} className="border border-slate-100 rounded-xl overflow-hidden p-2">
                                <img
                                    src={`http://localhost:5000${img.file_path}`}
                                    className="w-full h-48 object-cover rounded-lg mb-2"
                                    alt={img.step_name}
                                />
                                <p className="text-center font-black text-[9px] uppercase tracking-widest text-slate-400">{img.step_name}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Conclusion */}
            <section className="mb-20">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">7. Conclusión Final</h2>
                <div className="p-10 border-4 border-slate-900 bg-slate-50 rounded-sm">
                    <p className="text-lg font-bold text-slate-900 leading-relaxed italic">
                        "{repair.final_conclusion || 'Se concluye que el equipo se encuentra en condiciones operativas óptimas tras la revisión.'}"
                    </p>
                </div>
            </section>

            {/* Signatures */}
            <div className="mt-40 flex justify-between items-end border-t border-slate-200 pt-10">
                <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto"></div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Responsable Técnico</p>
                    <p className="font-bold text-slate-900">{repair.technician_name}</p>
                </div>
                <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto"></div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Firma DMD Compresores</p>
                </div>
            </div>
        </div>
    );
};

export default ReportView;
