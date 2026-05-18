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

// Get all room values (floors + children) for filtering logic
function getAllRoomValues() {
  const values = [];
  FLOORS.forEach((floor) => {
    values.push(floor.value);
    floor.children.forEach((child) => values.push(child.value));
  });
  return values;
}

// Get all children of a floor
function getFloorChildren(floorValue) {
  const floor = FLOORS.find((f) => f.value === floorValue);
  return floor ? floor.children.map((c) => c.value) : [];
}

function RoomDropdown({ selected, onToggle }) {
  // When a floor is toggled, toggle all its children too
  const handleFloorToggle = (floorValue) => {
    const children = getFloorChildren(floorValue);
    const allSelected = [floorValue, ...children].every((v) => selected.includes(v));

    if (allSelected) {
      // Deselect floor and all children
      [floorValue, ...children].forEach((v) => {
        if (selected.includes(v)) onToggle(v);
      });
    } else {
      // Select floor and all children
      [floorValue, ...children].forEach((v) => {
        if (!selected.includes(v)) onToggle(v);
      });
    }
  };

  const activeCount = selected.filter((s) => s !== 'all').length;

  return (
    <div className="relative group">
      <button className="px-3 py-2 rounded-lg font-medium text-sm bg-paper text-drift hover:bg-sand transition-colors flex items-center gap-1 border border-fog">
        Rooms
        {activeCount > 0 && (
          <span className="bg-evergreen text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none ml-1">
            {activeCount}
          </span>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 mt-1 w-64 bg-cloud rounded-lg shadow-lg border border-fog p-3 space-y-1 z-50 hidden group-hover:block max-h-80 overflow-y-auto">
        {/* All option */}
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={selected.includes('all') || selected.length === 0}
            onChange={() => onToggle('all')}
            className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
          />
          <span className="text-sm font-medium">All</span>
        </label>

        <div className="border-t border-fog my-1" />

        {FLOORS.map((floor) => {
          const children = floor.children;
          const floorAndChildrenSelected = [floor.value, ...children.map((c) => c.value)].every((v) => selected.includes(v));

          return (
            <div key={floor.value}>
              {/* Floor header */}
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={children.length > 0 ? floorAndChildrenSelected : selected.includes(floor.value)}
                  onChange={() => children.length > 0 ? handleFloorToggle(floor.value) : onToggle(floor.value)}
                  className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
                />
                <span className="text-sm font-medium">{floor.label}</span>
              </label>
              {/* Children */}
              {children.map((room) => (
                <label key={room.value} className="flex items-center gap-2 cursor-pointer py-1 pl-6">
                  <input
                    type="checkbox"
                    checked={selected.includes(room.value)}
                    onChange={() => onToggle(room.value)}
                    className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
                  />
                  <span className="text-sm">{room.label}</span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryDropdown({ selected, onToggle }) {
  const activeCount = selected.filter((s) => s !== 'all').length;

  return (
    <div className="relative group">
      <button className="px-3 py-2 rounded-lg font-medium text-sm bg-paper text-drift hover:bg-sand transition-colors flex items-center gap-1 border border-fog">
        Category
        {activeCount > 0 && (
          <span className="bg-evergreen text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none ml-1">
            {activeCount}
          </span>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 mt-1 w-56 bg-cloud rounded-lg shadow-lg border border-fog p-3 space-y-1 z-50 hidden group-hover:block">
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={selected.includes('all') || selected.length === 0}
            onChange={() => onToggle('all')}
            className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
          />
          <span className="text-sm font-medium">All</span>
        </label>
        {CATEGORIES.map((cat) => (
          <label key={cat.value} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={selected.includes(cat.value)}
              onChange={() => onToggle(cat.value)}
              className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
            />
            <span className="text-sm">{cat.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterBar({
  selectedRooms,
  onToggleRoom,
  selectedCategories,
  onToggleCategory,
  colorFilter,
  onColorFilterChange,
  starredOnly,
  onStarredOnlyChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RoomDropdown selected={selectedRooms} onToggle={onToggleRoom} />
      <CategoryDropdown selected={selectedCategories} onToggle={onToggleCategory} />

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-3 py-2 text-sm border border-fog rounded-lg focus:ring-2 focus:ring-evergreen focus:border-evergreen bg-paper"
      >
        <option value="room">Sort by: Room</option>
        <option value="created_at">Sort by: Date Added</option>
        <option value="title">Sort by: Title</option>
      </select>

      {/* Starred only */}
      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-fog bg-paper text-sm">
        <input
          type="checkbox"
          checked={starredOnly}
          onChange={(e) => onStarredOnlyChange(e.target.checked)}
          className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
        />
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>Only</span>
      </label>
    </div>
  );
}

export function MobileFilterSection({
  selectedRooms,
  onToggleRoom,
  selectedCategories,
  onToggleCategory,
  colorFilter,
  onColorFilterChange,
  starredOnly,
  onStarredOnlyChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="space-y-4 pt-4">
      <div className="text-sm font-medium text-ink">Filters</div>

      {/* Rooms */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-drift uppercase tracking-wide">Rooms</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedRooms.includes('all') || selectedRooms.length === 0}
            onChange={() => onToggleRoom('all')}
            className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
          />
          <span className="text-sm font-medium">All</span>
        </label>
        {FLOORS.map((floor) => (
          <div key={floor.value}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRooms.includes(floor.value)}
                onChange={() => onToggleRoom(floor.value)}
                className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
              />
              <span className="text-sm font-medium">{floor.label}</span>
            </label>
            {floor.children.map((room) => (
              <label key={room.value} className="flex items-center gap-2 cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room.value)}
                  onChange={() => onToggleRoom(room.value)}
                  className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
                />
                <span className="text-sm">{room.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-drift uppercase tracking-wide">Category</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedCategories.includes('all') || selectedCategories.length === 0}
            onChange={() => onToggleCategory('all')}
            className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
          />
          <span className="text-sm font-medium">All</span>
        </label>
        {CATEGORIES.map((cat) => (
          <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.value)}
              onChange={() => onToggleCategory(cat.value)}
              className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
            />
            <span className="text-sm">{cat.label}</span>
          </label>
        ))}
      </div>

      {/* Starred */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={starredOnly}
          onChange={(e) => onStarredOnlyChange(e.target.checked)}
          className="w-4 h-4 text-evergreen rounded focus:ring-2 focus:ring-evergreen"
        />
        <span className="text-sm">Starred only</span>
      </label>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-drift uppercase tracking-wide block mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full pl-3 pr-10 py-2 border border-fog rounded-lg focus:ring-2 focus:ring-evergreen focus:border-evergreen"
        >
          <option value="created_at">Date Added</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
