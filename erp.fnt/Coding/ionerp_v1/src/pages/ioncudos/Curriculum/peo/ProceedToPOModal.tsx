import React from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import UIButton from '../../../../components/FormBuilder/fields/Button';

interface ProceedToPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  curriculumName: string;
}

const ProceedToPOModal: React.FC<ProceedToPOModalProps> = ({ isOpen, onClose, onConfirm, curriculumName }) => {
  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Proceed to Creation of Program Outcomes (POs) Confirmation"
      size="lg"
    >
      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="text-gray-700 dark:text-gray-300">
            Current State: Addition of Program Educational Objectives (PEOs) has been completed.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Next State: Addition of Program Outcomes (POs).
          </p>
        </div>

        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Current status of curriculum:</p>
          <p className="text-[#437880] font-bold">{curriculumName || "Not Selected"}</p>
        </div>

        <p className="font-medium text-gray-900 dark:text-white">
          Are you sure you want to proceed to creation of Program Outcomes (POs)?
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Warning: You will not be able to ADD, DELETE PEOs after this, to current curriculum.
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-white bg-[#d9534f] rounded-md hover:bg-[#c9302c] shadow-md transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-bold text-white bg-[#437880] rounded-md hover:bg-[#386269] shadow-md transition-all active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default ProceedToPOModal;

