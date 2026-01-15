
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FillFormView from './views/FillFormView';
import PreviewView from './views/PreviewView';
import AnalyticsView from './views/AnalyticsView';
import TargetView from './views/TargetView';
import PowerPointView from './views/PowerPointView';
import { MonitoringEntry } from './types';
import { PILLARS, QUARTERS } from './data';

// Helper to generate a full year of dummy data for all indicators
const generateMockData = (): MonitoringEntry[] => {
  const mockEntries: MonitoringEntry[] = [];
  
  PILLARS.forEach(pillar => {
    pillar.outputs.forEach(output => {
      output.indicators.forEach(indicator => {
        const annualTargetStr = String(indicator.targets?.annual || '1000').replace(/[^0-9.]/g, '');
        const annualTarget = parseFloat(annualTargetStr) || 100;
        const monthlyTarget = annualTarget / 12;

        QUARTERS.forEach(quarter => {
          quarter.months.forEach(month => {
            // Generate realistic values: Percentage vs Numeric
            let achievement: number;
            let targetVal: number | undefined;

            if (indicator.isDual) {
              // Percentage based: Progressing over the year
              const monthIndex = QUARTERS.flatMap(q => q.months).indexOf(month);
              const progressBase = 60 + (monthIndex * 3); // Starts at 60%, ends near 100%
              achievement = Math.min(progressBase + (Math.random() * 10 - 5), 100);
              targetVal = 100;
            } else {
              // Numeric based: fluctuating around the monthly average
              const variance = 0.8 + (Math.random() * 0.4); // 80% to 120% of target
              achievement = Math.round(monthlyTarget * variance);
              targetVal = Math.round(monthlyTarget);
            }

            mockEntries.push({
              pillarId: pillar.id,
              outputId: output.id,
              indicatorId: indicator.id,
              quarterId: quarter.id,
              month,
              value: achievement,
              targetValue: targetVal,
              comments: `Automated performance sync for ${month}. Data verified by sector focal point.`,
              timestamp: new Date().toISOString()
            });
          });
        });
      });
    });
  });

  return mockEntries;
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'fill' | 'preview' | 'analytics' | 'targets' | 'ppt'>('analytics');
  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize with mock data on first load
  useEffect(() => {
    const data = generateMockData();
    setEntries(data);
  }, []);

  const handleAddEntry = (entry: MonitoringEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const handleClearEntries = () => {
    if (confirm('Are you sure you want to clear all reporting data? This will remove the mock data as well.')) {
      setEntries([]);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Positioned absolutely on mobile, relatively on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => {
            setActiveView(view);
            setIsSidebarOpen(false);
          }} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto pb-12">
            {activeView === 'fill' && (
              <FillFormView 
                entries={entries} 
                onAddEntry={handleAddEntry} 
                onClear={handleClearEntries} 
              />
            )}
            {activeView === 'targets' && (
              <TargetView />
            )}
            {activeView === 'ppt' && (
              <PowerPointView />
            )}
            {activeView === 'preview' && (
              <PreviewView entries={entries} />
            )}
            {activeView === 'analytics' && (
              <AnalyticsView entries={entries} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
