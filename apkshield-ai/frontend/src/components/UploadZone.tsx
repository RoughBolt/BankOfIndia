import { useCallback, useState } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  progress?: number;
}

const MAX_SIZE_MB = 50;

export default function UploadZone({ onFileSelected, isLoading, progress }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validate = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      return 'Only .apk files are accepted.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div className="w-full">
      <label
        htmlFor="apk-upload"
        className={`relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group ${
          dragOver
            ? 'border-cyber-accent bg-cyber-accent/10 scale-[1.02]'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : selectedFile
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-cyber-border bg-cyber-surface hover:border-cyber-accent/60 hover:bg-cyber-card'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Scan animation overlay */}
        {isLoading && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden scan-line pointer-events-none" />
        )}

        <input
          id="apk-upload"
          type="file"
          accept=".apk"
          className="hidden"
          disabled={isLoading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <div className="flex flex-col items-center gap-4 p-8 text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-cyber-accent/20 flex items-center justify-center">
                <Loader2 size={32} className="text-cyber-accent animate-spin" />
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-cyber-muted mb-2">
                  <span>Uploading…</span>
                  <span>{progress ?? 0}%</span>
                </div>
                <div className="w-full bg-cyber-border rounded-full h-1.5">
                  <div
                    className="bg-cyber-accent h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
              </div>
            </>
          ) : selectedFile && !error ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <FileCheck size={32} className="text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-400">{selectedFile.name}</p>
                <p className="text-sm text-cyber-text-dim mt-1">{formatSize(selectedFile.size)}</p>
              </div>
              <p className="text-xs text-cyber-text-dim">Click to change file</p>
            </>
          ) : (
            <>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                dragOver ? 'bg-cyber-accent/30 scale-110' : error ? 'bg-red-500/20' : 'bg-cyber-card group-hover:bg-cyber-accent/15'
              }`}>
                {error ? (
                  <AlertCircle size={32} className="text-red-400" />
                ) : (
                  <Upload size={32} className={`transition-colors ${dragOver ? 'text-cyber-accent' : 'text-cyber-muted group-hover:text-cyber-accent'}`} />
                )}
              </div>

              <div>
                <p className="text-lg font-semibold text-cyber-text">
                  {dragOver ? 'Drop your APK here' : 'Drag & drop your APK file'}
                </p>
                <p className="text-sm text-cyber-text-dim mt-1">
                  or <span className="text-cyber-accent underline underline-offset-2">browse to upload</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-cyber-text-dim">
                <span className="tag-info">.apk only</span>
                <span className="tag-info">Max 50 MB</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </label>
    </div>
  );
}
