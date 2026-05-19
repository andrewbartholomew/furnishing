import { useState } from 'react';
import { deleteItem, promoteQueueItem } from '../services/api';

const ROOMS = [
  'front-hall', 'powder-room', 'kitchen', 'living-room', 'dining-room',
  'butlers-pantry', 'main-bedroom', 'main-bathroom', 'family-room',
  'second-landing', 'graces-room', 'poppys-room', 'annas-office',
  'guest-bedroom', 'andrews-office', 'guest-living-room', 'guest-kitchen', 'basement',
];

const CATEGORIES = [
  { value: 'room_photo', label: 'Room Photo' },
  { value: 'owned', label: 'Owned' },
  { value: 'potential_purchase', label: 'Potential Purchase' },
  { value: 'planned_purchase', label: 'Planned Purchase' },
  { value: 'inspiration', label: 'Inspiration' },
];

function formatRoomName(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PromoteForm({ item, onPromote, onCancel }) {
  const [fields, setFields] = useState({
    title: item.title || '',
    room: '',
    category: 'inspiration',
    color: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.room) {
      setError('Please select a room');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onPromote(item.id, fields);
    } catch (err) {
      setError(err.message || 'Failed to promote item');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-fog space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-drift block mb-1">Title</label>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => setFields({ ...fields, title: e.target.value })}
            placeholder="Item title"
            className="w-full text-sm border border-fog rounded px-2 py-1.5 focus:ring-1 focus:ring-evergreen focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-drift block mb-1">Room *</label>
          <select
            value={fields.room}
            onChange={(e) => setFields({ ...fields, room: e.target.value })}
            className="w-full text-sm border border-fog rounded px-2 py-1.5 focus:ring-1 focus:ring-evergreen focus:outline-none bg-cloud"
          >
            <option value="">Select room...</option>
            {ROOMS.map((r) => (
              <option key={r} value={r}>{formatRoomName(r)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-drift block mb-1">Category</label>
          <select
            value={fields.category}
            onChange={(e) => setFields({ ...fields, category: e.target.value })}
            className="w-full text-sm border border-fog rounded px-2 py-1.5 focus:ring-1 focus:ring-evergreen focus:outline-none bg-cloud"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-drift block mb-1">Color</label>
          <input
            type="text"
            value={fields.color}
            onChange={(e) => setFields({ ...fields, color: e.target.value })}
            placeholder="Optional"
            className="w-full text-sm border border-fog rounded px-2 py-1.5 focus:ring-1 focus:ring-evergreen focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-drift block mb-1">Notes</label>
        <textarea
          value={fields.notes}
          onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          placeholder="Optional notes..."
          rows={2}
          className="w-full text-sm border border-fog rounded px-2 py-1.5 focus:ring-1 focus:ring-evergreen focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-xs text-cairn">{error}</p>}

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-drift hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            saving
              ? 'bg-fog text-drift cursor-not-allowed'
              : 'bg-evergreen text-white hover:bg-evergreen-hover'
          }`}
        >
          {saving ? 'Saving...' : 'Promote'}
        </button>
      </div>
    </form>
  );
}

function Queue({ items, onUpdate }) {
  const [promotingId, setPromotingId] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteItem(id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to delete queued item:', err);
    }
  };

  const handlePromote = async (id, data) => {
    await promoteQueueItem(id, data);
    setPromotingId(null);
    if (onUpdate) onUpdate();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          className="w-24 h-24 text-fog mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="text-xl font-semibold text-drift mb-2">Queue is Empty</h3>
        <p className="text-drift text-center max-w-md">
          Items saved from the iOS shortcut will appear here. Promote them by assigning a room and category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-cloud rounded-lg shadow-sm border border-fog p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              {item.image_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-paper shrink-0">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Queued item'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Queued
                  </span>
                  <span className="text-xs text-drift">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                {item.title && (
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                )}
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-trail hover:text-trail-hover hover:underline break-all"
                  >
                    {item.source_url}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setPromotingId(promotingId === item.id ? null : item.id)}
                  className="px-3 py-1.5 text-sm font-medium text-evergreen hover:bg-mint hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  {promotingId === item.id ? 'Close' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-drift hover:text-cairn hover:bg-cairn hover:bg-opacity-10 rounded transition-colors"
                  title="Delete from queue"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Promote form */}
            {promotingId === item.id && (
              <PromoteForm
                item={item}
                onPromote={handlePromote}
                onCancel={() => setPromotingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Queue;
