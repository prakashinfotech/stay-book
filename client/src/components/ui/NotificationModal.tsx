import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ModalState } from '../../hooks/useModal';

interface NotificationModalProps {
  modal: ModalState;
  onClose: () => void;
}

export default function NotificationModal({ modal, onClose }: NotificationModalProps) {
  if (!modal.isOpen) return null;

  const iconConfig = {
    success: { Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    error: { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    info: { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  const buttonConfig = {
    success: 'bg-emerald-600 hover:bg-emerald-700',
    error: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  const config = iconConfig[modal.type];
  const buttonClass = buttonConfig[modal.type];
  const { Icon } = config;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${config.bg} rounded-full p-3`}>
            <Icon size={32} className={config.color} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
          {modal.title}
        </h3>

        {/* Message - support multiline */}
        <p className="text-sm text-gray-600 text-center mb-6 whitespace-pre-line">
          {modal.message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full ${buttonClass} text-white font-medium py-2 rounded-lg transition-colors`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
