import { useState } from 'react';

export interface ModalConfig {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface ModalState extends ModalConfig {
  isOpen: boolean;
}

export function useModal() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const show = (config: ModalConfig) => {
    setModal({ ...config, isOpen: true });
  };

  const close = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return { modal, show, close };
}
