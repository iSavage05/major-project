import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Compass,
  FileImage,
  Info,
  Loader2,
  RotateCcw,
  ScanLine,
  UploadCloud,
  XCircle,
} from 'lucide-react';

import { vastuAPI } from '../services/api';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';
import { cn } from '../utils/cn';

const MAX_FILE_SIZE = 16 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const statusStyles = {
  Positive: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/70',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'text-emerald-600 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
  Neutral: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/70',
    iconWrap: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-300',
    Icon: Info,
  },
  Critical: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/70',
    iconWrap: 'bg-rose-100 dark:bg-rose-900/30',
    icon: 'text-rose-600 dark:text-rose-300',
    Icon: AlertTriangle,
  },
};

const getGaugeColor = (score) => {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const isSupportedImage = (file) => {
  const hasSupportedType = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const hasSupportedExtension = /\.(png|jpe?g|webp)$/i.test(file.name);
  return hasSupportedType || hasSupportedExtension;
};

const ScoreGauge = ({ score }) => {
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0));
  const radius = 56;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div
      className="relative flex h-44 w-44 items-center justify-center"
      role="progressbar"
      aria-label="Overall compliance score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedScore)}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700 ease-out', getGaugeColor(normalizedScore))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {Math.round(normalizedScore)}
        </span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">out of 100</span>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-6" aria-live="polite">
    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 rounded-full bg-primary-100 p-4 dark:bg-primary-900/30">
            <Loader2 className="h-9 w-9 animate-spin text-primary-600 dark:text-primary-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analyzing floor plan</h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
            Reading orientation, room placement, and zone-level Vastu signals.
          </p>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-dark-border dark:bg-dark-surface"
        >
          <div className="mb-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-3 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  </div>
);

const UploadState = ({
  error,
  isDragging,
  onAnalyze,
  onClearFile,
  onDrop,
  onFileInputChange,
  onSelectFile,
  previewUrl,
  selectedFile,
  setIsDragging,
  fileInputRef,
}) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
    <Card>
      <CardContent>
        <div
          className={cn(
            'flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg',
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/70 dark:border-dark-border dark:bg-gray-900/20 dark:hover:border-primary-500 dark:hover:bg-primary-900/10'
          )}
          onClick={onSelectFile}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={onDrop}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectFile();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFileInputChange}
            ref={fileInputRef}
            type="file"
            id="vastu-floor-plan-input"
          />

          <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm dark:bg-dark-surface">
            <UploadCloud className="h-10 w-10 text-primary-600 dark:text-primary-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload floor plan</h2>
          <p className="mt-3 max-w-md text-sm text-gray-600 dark:text-gray-400">
            Drop a PNG, JPG, JPEG, or WebP blueprint image up to 16 MB.
          </p>

          {selectedFile && (
            <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left dark:border-dark-border dark:bg-dark-surface">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
                <FileImage className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  onClearFile();
                }}
                type="button"
                aria-label="Remove selected file"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/70 dark:bg-rose-900/20 dark:text-rose-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={!selectedFile}
            onClick={onAnalyze}
            size="lg"
            type="button"
          >
            <ScanLine className="mr-2 h-5 w-5" />
            Analyze Floor Plan
          </Button>
        </div>
      </CardContent>
    </Card>

    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
              <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vastu Audit</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Orientation, room zoning, and practical remedies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-border dark:bg-dark-surface">
          <img
            alt="Selected floor plan preview"
            className="h-72 w-full object-contain"
            src={previewUrl}
          />
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-dark-border dark:bg-dark-surface">
          <FileImage className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
      )}
    </div>
  </div>
);

const RoomAccordion = ({ index, isOpen, onToggle, room }) => {
  const styles = statusStyles[room.status] || statusStyles.Neutral;
  const StatusIcon = styles.Icon;
  const panelId = `vastu-room-panel-${index}`;

  return (
    <div className={cn('rounded-xl border bg-white dark:bg-dark-surface', styles.border)}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg"
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn('rounded-xl p-3', styles.iconWrap)}>
            <StatusIcon className={cn('h-5 w-5', styles.icon)} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {room.room_name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{room.zone}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', styles.badge)}>
            {room.status}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-gray-500 transition-transform dark:text-gray-400',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="border-t border-gray-200 px-5 pb-5 pt-4 dark:border-dark-border"
          id={panelId}
        >
          <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">{room.observation}</p>
          {room.remedy && (
            <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800 dark:border-primary-800/70 dark:bg-primary-900/20 dark:text-primary-200">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4" />
                Suggested remedy
              </div>
              <p className="leading-6">{room.remedy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultsDashboard = ({ previewUrl, result, selectedFile, onReset }) => {
  const [openRooms, setOpenRooms] = useState(new Set([0]));
  const rooms = useMemo(() => result?.room_analysis ?? [], [result]);
  const tips = result?.general_tips ?? [];

  const counts = useMemo(
    () =>
      rooms.reduce(
        (acc, room) => {
          acc[room.status] = (acc[room.status] || 0) + 1;
          return acc;
        },
        { Positive: 0, Neutral: 0, Critical: 0 }
      ),
    [rooms]
  );

  const toggleRoom = (index) => {
    setOpenRooms((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          previewUrl
            ? 'xl:grid-cols-[minmax(280px,0.95fr)_320px_minmax(0,1.25fr)]'
            : 'lg:grid-cols-[320px_minmax(0,1fr)]'
        )}
      >
        {previewUrl && (
          <Card>
            <CardContent>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
                  <FileImage className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Uploaded Floor Plan
                  </h2>
                  {selectedFile && (
                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile.name} - {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>
              </div>
              <img
                alt={selectedFile?.name || 'Uploaded floor plan'}
                className="h-72 w-full rounded-xl border border-gray-200 bg-gray-50 object-contain dark:border-dark-border dark:bg-gray-900/30"
                src={previewUrl}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center">
              <ScoreGauge score={result.overall_compliance_score} />
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                Overall Compliance
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-primary-100 p-3 dark:bg-primary-900/30">
                    <Compass className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Orientation Summary
                  </h2>
                </div>
                <p className="text-base leading-7 text-gray-700 dark:text-gray-300">
                  {result.orientation_summary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['Positive', 'Neutral', 'Critical'].map((status) => (
                  <div
                    className="rounded-xl border border-gray-200 p-4 text-center dark:border-dark-border"
                    key={status}
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {counts[status] || 0}
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Room Analysis</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Zone-level findings from the uploaded plan.
            </p>
          </div>
          <Button variant="outline" onClick={onReset} type="button">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </div>

        <div className="space-y-4">
          {rooms.map((room, index) => (
            <RoomAccordion
              index={index}
              isOpen={openRooms.has(index)}
              key={`${room.room_name}-${index}`}
              onToggle={() => toggleRoom(index)}
              room={room}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">General Tips</h2>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li className="flex gap-3 text-sm leading-6 text-gray-700 dark:text-gray-300" key={index}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

const VastuAudit = () => {
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const revokePreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  };

  const chooseFile = (file) => {
    setError('');
    setResult(null);

    if (!file) return;

    if (!isSupportedImage(file)) {
      revokePreviewUrl();
      setSelectedFile(null);
      setPreviewUrl('');
      setError('Please upload a PNG, JPG, JPEG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      revokePreviewUrl();
      setSelectedFile(null);
      setPreviewUrl('');
      setError('The selected image is larger than 16 MB.');
      return;
    }

    revokePreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileInputChange = (event) => {
    chooseFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await vastuAPI.analyze(formData);
      setResult(response.data);
    } catch (apiError) {
      const message =
        apiError.response?.data?.error ||
        apiError.response?.data?.detail ||
        apiError.message ||
        'Unable to analyze this floor plan.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetAudit = () => {
    revokePreviewUrl();
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-dark-bg">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')} type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                  Vastu Audit
                </h1>
                <p className="mt-1 hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
                  Floor-plan compliance suggestions powered by multimodal AI.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <LoadingState />
        ) : result ? (
          <ResultsDashboard
            previewUrl={previewUrl}
            result={result}
            selectedFile={selectedFile}
            onReset={resetAudit}
          />
        ) : (
          <UploadState
            error={error}
            isDragging={isDragging}
            onAnalyze={handleAnalyze}
            onClearFile={resetAudit}
            onDrop={handleDrop}
            onFileInputChange={handleFileInputChange}
            onSelectFile={() => fileInputRef.current?.click()}
            previewUrl={previewUrl}
            selectedFile={selectedFile}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
          />
        )}
      </main>
    </div>
  );
};

export default VastuAudit;
