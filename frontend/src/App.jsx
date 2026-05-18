import { useState, useEffect, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import { getItems, getQueuedItems } from './services/api';
import ItemCard from './components/ItemCard';
import ItemDetail from './components/ItemDetail';
import FilterBar, { MobileFilterSection } from './components/FilterBar';
import UploadZone from './components/UploadZone';
import Queue from './components/Queue';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [queuedItems, setQueuedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    const hash = window.location.hash.slice(1);
    return ['browse', 'upload', 'queue'].includes(hash) ? hash : 'browse';
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters
  const [selectedRooms, setSelectedRooms] = useState(['all']);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [colorFilter, setColorFilter] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState('room');

  // Update URL hash when view mode changes
  useEffect(() => {
    window.location.hash = viewMode;
  }, [viewMode]);

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (['browse', 'upload', 'queue'].includes(hash)) {
        setViewMode(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, queueData] = await Promise.all([
        getItems({ sort: sortBy, order: sortBy === 'room' ? 'ASC' : 'DESC' }),
        getQueuedItems().catch(() => []),
      ]);
      setItems(itemsData);
      setQueuedItems(queueData);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when sort changes
  useEffect(() => {
    if (!loading) loadData();
  }, [sortBy]);

  const toggleRoom = (room) => {
    if (room === 'all') {
      setSelectedRooms(['all']);
    } else {
      setSelectedRooms((prev) => {
        const withoutAll = prev.filter((r) => r !== 'all');
        if (withoutAll.includes(room)) {
          const updated = withoutAll.filter((r) => r !== room);
          return updated.length === 0 ? ['all'] : updated;
        }
        return [...withoutAll, room];
      });
    }
  };

  const toggleCategory = (category) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories((prev) => {
        const withoutAll = prev.filter((c) => c !== 'all');
        if (withoutAll.includes(category)) {
          const updated = withoutAll.filter((c) => c !== category);
          return updated.length === 0 ? ['all'] : updated;
        }
        return [...withoutAll, category];
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Room filter
      const roomMatch = selectedRooms.includes('all') || selectedRooms.includes(item.room);

      // Category filter
      const categoryMatch = selectedCategories.includes('all') || selectedCategories.includes(item.category);

      // Color filter
      const colorMatch = !colorFilter || (item.color && item.color.toLowerCase().includes(colorFilter.toLowerCase()));

      // Starred filter
      const starMatch = !starredOnly || item.starred;

      return roomMatch && categoryMatch && colorMatch && starMatch;
    });
  }, [items, selectedRooms, selectedCategories, colorFilter, starredOnly]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    loadData();
  };

  const handleStarToggle = (updatedItem) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? { ...item, starred: updatedItem.starred } : item
      )
    );
  };

  const filterProps = {
    selectedRooms,
    onToggleRoom: toggleRoom,
    selectedCategories,
    onToggleCategory: toggleCategory,
    colorFilter,
    onColorFilterChange: setColorFilter,
    starredOnly,
    onStarredOnlyChange: setStarredOnly,
    sortBy,
    onSortChange: setSortBy,
  };

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:pt-6">
          <div className="flex justify-between items-center">
            <h1
              onClick={() => setViewMode('browse')}
              className="text-2xl font-bold text-ink cursor-pointer hover:text-evergreen transition-colors"
            >
              Furnish
            </h1>

            {/* Mobile: Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink hover:bg-sand rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop: View Toggle */}
            <div className="hidden md:flex gap-2 items-center">
              <button
                onClick={() => setViewMode('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'browse'
                    ? 'bg-evergreen text-white'
                    : 'bg-paper text-drift hover:bg-sand'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setViewMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'upload'
                    ? 'bg-evergreen text-white'
                    : 'bg-paper text-drift hover:bg-sand'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setViewMode('queue')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'queue'
                    ? 'bg-evergreen text-white'
                    : 'bg-paper text-drift hover:bg-sand'
                }`}
              >
                Queue
                {queuedItems.length > 0 && (
                  <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center leading-none ${
                    viewMode === 'queue'
                      ? 'bg-white text-evergreen'
                      : 'bg-evergreen text-white'
                  }`}>
                    {queuedItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop: Filter bar (browse view only) */}
          {viewMode === 'browse' && (
            <div className="hidden md:block mt-4">
              <FilterBar {...filterProps} />
            </div>
          )}

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 pt-4 space-y-4">
              <div className="space-y-2">
                <button
                  onClick={() => { setViewMode('browse'); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'browse' ? 'bg-evergreen text-white' : 'bg-sand text-drift'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => { setViewMode('upload'); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'upload' ? 'bg-evergreen text-white' : 'bg-sand text-drift'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => { setViewMode('queue'); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    viewMode === 'queue' ? 'bg-evergreen text-white' : 'bg-sand text-drift'
                  }`}
                >
                  Queue
                  {queuedItems.length > 0 && (
                    <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center leading-none ${
                      viewMode === 'queue' ? 'bg-white text-evergreen' : 'bg-evergreen text-white'
                    }`}>
                      {queuedItems.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile filters (browse view only) */}
              {viewMode === 'browse' && (
                <MobileFilterSection {...filterProps} />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-drift">Loading items...</div>
          </div>
        )}

        {error && (
          <div className="bg-peach border border-cairn text-cairn px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Browse View */}
        {!loading && !error && viewMode === 'browse' && (
          <>
            {filteredItems.length > 0 ? (
              <Masonry
                breakpointCols={{ default: 4, 1024: 3, 768: 2 }}
                className="masonry-grid"
                columnClassName="masonry-grid-column"
              >
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                    onStarToggle={handleStarToggle}
                  />
                ))}
              </Masonry>
            ) : items.length > 0 ? (
              <div className="text-center py-12">
                <div className="text-drift text-lg">No items match the current filters</div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-drift text-lg">No items saved yet</div>
                <div className="text-drift text-sm mt-2">
                  Upload images or use the iOS shortcut to start adding furnishing inspiration
                </div>
              </div>
            )}
          </>
        )}

        {/* Upload View */}
        {!loading && !error && viewMode === 'upload' && (
          <UploadZone onUploadComplete={loadData} />
        )}

        {/* Queue View */}
        {!loading && !error && viewMode === 'queue' && (
          <Queue items={queuedItems} onUpdate={loadData} />
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

export default App;
