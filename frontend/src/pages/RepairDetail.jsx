import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService, imageService, emailService } from '../services/dataService';
import {
    ArrowLeft, Save, ChevronRight, ChevronLeft,
    Settings, Clipboard, Activity, CheckCircle2,
    AlertCircle, Info, Camera, Trash2, Image as ImageIcon, Plus,
    FileText, Mail
} from 'lucide-react';

const STAGES = [
    'Received', 'Testing', 'Disassembled', 'Cleaned', 'Measured', 'Diagnosed', 'Assembled', 'Finished'
];

const RepairDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('entry');
    const [selectedImageStep, setSelectedImageStep] = useState('Received');

    const { data: repair, isLoading } = useQuery({
        queryKey: ['repair', id],
        queryFn: () => repairService.getById(id)
    });

    const updateDataMutation = useMutation({
        mutationFn: (data) => repairService.updateData(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['repair', id]);
            alert('Data updated successfully');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status) => repairService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['repair', id]);
        }
    });

    const upsertComponentMutation = useMutation({
        mutationFn: (data) => repairService.updateComponentState(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['repair', id]);
        }
    });

    const uploadImageMutation = useMutation({
        mutationFn: ({ file, stepName }) => imageService.upload(id, file, stepName),
        onSuccess: () => {
            queryClient.invalidateQueries(['repair', id]);
        }
    });

    const deleteImageMutation = useMutation({
        mutationFn: (imageId) => imageService.delete(imageId),
        onSuccess: () => {
            queryClient.invalidateQueries(['repair', id]);
        }
    });

    const sendEmailMutation = useMutation({
        mutationFn: (data) => emailService.sendNotification(id, data),
        onSuccess: () => {
            alert('Email sent successfully');
        },
        onError: (err) => {
            alert('Failed to send email: ' + (err.response?.data?.msg || err.message));
        }
    });

    const [formData, setFormData] = useState({});

    React.useEffect(() => {
        if (repair) {
            setFormData({
                age: repair.age || '',
                run_hours: repair.run_hours || '',
                connection_hours: repair.connection_hours || '',
                fault_history: repair.fault_history || '',
                reported_fault: repair.reported_fault || '',
                disassembly_obs: repair.disassembly_obs || '',
                measurement_obs: repair.measurement_obs || '',
                testing_obs: repair.testing_obs || '',
                final_conclusion: repair.final_conclusion || ''
            });
            setSelectedImageStep(repair.status);
        }
    }, [repair]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateDataMutation.mutate(formData);
    };

    const handleStatusChange = (newStatus) => {
        updateStatusMutation.mutate(newStatus);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading repair details...</p>
        </div>
    );

    if (!repair) return <div className="p-20 text-center text-danger">Repair Not Found</div>;

    const currentStageIndex = STAGES.indexOf(repair.status);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-accent font-semibold transition-colors group"
                >
                    <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    Back to Dashboard
                </button>
                <div className="flex gap-3">
                    <button
                        disabled={currentStageIndex === 0}
                        onClick={() => handleStatusChange(STAGES[currentStageIndex - 1])}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 disabled:opacity-30 font-semibold shadow-sm transition-all"
                    >
                        <ChevronLeft size={18} /> Previous Stage
                    </button>
                    <button
                        disabled={currentStageIndex === STAGES.length - 1}
                        onClick={() => handleStatusChange(STAGES[currentStageIndex + 1])}
                        className="px-6 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover flex items-center gap-2 disabled:opacity-30 font-bold shadow-lg shadow-accent/20 transition-all active:scale-95"
                    >
                        Next Stage <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${repair.type === 'Approval' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {repair.type}
                            </span>
                        </div>

                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Device Information</h2>
                        <h1 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                            {repair.brand} {repair.model}
                        </h1>
                        <p className="text-slate-500 font-medium mb-6 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5 rounded font-black">SN</span>
                            {repair.serial_number}
                        </p>

                        <div className="space-y-4 pt-6 border-t border-slate-50 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold">Client:</span>
                                <span className="text-slate-700 font-bold">{repair.client_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold">Internal No:</span>
                                <span className="text-slate-700 font-bold">{repair.internal_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold">Power:</span>
                                <span className="text-slate-700 font-bold">{repair.power || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold">Technician:</span>
                                <span className="text-slate-700 font-bold">{repair.technician_name}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                                <h3 className="text-sm font-black text-slate-900 uppercase">Current Status</h3>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <p className="text-xl font-black text-accent">{repair.status}</p>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-accent h-full transition-all duration-1000 ease-out"
                                        style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto">
                            {[
                                { id: 'entry', label: 'Entry Data', icon: Clipboard },
                                { id: 'procedure', label: 'Procedure', icon: Activity },
                                { id: 'components', label: 'Components', icon: Settings },
                                { id: 'images', label: 'Images', icon: Camera },
                                { id: 'conclusion', label: 'Final Conclusion', icon: CheckCircle2 }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold min-w-[120px] rounded-2xl transition-all ${activeTab === tab.id
                                        ? 'bg-white text-accent shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleSave}>
                                {activeTab === 'entry' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase ml-1">Device Age</label>
                                                <input
                                                    name="age"
                                                    value={formData.age}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium"
                                                    placeholder="e.g. 5 years"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase ml-1">Run Hours</label>
                                                <input
                                                    type="number"
                                                    name="run_hours"
                                                    value={formData.run_hours}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase ml-1">Connect Hours</label>
                                                <input
                                                    type="number"
                                                    name="connection_hours"
                                                    value={formData.connection_hours}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Reported Fault</label>
                                            <textarea
                                                name="reported_fault"
                                                value={formData.reported_fault}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium min-h-[120px]"
                                                placeholder="What did the client report?"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Historical Faults</label>
                                            <textarea
                                                name="fault_history"
                                                value={formData.fault_history}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium min-h-[100px]"
                                                placeholder="Step 3: Register historical faults..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'procedure' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="space-y-2 group">
                                            <div className="flex items-center gap-2 ml-1 mb-2">
                                                <label className="text-xs font-black text-slate-400 uppercase">Disassembly Observations</label>
                                                <Info size={14} className="text-slate-300" />
                                            </div>
                                            <textarea
                                                name="disassembly_obs"
                                                value={formData.disassembly_obs}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 p-5 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium min-h-[120px]"
                                                placeholder="Step 4: Note anomalies, screws rounded, photo references..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Measurement Results</label>
                                            <textarea
                                                name="measurement_obs"
                                                value={formData.measurement_obs}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 p-5 rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium min-h-[120px]"
                                                placeholder="Step 6: IGBTs, Rectifiers, Capacitors health status..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'components' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Health Status Checklist</h3>
                                            <button
                                                type="button"
                                                onClick={() => { }}
                                                className="text-xs font-bold text-accent flex items-center gap-1 hover:underline"
                                            >
                                                <Plus size={14} /> Add Custom Component
                                            </button>
                                        </div>

                                        <div className="overflow-hidden border border-slate-100 rounded-3xl">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Component</th>
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">State</th>
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {[
                                                        'Carcasa', 'Cooler', 'Placa de Control', 'Bloque IGBT',
                                                        'Rectificador', 'Capacitores', 'Bornera', 'Keypad'
                                                    ].map(comp => {
                                                        const stateData = repair.component_states?.find(s => s.component_name === comp) || {};
                                                        return (
                                                            <tr key={comp} className="group hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-4 font-bold text-slate-700">{comp}</td>
                                                                <td className="p-4 text-sm font-medium">
                                                                    <select
                                                                        className={`w-full p-2 rounded-xl border-none focus:ring-0 text-xs font-black uppercase tracking-tighter ${stateData.state === 'Good' ? 'text-success' :
                                                                            stateData.state === 'Faulty' ? 'text-danger' :
                                                                                stateData.state === 'Warning' ? 'text-warning' : 'text-slate-400'
                                                                            }`}
                                                                        value={stateData.state || ''}
                                                                        onChange={(e) => upsertComponentMutation.mutate({
                                                                            component_name: comp,
                                                                            state: e.target.value,
                                                                            observations: stateData.observations
                                                                        })}
                                                                    >
                                                                        <option value="">Select State</option>
                                                                        <option value="Good">🟢 Good</option>
                                                                        <option value="Warning">🟡 Warning</option>
                                                                        <option value="Faulty">🔴 Faulty</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-4">
                                                                    <input
                                                                        className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-300 font-medium"
                                                                        placeholder="Add notes..."
                                                                        defaultValue={stateData.observations || ''}
                                                                        onBlur={(e) => upsertComponentMutation.mutate({
                                                                            component_name: comp,
                                                                            state: stateData.state,
                                                                            observations: e.target.value
                                                                        })}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'images' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-accent/40 transition-all">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 text-slate-400 group-hover:text-accent transition-colors">
                                                    <Camera size={32} />
                                                </div>
                                                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Upload Visual Evidence</h4>
                                                <p className="text-slate-400 text-xs font-medium mb-6 px-4">Take photos of components, fault signs, or test results.</p>
                                                <div className="flex flex-col gap-4 w-full">
                                                    <select
                                                        value={selectedImageStep}
                                                        onChange={(e) => setSelectedImageStep(e.target.value)}
                                                        className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-600 focus:outline-none"
                                                    >
                                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <label className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-center">
                                                        Select Files
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) uploadImageMutation.mutate({ file, stepName: selectedImageStep });
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="bg-accent/5 rounded-3xl p-8 border border-accent/10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <ImageIcon className="text-accent" size={20} />
                                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Imaging Policy</h4>
                                                </div>
                                                <ul className="space-y-3">
                                                    {[
                                                        'Record initial state upon receipt',
                                                        'Document internal anomalies during disassembly',
                                                        'Visual proof of motor test success',
                                                        'Clear photos of rounded screws or burns'
                                                    ].map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                                                            <span className="text-accent">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gallery</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {repair.images?.map(img => (
                                                    <div key={img.id} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group bg-slate-50">
                                                        <img
                                                            src={`http://localhost:5000${img.file_path}`}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            alt={img.step_name}
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); if (window.confirm('Delete image?')) deleteImageMutation.mutate(img.id); }}
                                                                className="self-end p-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-danger transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest truncate bg-black/20 p-1 rounded-md">
                                                                {img.step_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {(!repair.images || repair.images.length === 0) && (
                                                <div className="py-12 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                                                    <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No images uploaded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'conclusion' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 flex items-start gap-4">
                                            <AlertCircle className="text-accent shrink-0" size={24} />
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                Step 7: Diagnosis and evaluate with supervisor. Elaborate the report based on these conclusions.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Final Conclusion</label>
                                            <textarea
                                                name="final_conclusion"
                                                value={formData.final_conclusion}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[40px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-bold text-slate-800 min-h-[220px] text-lg leading-relaxed"
                                                placeholder="Summary of diagnosis and work performed..."
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-12 flex justify-between items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/repair/${id}/report`)}
                                            className="bg-white text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-200 shadow-sm"
                                        >
                                            <FileText size={18} className="text-accent" />
                                            Preview Report
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendEmailMutation.isLoading}
                                            onClick={() => sendEmailMutation.mutate({})}
                                            className="bg-white text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-200 shadow-sm disabled:opacity-50"
                                        >
                                            <Mail size={18} className="text-success" />
                                            {sendEmailMutation.isLoading ? 'Sending...' : 'Send Notification'}
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={updateDataMutation.isLoading}
                                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {updateDataMutation.isLoading ? 'Saving...' : 'Save All Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepairDetail;
