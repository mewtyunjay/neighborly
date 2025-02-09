'use client'

import { useEffect, useState, useMemo, useRef } from 'react';
import Map from '@/components/Map';
import AddItemModal from '@/components/AddItemModal';
// import { getUserSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { useSession } from "next-auth/react"
import Profile from '@/components/Profile';
import { signIn } from "next-auth/react"

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
  isLocked: boolean;
  coordinates: [number, number];
  percentageFull: number;
  items: FridgeItem[];
}

interface UnlockedFridgeState {
  [key: string]: {
    isUnlocked: boolean;
    isWithinRange: boolean;
  }
}


function HomePage() {
  // useEffect(() => {
  //   checkLogin();
  // }, []);
  const { data: session } = useSession();


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
  const [fridges, setFridges] = useState<FridgeLocation[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filters = ['All', 'Available', 'Upcoming', 'Unavailable'];
  const itemCategories = ['All', 'Medicine', 'Utilities', 'Food'];

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

  useEffect(() => {
    if (userPos) {
      loadFridges(userPos[0], userPos[1]);
    }
  }, [userPos]);

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

  const filteredFridges = useMemo(() => {
    let filtered = fridges;

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
        || fridge.items.some(item => item.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [fridges, activeFilter, searchQuery]);

  const MapComponent = useMemo(() => (
    <Map
      userPos={userPos || undefined}
      locations={fridges.map(fridge => ({
        coordinates: fridge.coordinates,
        status: fridge.status,
        name: fridge.name,
        id: fridge.id,
        percentageFull: fridge.percentageFull,
        isSelected: fridge.id === selectedFridgeId
      }))}
      handleMarkerClick={(id) => {
        const fridge = fridges.find(f => f.id === id);
        if (fridge) {
          if (fridge.status.toLowerCase() !== 'unavailable')
            handleFridgeClick(fridge);
        }
      }}
    />
  ), [userPos, fridges, selectedFridgeId]);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // calculation algorithm
    const R = 3959; //
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  };

  const [unlockedFridges, setUnlockedFridges] = useState<UnlockedFridgeState>({});

  const handleUnlock = async (fridgeId: string) => {
    if (!userPos) return;

    try {
      const response = await fetch('/api/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fridgeId }),
      });

      if (response.status === 200) {
        const fridge = fridges.find(f => f.id === fridgeId);
        if (fridge) {
          const distance = calculateDistance(
            userPos[1], userPos[0],
            fridge.coordinates[1], fridge.coordinates[0]
          );

          if (distance <= 1) {
            setUnlockedFridges(prev => ({
              ...prev,
              [fridgeId]: {
                isUnlocked: true,
                isWithinRange: true
              }
            }));
          } else {
            alert('You must be within 1 mile of the fridge to unlock it');
          }
        }
      }
    } catch (error) {
      console.error('Error unlocking fridge:', error);
    }
  };

  const handleLockFridge = async (fridgeId: string) => {
    try {
      const response = await fetch('/api/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fridgeId }),
      });

      if (response.ok) {
        setUnlockedFridges(prev => {
          const newState = { ...prev };
          delete newState[fridgeId];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error locking fridge:', error);
    }
  };

  const loadFridges = async (longitude: number, latitude: number) => {
    try {
      const response = await fetch('/api/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longitude, latitude }),
      });

      const data = await response.json();

      const mappedFridges: FridgeLocation[] = data.map((fridge: any) => ({
        id: fridge._id,
        name: fridge.name,
        address: fridge.address,
        distance: "0.5 km",
        status: fridge.isLocked ? 'available' : 'unavailable',
        coordinates: fridge.location.coordinates,
        percentageFull: 75,
        items: fridge.items.map((item: any) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          addedAt: new Date(item.createdAt).toLocaleString(),
          category: 'food'
        }))
      }));

      setFridges(mappedFridges);

    } catch (error) {
      console.error("Error loading fridges:", error);
    }
  };

  const handleCheckout = async (itemId: string, fridgeId: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: itemId, userId: session?.user?.id }),
      });

      if (response.ok) {
        if (userPos) {

          setSelectedFridge(null);
          handleLockFridge(fridgeId);
          loadFridges(userPos[0], userPos[1]);
        }
      }
    } catch (error) {
      console.error('Error checking out item:', error);
    }
  };

  const availableFridges = useMemo(() => {
    return fridges.filter(f => f.status === 'available');
  }, [fridges]);

  return (
    <div className="h-screen w-full relative bg-[#111111]">
      {/* Header - Fixed on mobile, hidden on desktop */}
      <div className="fixed top-0 inset-x-0 z-20 bg-gradient-to-b from-[#111111]/50 to-transparent backdrop-blur-sm rounded-b-2xl md:hidden">
        <div className="p-4 space-y-4">
          {/* Top Bar with Logo and Actions */}
          <div className="flex items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <h1
                className="text-2xl font-bold text-[#e6e6e6]"
                style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}
              >
                Neighborly
              </h1>
            </div>

            {/* Actions on the right */}
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  {/* Add Item Button - Only shown when logged in */}
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="px-3 py-1.5 bg-[#e6e6e6] text-black rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Add Item
                  </button>

                  {/* Profile Icon - Only shown when logged in */}
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </>
              ) : (
                /* Sign in with Google button - Only shown when logged out */
                <button
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search fridges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-2xl text-gray-100 placeholder-gray-500 border border-[#e6e6e6] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:outline-none transition-colors text-sm"
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
      <div className="hidden md:block absolute top-0 left-0 w-1/4 h-full bg-transparent backdrop-blur-md shadow-2xl">
        <div className="h-full overflow-hidden flex flex-col">
          {/* Header Section with fixed height */}
          <div className="flex-none p-8 pb-4">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-6">
              <h1
                className="text-4xl font-bold text-[#e6e6e6] mb-2"
                style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}
              >
                Neighborly
              </h1>
              <p className="text-gray-400 text-sm">Connect with your community</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search fridges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-transparent rounded-2xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors backdrop-blur-md bg-[#111111]/50"
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md duration-200 ${activeFilter === filter
                    ? 'bg-[#e6e6e6]-500/20 text-[#e6e6e6] border border-[#e6e6e6]-500/20 shadow-lg shadow-[#e6e6e6]-500/10'
                    : 'text-gray-400 hover:bg-[#1D1D1D] border border-transparent'
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
                  onClick={fridge.status.toLowerCase() !== 'unavailable' ? () => handleFridgeClick(fridge) : undefined}
                  className="group p-4 rounded-2xl transition-shadow duration-200 cursor-pointer border border-gray-800/50 hover:border-[#B0E0E6]/20 hover:shadow-lg hover:shadow-[#B0E0E6]/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-100 font-medium group-hover:text-white">
                        {fridge.name}
                      </h3>
                      <span className="text-xs font-medium text-[#e6e6e6]">
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
        className={`fixed inset-x-0 bg-[#111111]/95 backdrop-blur-md shadow-2xl z-10 transition-all duration-300 ease-in-out touch-pan-y md:hidden rounded-t-2xl
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-md duration-200 ${activeFilter === filter
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
                  onClick={fridge.status.toLowerCase() !== 'unavailable' ? () => handleFridgeClick(fridge) : undefined}
                  className={`group p-3 rounded-2xl transition-shadow duration-200 cursor-pointer border ${selectedFridgeId === fridge.id
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
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedFridge.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{selectedFridge.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUnlock(selectedFridge.id)}
                    disabled={unlockedFridges[selectedFridge.id]?.isUnlocked}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${unlockedFridges[selectedFridge.id]?.isUnlocked
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                  >
                    {unlockedFridges[selectedFridge.id]?.isUnlocked ? 'Unlocked' : 'Unlock Fridge'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedFridge && unlockedFridges[selectedFridge.id]?.isUnlocked) {
                        handleLockFridge(selectedFridge.id);
                      }
                      setSelectedFridge(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                  {filteredItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/50 border border-gray-700"
                    >
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.name}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">Quantity: {item.quantity}</span>
                          <span className="text-gray-400">Added {item.addedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                        {unlockedFridges[selectedFridge.id]?.isUnlocked &&
                          unlockedFridges[selectedFridge.id]?.isWithinRange && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckout(item.id, selectedFridge.id);
                              }}
                              className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                            >
                              Checkout
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {session && (
        <>
          {session.user && (
            <Profile
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              user={{ name: session.user?.name || '', email: session.user?.email || '' }}
            />
          )}
        </>
      )}

      {/* Add Item Modal - Only render if user is logged in */}
      {session && (
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          fridges={fridges}
          user={{ name: session?.user?.name || '', email: session?.user?.email || '', id: session?.user?.id || '' }}
        />
      )}
    </div >
  );
}

export default HomePage;

function closeItemModal() {
  throw new Error('Function not implemented.');
}
