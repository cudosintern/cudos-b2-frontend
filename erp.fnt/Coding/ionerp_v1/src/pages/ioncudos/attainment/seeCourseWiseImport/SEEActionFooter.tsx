import React from 'react';
import styles from '../mtedataimport/mteImportReview/mteImportReview.module.css';
import { FaUpload, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

interface SEEActionFooterProps {
  onUpload: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onDiscard?: () => void;
  canAccept: boolean;
  isProcessing: boolean;
}

const SEEActionFooter: React.FC<SEEActionFooterProps> = ({
  onUpload,
  onAccept,
  onCancel,
  onDiscard,
  canAccept,
  isProcessing,
}) => {
  return (
    <div className={styles.actionBar} style={{ display: 'flex', gap: '8px' }}>
      <button 
        type="button" 
        className={`${styles.btn} ${styles.btnUpload} bg-[#28a745] text-white hover:bg-green-700`} 
        onClick={onUpload}
        disabled={isProcessing}
      >
        <FaUpload size={12} className="mr-1" />
        {isProcessing ? "Processing..." : "Upload File"}
      </button>

      {canAccept && (
        <button 
          type="button" 
          className={`${styles.btn} ${styles.btnAccept} bg-[#28a745] text-white hover:bg-green-700`}
          onClick={onAccept}
          disabled={isProcessing}
        >
          <FaCheck size={12} className="mr-1" />
          Accept Data
        </button>
      )}

      {canAccept && onDiscard && (
        <button 
          type="button" 
          className={`${styles.btn} ${styles.btnDiscard} bg-[#dc2626] text-white hover:bg-red-700`}
          onClick={onDiscard}
          disabled={isProcessing}
        >
          <FaTrash size={12} className="mr-1" />
          Discard Data
        </button>
      )}

      <button 
        type="button" 
        className={`${styles.btn} ${styles.btnDiscard} bg-gray-500 text-white hover:bg-gray-600`}
        onClick={onCancel}
        disabled={isProcessing}
      >
        <FaTimes size={12} className="mr-1" />
        {canAccept ? "Close" : "Cancel"}
      </button>
    </div>
  );
};

export default SEEActionFooter;