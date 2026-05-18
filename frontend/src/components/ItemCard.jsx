import { toggleStar } from '../services/api';

const CATEGORY_STYLES = {
  room_photo: 'bg-lake text-white',
  owned: 'bg-evergreen text-white',
  potential_purchase: 'bg-cairn text-white',
  inspiration: 'bg-yellow-500 text-white',
};

const CATEGORY_LABELS = {
  room_photo: 'Room',
  owned: 'Owned',
  potential_purchase: 'Potential',
  inspiration: 'Inspiration',
};

function formatRoomName(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function ItemCard({ item, onClick, onStarToggle }) {
  const handleStarClick = async (e) => {
    e.stopPropagation();
    try {
      const updated = await toggleStar(item.id);
      if (onStarToggle) onStarToggle(updated);
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const categoryClass = CATEGORY_STYLES[item.category] || 'bg-drift text-white';

  return (
    <div
      onClick={() => onClick(item)}
      className="relative bg-cloud rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="h-48 bg-paper relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title || formatRoomName(item.room)}
            className="w-full h-full object-cover"
            style={item.focal_point_x != null && item.focal_point_y != null
              ? { objectPosition: `${item.focal_point_x * 100}% ${item.focal_point_y * 100}%` }
              : undefined}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-drift">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Top-right badges: source link + star */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-cloud bg-opacity-80 hover:bg-opacity-100 text-ink rounded-full p-1.5 shadow-md transition-colors"
              title="View source"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
          <button
            onClick={handleStarClick}
            className="bg-cloud bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 shadow-md transition-colors"
          >
            {item.starred ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-drift" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Category badge — top left */}
        <span
          className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm ${categoryClass}`}
        >
          {CATEGORY_LABELS[item.category] || item.category}
        </span>

        {/* Price badge — bottom right of image */}
        {item.price != null && item.price > 0 && (
          <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm bg-cloud bg-opacity-90 text-ink">
            ${Number(item.price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Info — room name only */}
      <div className="py-2 px-3">
        <h3 className="font-semibold text-sm text-ink line-clamp-1">
          {formatRoomName(item.room)}
        </h3>
      </div>
    </div>
  );
}

export default ItemCard;
