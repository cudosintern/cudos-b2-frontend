import React from 'react';
import styles from '../mteImportReview/mteImportReview.module.css';
import { FaUpload, FaCheck, FaTimes } from 'react-icons/fa';

interface UploadActionButtonsProps {
  onUpload: () => void;
  onAccept: () => void;
  onCancel: () => void;
  canAccept: boolean;
  isUploading: boolean;
}

const UploadActionButtons: React.FC<UploadActionButtonsProps> = ({
  onUpload,
  onAccept,
  onCancel,
  canAccept,
  isUploading,
}) => {
  return (
    <div className={styles.actionBar}>
      <button 
        type="button" 
        className={`${styles.btn} ${styles.btnUpload} bg-[#28a745] text-white hover:bg-green-700`} 
        onClick={onUpload}
        disabled={isUploading}
      >
        <FaUpload size={12} className="mr-1" />
        {isUploading ? "Uploading..." : "Upload .xls"}
      </button>

      <button 
        type="button" 
        className={`${styles.btn} ${styles.btnAccept} bg-[#28a745] text-white hover:bg-green-700`}
        onClick={onAccept}
        disabled={!canAccept}
      >
        <FaCheck size={12} className="mr-1" />
        Accept .xls
      </button>

      <button 
        type="button" 
        className={`${styles.btn} ${styles.btnDiscard} bg-[#dc2626] text-white hover:bg-red-700`}
        onClick={onCancel}
      >
        <FaTimes size={12} className="mr-1" />
        Cancel
      </button>
    </div>
  );
}

export default UploadActionButtons;
