import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shadow-soft">
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
