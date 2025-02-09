import { useState, useEffect } from 'react';

interface FridgeLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: 'available' | 'unavailable' | 'upcoming';
  percentageFull: number;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  fridges: FridgeLocation[];
}

export default function AddItemModal({ isOpen, onClose, fridges }: AddItemModalProps) {
  const [selectedFridge, setSelectedFridge] = useState<FridgeLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '1',
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Auto-select nearest available fridge
  useEffect(() => {
    if (isOpen && fridges.length > 0) {
      const availableFridges = fridges.filter(f => f.status === 'available');
      if (availableFridges.length > 0) {
        // Find nearest fridge by comparing distance strings (assuming format "X.X km")
        const nearest = availableFridges.reduce((nearest, current) => {
          const nearestDist = parseFloat(nearest.distance.split(' ')[0]);
          const currentDist = parseFloat(current.distance.split(' ')[0]);
          return currentDist < nearestDist ? current : nearest;
        });
        setSelectedFridge(nearest);
      }
    }
  }, [isOpen, fridges]);

  const handlePhotoUpload = async () => {
    setIsProcessingImage(true);
    // Placeholder for Vision LLM call
    setTimeout(() => {
      setFormData({
        name: 'Fresh Vegetables',
        description: 'A bundle of fresh organic vegetables including carrots, tomatoes, and lettuce.',
        quantity: '5',
      });
      setIsProcessingImage(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFridge || parseInt(formData.quantity) === 0) return;

    // Handle form submission
    console.log({
      fridge: selectedFridge,
      item: {
        ...formData,
        quantity: parseInt(formData.quantity)
      }
    });
    onClose();
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string (while typing) or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setFormData({ ...formData, quantity: value });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] rounded-2xl w-full max-w-[500px] overflow-hidden border border-gray-800 shadow-xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Add Item</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Selected Fridge Info */}
        {selectedFridge && (
          <div className="px-6 py-4 border-b border-gray-800 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-emerald-400 font-medium">{selectedFridge.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedFridge.address}</p>
              </div>
              <span className="text-sm text-emerald-400">{selectedFridge.distance}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload Button */}
          <button
            type="button"
            onClick={handlePhotoUpload}
            disabled={isProcessingImage}
            className="relative p-6 w-full rounded-xl border-2 border-dashed border-gray-700 hover:border-emerald-500/50 transition-colors group"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-blue-400/10 text-blue-400 group-hover:bg-blue-400/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <span className="text-gray-400 group-hover:text-gray-300">
                {isProcessingImage ? 'Analyzing photo...' : 'Take a photo to auto-fill details'}
              </span>
            </div>
          </button>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
                placeholder="What are you donating?"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
                placeholder="Add details about the item..."
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-1">
                Quantity
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                id="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFridge || !formData.name || parseInt(formData.quantity) === 0}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            Add to {selectedFridge?.name || 'Fridge'}
          </button>
        </form>
      </div>
    </div>
  );
} 