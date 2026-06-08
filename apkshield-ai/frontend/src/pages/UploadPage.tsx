import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock, Eye, ArrowRight, CheckCircle } from 'lucide-react';
import UploadZone from '../components/UploadZone';
import { uploadAPK, startAnalysis } from '../api/client';

const FEATURES = [
  { icon: <Eye size={18} />, label: 'Static Analysis', desc: 'Manifest, permissions & code inspection' },
  { icon: <Zap size={18} />, label: 'Dynamic Simulation', desc: 'Behavioral sandbox execution' },
  { icon: <Shield size={18} />, label: 'Threat Scoring', desc: 'Rule-based malware classification' },
  { icon: <Lock size={18} />, label: 'AI Report', desc: 'Executive summary & remediation' },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');

  const handleFileSelected = (f: File) => {
    setFile(f);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);

    try {
      // Step 1: Upload
      setStep('uploading');
      setIsUploading(true);
      const uploadRes = await uploadAPK(file, setProgress);
      setIsUploading(false);

      // Step 2: Start analysis
      setStep('analyzing');
      setIsAnalyzing(true);
      await startAnalysis(uploadRes.scan_id);
      setIsAnalyzing(false);
      setStep('done');

      // Brief success flash, then navigate
      setTimeout(() => {
        navigate(`/scan/${uploadRes.scan_id}`);
      }, 800);
    } catch (err: any) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setStep('idle');
      setError(err?.response?.data?.detail || 'Upload failed. Please try again.');
    }
  };

  const stepLabels = {
    idle: null,
    uploading: 'Uploading APK to secure sandbox…',
    analyzing: 'Running static & dynamic analysis…',
    done: 'Analysis complete! Redirecting…',
  };

  return (
    <div className="min-h-screen pt-16 grid-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-accent/10 border border-cyber-accent/25 text-cyber-accent text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
            MALWARE ANALYSIS PLATFORM
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight">
            <span className="text-gradient">APKShield</span>{' '}
            <span className="text-cyber-text">AI</span>
          </h1>
          <p className="text-xl text-cyber-muted max-w-2xl mx-auto leading-relaxed">
            Upload any Android APK for automated malware detection, behavioral analysis,
            and AI-powered threat assessment in seconds.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {FEATURES.map((f) => (
            <div key={f.label} className="glass-card p-4 text-center hover:border-cyber-accent/40 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex justify-center text-cyber-accent mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-cyber-text">{f.label}</div>
              <div className="text-xs text-cyber-text-dim mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Upload card */}
        <div className="glass-card p-8 mb-6 animate-slide-up">
          <UploadZone
            onFileSelected={handleFileSelected}
            isLoading={isUploading}
            progress={progress}
          />

          {/* Status message */}
          {stepLabels[step] && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-cyber-accent animate-fade-in">
              {step === 'done' ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <div className="w-4 h-4 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
              )}
              <span className={step === 'done' ? 'text-green-400' : ''}>{stepLabels[step]}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Analyze button */}
          <div className="mt-6 flex justify-center">
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={!file || isUploading || isAnalyzing}
              className="cyber-btn-primary text-base px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 transition-transform"
            >
              {isUploading || isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Analyze APK
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust footer */}
        <div className="text-center text-xs text-cyber-text-dim space-y-1">
          <p>🔒 Files are hashed and stored securely for analysis purposes.</p>
          <p>Powered by static analysis, dynamic simulation, and AI threat intelligence.</p>
        </div>
      </div>
    </div>
  );
}
