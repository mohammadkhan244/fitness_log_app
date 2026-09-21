import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { buildBackupJson, buildWeekMarkdown, currentWeek, exportWeekToNotion } from '../db/inbox';
import type { InboxType } from '../types';

const TYPES: InboxType[] = ['Thought', 'Link', 'Quote'];
const EMOJI: Record<InboxType, string> = { Thought: '💭', Link: '🔗', Quote: '💬' };
const PLACEHOLDER: Record<InboxType, string> = {
  Thought: 'Write a thought, observation, or reflection…',
  Link: 'Paste a URL…',
  Quote: 'Paste a quote and note the source…',
};

export default function InboxScreen() {
  const [type, setType] = useState<InboxType>('Thought');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [notionStatus, setNotionStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [copyLabel, setCopyLabel] = useState('Copy digest');
  const [exportMsg, setExportMsg] = useState('');

  const week = currentWeek();
  const entries =
    useLiveQuery(() => db.inbox.orderBy('createdAt').reverse().limit(30).toArray(), []) ?? [];

  async function handleCapture() {
    const text = content.trim();
    if (!text) return;
    setSaving(true);
    try {
      await db.inbox.add({
        clientId: crypto.randomUUID(),
        syncedAt: Date.now(),
        type,
        content: text,
        url: type === 'Link' ? text : undefined,
        date: new Date().toISOString().slice(0, 10),
        week,
        createdAt: Date.now(),
      });
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportNotion() {
    if (notionStatus === 'loading') return;
    setNotionStatus('loading');
    try {
      const url = await exportWeekToNotion(week);
      setNotionStatus('done');
      setExportMsg(`Exported — open in Notion`);
      // Open the created page
      window.open(url, '_blank', 'noopener');
      setTimeout(() => { setNotionStatus('idle'); setExportMsg(''); }, 4000);
    } catch (err) {
      setNotionStatus('error');
      setExportMsg(err instanceof Error ? err.message : 'Export failed');
      setTimeout(() => { setNotionStatus('idle'); setExportMsg(''); }, 4000);
    }
  }

  async function handleCopyDigest() {
    const md = await buildWeekMarkdown(week);
    await navigator.clipboard.writeText(md);
    setCopyLabel('Copied!');
    setTimeout(() => setCopyLabel('Copy digest'), 2500);
  }

  async function handleDownloadBackup() {
    const json = await buildBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5">
      {/* Capture form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {EMOJI[t]} {t}
            </button>
          ))}
        </div>

        {type === 'Link' ? (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER[type]}
            inputMode="url"
            autoCapitalize="none"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 text-base text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER[type]}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        )}

        <button
          onClick={() => void handleCapture()}
          disabled={saving || content.trim().length === 0}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          {saving ? 'Saving…' : `Capture ${EMOJI[type]}`}
        </button>
      </div>

      {/* Export row */}
      <div className="border-t border-gray-800 pt-4 space-y-2">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Week {week} export</p>
        <button
          onClick={() => void handleExportNotion()}
          disabled={notionStatus === 'loading'}
          className={`w-full h-11 rounded-xl text-sm font-semibold transition-colors ${
            notionStatus === 'done'
              ? 'bg-green-700 text-white'
              : notionStatus === 'error'
              ? 'bg-red-900 text-red-200'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:opacity-50'
          }`}
        >
          {notionStatus === 'loading'
            ? 'Creating Notion page…'
            : notionStatus === 'done'
            ? 'Exported to Notion ↗'
            : notionStatus === 'error'
            ? 'Export failed'
            : 'Export week to Notion'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => void handleCopyDigest()}
            className="flex-1 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-medium text-gray-300 transition-colors"
          >
            {copyLabel}
          </button>
          <button
            onClick={() => void handleDownloadBackup()}
            className="flex-1 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-medium text-gray-300 transition-colors"
          >
            Download backup
          </button>
        </div>
        {exportMsg && (
          <p className={`text-xs ${notionStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {exportMsg}
          </p>
        )}
      </div>

      {/* Recent captures */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Recent</p>
          {entries.map((e) => (
            <div key={e.id} className="bg-gray-900 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">{EMOJI[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 leading-snug break-words">{e.content}</p>
                  {e.url && e.url !== e.content && (
                    <p className="text-xs text-blue-400 mt-1 truncate">{e.url}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-600">W{e.week}</span>
                    <span className="text-xs text-gray-700">{e.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
