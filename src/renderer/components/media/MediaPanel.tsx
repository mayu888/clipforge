import { useRef, useState } from 'react';
import { Film, Music, Loader2, Plus, X } from 'lucide-react';
import { useMediaStore } from '../../store/mediaStore';
import { useOpStore } from '../../store/opStore';
import { useThumbnail } from '../../hooks/useThumbnail';
import { api } from '../../lib/ipc';
import { useT } from '../../lib/i18n';
import type { MediaFile } from '../../lib/ipc';

export default function MediaPanel() {
  const { files, selectedFileId, addFiles, removeFile, selectFile, durations } = useMediaStore();
  const { saveFileConfig, restoreFileConfig } = useOpStore();
  const t = useT();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleSelectFile = (id: string) => {
    if (id === selectedFileId) return;
    if (selectedFileId) saveFileConfig(selectedFileId);
    selectFile(id);
    restoreFileConfig(id);
  };

  const handleAddFiles = async () => {
    const newFiles = await api.openFiles();
    if (newFiles.length > 0) addFiles(newFiles);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const droppedFiles: MediaFile[] = Array.from(e.dataTransfer.files)
      .filter(f => (f as File & { path?: string }).path)
      .map((f, i) => {
        const ef = f as File & { path: string };
        return {
          id: `dropped-${Date.now()}-${i}`,
          name: ef.name,
          path: ef.path,
          size: ef.size,
          ext: ef.name.split('.').pop()?.toLowerCase() ?? '',
        };
      });
    if (droppedFiles.length > 0) addFiles(droppedFiles);
  };

  return (
    <div
      className="h-full flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-accent/10 border-2 border-dashed border-accent rounded-panel flex items-center justify-center pointer-events-none">
          <p className="text-xs text-accent font-semibold">{t('leftdock.media.drop')}</p>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-3 text-center">
            <div className="border-2 border-dashed border-border rounded-panel p-6">
              <Film size={24} className="mx-auto text-muted mb-2" />
              <p className="text-xs text-muted">{t('leftdock.media.empty')}</p>
            </div>
          </div>
        ) : (
          files.map(file => (
            <FileCard
              key={file.id}
              file={file}
              selected={file.id === selectedFileId}
              duration={durations[file.id] ?? 0}
              onSelect={() => handleSelectFile(file.id)}
              onRemove={() => removeFile(file.id)}
            />
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={handleAddFiles}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-btn text-xs text-text-2 hover:bg-elevated hover:text-text transition-colors"
        >
          <Plus size={13} />
          {t('leftdock.media.addFiles')}
        </button>
      </div>
    </div>
  );
}

function FileCard({
  file,
  selected,
  duration,
  onSelect,
  onRemove,
}: {
  file: MediaFile;
  selected: boolean;
  duration: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { thumb, loading } = useThumbnail(file);
  const t = useT();
  const isAudio = /^(mp3|wav|aac|ogg|flac|m4a|wma|opus)$/i.test(file.ext);
  const durationLabel = duration > 0
    ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`group w-full flex items-center gap-2 px-2 py-1.5 transition-colors cursor-pointer ${
        selected ? 'bg-accent/15 border-l-2 border-accent' : 'hover:bg-elevated border-l-2 border-transparent'
      }`}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-10 rounded bg-panel-2 flex items-center justify-center overflow-hidden">
        {isAudio ? (
          <Music size={18} className="text-muted" />
        ) : loading ? (
          <Loader2 size={14} className="text-muted animate-spin" />
        ) : thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <Film size={18} className="text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate ${selected ? 'text-text font-medium' : 'text-text-2'}`}>
          {file.name}
        </p>
        {durationLabel && (
          <p className="text-xxs text-muted mt-0.5 font-mono">{durationLabel}</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-error/20 hover:text-error text-muted"
        title={t('leftdock.media.remove')}
      >
        <X size={12} />
      </button>
    </div>
  );
}
