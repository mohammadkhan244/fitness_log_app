import { useEffect } from 'react';
import { CAPABILITIES } from '../config/capabilityConfig';
import type { SourceTier } from '../config/capabilityConfig';

const TIER_LABEL: Record<SourceTier, string> = {
  'peer-reviewed': 'Peer-reviewed research',
  'practitioner':  'Coaching/practitioner source',
  'learnings':     'Your own training log',
};

const TIER_STYLE: Record<SourceTier, string> = {
  'peer-reviewed': 'bg-green-900/50 text-green-300',
  'practitioner':  'bg-blue-900/50 text-blue-300',
  'learnings':     'bg-amber-900/50 text-amber-300',
};

export default function ScienceScreen({ targetId }: { targetId?: string }) {
  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(`science-${targetId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [targetId]);

  const withSources = CAPABILITIES.filter((c) => c.sources && c.sources.length > 0);

  return (
    <div className="max-w-lg mx-auto p-4 pb-8 space-y-8">
      <p className="text-xs text-gray-500">
        The biology behind each capability status. Every entry is tagged by source type — peer-reviewed research, coaching consensus, or a conclusion from your own training log.
      </p>

      {withSources.map((cap) => (
        <div key={cap.id} id={`science-${cap.id}`}>
          <h2 className="text-sm font-semibold text-gray-200 mb-4">{cap.name}</h2>

          {cap.sources!.map((source, i) => (
            <div key={i} className="space-y-3">
              {/* Tier badge + title */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_STYLE[source.tier]}`}>
                  {TIER_LABEL[source.tier]}
                </span>
                <span className="text-xs text-gray-400">{source.title}</span>
              </div>

              {/* Source link */}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 active:text-indigo-200 break-all leading-relaxed block transition-colors"
                >
                  {source.url}
                </a>
              )}

              {/* Caveat */}
              {source.caveat && (
                <div className="border-l-2 border-amber-800/60 pl-3 space-y-1">
                  <p className="text-xs font-medium text-amber-600/80 uppercase tracking-wide">Caveat</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{source.caveat}</p>
                </div>
              )}

              {/* Writeup */}
              <p className="text-xs text-gray-400 leading-relaxed">{source.writeup}</p>
            </div>
          ))}

          <div className="border-t border-gray-800/60 mt-6" />
        </div>
      ))}
    </div>
  );
}
