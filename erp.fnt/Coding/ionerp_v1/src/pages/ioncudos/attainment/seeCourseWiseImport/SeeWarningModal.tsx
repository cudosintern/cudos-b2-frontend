import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface SeeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SeeWarningModal: React.FC<SeeWarningModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 font-sans drop-shadow-2xl">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all">
        
        <div className="bg-red-50 text-red-600 px-4 py-3 flex justify-between items-center border-b border-red-100">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle />
            <span className="font-bold text-sm tracking-wide">Warning</span>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors focus:outline-none">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6 text-sm text-gray-700 bg-white leading-relaxed">
          <p>Thresholds/Targets OR Attainment Levels are not defined for this course. Kindly define before importing student assessment data.</p>
          <p className="mt-4">
             <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Click here to define Thresholds/Targets OR Attainment Levels</a>
          </p>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors shadow-sm focus:outline-none">
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default SeeWarningModal;
