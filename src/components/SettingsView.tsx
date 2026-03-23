import React, { useState, useEffect } from 'react';
import { Key, Database, Github, AlertTriangle, Download, Folder, CheckCircle, FolderOpen, XCircle } from 'lucide-react';
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
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!window.bujo) return;
    window.bujo.vaultInfo().then(info => setVaultPath(info.path)).catch(() => {});
    window.bujo.configGet().then(cfg => {
      setApiKey(cfg.api_key || '');
      setModel(cfg.model || 'openai/gpt-4o-2024-11-20');
    }).catch(() => {});
  }, []);

  const handleSaveConfig = async () => {
    if (!window.bujo) {
      // Fallback: write config directly
      try {
        localStorage.setItem('bujo-api-key', apiKey);
        localStorage.setItem('bujo-model', model);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
      } catch {
        setStatus('error');
        setErrorMsg('IPC not available. Set config at ~/.bujo-electron/config.json');
        setTimeout(() => setStatus('idle'), 5000);
      }
      return;
    }
    setStatus('saving');
    try {
      await window.bujo.configSave({ api_key: apiKey, model, vault_path: vaultPath, theme: 'dark' });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Save failed');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handlePickVaultFolder = async () => {
    if (!window.bujo) return;
    const result = await window.bujo.vaultPickFolder();
    if (result.path) {
      setVaultPath(result.path);
    }
  };

  const handleClearData = async () => {
    if (!window.bujo) return;
    const dates = Object.keys(logs);
    await Promise.all(dates.map(date => window.bujo.clearDay(date)));
    window.location.reload();
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
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveConfig}
                  disabled={status === 'saving'}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {status === 'saving' ? 'Saving...' :
                   status === 'saved' ? <><CheckCircle size={14} className="text-emerald-400" /> Saved</> :
                   status === 'error' ? <><XCircle size={14} className="text-red-400" /> Failed</> :
                   'Save'}
                </button>
                {status === 'error' && <span className="text-xs text-red-400">{errorMsg}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Database size={20} className="text-emerald-400" />
            Vault Location
          </h2>
          <div className="p-6 bg-zinc-900/30 rounded-2xl space-y-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Where your journal files are stored. Set <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">BUJO_VAULT</code> env var or pick a folder below.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 font-mono truncate">
                {vaultPath || 'Default: ~/bujo-vault'}
              </div>
              <button
                onClick={handlePickVaultFolder}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <FolderOpen size={14} />
                Browse
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Point this to an Obsidian vault or any folder. The app creates <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">daily/</code>, <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">monthly/</code>, <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">future/</code> subfolders on first run.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Database size={20} className="text-zinc-400" />
            Data
          </h2>
          <div className="p-6 bg-zinc-900/30 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleExport} className="px-4 py-2 bg-zinc-800/50 text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Download size={16} /> Export Vault (Zip)
              </button>
              {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium">
                  Clear All Data
                </button>
              ) : (
                <div className="p-4 bg-red-500/10 rounded-xl space-y-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-red-400 font-medium"><AlertTriangle size={18} />Are you sure?</div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleClearData} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">Delete everything</button>
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
