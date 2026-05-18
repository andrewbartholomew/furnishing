import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImage, createItem } from '../services/api';

const FLOORS = [
  {
    label: 'Ground',
    value: 'ground',
    children: [
      { value: 'front-hall', label: 'Front Hall' },
      { value: 'living-room', label: 'Living Room' },
      { value: 'dining-room', label: 'Dining Room' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'butlers-pantry', label: "Butler's Pantry" },
      { value: 'powder-room', label: 'Powder Room' },
    ],
  },
  {
    label: 'Second',
    value: 'second',
    children: [
      { value: 'landing', label: 'Landing' },
      { value: 'family-room', label: 'Family Room' },
      { value: 'main-bedroom', label: 'Main Bedroom' },
      { value: 'main-bath', label: 'Main Bath' },
      { value: 'graces-room', label: "Grace's Room" },
      { value: 'poppys-room', label: "Poppy's Room" },
      { value: 'bathroom-2', label: 'Bathroom 2' },
    ],
  },
  {
    label: 'Third',
    value: 'third',
    children: [
      { value: 'guest-bedroom', label: 'Guest Bedroom' },
      { value: 'guest-bathroom', label: 'Guest Bathroom' },
      { value: 'annas-office', label: "Anna's Office" },
      { value: 'andrews-office', label: "Andrew's Office" },
      { value: 'guest-living-room', label: 'Guest Living Room' },
      { value: 'guest-kitchen', label: 'Guest Kitchen' },
    ],
  },
  {
    label: 'Basement',
    value: 'basement',
    children: [],
  },
  {
    label: 'Exterior',
    value: 'exterior',
    children: [],
  },
];

const CATEGORIES = [
  { value: 'potential_purchase', label: 'Potential Purchase' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'owned', label: 'Owned' },
  { value: 'room_photo', label: 'Room' },
];

function RoomSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="flex-1 text-sm border border-fog rounded px-2 py-1 focus:ring-1 focus:ring-evergreen focus:outline-none bg-cloud"
    >
      <option value="">Select room...</option>
      {FLOORS.map((floor) => (
        floor.children.length > 0 ? (
          <optgroup key={floor.value} label={floor.label}>
            <option value={floor.value}>{floor.label} (all)</option>
            {floor.children.map((room) => (
              <option key={room.value} value={room.value}>{room.label}</option>
            ))}
          </optgroup>
        ) : (
          <option key={floor.value} value={floor.value}>{floor.label}</option>
        )
      ))}
    </select>
  );
}

function UploadZone({ onUploadComplete }) {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      room: '',
      category: 'potential_purchase',
      notes: '',
      status: 'pending',
      error: null,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const updateFile = (index, fields) => {
    setPendingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...fields } : f))
    );
  };

  const removeFile = (index) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadAll = async () => {
    setUploading(true);

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      if (pf.status === 'success') continue;

      updateFile(i, { status: 'uploading' });

      try {
        const uploadResult = await uploadImage(pf.file);

        await createItem({
          room: pf.room,
          category: pf.category,
          notes: pf.notes || null,
          image_url: uploadResult.image_url,
        });

        updateFile(i, { status: 'success' });
      } catch (err) {
        console.error('Upload error:', err);
        updateFile(i, { status: 'error', error: err.message || 'Upload failed' });
      }
    }

    setUploading(false);
    if (onUploadComplete) onUploadComplete();
  };

  const allComplete = pendingFiles.length > 0 && pendingFiles.every((f) => f.status === 'success');
  const hasValidFiles = pendingFiles.some(
    (f) => f.status === 'pending' || f.status === 'error'
  );

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragActive
            ? 'border-evergreen bg-mint bg-opacity-20'
            : 'border-fog hover:border-meadow hover:bg-sand'
        }`}
      >
        <input {...getInputProps()} />
        <svg className="w-16 h-16 mx-auto text-drift mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-drift text-lg">
          {isDragActive ? 'Drop images here...' : 'Drag images here'}
        </p>
        <p className="text-drift text-sm mt-2">Accepts JPG, PNG, WebP, and other image formats</p>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={open}
          className="px-4 py-2 bg-evergreen text-white rounded-lg font-medium hover:bg-evergreen-hover transition-colors"
        >
          Or browse files
        </button>
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {pendingFiles.length} {pendingFiles.length === 1 ? 'image' : 'images'} ready
            </h3>
            {allComplete && (
              <button
                onClick={() => setPendingFiles([])}
                className="text-sm text-drift hover:text-ink transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {pendingFiles.map((pf, index) => (
            <div
              key={index}
              className={`bg-cloud rounded-lg shadow-sm border p-4 ${
                pf.status === 'success'
                  ? 'border-meadow'
                  : pf.status === 'error'
                  ? 'border-cairn'
                  : 'border-fog'
              }`}
            >
              <div className="flex gap-4">
                {/* Preview */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-paper shrink-0">
                  <img
                    src={pf.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Metadata form */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <RoomSelect
                      value={pf.room}
                      onChange={(e) => updateFile(index, { room: e.target.value })}
                      disabled={pf.status === 'success' || pf.status === 'uploading'}
                    />
                    {pf.status !== 'success' && pf.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-drift hover:text-cairn transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={pf.category}
                      onChange={(e) => updateFile(index, { category: e.target.value })}
                      disabled={pf.status === 'success' || pf.status === 'uploading'}
                      className="flex-1 text-sm border border-fog rounded px-2 py-1 focus:ring-1 focus:ring-evergreen focus:outline-none bg-cloud"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={pf.notes}
                      onChange={(e) => updateFile(index, { notes: e.target.value })}
                      placeholder="Notes (optional)"
                      disabled={pf.status === 'success' || pf.status === 'uploading'}
                      className="flex-1 text-sm border border-fog rounded px-2 py-1 focus:ring-1 focus:ring-evergreen focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center shrink-0">
                  {pf.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-evergreen border-t-transparent rounded-full animate-spin" />
                  )}
                  {pf.status === 'success' && (
                    <svg className="w-5 h-5 text-evergreen" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {pf.status === 'error' && (
                    <svg className="w-5 h-5 text-cairn" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {pf.error && (
                <p className="text-xs text-cairn mt-2">{pf.error}</p>
              )}
            </div>
          ))}

          {/* Upload button */}
          {hasValidFiles && (
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                uploading
                  ? 'bg-fog text-drift cursor-not-allowed'
                  : 'bg-evergreen text-white hover:bg-evergreen-hover'
              }`}
            >
              {uploading ? 'Uploading...' : `Upload ${pendingFiles.filter((f) => f.status !== 'success').length} ${pendingFiles.filter((f) => f.status !== 'success').length === 1 ? 'image' : 'images'}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadZone;
