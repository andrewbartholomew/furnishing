import { useState, useEffect } from 'react';
import { analyzeRoom, getRoomAnalysis, createDesignProject, updateElementStatus, uploadImage, getItems } from '../services/api';

const ROOMS = [
  { value: 'front-hall', label: 'Front Hall' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'dining-room', label: 'Dining Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'butlers-pantry', label: "Butler's Pantry" },
  { value: 'powder-room', label: 'Powder Room' },
  { value: 'landing', label: 'Landing' },
  { value: 'family-room', label: 'Family Room' },
  { value: 'main-bedroom', label: 'Main Bedroom' },
  { value: 'main-bath', label: 'Main Bath' },
  { value: 'graces-room', label: "Grace's Room" },
  { value: 'poppys-room', label: "Poppy's Room" },
  { value: 'guest-bedroom', label: 'Guest Bedroom' },
  { value: 'guest-bathroom', label: 'Guest Bathroom' },
  { value: 'annas-office', label: "Anna's Office" },
  { value: 'andrews-office', label: "Andrew's Office" },
  { value: 'guest-living-room', label: 'Guest Living Room' },
  { value: 'guest-kitchen', label: 'Guest Kitchen' },
  { value: 'basement', label: 'Basement' },
  { value: 'exterior', label: 'Exterior' },
];

function PaletteDisplay({ palette }) {
  if (!palette || palette.length === 0) return null;
  const colors = typeof palette === 'string' ? JSON.parse(palette) : palette;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-2 bg-cloud rounded-lg px-3 py-1.5 border border-fog">
          <div
            className="w-5 h-5 rounded-full border border-fog shrink-0"
            style={{ backgroundColor: c.hex }}
          />
          <div>
            <span className="text-xs font-medium text-ink">{c.name}</span>
            <span className="text-xs text-drift ml-1.5">{c.role}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ElementList({ elements, onStatusChange, interactive }) {
  if (!elements || elements.length === 0) return null;

  const architectural = elements.filter((e) => e.type === 'architectural');
  const furnishing = elements.filter((e) => e.type === 'furnishing');

  const statusColors = {
    fixed: 'bg-blue-50 text-blue-700 border-blue-200',
    keep: 'bg-green-50 text-green-700 border-green-200',
    discard: 'bg-red-50 text-red-400 border-red-200 line-through',
  };

  const renderElement = (el) => (
    <div
      key={el.id || el.name}
      className={`flex items-start gap-2 text-sm py-1.5 px-2 rounded ${
        el.status === 'discard' ? 'opacity-50' : ''
      }`}
    >
      <div
        className="w-3 h-3 rounded-full border border-fog shrink-0 mt-1"
        style={{ backgroundColor: el.color_hex || '#ccc' }}
      />
      <div className="flex-1 min-w-0">
        <span className={`font-medium ${el.status === 'discard' ? 'text-drift line-through' : 'text-ink'}`}>
          {el.name}
        </span>
        <span className="text-drift ml-1.5 text-xs">{el.ai_description}</span>
      </div>
      {interactive && el.type === 'furnishing' && (
        <div className="shrink-0">
          <button
            onClick={() => onStatusChange(el.id, el.status === 'keep' ? 'discard' : 'keep')}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ backgroundColor: el.status === 'keep' ? '#4F7F72' : '#d4cfc5' }}
            aria-label={el.status === 'keep' ? 'Keeping — click to remove' : 'Removing — click to keep'}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ left: el.status === 'keep' ? '18px' : '2px' }}
            />
          </button>
        </div>
      )}
      {interactive && el.type === 'architectural' && (
        <span className="text-xs text-blue-500 px-2 py-0.5 shrink-0">Fixed</span>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {architectural.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-drift uppercase tracking-wide mb-1.5">Architectural</h4>
          <div className="space-y-0.5">{architectural.map(renderElement)}</div>
        </div>
      )}
      {furnishing.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-drift uppercase tracking-wide mb-1.5">Existing Furnishings</h4>
          <div className="space-y-0.5">{furnishing.map(renderElement)}</div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec, matchedItems }) {
  const avoid = typeof rec.avoid === 'string' ? JSON.parse(rec.avoid) : rec.avoid;

  return (
    <div className="bg-cloud rounded-lg border border-fog p-4">
      <h4 className="font-semibold text-ink text-base capitalize mb-3">{rec.role}</h4>

      {/* Matched items from library — visual first */}
      {matchedItems && matchedItems.length > 0 && (
        <div className="mb-3 pb-3 border-b border-fog">
          <p className="text-xs font-medium text-evergreen mb-2">From your collection</p>
          <div className="flex gap-2 overflow-x-auto">
            {matchedItems.map((item) => (
              <div key={item.id} className="shrink-0">
                <img
                  src={item.image_url}
                  alt={item.title || 'Item'}
                  className="h-28 w-36 rounded-lg object-cover border border-fog"
                />
                <p className="text-xs text-drift mt-1 truncate w-36">{item.title}</p>
                {item.price && (
                  <p className="text-xs font-medium text-ink">${Number(item.price).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-evergreen">Color: </span>
          <span className="text-ink">{rec.color_direction}</span>
        </div>
        <div>
          <span className="font-medium text-evergreen">Material: </span>
          <span className="text-ink">{rec.material_direction}</span>
        </div>
        <div>
          <span className="font-medium text-evergreen">Style: </span>
          <span className="text-ink">{rec.style_direction}</span>
        </div>
        {avoid && avoid.length > 0 && (
          <div>
            <span className="font-medium text-cairn">Avoid: </span>
            <span className="text-ink">{avoid.join(', ')}</span>
          </div>
        )}
        <p className="text-drift text-xs mt-2 pt-2 border-t border-fog">{rec.reasoning}</p>
      </div>
    </div>
  );
}

function DesignAdvisor() {
  const [step, setStep] = useState('select'); // select | uploading | analysis | context | generating | results
  const [selectedRoom, setSelectedRoom] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [libraryPhotos, setLibraryPhotos] = useState([]);
  const [selectedLibraryPhotos, setSelectedLibraryPhotos] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [elements, setElements] = useState([]);
  const [palette, setPalette] = useState([]);
  const [userContext, setUserContext] = useState('');
  const [project, setProject] = useState(null);
  const [libraryMatches, setLibraryMatches] = useState([]);
  const [error, setError] = useState(null);
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedAnchors, setSelectedAnchors] = useState([]);

  // Check for existing analysis and library photos when room is selected
  useEffect(() => {
    if (!selectedRoom) return;

    // Check for cached analysis
    getRoomAnalysis(selectedRoom)
      .then((data) => {
        setAnalysis(data.analysis);
        setElements(data.elements);
        const raw = JSON.parse(data.analysis.raw_llm_analysis);
        setPalette(raw.palette || []);
        setStep('analysis');
      })
      .catch(() => {});

    // Fetch room photos from library
    getItems({ room: selectedRoom, category: 'room_photo' })
      .then((items) => {
        setLibraryPhotos(items.filter((i) => i.image_url));
      })
      .catch(() => setLibraryPhotos([]));

    // Fetch all non-room-photo items for this room (potential anchors)
    getItems({ room: selectedRoom })
      .then((items) => {
        setLibraryItems(items.filter((i) => i.category !== 'room_photo' && i.image_url));
      })
      .catch(() => setLibraryItems([]));
  }, [selectedRoom]);

  const toggleLibraryPhoto = (item) => {
    setSelectedLibraryPhotos((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      return [...prev, item];
    });
  };

  const handleElementStatusChange = async (elementId, newStatus) => {
    try {
      await updateElementStatus(elementId, newStatus);
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, status: newStatus } : el))
      );
    } catch (err) {
      console.error('Failed to update element status:', err);
    }
  };

  const toggleAnchor = (item) => {
    setSelectedAnchors((prev) => {
      const exists = prev.find((a) => a.id === item.id);
      if (exists) return prev.filter((a) => a.id !== item.id);
      return [...prev, item];
    });
  };

  const handleAnalyzeFromLibrary = async () => {
    if (selectedLibraryPhotos.length === 0) return;
    setError(null);
    setStep('uploading');

    try {
      const urls = selectedLibraryPhotos.map((p) => p.image_url);
      const data = await analyzeRoom(selectedRoom, urls);
      setAnalysis(data.analysis);
      setElements(data.elements);
      setPalette(data.palette || []);
      setStep('analysis');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
      setStep('select');
    }
  };

  const handlePhotoUpload = async (files) => {
    setError(null);
    setStep('uploading');

    try {
      // Upload each photo to R2 first
      const urls = [];
      for (const file of files) {
        const result = await uploadImage(file);
        urls.push(result.image_url);
      }
      setPhotoUrls(urls);

      // Now analyze with vision model
      const data = await analyzeRoom(selectedRoom, urls);
      setAnalysis(data.analysis);
      setElements(data.elements);
      setPalette(data.palette || []);
      setStep('analysis');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
      setStep('select');
    }
  };

  const handleGenerate = async () => {
    if (!userContext.trim() && selectedAnchors.length === 0) {
      setError('Please describe your design intentions or select anchor pieces');
      return;
    }

    setError(null);
    setStep('generating');

    try {
      const data = await createDesignProject(
        analysis.id,
        `${ROOMS.find((r) => r.value === selectedRoom)?.label || selectedRoom} design`,
        userContext,
        selectedAnchors.length > 0 ? selectedAnchors : undefined
      );
      setProject(data.project);
      setLibraryMatches(data.library_matches || []);
      setStep('results');
    } catch (err) {
      console.error('Recommendation failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate recommendations');
      setStep('analysis');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedRoom('');
    setPhotos([]);
    setPhotoUrls([]);
    setLibraryPhotos([]);
    setSelectedLibraryPhotos([]);
    setLibraryItems([]);
    setSelectedAnchors([]);
    setAnalysis(null);
    setElements([]);
    setPalette([]);
    setUserContext('');
    setProject(null);
    setLibraryMatches([]);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink">Design Advisor</h2>
        <p className="text-sm text-drift mt-1">
          Upload room photos, describe your vision, get personalized recommendations.
        </p>
      </div>

      {error && (
        <div className="bg-peach border border-cairn text-cairn px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select room + upload photos */}
      {(step === 'select' || step === 'uploading') && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink block mb-1.5">Room</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full text-sm border border-fog rounded-lg px-3 py-2 focus:ring-1 focus:ring-evergreen focus:outline-none bg-cloud"
            >
              <option value="">Select a room...</option>
              {ROOMS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {selectedRoom && (
            <div className="space-y-4">
              {/* Library photos */}
              {libraryPhotos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-ink block mb-1.5">Photos from your library</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {libraryPhotos.map((item) => {
                      const selected = selectedLibraryPhotos.find((p) => p.id === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => step !== 'uploading' && toggleLibraryPhoto(item)}
                          className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selected
                              ? 'border-evergreen ring-2 ring-evergreen ring-opacity-30'
                              : 'border-fog hover:border-drift'
                          }`}
                        >
                          <img
                            src={item.image_url}
                            alt={item.title || 'Room photo'}
                            className="w-full h-20 object-cover"
                          />
                          {selected && (
                            <div className="absolute top-1 right-1 bg-evergreen text-white rounded-full w-5 h-5 flex items-center justify-center">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedLibraryPhotos.length > 0 && (
                    <button
                      onClick={handleAnalyzeFromLibrary}
                      disabled={step === 'uploading'}
                      className={`mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        step === 'uploading'
                          ? 'bg-fog text-drift cursor-not-allowed'
                          : 'bg-evergreen text-white hover:bg-evergreen-hover'
                      }`}
                    >
                      {step === 'uploading'
                        ? 'Analyzing room photos... (15-30 seconds)'
                        : `Analyze ${selectedLibraryPhotos.length} photo${selectedLibraryPhotos.length > 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>
              )}

              {/* Upload new photos */}
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">
                  {libraryPhotos.length > 0 ? 'Or upload new photos' : 'Room Photos'}
                </label>
                <div
                  className="border-2 border-dashed border-fog rounded-lg p-6 text-center hover:border-evergreen transition-colors cursor-pointer"
                  onClick={() => step !== 'uploading' && document.getElementById('design-photo-input').click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                    if (files.length > 0) handlePhotoUpload(files);
                  }}
                >
                  {step === 'uploading' && selectedLibraryPhotos.length === 0 ? (
                    <div>
                      <div className="text-drift text-sm mb-1">Analyzing room photos...</div>
                      <div className="text-xs text-drift">This may take 15-30 seconds</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-drift text-sm mb-1">Drop photos here or click to browse</div>
                      <div className="text-xs text-drift">Upload 1-5 photos from different angles</div>
                    </div>
                  )}
                </div>
                <input
                  id="design-photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) handlePhotoUpload(files);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Show analysis */}
      {(step === 'analysis' || step === 'context' || step === 'generating') && analysis && (
        <div className="space-y-6">
          {/* Hero: Room photos large */}
          {analysis.photos && (
            <div>
              {(() => {
                const urls = JSON.parse(analysis.photos);
                if (urls.length === 1) {
                  return (
                    <img src={urls[0]} alt="Room" className="w-full rounded-lg object-cover max-h-96 border border-fog" />
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Room photo ${i + 1}`}
                        className={`w-full rounded-lg object-cover border border-fog ${urls.length <= 2 ? 'max-h-72' : 'max-h-48'}`}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Vibe + palette strip */}
          <div className="bg-cloud rounded-lg border border-fog p-4">
            <p className="text-sm text-ink leading-relaxed">{analysis.vibe_summary}</p>
            <PaletteDisplay palette={palette} />
          </div>

          {/* Elements with keep/discard toggles */}
          <div className="bg-cloud rounded-lg border border-fog p-4">
            <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-1">Room Elements</h3>
            <p className="text-xs text-drift mb-3">Toggle furnishings you want to keep or remove. Architectural elements are fixed.</p>
            <ElementList elements={elements} onStatusChange={handleElementStatusChange} interactive />
          </div>

          {/* Anchor piece picker — larger images */}
          {libraryItems.length > 0 && (
            <div className="bg-cloud rounded-lg border border-fog p-4">
              <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-1">Anchor Pieces</h3>
              <p className="text-xs text-drift mb-3">Select items you're committed to placing in this room.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {libraryItems.map((item) => {
                  const selected = selectedAnchors.find((a) => a.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAnchor(item)}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selected
                          ? 'border-evergreen ring-2 ring-evergreen ring-opacity-30'
                          : 'border-fog hover:border-drift'
                      }`}
                    >
                      <img
                        src={item.image_url}
                        alt={item.title || 'Item'}
                        className="w-full h-36 object-cover"
                      />
                      {selected && (
                        <div className="absolute top-2 right-2 bg-evergreen text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 pt-4">
                        <span className="text-white text-xs font-medium truncate block">{item.title || 'Untitled'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional notes + generate */}
          <div className="bg-cloud rounded-lg border border-fog p-4">
            <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-2">Additional Notes</h3>
            <p className="text-xs text-drift mb-3">
              Style preferences, pieces you're considering, the overall feel you're going for.
            </p>
            <textarea
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="Example: Looking for a warm, collected feel. Considering a blush pink sofa. Need a rug, coffee table, side tables, and lighting."
              rows={3}
              className="w-full text-sm border border-fog rounded-lg px-3 py-2 focus:ring-1 focus:ring-evergreen focus:outline-none resize-none"
            />
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={handleReset}
                className="text-sm text-drift hover:text-ink transition-colors"
              >
                Start over
              </button>
              <button
                onClick={handleGenerate}
                disabled={step === 'generating' || (!userContext.trim() && selectedAnchors.length === 0)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  step === 'generating' || (!userContext.trim() && selectedAnchors.length === 0)
                    ? 'bg-fog text-drift cursor-not-allowed'
                    : 'bg-evergreen text-white hover:bg-evergreen-hover'
                }`}
              >
                {step === 'generating' ? 'Generating...' : 'Get Recommendations'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Show results */}
      {step === 'results' && project && (
        <div className="space-y-6">
          {/* Hero: Room photo + anchors side by side */}
          <div>
            {/* Room photo stays prominent */}
            {analysis && analysis.photos && (
              <img
                src={JSON.parse(analysis.photos)[0]}
                alt="Room"
                className="w-full rounded-lg object-cover max-h-72 border border-fog"
              />
            )}
            {/* Selected anchors strip below the room photo */}
            {selectedAnchors.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {selectedAnchors.map((item) => (
                  <div key={item.id} className="shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.title || 'Anchor'}
                      className="h-20 w-28 rounded-lg object-cover border border-fog"
                    />
                    <p className="text-xs text-drift mt-0.5 text-center truncate w-28">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refined vibe + palette */}
          <div className="bg-cloud rounded-lg border border-fog p-4">
            <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-2">Design Direction</h3>
            <p className="text-sm text-ink leading-relaxed">{project.vibe_refined}</p>
            <PaletteDisplay palette={project.palette} />
          </div>

          {/* Observations */}
          {project.llm_reasoning && (() => {
            const reasoning = typeof project.llm_reasoning === 'string' ? JSON.parse(project.llm_reasoning) : project.llm_reasoning;
            if (!reasoning.observations || reasoning.observations.length === 0) return null;
            return (
              <div className="bg-mint bg-opacity-20 rounded-lg border border-evergreen border-opacity-20 p-4">
                <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-2">Key Observations</h3>
                <div className="space-y-1.5">
                  {reasoning.observations.map((obs, i) => (
                    <p key={i} className="text-sm text-ink">{obs}</p>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-semibold text-evergreen uppercase tracking-wide mb-3">Recommendations</h3>
            <div className="grid grid-cols-1 gap-3">
              {(() => {
                const recs = typeof project.recommendations === 'string' ? JSON.parse(project.recommendations) : project.recommendations;
                return recs.map((rec, i) => {
                  const match = libraryMatches.find((m) => m.rec_index === i);
                  return <RecommendationCard key={i} rec={rec} matchedItems={match?.items} />;
                });
              })()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setProject(null);
                setLibraryMatches([]);
                setStep('analysis');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-fog text-drift hover:bg-sand transition-colors"
            >
              Try different direction
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium text-drift hover:text-ink transition-colors"
            >
              New room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesignAdvisor;
