import { useEffect, useState } from 'react';
import { CheckIcon } from './Icons';

export function Toast({ message, isVisible, onHide }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 150);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-150 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-oblivion border border-metal/30 text-white rounded-lg shadow-lg">
        <CheckIcon className="w-5 h-5 text-turtle" />
        <span>{message}</span>
      </div>
    </div>
  );
}
