import React, { useState, useEffect } from 'react';
import { Key, Database, Github, AlertTriangle, Download, Folder, CheckCircle } from 'lucide-react';
import { useVault } from '../store/VaultContext';
import { DailyLog } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function SettingsView() {
  const { logs } = useVault();
  const [showConfirm, setShowConfirm] = useState(false);
  const [vaultPath, setVaultPath] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-2024-11-20');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (window.bujo) {
      window.bujo.vaultInfo().then(info => setVaultPath(info.path)).catch(console.error);
      window.bujo.configGet().then(cfg => {
        if (cfg.api_key) setApiKey(cfg.api_key);
        if (cfg.model) setModel(cfg.model);
      }).catch(console.error);
    }
  }, []);

  const handleSaveConfig = async () => {
    if (!window.bujo) return;
    await window.bujo.configSave({ api_key: apiKey, model, vault_path: vaultPath, theme: 'dark' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = async () => {
    if (typeof window !== 'undefined' && window.bujo) {
      const dates = Object.keys(logs);
      await Promise.all(dates.map(date => window.bujo.clearDay(date)));
      window.location.reload();
    } else {
      localStorage.removeItem('bujo-vault');
      window.location.reload();
    }
  };

  const handleExport = async () => {
    const zip = new JSZip();
    (Object.values(logs) as DailyLog[]).forEach(log => {
      let content = `# ${log.date}\n\n`;
      log.entries.forEach(e => {
        let symbol = '-';
        if (e.type === 'task') symbol = '- [ ]';
        if (e.type === 'done') symbol = '- [x]';
        if (e.type === 'migrated') symbol = '- [>]';
        if (e.type === 'killed') symbol = '- [~]';
        if (e.type === 'event') symbol = '○';
        if (e.type === 'note') symbol = '-';
        if (e.type === 'priority') symbol = '*';
        content += `${symbol} ${e.content}\n`;
      });
      zip.file(`${log.date}.md`, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'bujo-vault.zip');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-2">Settings</h1>
        <p className="text-zinc-500 font-sans">Configure your BuJo experience.</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full space-y-8">

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Key size={20} className="text-indigo-400" />
            AI Configuration
          </h2>
          <div className="p-6 bg-zinc-900/30 rounded-2xl space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">OpenRouter API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="openai/gpt-4o-2024-11-20"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700 transition-colors font-mono"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium"
              >
                {saved ? <CheckCircle size={14} className="text-emerald-400" /> : null}
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Get a key at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">openrouter.ai</a>.
              Used for dump parsing and monthly reviews.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Database size={20} className="text-emerald-400" />
            Data Storage
          </h2>
          <div className="p-6 bg-zinc-900/30 rounded-2xl space-y-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your entries are stored as markdown files in your vault directory.
            </p>
            {vaultPath && (
              <div className="flex items-center gap-2 text-sm text-zinc-500 font-mono">
                <Folder size={14} />
                <span>{vaultPath}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={handleExport} className="px-4 py-2 bg-zinc-800/50 text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Download size={16} />
                Export Vault (Zip)
              </button>
              {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium">
                  Clear All Data
                </button>
              ) : (
                <div className="p-4 bg-red-500/10 rounded-xl space-y-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-red-400 font-medium">
                    <AlertTriangle size={18} />
                    Are you absolutely sure?
                  </div>
                  <p className="text-sm text-red-400/80">This will permanently delete all your journal entries.</p>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleClearData} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">Yes, delete everything</button>
                    <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Github size={20} className="text-zinc-400" />
            About
          </h2>
          <div className="p-6 bg-zinc-900/30 rounded-2xl">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Based on the original CLI/TUI <a href="https://github.com/naungmon/bujo-ai" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">bujo-ai</a> by naungmon.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
