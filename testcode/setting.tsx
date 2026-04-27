import React, { useState, useEffect, useRef } from 'react';
import {
    Shield,
    Sword,
    Zap,
    Box,
    ArrowLeft,
    ChevronRight,
    Skull,
    Target,
    Activity,
    Languages,
    Settings,
    Cpu,
    Info,
    Terminal,
    Radio,
    Navigation,
    AlertCircle,
    Lock
} from 'lucide-react';

// --- 翻译与文案配置 ---
const TRANSLATIONS = {
    EN: {
        title: "OPERATIVE INTERFACE",
        routeStatus: "ROUTE SECURE",
        riskZones: ["Low Risk", "Mid Risk", "High Risk"],
        labels: {
            actionStatus: "Action Status",
            acquired: "Acquired Items",
            balance: "Current Balance",
            cost: "Deploy Cost",
            buyArmor: "Purchase Qty (Armor)",
            buyWeapon: "Purchase Qty (Weapon)",
            carrying: "Carrying Gear",
            safeBox: "Safe Box",
            tacticalFeed: "TACTICAL FEED",
            debug: "DEBUG TERMINAL",
            start: "START ACTION",
            abandon: "ABANDON MISSION",
            missionLog: "MISSION COMMS",
            ops: "Available Ops"
        }
    },
    ZH: {
        title: "开始游戏",
        routeStatus: "路线安全",
        riskZones: ["低风险区", "中风险区", "高风险区"],
        labels: {
            actionStatus: "行动状态",
            acquired: "已获得物品",
            balance: "当前余额",
            cost: "开局消耗",
            buyArmor: "购买数量 (护甲)",
            buyWeapon: "购买数量 (武器)",
            carrying: "携带装备",
            safeBox: "安全箱",
            tacticalFeed: "TACTICAL FEED",
            debug: "DEBUG TERMINAL",
            start: "开始行动",
            abandon: "放弃战局",
            missionLog: "战术通讯记录",
            ops: "可选操作"
        }
    }
};

const MISSION_SCENARIOS = [
    {
        text: "系统初始化完成。你已成功降落在 Delta-09 扇区边缘。前方发现一座废弃的观测塔，雷达显示那里有微弱的补给信号。",
        choices: [
            { text: "潜入观测塔寻找物资", next: 1, impact: { armor: -0.1, luck: 0.2 } },
            { text: "绕过观测塔，直接前往核心区", next: 2, impact: { armor: 0, luck: 0 } }
        ]
    },
    {
        text: "你在观测塔内发现了一个加密补给箱，但触发了警报！无人机正在启动。你可以尝试强行拆解或立刻撤离。",
        choices: [
            { text: "使用武器摧毁无人机", next: 3, impact: { weapon: -0.5, edcoins: 500 } },
            { text: "放弃物资，迅速撤离", next: 2, impact: { armor: -0.2, luck: -0.1 } }
        ]
    },
    {
        text: "你接近了核心提取点。提取信标已经激活，一群变异掠夺者正朝你的坐标聚拢。",
        choices: [
            { text: "坚守阵地，等待提取完成", next: 4, impact: { armor: -0.5, weapon: -0.5 } },
            { text: "投掷诱饵弹并寻找掩体", next: 4, impact: { armor: -0.1, luck: 0.1 } }
        ]
    },
    {
        text: "任务完成。提取点验证成功，传输光束已锁定。你带回了一些有价值的数据和少量 EDcoins。",
        choices: [
            { text: "完成行动，返回基站", next: -1, impact: { edcoins: 1000 } }
        ]
    }
];

const App = () => {
    const [view, setView] = useState('CONFIG');
    const [lang, setLang] = useState('ZH');
    const [selectedRisk, setSelectedRisk] = useState(0);
    const [safeBoxSize, setSafeBoxSize] = useState(0);
    const [missionStep, setMissionStep] = useState(0);
    const [stats, setStats] = useState({ armor: 2.0, weapon: 2.0, edcoins: 1000, luck: 0.5 });
    const [chatLogs, setChatLogs] = useState([]);

    const t = TRANSLATIONS[lang];
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatLogs]);

    const handleStartMission = () => {
        setView('MISSION');
        setMissionStep(0);
        setChatLogs([
            { type: 'sys', text: ">> INFILTRATION SEQUENCE INITIATED..." },
            { type: 'npc', text: MISSION_SCENARIOS[0].text }
        ]);
    };

    const handleChoice = (choice) => {
        if (choice.impact) {
            setStats(prev => ({
                ...prev,
                armor: Number(Math.max(0, prev.armor + (choice.impact.armor || 0)).toFixed(2)),
                weapon: Number(Math.max(0, prev.weapon + (choice.impact.weapon || 0)).toFixed(2)),
                edcoins: prev.edcoins + (choice.impact.edcoins || 0),
                luck: Number(Math.max(0, Math.min(1, prev.luck + (choice.impact.luck || 0))).toFixed(2))
            }));
        }

        const nextStep = choice.next;
        if (nextStep === -1) {
            setView('CONFIG');
            setChatLogs([]);
            setMissionStep(0);
            return;
        }

        setMissionStep(nextStep);
        setChatLogs(prev => [
            ...prev,
            { type: 'user', text: choice.text },
            { type: 'npc', text: MISSION_SCENARIOS[nextStep]?.text || "Communication lost..." }
        ]);
    };

    return (
        <div className="h-screen bg-[#05070a] text-slate-300 font-mono selection:bg-emerald-500/30 overflow-hidden flex flex-col p-6 gap-6">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 2px 100%' }}></div>

            {/* Header */}
            <header className="flex justify-between items-center relative z-20 px-2 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black tracking-tighter text-white italic">
                        {view === 'MISSION' ? "MISSION ACTIVE" : t.title}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white/5 border border-white/10 px-4 py-1.5 rounded text-[10px] font-black hover:bg-white/10 transition-all uppercase">返回主页</button>
                    <button onClick={() => setLang(l => l === 'EN' ? 'ZH' : 'EN')} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded text-[10px] font-black flex items-center gap-2 transition-colors hover:bg-white/10">
                        <Languages size={14} /> {lang}
                    </button>
                </div>
            </header>

            {/* Main UI */}
            <main className="flex-1 grid grid-cols-12 gap-8 relative z-10 overflow-hidden">

                {view === 'CONFIG' ? (
                    <>
                        {/* COLUMN 1: Zones & Action Status */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                    <Target size={14} className="text-emerald-500" /> {t.riskZones[0]} / {t.riskZones[2]}
                                </div>
                                <div className="space-y-2">
                                    {t.riskZones.map((zone, i) => (
                                        <RiskCard
                                            key={i}
                                            selected={selectedRisk === i}
                                            onClick={() => setSelectedRisk(i)}
                                            title={zone}
                                            subtitle="100% 基础遭遇率"
                                            color={i === 0 ? 'emerald' : i === 1 ? 'yellow' : 'red'}
                                            icon={i === 0 ? <Shield size={18} /> : i === 1 ? <Zap size={18} /> : <Skull size={18} />}
                                        />
                                    ))}
                                </div>
                            </div>

                            <TacticalPanel title={t.labels.actionStatus} icon={<Activity size={14} />}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-emerald-400">{t.routeStatus}</span>
                                </div>
                                <div className="flex gap-3 mb-4">
                                    <StatusBox label="区域" value={t.riskZones[selectedRisk]} active />
                                    <StatusBox label="锁定状态" value="开始行动" active />
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">{t.labels.ops}</p>
                                    <p className="text-2xl font-mono font-black text-white">1</p>
                                </div>
                            </TacticalPanel>

                            <TacticalPanel title={t.labels.acquired} icon={<Box size={14} />} flex>
                                <p className="text-[10px] text-slate-700 italic py-4 px-2">暂未获得收藏品</p>
                            </TacticalPanel>
                        </div>

                        {/* COLUMN 2: Resource & Gear */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-5 overflow-y-auto px-2 custom-scrollbar">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-1">
                                <Settings size={14} className="text-emerald-500" /> {t.labels.balance} & 护甲
                            </div>

                            <StatBlock title={t.labels.balance} armor="0.0" weapon="0.0" edcoins={stats.edcoins} highlight />
                            <StatBlock title={t.labels.cost} armor="2.0" weapon="2.0" edcoins="0" />

                            <div className="space-y-4 pt-2">
                                <PurchaseInput label={t.labels.buyArmor} balance={`${stats.edcoins} EDCOINS`} />
                                <PurchaseInput label={t.labels.buyWeapon} balance={`${stats.edcoins} EDCOINS`} />
                            </div>

                            <TacticalPanel title={t.labels.carrying} icon={<Terminal size={14} />} className="mt-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                                        <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">护甲强度</p>
                                        <p className="text-2xl font-mono font-black text-white tracking-tighter">{stats.armor.toFixed(1)}</p>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                                        <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">武器充能</p>
                                        <p className="text-2xl font-mono font-black text-white tracking-tighter">{stats.weapon.toFixed(1)}</p>
                                    </div>
                                </div>
                            </TacticalPanel>
                        </div>

                        {/* COLUMN 3: Feed, Safe Box & Execute */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                            <div className="bg-black/40 border border-white/10 rounded-2xl aspect-[16/11] relative overflow-hidden flex items-center justify-center shadow-inner">
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                                <div className="absolute top-4 left-4 border border-emerald-500/30 px-2 py-1 rounded text-[8px] font-bold text-emerald-400 uppercase bg-black/60">{t.labels.tacticalFeed}</div>

                                <svg viewBox="0 0 200 100" className="w-48 h-24 text-emerald-500/30">
                                    <path d="M0 50 L40 50 L50 20 L60 80 L70 50 L120 50 L130 10 L140 90 L150 50 L200 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                </svg>

                                <div className="absolute bottom-4 right-4 text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">SECTOR_09_LOCKED</div>
                            </div>

                            <TacticalPanel title={t.labels.safeBox} icon={<Lock size={14} />}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[8px] font-mono font-bold text-emerald-500/50 uppercase">SAFE MODE: ON</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <button key={i} onClick={() => setSafeBoxSize(i)} className={`py-3 rounded-lg border text-[11px] font-black transition-all ${safeBoxSize === i ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_#10b981]' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
                                            {i === 0 ? "不购买" : `${i}格`}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-600 font-bold italic leading-tight px-1">失败结算前，可保留物品</p>
                            </TacticalPanel>

                            <div className="space-y-3 mt-auto">
                                <button onClick={handleStartMission} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl text-base shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 uppercase tracking-widest">
                                    {t.labels.start}
                                </button>
                                <button className="w-full bg-red-500/10 border border-red-500/10 hover:bg-red-500/20 text-red-800 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-colors">
                                    {t.labels.abandon}
                                </button>
                            </div>

                            <div className="bg-black/60 border border-white/5 p-5 rounded-2xl font-mono">
                                <p className="text-[9px] font-bold text-slate-600 mb-2 uppercase tracking-widest">{t.labels.debug}</p>
                                <div className="flex items-center gap-2 text-[10px] text-emerald-500/60 animate-pulse">
                                    <span className="opacity-40">{'>'}</span> <span>play_state_init...</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* MISSION MODE (Text Gameplay) */
                    <div className="col-span-12 flex gap-6 h-full">
                        <div className="w-1/4 flex flex-col gap-4 shrink-0">
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-5 shadow-lg backdrop-blur-sm">
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} /> 实战遥测
                                </h3>
                                <div className="space-y-4">
                                    <ProgressBar label="护甲强度" value={stats.armor} max={2.0} color="bg-emerald-500" />
                                    <ProgressBar label="武器耐久" value={stats.weapon} max={2.0} color="bg-cyan-500" />
                                    <div className="pt-2 flex justify-between text-[10px] font-mono font-black border-t border-white/5 mt-4 pt-4">
                                        <span className="text-slate-500 uppercase tracking-tighter">撤离成功率:</span>
                                        <span className="text-white">{(stats.luck * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex-1 overflow-y-auto">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest font-bold underline decoration-emerald-500/50">任务简报</h3>
                                <div className="text-[11px] text-slate-400 leading-relaxed space-y-3">
                                    <p>• 坐标: Sector Delta-09</p>
                                    <p>• 威胁等级: {t.riskZones[selectedRisk]}</p>
                                    <p>• 提取状态: 待验证</p>
                                    <div className="pt-4">
                                        <div className="text-emerald-500/60 animate-pulse font-bold">LINK_ESTABLISHED_...</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-black/60 border border-white/10 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 left-0 right-0 h-12 bg-black/40 border-b border-white/5 flex items-center px-8 justify-between shrink-0 z-10 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <Radio size={14} className="text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">{t.labels.missionLog}</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-600">ENCRYPTION: AES-256</div>
                            </div>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 pt-16 space-y-8 scroll-smooth">
                                {chatLogs.map((log, i) => (
                                    <div key={i} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed border transition-all ${log.type === 'sys' ? 'text-emerald-500/60 border-transparent font-black tracking-widest' :
                                                log.type === 'user' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    'bg-white/5 border-white/10 text-slate-300'
                                            }`}>
                                            {log.type === 'npc' && <span className="text-[9px] block font-black text-emerald-500 mb-1.5 tracking-widest underline underline-offset-4">HQ_DELTA {">"}</span>}
                                            {log.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-black/40 border-t border-white/10 space-y-4 shrink-0 backdrop-blur-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {MISSION_SCENARIOS[missionStep]?.choices?.map((choice, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleChoice(choice)}
                                            className="p-5 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 rounded-2xl text-xs font-black text-emerald-400 text-left transition-all group flex justify-between items-center active:scale-95"
                                        >
                                            {choice.text}
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent shrink-0"></footer>

            {/* Internal Custom Scrollbar Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.3); }
      ` }} />
        </div>
    );
};

// --- Sub-Components ---

const TacticalPanel = ({ title, icon, children, flex = false, className = "" }) => (
    <div className={`bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col ${flex ? 'flex-1' : ''} shadow-lg backdrop-blur-sm ${className}`}>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <span className="text-emerald-500">{icon}</span> {title}
        </h3>
        {children}
    </div>
);

const RiskCard = ({ selected, onClick, title, subtitle, color, icon }) => {
    const themes = {
        emerald: selected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 text-emerald-900 opacity-50',
        yellow: selected ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5 text-yellow-900 opacity-50',
        red: selected ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/5 text-red-900 opacity-50'
    };

    return (
        <button onClick={onClick} className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all relative group ${themes[color]} hover:opacity-100`}>
            <div className="bg-black/40 p-3 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
            <div className="text-left flex-1">
                <h4 className="text-[13px] font-black uppercase tracking-tight leading-none mb-1.5">{title}</h4>
                <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{subtitle}</p>
            </div>
            {selected && <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-2 shadow-[0_0_8px_currentColor]"></div>}
        </button>
    );
};

const StatBlock = ({ title, armor, weapon, edcoins, highlight = false }) => (
    <div className={`bg-black/40 border ${highlight ? 'border-emerald-500/20' : 'border-white/5'} rounded-2xl p-6 relative overflow-hidden`}>
        {highlight && <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/30 shadow-[0_0_15px_#10b981]"></div>}
        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">{title}</h4>
        <div className="flex justify-between items-end">
            <div className="flex gap-8">
                <div>
                    <p className="text-[8px] text-slate-600 font-bold uppercase mb-2">ARMOR</p>
                    <p className="text-xl font-mono font-black text-white">{armor}</p>
                </div>
                <div>
                    <p className="text-[8px] text-slate-600 font-bold uppercase mb-2">WEAPON</p>
                    <p className="text-xl font-mono font-black text-white">{weapon}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[8px] text-emerald-500/60 font-black uppercase mb-1.5">EDCOINS</p>
                <p className="text-2xl font-mono font-black text-emerald-400 tracking-tighter">{edcoins.toLocaleString()}</p>
            </div>
        </div>
    </div>
);

const PurchaseInput = ({ label, balance }) => (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4 group hover:border-white/10 transition-all">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
        <div className="flex gap-2 relative">
            <input
                type="number"
                defaultValue={1}
                className="flex-1 bg-[#0a0c10] border border-white/10 rounded-xl py-3.5 px-4 text-sm font-mono font-black focus:border-emerald-500/40 outline-none transition-all text-white"
            />
            <button className="bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 px-6 font-black text-[10px] uppercase rounded-xl transition-all shadow-sm">
                BUY
            </button>
        </div>
        <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">支持 0.1 步进</span>
            <span className="text-[9px] font-mono font-black text-emerald-500/40">{balance}</span>
        </div>
    </div>
);

const StatusBox = ({ label, value, active = false, color = "text-white" }) => (
    <div className={`flex-1 p-3.5 rounded-xl border ${active ? 'bg-white/5 border-white/10' : 'bg-black border-white/5'}`}>
        <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest leading-none">{label}</p>
        <p className={`text-[11px] font-black uppercase tracking-tighter leading-none ${color}`}>{value}</p>
    </div>
);

const StatMini = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[8px] font-black text-emerald-500/40 uppercase mb-1 tracking-tighter">{label}</span>
        <span className="text-base font-mono font-black text-white leading-none">{value}</span>
    </div>
);

const ProgressBar = ({ label, value, max, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-slate-500 tracking-tighter">{label}</span>
            <span className="text-white font-mono">{Number(value).toFixed(1)} / {Number(max).toFixed(1)}</span>
        </div>
        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div className={`h-full ${color} transition-all duration-700 shadow-[0_0_8px_currentColor]`} style={{ width: `${(value / max) * 100}%` }}></div>
        </div>
    </div>
);

export default App;