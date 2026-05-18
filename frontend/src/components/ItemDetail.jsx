import { useState, useEffect } from 'react';
import { getItem, updateItem, deleteItem, toggleStar } from '../services/api';

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
];

const CATEGORIES = [
  { value: 'potential_purchase', label: 'Potential Purchase' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'owned', label: 'Owned' },
  { value: 'room_photo', label: 'Room' },
];

function formatRoomName(slug) {
  if (!slug) return '';
  // Check floors and children for a proper label
  for (const floor of FLOORS) {
    if (floor.value === slug) return floor.label;
    for (const child of floor.children) {
      if (child.value === slug) return child.label;
    }
  }
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function EditRow({ label, field, type = 'text', hint, editFields, setEditFields, item, saving, saveError, onKeyDown }) {
  const isDirty = String(editFields[field] ?? '') !== String(item[field] ?? '');
  return (
    <div className="flex items-center gap-3 py-2 border-b border-fog last:border-0">
      <span className="text-xs text-drift w-24 shrink-0">{label}</span>
      {type === 'textarea' ? (
        <textarea
          value={editFields[field] ?? ''}
          onChange={(e) => setEditFields((prev) => ({ ...prev, [field]: e.target.value }))}
          onKeyDown={(e) => onKeyDown(e, field)}
          rows={3}
          className={`flex-1 text-sm bg-transparent border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-evergreen transition-colors resize-none ${
            saveError === field ? 'border-cairn' : isDirty ? 'border-meadow' : 'border-fog'
          }`}
          placeholder={hint || label}
        />
      ) : (
        <input
          type={type}
          value={editFields[field] ?? ''}
          onChange={(e) => setEditFields((prev) => ({ ...prev, [field]: e.target.value }))}
          onKeyDown={(e) => onKeyDown(e, field)}
          className={`flex-1 text-sm bg-transparent border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-evergreen transition-colors ${
            saveError === field ? 'border-cairn' : isDirty ? 'border-meadow' : 'border-fog'
          }`}
          placeholder={hint || label}
        />
      )}
      {saving === field && <span className="text-xs text-drift shrink-0">saving...</span>}
      {saveError === field && <span className="text-xs text-cairn shrink-0">error</span>}
    </div>
  );
}

function RoomSelectRow({ editFields, setEditFields, item, saving, saveError }) {
  const isDirty = (editFields.room ?? '') !== (item.room ?? '');
  return (
    <div className="flex items-center gap-3 py-2 border-b border-fog">
      <span className="text-xs text-drift w-24 shrink-0">Room</span>
      <select
        value={editFields.room ?? ''}
        onChange={(e) => setEditFields((prev) => ({ ...prev, room: e.target.value }))}
        className={`flex-1 text-sm bg-cloud border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-evergreen transition-colors ${
          saveError === 'room' ? 'border-cairn' : isDirty ? 'border-meadow' : 'border-fog'
        }`}
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
      {saving === 'room' && <span className="text-xs text-drift shrink-0">saving...</span>}
    </div>
  );
}

function CategorySelectRow({ editFields, setEditFields, item, saving, saveError }) {
  const isDirty = (editFields.category ?? '') !== (item.category ?? '');
  return (
    <div className="flex items-center gap-3 py-2 border-b border-fog">
      <span className="text-xs text-drift w-24 shrink-0">Category</span>
      <select
        value={editFields.category ?? ''}
        onChange={(e) => setEditFields((prev) => ({ ...prev, category: e.target.value }))}
        className={`flex-1 text-sm bg-cloud border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-evergreen transition-colors ${
          saveError === 'category' ? 'border-cairn' : isDirty ? 'border-meadow' : 'border-fog'
        }`}
      >
        <option value="">Select category...</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      {saving === 'category' && <span className="text-xs text-drift shrink-0">saving...</span>}
    </div>
  );
}

function ItemDetail({ item: initialItem, onClose, onUpdate }) {
  const [item, setItem] = useState(initialItem);
  const [loading, setLoading] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadFullItem();
  }, [initialItem.id]);

  const loadFullItem = async () => {
    try {
      setLoading(true);
      const data = await getItem(initialItem.id);
      setItem(data);
      setEditFields({
        title: data.title || '',
        room: data.room || '',
        category: data.category || '',
        notes: data.notes || '',
        source_url: data.source_url || '',
        price: data.price != null ? String(data.price) : '',
      });
    } catch (error) {
      console.error('Error loading item details:', error);
    } finally {
      setLoading(false);
    }
  };

  // When category changes to room_photo, auto-set title to room name
  useEffect(() => {
    if (editFields.category === 'room_photo' && editFields.room) {
      setEditFields((prev) => ({ ...prev, title: formatRoomName(prev.room) }));
    }
  }, [editFields.category, editFields.room]);

  const handleStarToggle = async () => {
    try {
      const updated = await toggleStar(item.id);
      setItem((prev) => ({ ...prev, starred: updated.starred }));
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteItem(item.id);
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSavingAll(true);
      setSaveError(null);
      setSaveSuccess(false);
      const fieldsToSave = {
        ...editFields,
        price: editFields.price !== '' ? Number(editFields.price) : null,
      };
      const updated = await updateItem(item.id, fieldsToSave);
      setItem({ ...item, ...updated });
      setEditFields({
        title: updated.title || '',
        room: updated.room || '',
        category: updated.category || '',
        notes: updated.notes || '',
        source_url: updated.source_url || '',
        price: updated.price != null ? String(updated.price) : '',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving fields:', error);
      setSaveError('all');
    } finally {
      setSavingAll(false);
    }
  };

  const isDirty = Object.keys(editFields).some(
    (field) => String(editFields[field] ?? '') !== String(item[field] ?? '')
  );

  const handleKeyDown = (e, field) => {
    if (e.key === 'Escape') setEditFields((prev) => ({ ...prev, [field]: item[field] || '' }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Display title: if room_photo, use room name
  const displayTitle = item.category === 'room_photo' && item.room
    ? formatRoomName(item.room)
    : (item.title || 'Untitled');

  const rowProps = { editFields, setEditFields, item, saving, saveError, onKeyDown: handleKeyDown };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start md:items-center justify-center md:p-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-cloud md:rounded-lg shadow-xl max-w-3xl w-full h-screen md:h-auto md:max-h-[calc(100vh-48px)] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-drift">Loading...</div>
        ) : (
          <div className="relative">
            {/* Image */}
            {item.image_url ? (
              <div className="relative rounded-t-lg overflow-hidden">
                <img
                  src={item.image_url}
                  alt={displayTitle}
                  className="w-full h-64 md:h-96 object-cover"
                  style={item.focal_point_x != null && item.focal_point_y != null
                    ? { objectPosition: `${item.focal_point_x * 100}% ${item.focal_point_y * 100}%` }
                    : undefined}
                />

                {/* Price badge — bottom right of image */}
                {item.price != null && item.price > 0 && (
                  <span className="absolute bottom-4 right-4 text-sm font-semibold px-3 py-1 rounded-full shadow-sm bg-cloud bg-opacity-90 text-ink">
                    ${Number(item.price).toLocaleString()}
                  </span>
                )}

                {/* Top-right badges: source link + close */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-cloud hover:bg-sand text-ink rounded-full p-2 shadow-lg transition-colors"
                      title="View source"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="bg-cloud hover:bg-sand text-ink rounded-full p-2 shadow-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cloud hover:bg-sand text-ink rounded-full p-2 shadow-lg transition-colors"
                    title="View source"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="bg-cloud hover:bg-sand text-ink rounded-full p-2 shadow-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-ink">{displayTitle}</h3>
                  <button
                    onClick={handleStarToggle}
                    className="p-1 hover:bg-sand rounded-full transition-colors"
                  >
                    {item.starred ? (
                      <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-drift" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-sm text-drift mt-1">{formatRoomName(item.room)}</p>
                {item.notes && (
                  <p className="text-sm text-drift mt-2 whitespace-pre-wrap">{item.notes}</p>
                )}
              </div>

              {/* Editable Fields */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-drift uppercase tracking-wide mb-2">Edit Fields</div>
                <div className="bg-paper rounded-lg px-3">
                  <EditRow label="Title" field="title" hint="Item name" {...rowProps} />
                  <RoomSelectRow {...rowProps} />
                  <CategorySelectRow {...rowProps} />
                  <EditRow label="Price" field="price" type="number" hint="0.00" {...rowProps} />
                  <EditRow label="Notes" field="notes" type="textarea" hint="Additional notes..." {...rowProps} />
                  <EditRow label="Source URL" field="source_url" hint="https://..." {...rowProps} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    confirmDelete
                      ? 'bg-cairn text-white hover:bg-cairn-hover'
                      : 'text-cairn hover:text-cairn-hover hover:bg-cairn hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {confirmDelete ? 'Confirm Delete' : 'Delete Item'}
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && <span className="text-sm text-evergreen">Saved!</span>}
                  {saveError === 'all' && <span className="text-sm text-cairn">Save failed</span>}
                  <button
                    onClick={handleSaveAll}
                    disabled={!isDirty || savingAll}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDirty && !savingAll
                        ? 'bg-evergreen text-white hover:bg-evergreen-hover'
                        : 'bg-fog text-drift cursor-not-allowed'
                    }`}
                  >
                    {savingAll ? 'Saving...' : 'Save Edits'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
