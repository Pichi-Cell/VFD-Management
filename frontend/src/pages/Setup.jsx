import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { userService } from '../services/dataService';
import { Settings, Shield, HardDrive, Mail, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Setup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);

    // User Form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Storage Form
    const [storageType, setStorageType] = useState('LOCAL');
    const [uploadsDir, setUploadsDir] = useState('/app/uploads');
    const [smbHost, setSmbHost] = useState('');
    const [smbUser, setSmbUser] = useState('');
    const [smbPass, setSmbPass] = useState('');
    const [smbShare, setSmbShare] = useState('');
    const [smbBasePath, setSmbBasePath] = useState('!variadores\\Informes Variadores');

    // Email Form
    const [emailUser, setEmailUser] = useState('');
    const [emailPass, setEmailPass] = useState('');
    const [emailHost, setEmailHost] = useState('smtp.gmail.com');
    const [emailPort, setEmailPort] = useState('587');
    const [emailSecure, setEmailSecure] = useState(false);
    const [emailRejectUnauth, setEmailRejectUnauth] = useState(true);

    const setupMutation = useMutation({
        mutationFn: userService.setup,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Setup completed successfully! Welcome to VFD Management.');
            navigate('/');
        },
        onError: (err) => {
            toast.error(err.response?.data?.msg || 'An error occurred during setup');
        }
    });

    const handleNext = () => {
        if (step === 1) {
            if (!username || !password || !confirmPassword) return toast.error("All fields are required");
            if (password !== confirmPassword) return toast.error("Passwords do not match");
        }
        if (step === 2) {
            if (storageType === 'SMB' && (!smbHost || !smbUser || !smbPass || !smbShare)) {
                return toast.error("Please fill in all SMB details");
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let config = {
            STORAGE_TYPE: storageType,
            UPLOADS_DIR: storageType,
        };

        if (storageType === 'SMB') {
            config = {
                ...config,
                SMB_HOST: smbHost,
                SMB_USER: smbUser,
                SMB_PASS: smbPass,
                SMB_SHARE: smbShare,
                SMB_BASE_PATH: smbBasePath
            };
        }

        config = {
            ...config,
            EMAIL_USER: emailUser,
            EMAIL_PASS: emailPass,
            EMAIL_HOST: emailHost,
            EMAIL_PORT: emailPort,
            EMAIL_SECURE: emailSecure.toString(),
            EMAIL_REJECT_UNAUTHORIZED: emailRejectUnauth.toString()
        };

        setupMutation.mutate({
            username,
            password,
            config
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-accent origin-top-left -skew-y-6 transform shadow-2xl z-0" />

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="flex justify-center mb-8 gap-3 items-center text-white drop-shadow-md">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent shadow-lg">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight leading-none">VFD Management</h2>
                        <p className="text-accent-hover font-bold text-sm tracking-widest uppercase">System Initialization</p>
                    </div>
                </div>

                <div className="bg-white px-8 py-10 shadow-2xl rounded-[2.5rem] border border-slate-100 backdrop-blur-sm sm:px-12 relative overflow-hidden group">
                    {/* Step Indicators */}
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        {/* Connecting lines */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2 rounded-full" />
                        <div className="absolute top-1/2 left-0 h-0.5 bg-accent -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />

                        {[
                            { num: 1, icon: Shield, label: 'Admin' },
                            { num: 2, icon: HardDrive, label: 'Storage' },
                            { num: 3, icon: Mail, label: 'Email' }
                        ].map((s) => (
                            <div key={s.num} className="flex flex-col items-center gap-2">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-300 shadow-md ${step > s.num ? 'bg-accent text-white' :
                                    step === s.num ? 'bg-slate-900 text-white shadow-xl scale-110' :
                                        'bg-white text-slate-300 border-2 border-slate-100'
                                    }`}>
                                    {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.num ? 'text-slate-900' : 'text-slate-400'
                                    }`}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6 relative z-10">

                        {/* Step 1: User Config */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Create Administrator</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">This user will have full access to the system.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Username</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all peer"
                                                placeholder="admin"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all peer pr-12"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-accent transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all peer"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Storage Config */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Storage Configuration</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Where should images and reports be stored?</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Storage Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setStorageType('LOCAL')}
                                                className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${storageType === 'LOCAL' ? 'border-accent bg-accent/5 text-accent shadow-md' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                            >
                                                <HardDrive size={24} />
                                                <span>Local Volume</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStorageType('SMB')}
                                                className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${storageType === 'SMB' ? 'border-accent bg-accent/5 text-accent shadow-md' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                            >
                                                <Settings size={24} />
                                                <span>SMB Share</span>
                                            </button>
                                        </div>
                                    </div>

                                    {storageType === 'LOCAL' ? (
                                        <div className="group/input animate-in fade-in">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Uploads Directory</label>
                                            <input
                                                type="text"
                                                required
                                                className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                                                value={uploadsDir}
                                                onChange={(e) => setUploadsDir(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="group/input">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">SMB Host</label>
                                                    <input
                                                        type="text"
                                                        required={storageType === 'SMB'}
                                                        placeholder="192.168.1.100"
                                                        className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                                        value={smbHost}
                                                        onChange={(e) => setSmbHost(e.target.value)}
                                                    />
                                                </div>
                                                <div className="group/input">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">SMB Share Name</label>
                                                    <input
                                                        type="text"
                                                        required={storageType === 'SMB'}
                                                        placeholder="Public"
                                                        className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                                        value={smbShare}
                                                        onChange={(e) => setSmbShare(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="group/input">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">SMB Username</label>
                                                    <input
                                                        type="text"
                                                        required={storageType === 'SMB'}
                                                        className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                                        value={smbUser}
                                                        onChange={(e) => setSmbUser(e.target.value)}
                                                    />
                                                </div>
                                                <div className="group/input">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">SMB Password</label>
                                                    <input
                                                        type="password"
                                                        required={storageType === 'SMB'}
                                                        className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                                        value={smbPass}
                                                        onChange={(e) => setSmbPass(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="group/input">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Base Path</label>
                                                <input
                                                    type="text"
                                                    required={storageType === 'SMB'}
                                                    placeholder="Folder\\Subfolder"
                                                    className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                                    value={smbBasePath}
                                                    onChange={(e) => setSmbBasePath(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Email Config */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Email Configuration</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Configure SMTP for sending reports.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">SMTP Host & Port</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="smtp.example.com"
                                                className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                                value={emailHost}
                                                onChange={(e) => setEmailHost(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                required
                                                placeholder="587"
                                                className="appearance-none block w-24 px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-center"
                                                value={emailPort}
                                                onChange={(e) => setEmailPort(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={emailSecure}
                                                    onChange={(e) => setEmailSecure(e.target.checked)}
                                                />
                                                <div className="w-10 h-6 bg-slate-300 rounded-full peer-checked:bg-accent transition-colors shadow-inner"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">Use Secure (TLS)</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={emailRejectUnauth}
                                                    onChange={(e) => setEmailRejectUnauth(e.target.checked)}
                                                />
                                                <div className="w-10 h-6 bg-slate-300 rounded-full peer-checked:bg-accent transition-colors shadow-inner"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">Reject Unauth Certs</span>
                                        </label>
                                    </div>

                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Email Username / Address</label>
                                        <input
                                            type="text"
                                            required
                                            className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                            value={emailUser}
                                            onChange={(e) => setEmailUser(e.target.value)}
                                        />
                                    </div>

                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Email Password / App Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                            value={emailPass}
                                            onChange={(e) => setEmailPass(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={setupMutation.isPending}
                                className="flex-1 flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-accent/20 font-black text-[10px] uppercase tracking-widest text-white bg-accent hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50"
                            >
                                {setupMutation.isPending ? (
                                    <span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Initializing...</span>
                                ) : (
                                    step === 3 ? 'Complete Setup' : 'Continue'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Setup;
