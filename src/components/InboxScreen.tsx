import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { buildBackupJson, buildWeekMarkdown, currentWeek, syncInboxPending } from '../db/inbox';
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
  const [syncing, setSyncing] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy week digest');
  const [exportMsg, setExportMsg] = useState('');

  const week = currentWeek();
  const entries = useLiveQuery(
    () => db.inbox.orderBy('createdAt').reverse().limit(30).toArray(),
    [],
  ) ?? [];
  const pendingCount = useLiveQuery(
    () => db.inbox.where('syncedAt').equals(0).count(),
    [],
    0,
  );

  async function handleCapture() {
    const text = content.trim();
    if (!text) return;
    setSaving(true);
    try {
      const isLink = type === 'Link';
      await db.inbox.add({
        clientId: crypto.randomUUID(),
        syncedAt: 0,
        type,
        content: isLink ? text : text,
        url: isLink ? text : undefined,
        date: new Date().toISOString().slice(0, 10),
        week,
        createdAt: Date.now(),
      });
      setContent('');
      // Fire-and-forget sync
      void syncInboxPending();
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncInbox() {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncInboxPending();
    } finally {
      setSyncing(false);
    }
  }

  async function handleCopyDigest() {
    const md = await buildWeekMarkdown(week);
    await navigator.clipboard.writeText(md);
    setCopyLabel('Copied!');
    setTimeout(() => setCopyLabel('Copy week digest'), 2500);
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
    setExportMsg('Backup downloaded');
    setTimeout(() => setExportMsg(''), 3000);
  }

  const isLink = type === 'Link';
  const canCapture = content.trim().length > 0;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5">
      {/* Capture form */}
      <div className="space-y-3">
        {/* Type selector */}
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

        {/* Content input */}
        {isLink ? (
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
          disabled={saving || !canCapture}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          {saving ? 'Saving…' : `Capture ${EMOJI[type]}`}
        </button>
      </div>

      {/* Export row */}
      <div className="border-t border-gray-800 pt-4 space-y-2">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Export</p>
        <div className="flex gap-2">
          <button
            onClick={() => void handleCopyDigest()}
            className="flex-1 h-10 bg-gray-800 hover:bg-gray-700 active:bg-gray-700 rounded-xl text-xs font-medium text-gray-300 transition-colors"
          >
            {copyLabel}
          </button>
          <button
            onClick={() => void handleDownloadBackup()}
            className="flex-1 h-10 bg-gray-800 hover:bg-gray-700 active:bg-gray-700 rounded-xl text-xs font-medium text-gray-300 transition-colors"
          >
            Download backup
          </button>
        </div>
        {exportMsg && <p className="text-xs text-green-400">{exportMsg}</p>}
      </div>

      {/* Sync button if pending */}
      {(pendingCount ?? 0) > 0 && (
        <div className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-2.5">
          <span className="text-xs text-gray-400">{pendingCount} capture{pendingCount !== 1 ? 's' : ''} pending Notion sync</span>
          <button
            onClick={() => void handleSyncInbox()}
            disabled={syncing}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now ↑'}
          </button>
        </div>
      )}

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
                    {e.syncedAt === 0 && (
                      <span className="text-xs text-amber-600">pending sync</span>
                    )}
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
