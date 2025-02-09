'use client'

import { useEffect, useState, useMemo, useRef } from 'react';
import Map from '@/components/Map';
import AddItemModal from '@/components/AddItemModal';

interface FridgeItem {
  id: string;
  name: string;
  category: 'medicine' | 'utilities' | 'food';
  quantity: number;
  addedAt: string;
}

interface FridgeLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: 'available' | 'unavailable' | 'upcoming';
  coordinates: [number, number];
  percentageFull: number;
  items: FridgeItem[];
}

export default function HomePage() {
  const mapRef = useRef<any>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFridge, setSelectedFridge] = useState<FridgeLocation | null>(null);
  const [activeItemCategory, setActiveItemCategory] = useState('All');
  const [sheetPosition, setSheetPosition] = useState<'closed' | 'full'>('full');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [selectedFridgeId, setSelectedFridgeId] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const filters = ['All', 'Available', 'Upcoming', 'Unavailable'];
  const itemCategories = ['All', 'Medicine', 'Utilities', 'Food'];

  const demoFridges: FridgeLocation[] = [
    {
      id: '1',
      name: 'MetroTech Fridge',
      address: '6 MetroTech Center, Brooklyn',
      distance: '0.2 km',
      status: 'available',
      coordinates: [-73.9857, 40.6937], // NYU Tandon area
      percentageFull: 75,
      items: [
        { id: '1', name: 'Insulin', category: 'medicine', quantity: 5, addedAt: '2 hours ago' },
        { id: '2', name: 'First Aid Kit', category: 'medicine', quantity: 2, addedAt: '1 day ago' },
        { id: '3', name: 'Fresh Vegetables', category: 'food', quantity: 10, addedAt: '3 hours ago' },
        { id: '5', name: 'Power Bank', category: 'utilities', quantity: 3, addedAt: '5 hours ago' },
      ]
    },
    {
      id: '2',
      name: 'DUMBO Fridge',
      address: '45 Water Street, Brooklyn',
      distance: '0.6 km',
      status: 'upcoming',
      coordinates: [-73.9891, 40.7028], // DUMBO area
      percentageFull: 30,
      items: [
        { id: '6', name: 'Bandages', category: 'medicine', quantity: 20, addedAt: '1 day ago' },
        { id: '7', name: 'Canned Food', category: 'food', quantity: 15, addedAt: '6 hours ago' },
      ]
    },
    {
      id: '3',
      name: 'Downtown Brooklyn Fridge',
      address: '345 Jay Street, Brooklyn',
      distance: '0.4 km',
      status: 'unavailable',
      coordinates: [-73.9877, 40.6925], // Downtown Brooklyn
      percentageFull: 90,
      items: []
    },
  ];

  // Memoize the filtered fridges
  const filteredFridges = useMemo(() => {
    let filtered = demoFridges;

    if (activeFilter !== 'All') {
      filtered = filtered.filter(fridge =>
        fridge.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fridge =>
        fridge.name.toLowerCase().includes(query) ||
        fridge.address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery]);

  // Memoize the map component with fridge locations
  const MapComponent = useMemo(() => (

    <Map
      userPos={userPos || undefined}
      locations={demoFridges.map(fridge => ({
        coordinates: fridge.coordinates,
        status: fridge.status,
        name: fridge.name,
        id: fridge.id,
        percentageFull: fridge.percentageFull,
        isSelected: fridge.id === selectedFridgeId
      }))}
      handleMarkerClick={(id) => {
        const fridge = demoFridges.find(f => f.id === id);
        if (fridge) {
          handleFridgeClick(fridge);
        }
      }}
    />

  ), [userPos, demoFridges, selectedFridgeId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPos([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'All':
        return 'bg-[#e6e6e6] text-[#e6e6e6] border-[#e6e6e6]';
      case 'available':
        return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'Available':
        return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'upcoming':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'Upcoming':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'unavailable':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'Unavailable':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    }
  };

  function getStatusBarColor(status: string) {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-emerald-400';
      case 'upcoming':
        return 'bg-yellow-400';
      case 'unavailable':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  const filteredItems = useMemo(() => {
    if (!selectedFridge) return [];

    if (activeItemCategory === 'All') return selectedFridge.items;

    return selectedFridge.items.filter(item =>
      item.category.toLowerCase() === activeItemCategory.toLowerCase()
    );
  }, [selectedFridge, activeItemCategory]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;

    if (diff > 50 && sheetPosition === 'full') {
      setSheetPosition('closed');
    } else if (diff < -50 && sheetPosition === 'closed') {
      setSheetPosition('full');
    }



    setStartY(currentY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleFridgeClick = (fridge: FridgeLocation) => {
    setSelectedFridge(fridge);
    setSelectedFridgeId(fridge.id);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: fridge.coordinates,
        zoom: 16,
        duration: 1500
      });
    }
  };

  return (
    <div className="h-screen w-full relative bg-[#111111]">
      {/* Header - Fixed on mobile, hidden on desktop */}
      <div className="fixed top-0 inset-x-0 z-20 bg-[#111111]/95 backdrop-blur-md md:hidden">
        <div className="p-4 space-y-4">
          {/* Top Bar with Logo and Actions */}
          <div className="flex items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#e6e6e6]">Neighbourly</h1>
            </div>

            {/* Actions on the right */}
            <div className="flex items-center space-x-4">
              {/* Add Item Button */}
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="px-3 py-1.5 bg-[#e6e6e6] text-black rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Add Item
              </button>

              {/* Profile Icon */}
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search fridges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-[#e6e6e6] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Full screen map */}
      <div className="absolute inset-0 md:relative md:h-screen">
        {MapComponent}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block absolute top-0 left-0 w-1/2 h-full bg-[#111111]/95 backdrop-blur-md shadow-2xl">
        <div className="h-full overflow-hidden flex flex-col">
          {/* Header Section with fixed height */}
          <div className="flex-none p-8 pb-4">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-6">
              <h1 className="text-4xl font-bold text-[#e6e6e6] mb-2">Neighbourly</h1>
              <p className="text-gray-400 text-sm">Connect with your community</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search fridges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeFilter === filter
                    ? 'bg-[#e6e6e6]-500/20 text-[#e6e6e6]-400 border border-[#e6e6e6]-500/20 shadow-lg shadow-[#e6e6e6]-500/10'
                    : 'text-gray-400 hover:bg-[#1D1D1D] hover:text-white border border-transparent'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-grow overflow-auto px-8 pb-8">
            {/* Fridges List */}
            <div className="space-y-3">
              {filteredFridges.map((fridge) => (
                <div
                  key={fridge.id}
                  onClick={() => handleFridgeClick(fridge)}
                  className="group p-4 rounded-xl hover:bg-[#1D1D1D] transition-all duration-200 cursor-pointer border border-gray-800/50 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-gray-100 font-medium group-hover:text-white">
                        {fridge.name}
                      </h3>
                      <span className={`text-sm font-medium text-[#e6e6e6]-400`}>
                        {fridge.percentageFull}% full
                      </span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(fridge.status)}`}>
                      {fridge.status.charAt(0).toUpperCase() + fridge.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 group-hover:text-gray-400">
                      {fridge.address}
                    </span>
                    <span className="text-sm text-gray-500 group-hover:text-gray-400">
                      {fridge.distance}
                    </span>
                  </div>
                  {/* Percentage bar */}
                  <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusBarColor(fridge.status)} transition-all duration-300`}
                      style={{ width: `${fridge.percentageFull}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bg-[#111111]/95 backdrop-blur-md shadow-2xl z-10 transition-all duration-300 ease-in-out touch-pan-y md:hidden
          ${sheetPosition === 'full' ? 'h-[80%] bottom-0' : 'h-[20%] bottom-0'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div
          className="w-full h-8 flex items-center justify-center cursor-pointer"
          onClick={() => setSheetPosition(sheetPosition === 'full' ? 'closed' : 'full')}

        >
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="h-full overflow-hidden flex flex-col px-4">
          {/* Filters */}
          <div className="flex-none py-2 overflow-x-auto">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeFilter === filter
                    ? `bg-${getStatusColor(filter)}-500/20 text-${getStatusColor(filter)}-400 border border-${getStatusColor(filter)}-500/20 shadow-lg shadow-${getStatusColor(filter)}-500/10`
                    : 'text-gray-400 hover:bg-[#1D1D1D] hover:text-white border border-transparent'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Fridges List */}
          <div className="flex-grow overflow-y-auto">
            <div className="space-y-3 py-4">
              {filteredFridges.map((fridge) => (
                <div
                  key={fridge.id}
                  onClick={() => handleFridgeClick(fridge)}
                  className={`group p-3 rounded-xl transition-all duration-200 cursor-pointer border ${selectedFridgeId === fridge.id
                    ? 'bg-[#1D1D1D] border-[#e6e6e6]/50 shadow-lg shadow-[#e6e6e6]/10'
                    : 'hover:bg-[#1D1D1D] border-gray-800/50 hover:border-[#e6e6e6]/20 hover:shadow-lg hover:shadow-[#e6e6e6]/5'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-gray-100 font-medium group-hover:text-white">
                        {fridge.name}
                      </h3>
                      <span className={`text-sm font-medium text-emerald-400`}>
                        {fridge.percentageFull}% full
                      </span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(fridge.status)}`}>
                      {fridge.status.charAt(0).toUpperCase() + fridge.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 group-hover:text-gray-400">
                      {fridge.address}
                    </span>
                    <span className="text-sm text-gray-500 group-hover:text-gray-400">
                      {fridge.distance}
                    </span>
                  </div>
                  {/* Percentage bar */}
                  <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusBarColor(fridge.status)} transition-all duration-300`}
                      style={{ width: `${fridge.percentageFull}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Adjusted for mobile */}
      {selectedFridge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-2xl w-full max-w-[600px] max-h-[80vh] overflow-hidden border border-gray-800 shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white">{selectedFridge.name}</h2>
                <button
                  onClick={() => setSelectedFridge(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-400 text-sm">{selectedFridge.address}</p>
            </div>

            {/* Category Filters */}
            <div className="p-4 border-b border-gray-800 overflow-x-auto">
              <div className="flex gap-2">
                {itemCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveItemCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeItemCategory === category
                      ? 'bg-[#e6e6e6]/20 text-[#e6e6e6] border border-[#e6e6e6]/20 shadow-lg shadow-[#e6e6e6]/10'
                      : 'text-gray-400 hover:bg-[#1D1D1D] hover:text-white border border-transparent'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {filteredItems.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No items found in this category
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700"
                    >
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.name}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">Quantity: {item.quantity}</span>
                          <span className="text-gray-400">Added {item.addedAt}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        fridges={demoFridges}
      />
    </div>
  );
}
