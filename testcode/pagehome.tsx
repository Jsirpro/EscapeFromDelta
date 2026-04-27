import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Bell,
    Shield,
    Sword,
    Zap,
    TrendingUp,
    ShoppingCart,
    Box,
    History,
    User,
    AlertCircle,
    RefreshCw,
    X,
    ChevronDown,
    Navigation,
    Target,
    Activity
} from 'lucide-react';

// 模拟数据
const INITIAL_LOGS = [
    { id: 1, type: 'RAID', text: '玩家 Alpha 携带稀有武器成功撤离。', time: '2分钟前' },
    { id: 2, type: 'EVENT', text: '4号区域刷新了新的补给箱。', time: '5分钟前' },
    { id: 3, type: 'SYSTEM', text: '检测到 Solana 网络波动，正在优化路径...', time: '10分钟前' },
];

const App = () => {
    const [solAmount, setSolAmount] = useState(1);
    const [showError, setShowError] = useState(true);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [isDeploying, setIsDeploying] = useState(false);

    const edCoinRate = 100000000;

    // 模拟错误重试
    const handleRetry = () => {
        setShowError(false);
        setTimeout(() => {
            // 模拟重连成功
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            {/* 扫描线背景效果 */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,32,24,0.1)_0%,transparent_100%)]"></div>

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-md px-8 py-4 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                        ESCAPE FROM DELTA
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/60 font-mono">An On-Chain Extraction Raid</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* 钱包状态 */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <div className="text-right">
                            <p className="text-xs font-mono font-bold text-white uppercase">6tBU...4Lm</p>
                            <p className="text-[10px] text-slate-500 uppercase">Solana Mainnet</p>
                        </div>
                        <ChevronDown size={14} className="text-slate-500 group-hover:text-white" />
                    </div>

                    <button className="relative p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#05070a]"></span>
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-[1800px] mx-auto grid grid-cols-12 gap-6 relative z-10">

                {/* 左侧：资产与兑换 */}
                <section className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-2xl">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> My Assets
                        </h3>

                        <div className="space-y-3">
                            <AssetCard icon={<Box className="text-amber-500" />} label="EDcoins" value="0" />
                            <AssetCard icon={<Shield className="text-cyan-500" />} label="Armor Points" value="0.0" />
                            <AssetCard icon={<Sword className="text-red-500" />} label="Weapon Points" value="0.0" />
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Asset Exchange</h3>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-500">
                                <span>1 SOL = 100M EDcoins</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={solAmount}
                                    onChange={(e) => setSolAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">SOL</span>
                            </div>
                            <div className="flex justify-center text-emerald-500/50 py-1">
                                <RefreshCw size={16} />
                            </div>
                            <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-3 px-4">
                                <p className="text-[10px] uppercase text-emerald-500/60 mb-1">Preview</p>
                                <p className="text-xl font-black text-emerald-400 font-mono">{(solAmount * edCoinRate).toLocaleString()}</p>
                                <p className="text-[10px] text-emerald-500/40">EDCOINS</p>
                            </div>
                            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95">
                                Convert Assets (SOL)
                            </button>
                        </div>
                    </div>
                </section>

                {/* 中间：战术地图与核心指令 */}
                <section className="col-span-12 lg:col-span-6 space-y-6">
                    {/* 复杂战术地图 */}
                    <div className="relative aspect-[16/10] bg-black border border-emerald-500/20 rounded-xl overflow-hidden group shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                        {/* 网格背景 */}
                        <div className="absolute inset-0 opacity-[0.15]"
                            style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        {/* 地图 Header 信息 */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-20">
                            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Sector: Delta-09</p>
                                    <p className="text-[8px] font-mono text-emerald-500/60 uppercase">Live On-Chain Data Feed</p>
                                </div>
                            </div>
                            <div className="text-right font-mono text-[9px] text-emerald-500/40">
                                LAT: 34.0522° N<br />
                                LON: 118.2437° W
                            </div>
                        </div>

                        {/* SVG 战术布局 */}
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <svg viewBox="0 0 800 500" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                {/* 装饰性坐标轴 */}
                                <line x1="0" y1="250" x2="800" y2="250" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
                                <line x1="400" y1="0" x2="400" y2="500" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />

                                {/* 建筑布局 (Rooms & Hallways) */}
                                <g fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4">
                                    {/* Core Lab */}
                                    <path d="M350 150 L450 150 L480 180 L480 320 L450 350 L350 350 L320 320 L320 180 Z" className="animate-pulse" />
                                    <text x="375" y="255" fill="#10b981" fontSize="10" fontWeight="bold" opacity="0.6" className="font-mono">CORE_LAB</text>

                                    {/* Power Sector */}
                                    <rect x="100" y="100" width="120" height="100" rx="4" />
                                    <text x="110" y="120" fill="#10b981" fontSize="8" opacity="0.4" className="font-mono">P-SECTOR_01</text>

                                    {/* Storage B */}
                                    <rect x="580" y="100" width="120" height="150" rx="4" />
                                    <text x="590" y="120" fill="#10b981" fontSize="8" opacity="0.4" className="font-mono">STORAGE_B</text>

                                    {/* Extraction Corridor */}
                                    <path d="M220 150 L320 200 M480 200 L580 150 M400 350 L400 450 L100 450" strokeDasharray="5 5" />

                                    {/* Hazard Zone */}
                                    <circle cx="150" cy="400" r="60" stroke="#ef4444" strokeOpacity="0.3" fill="#ef4444" fillOpacity="0.05" />
                                    <text x="115" y="405" fill="#ef4444" fontSize="8" fontWeight="bold" className="font-mono">HAZARD_ZONE</text>
                                </g>

                                {/* 动态实体标记 */}

                                {/* 玩家 1 (Green) */}
                                <g className="translate-x-[360px] translate-y-[220px]">
                                    <circle r="6" fill="#10b981" className="animate-ping opacity-40" />
                                    <circle r="4" fill="#10b981" />
                                    <text y="-10" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold">YOU</text>
                                </g>

                                {/* 撤离点 (Cyan) */}
                                <g className="translate-x-[100px] translate-y-[450px]">
                                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="#06b6d4" strokeWidth="2" className="animate-spin" style={{ transformOrigin: 'center' }} />
                                    <Navigation size={12} className="text-cyan-400 -translate-x-1.5 -translate-y-1.5" />
                                    <text y="20" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="black">EXTRACT</text>
                                </g>

                                {/* 补给箱 (Amber) */}
                                <g className="translate-x-[640px] translate-y-[180px]">
                                    <rect x="-5" y="-5" width="10" height="10" fill="#f59e0b" />
                                    <text y="15" textAnchor="middle" fill="#f59e0b" fontSize="8">SUPPLY_CRATE</text>
                                </g>

                                {/* 敌人/威胁 (Red) */}
                                <g className="translate-x-[420px] translate-y-[170px]">
                                    <path d="M0 -6 L5 4 L-5 4 Z" fill="#ef4444" />
                                    <circle r="12" fill="none" stroke="#ef4444" strokeWidth="0.5" className="animate-pulse" />
                                </g>
                            </svg>
                        </div>

                        {/* 扫描线动画 */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[radar_4s_linear_infinite] z-10"></div>

                        {/* 底部 HUD 覆盖层 */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] text-white font-bold">SIGNAL STRENGTH: 98%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-white font-bold">ON-CHAIN VALIDATION: ACTIVE</span>
                                </div>
                            </div>
                            <div className="bg-black/60 backdrop-blur px-3 py-1 rounded border border-white/10 text-[9px] font-mono text-emerald-500/60 uppercase">
                                Terminal 0xDF...A21
                            </div>
                        </div>

                        {/* 边角装饰 */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-emerald-500/40 rounded-tl-xl pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-emerald-500/40 rounded-br-xl pointer-events-none"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setIsDeploying(!isDeploying)}
                            className={`col-span-2 py-8 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all group overflow-hidden relative ${isDeploying ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20'
                                }`}
                        >
                            <div className="relative z-10 flex flex-col items-center">
                                <Navigation className={`w-8 h-8 mb-2 ${isDeploying ? 'rotate-180 transition-transform' : ''}`} />
                                <span className="text-xl font-black uppercase tracking-[0.2em]">{isDeploying ? 'Aborting Mission...' : 'Deploy to Raid'}</span>
                                <span className="text-[10px] opacity-60 font-mono tracking-widest">Target: Delta Extraction Point</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent -translate-y-full group-hover:animate-[scan_2s_linear_infinite]"></div>
                        </button>

                        <NavButton icon={<ShoppingCart size={20} />} label="Open Market" />
                        <NavButton icon={<Box size={20} />} label="Warehouse" />
                        <NavButton icon={<User size={20} />} label="Inventory" />
                        <NavButton icon={<History size={20} />} label="Raid History" />
                    </div>
                </section>

                {/* 右侧：角色 HUD 与日志 */}
                <section className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex justify-between items-center">
                            <span>Player HUD</span>
                            <Activity size={14} className="text-emerald-500" />
                        </h3>

                        <div className="flex flex-col items-center py-6 relative">
                            <div className="w-32 h-48 bg-gradient-to-b from-emerald-500/10 to-transparent border border-white/5 rounded-2xl flex items-center justify-center relative mb-8 group cursor-crosshair">
                                <svg viewBox="0 0 100 150" className="w-full h-full p-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105">
                                    <rect x="35" y="30" width="30" height="30" fill="#8d6e63" />
                                    <rect x="25" y="60" width="50" height="60" fill="#37474f" />
                                    <rect x="25" y="120" width="20" height="30" fill="#263238" />
                                    <rect x="55" y="120" width="20" height="30" fill="#263238" />
                                    <rect x="75" y="70" width="15" height="10" fill="#546e7a" />
                                </svg>
                                <div className="absolute -bottom-4 w-24 h-4 bg-emerald-500/20 blur-xl rounded-full"></div>
                                {/* 瞄准准星装饰 */}
                                <div className="absolute inset-0 border border-emerald-500/0 group-hover:border-emerald-500/20 transition-all rounded-2xl">
                                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <StatBar label="Armor Integrity" current={14} max={100} color="bg-emerald-500" />
                                <StatBar label="Weapon Charge" current={85} max={100} color="bg-orange-500" />
                                <StatBar label="Neural Sync" current={42} max={100} color="bg-cyan-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col h-[360px]">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <AlertCircle size={14} /> Battle Records
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {logs.map(log => (
                                <div key={log.id} className="text-[11px] leading-relaxed border-l-2 border-white/5 pl-3 py-1 hover:bg-white/5 transition-colors group">
                                    <span className={`font-bold mr-2 ${log.type === 'RAID' ? 'text-emerald-400' :
                                        log.type === 'EVENT' ? 'text-cyan-400' : 'text-slate-500'
                                        }`}>[{log.type}]</span>
                                    <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.text}</span>
                                    <p className="text-[9px] text-slate-600 mt-1 font-mono uppercase">{log.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* 错误提示浮窗 */}
            {showError && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
                    <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-5 shadow-[0_0_40px_rgba(239,68,68,0.2)] max-w-sm">
                        <div className="flex gap-4">
                            <div className="bg-red-500/20 p-2 rounded-lg h-fit text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-red-500 font-black text-sm uppercase tracking-wide flex justify-between items-center">
                                    Data Fetch Error
                                    <button onClick={() => setShowError(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                                </h4>
                                <p className="text-xs text-slate-400 leading-normal">
                                    获取账户 6tBU...4Lm 的链上信息失败。
                                    <span className="block mt-1 font-mono text-[10px] text-red-500/60 opacity-80">(TypeError: fetch failed)</span>
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleRetry}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-black uppercase px-4 py-2 rounded border border-red-500/20 transition-all flex items-center gap-2"
                                    >
                                        <RefreshCw size={12} /> Retry
                                    </button>
                                    <button
                                        onClick={() => setShowError(false)}
                                        className="text-slate-500 hover:text-white text-[10px] font-bold uppercase px-2 py-2"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 底部装饰 */}
            <footer className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0"></footer>

            <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes radar {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16,185,129,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16,185,129,0.4);
        }
      `}</style>
        </div>
    );
};

// 子组件：资产卡片
const AssetCard = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-lg hover:border-white/20 transition-all group">
        <div className="bg-black/40 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{label}</p>
            <p className="text-xl font-black text-white font-mono">{value}</p>
        </div>
    </div>
);

// 子组件：战术导航按钮
const NavButton = ({ icon, label }) => (
    <button className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-4 hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
        <div className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors">
            {icon}
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">
            {label}
        </span>
    </button>
);

// 子组件：状态条
const StatBar = ({ label, current, max, color }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
            <span className="text-slate-500">{label}: {current}.0 / {max}</span>
            <span className="font-mono text-white">{Math.round((current / max) * 100)}%</span>
        </div>
        <div className="h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
                className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                style={{ width: `${(current / max) * 100}%` }}
            ></div>
        </div>
    </div>
);

export default App;