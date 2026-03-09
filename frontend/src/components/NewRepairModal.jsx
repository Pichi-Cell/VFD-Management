import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, vfdService, repairService } from '../services/dataService';
import Modal from './Modal';
import { Plus, Search, ChevronRight, Check, AlertCircle, ArrowLeft, Building, Database } from 'lucide-react';

const NewRepairModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1); // 1: Client, 2: VFD/Model, 3: Repair Info
    const [subStep, setSubStep] = useState('list'); // 'list' or 'create'

    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVfd, setSelectedVfd] = useState(null);
    const [repairData, setRepairData] = useState({
        type: 'Approval',
        reported_fault: ''
    });

    // Forms for new entities
    const [newClient, setNewClient] = useState({ name: '', contact_info: '' });
    const [newVfd, setNewVfd] = useState({ model_id: '', serial_number: '', internal_number: '' });
    const [newModel, setNewModel] = useState({ brand: '', model: '', power: '', input_voltage: '380V' });

    const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: clientService.getAll, enabled: isOpen });
    const { data: vfds } = useQuery({
        queryKey: ['vfds', selectedClient?.id],
        queryFn: vfdService.getAll,
        enabled: !!selectedClient
    });
    const { data: models } = useQuery({ queryKey: ['models'], queryFn: vfdService.getModels, enabled: isOpen });

    const createRepairMutation = useMutation({
        mutationFn: (data) => repairService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['repairs']);
            onClose();
            resetForm();
        }
    });

    const createClientMutation = useMutation({
        mutationFn: (data) => clientService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['clients']);
            setSelectedClient(data);
            setSubStep('list');
            setStep(2);
        }
    });

    const createVfdMutation = useMutation({
        mutationFn: (data) => vfdService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['vfds', selectedClient.id]);
            setSelectedVfd(data);
            setSubStep('list');
            setStep(3);
        }
    });

    const createModelMutation = useMutation({
        mutationFn: (data) => vfdService.createModel(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['models']);
            setSubStep('vfd-form');
        }
    });

    const resetForm = () => {
        setStep(1);
        setSubStep('list');
        setSelectedClient(null);
        setSelectedVfd(null);
        setRepairData({ type: 'Approval', reported_fault: '' });
        setNewClient({ name: '', contact_info: '' });
        setNewVfd({ model_id: '', serial_number: '', internal_number: '' });
        setNewModel({ brand: '', model: '', power: '', input_voltage: '380V' });
    };

    const currentClientVfds = vfds?.filter(v => v.client_id === selectedClient?.id) || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Start New Repair">
            {/* Progress Stepper */}
            <div className="flex items-center gap-2 mb-8 px-2">
                {[1, 2, 3].map(i => (
                    <React.Fragment key={i}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= i ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {step > i ? <Check size={14} /> : i}
                        </div>
                        {i < 3 && <div className={`flex-1 h-1 rounded-full ${step > i ? 'bg-accent' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {subStep === 'list' ? (
                        <>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Select Client</h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" placeholder="Search clients..." />
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {clients?.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => { setSelectedClient(client); setStep(2); }}
                                        className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800">{client.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{client.contact_info || 'No contact info'}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                                <button onClick={() => setSubStep('client-form')} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} /> Add New Client
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Building size={18} className="text-accent" /> New Client
                            </h3>
                            <div className="space-y-4">
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                    placeholder="Company Name"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                    placeholder="Contact Email/Phone"
                                    value={newClient.contact_info}
                                    onChange={(e) => setNewClient({ ...newClient, contact_info: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setSubStep('list')} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancel</button>
                                    <button
                                        onClick={() => createClientMutation.mutate(newClient)}
                                        disabled={!newClient.name}
                                        className="flex-1 bg-accent text-white py-3 rounded-xl font-bold disabled:opacity-50"
                                    >
                                        Save Client
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {subStep === 'list' ? (
                        <>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Select VFD for {selectedClient?.name}</h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {currentClientVfds.map(vfd => (
                                    <button
                                        key={vfd.id}
                                        onClick={() => { setSelectedVfd(vfd); setStep(3); }}
                                        className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800">{vfd.brand} {vfd.model}</p>
                                            <p className="text-xs text-slate-400 font-mono text-uppercase uppercase">Internal: {vfd.internal_number || '---'}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                                <button onClick={() => setSubStep('vfd-form')} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} /> Register New Equipment
                                </button>
                            </div>
                        </>
                    ) : subStep === 'vfd-form' ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">New VFD Equipment</h3>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none"
                                value={newVfd.model_id}
                                onChange={(e) => setNewVfd({ ...newVfd, model_id: e.target.value })}
                            >
                                <option value="">Select Model</option>
                                {models?.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.power})</option>)}
                            </select>
                            <button onClick={() => setSubStep('model-form')} className="text-xs font-bold text-accent hover:underline">+ Create New Model</button>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none"
                                placeholder="Serial Number"
                                value={newVfd.serial_number}
                                onChange={(e) => setNewVfd({ ...newVfd, serial_number: e.target.value })}
                            />
                            <input
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none"
                                placeholder="Internal Number (Optional)"
                                value={newVfd.internal_number}
                                onChange={(e) => setNewVfd({ ...newVfd, internal_number: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setSubStep('list')} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Back</button>
                                <button
                                    onClick={() => createVfdMutation.mutate({
                                        ...newVfd,
                                        internal_number: newVfd.internal_number ? parseInt(newVfd.internal_number, 10) : null,
                                        client_id: selectedClient.id
                                    })}
                                    disabled={!newVfd.model_id || !newVfd.serial_number}
                                    className="flex-1 bg-accent text-white py-3 rounded-xl font-bold disabled:opacity-50"
                                >
                                    Register VFD
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">New VFD Model</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Brand" value={newModel.brand} onChange={e => setNewModel({ ...newModel, brand: e.target.value })} />
                                <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Model" value={newModel.model} onChange={e => setNewModel({ ...newModel, model: e.target.value })} />
                            </div>
                            <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Power (e.g. 7.5kW / 10HP)" value={newModel.power} onChange={e => setNewModel({ ...newModel, power: e.target.value })} />
                            <div className="flex gap-2">
                                <button onClick={() => setSubStep('vfd-form')} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Back</button>
                                <button
                                    onClick={() => createModelMutation.mutate(newModel)}
                                    className="flex-1 bg-success text-white py-3 rounded-xl font-bold"
                                >
                                    Save Model
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { setStep(1); setSubStep('list'); }} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                        ← {subStep === 'list' ? 'Back to Clients' : 'View Equipment List'}
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200 text-accent">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Target Equipment</p>
                            <p className="font-bold text-slate-800">{selectedVfd?.brand} {selectedVfd?.model}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRepairData({ ...repairData, type: 'Approval' })}
                                className={`p-4 rounded-2xl border-2 transition-all text-center font-bold ${repairData.type === 'Approval' ? 'border-success bg-success/5 text-success shadow-lg shadow-success/10' : 'border-slate-100 text-slate-400 bg-slate-50 hover:bg-white'
                                    }`}
                            >
                                Maintenance
                            </button>
                            <button
                                onClick={() => setRepairData({ ...repairData, type: 'Quote' })}
                                className={`p-4 rounded-2xl border-2 transition-all text-center font-bold ${repairData.type === 'Quote' ? 'border-warning bg-warning/5 text-warning shadow-lg shadow-warning/10' : 'border-slate-100 text-slate-400 bg-slate-50 hover:bg-white'
                                    }`}
                            >
                                Quote Only
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reported Fault</label>
                            <textarea
                                value={repairData.reported_fault}
                                onChange={(e) => setRepairData({ ...repairData, reported_fault: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium min-h-[100px]"
                                placeholder="Brief description of the issue..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setStep(2)} className="px-6 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-all">
                            Back
                        </button>
                        <button
                            onClick={() => createRepairMutation.mutate({ vfd_id: selectedVfd.id, type: repairData.type, reported_fault: repairData.reported_fault })}
                            disabled={createRepairMutation.isLoading}
                            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {createRepairMutation.isLoading ? 'Creating...' : 'Initialize Repair'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default NewRepairModal;
