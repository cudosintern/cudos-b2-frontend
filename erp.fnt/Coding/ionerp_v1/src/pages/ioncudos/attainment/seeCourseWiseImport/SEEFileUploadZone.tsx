import React from 'react';

interface SEEFileUploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onUpload: () => void; // Unused in hidden mode but keept for interface
  isUploading: boolean;
}

const SEEFileUploadZone = React.forwardRef<HTMLInputElement, SEEFileUploadZoneProps>(
  ({ onFileSelect }, ref) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    };

    return (
      <input
        type="file"
        ref={ref}
        onChange={handleFileChange}
        accept=".xls,.xlsx"
        style={{ display: 'none' }}
      />
    );
  }
);

export default SEEFileUploadZone;
