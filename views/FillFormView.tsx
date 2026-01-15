
import React, { useState, useMemo } from 'react';
import SummaryCard from '../components/SummaryCard';
import { PILLARS, QUARTERS } from '../data';
import { MonitoringEntry } from '../types';

interface FillFormViewProps {
  entries: MonitoringEntry[];
  onAddEntry: (entry: MonitoringEntry) => void;
  onClear: () => void;
}

const FillFormView: React.FC<FillFormViewProps> = ({ entries, onAddEntry, onClear }) => {
  const [pillarId, setPillarId] = useState('');
  const [indicatorId, setIndicatorId] = useState('');
  const [quarterId, setQuarterId] = useState('');
  const [month, setMonth] = useState('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [achievementValue, setAchievementValue] = useState<string>('');
  const [comments, setComments] = useState('');

  // Hierarchy Stats
  const stats = useMemo(() => {
    const pillarsCount = PILLARS.length;
    const outputsCount = PILLARS.reduce((acc, p) => acc + p.outputs.length, 0);
    const indicatorsCount = PILLARS.reduce((acc, p) => 
      acc + p.outputs.reduce((oAcc, o) => oAcc + o.indicators.length, 0), 0
    );
    return { pillarsCount, outputsCount, indicatorsCount };
  }, []);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);
  
  const indicators = useMemo(() => {
    if (!selectedPillar) return [];
    return selectedPillar.outputs.flatMap(output => 
      output.indicators.map(ind => ({ ...ind, parentOutputId: output.id }))
    );
  }, [selectedPillar]);

  const selectedIndicator = useMemo(() => 
    indicators.find(i => i.id === indicatorId), 
    [indicators, indicatorId]
  );

  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === quarterId), [quarterId]);
  const months = useMemo(() => selectedQuarter?.months || [], [selectedQuarter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarId || !indicatorId || !quarterId || !month || !achievementValue) return;
    if (selectedIndicator?.isDual && !targetValue) return;

    onAddEntry({
      pillarId,
      outputId: selectedIndicator?.parentOutputId || '',
      indicatorId,
      quarterId,
      month,
      value: Number(achievementValue),
      targetValue: selectedIndicator?.isDual ? Number(targetValue) : undefined,
      comments,
      timestamp: new Date().toISOString()
    });

    setIndicatorId('');
    setTargetValue('');
    setAchievementValue('');
    setComments('');
  };

  // Improved Input Classes for better visibility and contrast
  const inputClasses = "w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 cursor-pointer appearance-none text-sm ring-offset-2";

  const chevronIcon = (
    <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Performance Entry</h1>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600 font-medium">Reporting monitoring data for Imihigo 2025-2026.</p>
      </header>

      {/* System Hierarchy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard 
          title="Total Pillars" 
          value={stats.pillarsCount} 
          color="bg-indigo-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <SummaryCard 
          title="Total Outputs" 
          value={stats.outputsCount} 
          color="bg-violet-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <SummaryCard 
          title="Monitored Indicators" 
          value={stats.indicatorsCount} 
          color="bg-blue-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main Form Section */}
        <div className="lg:col-span-8 order-1">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Data Entry</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Provide monthly performance data for specific indicators.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">1. Pillar</label>
                <div className="relative">
                  <select 
                    value={pillarId} 
                    onChange={(e) => {
                      setPillarId(e.target.value);
                      setIndicatorId('');
                    }}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Pillar --</option>
                    {PILLARS.map(p => <option key={p.id} value={p.id} className="text-slate-900 font-medium">{p.name}</option>)}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">2. Indicator</label>
                <div className="relative">
                  <select 
                    value={indicatorId} 
                    onChange={(e) => {
                      setIndicatorId(e.target.value);
                      setTargetValue('');
                      setAchievementValue('');
                    }}
                    disabled={!pillarId}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Indicator --</option>
                    {indicators.map(i => <option key={i.id} value={i.id} className="text-slate-900 font-medium">{i.name}</option>)}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">3. Quarter</label>
                  <div className="relative">
                    <select 
                      value={quarterId} 
                      onChange={(e) => {
                        setQuarterId(e.target.value);
                        setMonth('');
                      }}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Quarter --</option>
                      {QUARTERS.map(q => <option key={q.id} value={q.id} className="text-slate-900 font-medium">{q.name}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">4. Month</label>
                  <div className="relative">
                    <select 
                      value={month} 
                      onChange={(e) => setMonth(e.target.value)}
                      disabled={!quarterId}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Month --</option>
                      {months.map(m => <option key={m} value={m} className="text-slate-900 font-medium">{m}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>
              </div>

              {/* DYNAMIC VALUE SECTION */}
              <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance Data Points</h4>
                
                {selectedIndicator?.isDual ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="block text-[10px] font-bold text-amber-700 uppercase">Target Goal</label>
                      <input 
                        type="number" 
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="Expected value..."
                        className={`${inputClasses} border-amber-300 focus:border-amber-600 focus:ring-amber-500/10 placeholder:text-slate-300 placeholder:font-normal`}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase">Actual Achievement</label>
                      <input 
                        type="number" 
                        value={achievementValue}
                        onChange={(e) => setAchievementValue(e.target.value)}
                        placeholder="Recorded value..."
                        className={`${inputClasses} border-emerald-300 focus:border-emerald-600 focus:ring-emerald-500/10 placeholder:text-slate-300 placeholder:font-normal`}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-[10px] font-bold text-blue-700 uppercase">Value Recorded</label>
                    <input 
                      type="number" 
                      value={achievementValue}
                      onChange={(e) => setAchievementValue(e.target.value)}
                      placeholder="e.g. 500"
                      className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                      disabled={!indicatorId}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">Internal Remarks</label>
                  <textarea 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Briefly explain any deviations or key notes..."
                    className="w-full min-h-[100px] p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <button 
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group ring-offset-2 focus:ring-4 focus:ring-slate-900/20"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span>Commit Records</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar/Recent Feed Section */}
        <div className="lg:col-span-4 order-2">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden min-h-[400px]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Recent Logs</h3>
              {entries.length > 0 && (
                <button onClick={onClear} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:text-red-600 transition-colors">Clear All</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              {entries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  <p className="text-sm font-black uppercase tracking-tight">Empty Database</p>
                </div>
              ) : (
                entries.map((entry, idx) => {
                  const pillar = PILLARS.find(p => p.id === entry.pillarId);
                  const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
                  return (
                    <div key={idx} className="p-4 rounded-xl md:rounded-2xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-white px-1.5 py-0.5 rounded border border-slate-100">{entry.month}</span>
                        <div className="text-right">
                          {entry.targetValue !== undefined && (
                            <div className="text-[9px] font-bold text-amber-500 leading-none mb-1">Target: {entry.targetValue}</div>
                          )}
                          <div className="text-base md:text-lg font-black text-blue-600 leading-none">{entry.value.toLocaleString()}</div>
                        </div>
                      </div>
                      <p className="text-[11px] md:text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{indicator?.name}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillFormView;
