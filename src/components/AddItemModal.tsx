import { useState, useEffect } from 'react';

interface FridgeLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: 'available' | 'unavailable' | 'upcoming';
  percentageFull: number;
}

interface NewItemPayload {
  name: string;
  quantity: number;
  description: string;
  userId: string;
  photo?: File;
  fridgeId: string;
  category: 'medicine' | 'utilities' | 'food';
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  fridges: FridgeLocation[];
}

export default function AddItemModal({ isOpen, onClose, fridges }: AddItemModalProps) {
  const [selectedFridge, setSelectedFridge] = useState<FridgeLocation | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '1',
    category: 'food' as 'medicine' | 'utilities' | 'food'
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove auto-selection of nearest fridge
  useEffect(() => {
    if (isOpen && fridges.length > 0) {
      // Don't auto-select, let user choose
      setSelectedFridge(null);
    }
  }, [isOpen, fridges]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setIsProcessingImage(true);
      // You can add image processing logic here
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFridge || parseInt(formData.quantity) === 0) return;

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('quantity', formData.quantity);
      formPayload.append('description', formData.description);
      formPayload.append('userId', 'temp-user-id'); // Replace with actual user ID
      formPayload.append('fridgeId', selectedFridge.id);
      formPayload.append('category', formData.category);
      if (selectedPhoto) {
        formPayload.append('photo', selectedPhoto);
      }

      const response = await fetch('/api/add-product', {
        method: 'POST',
        body: formPayload,
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        quantity: '1',
        category: 'food'
      });
      setSelectedPhoto(null);
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
      // Add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
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
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-[#111111] rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo upload */}
          <div>
            <label 
              htmlFor="photo-upload" 
              className="block w-full p-4 border-2 border-dashed border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              {selectedPhoto ? (
                <span className="text-emerald-500">Photo selected</span>
              ) : (
                <span className="text-gray-400">Upload photo</span>
              )}
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
              Item Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
              placeholder="Enter item name"
            />
          </div>

          {/* Description input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          {/* Quantity input */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleQuantityChange}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Category selection */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ 
                ...formData, 
                category: e.target.value as 'medicine' | 'utilities' | 'food' 
              })}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
            >
              <option value="food">Food</option>
              <option value="medicine">Medicine</option>
              <option value="utilities">Utilities</option>
            </select>
          </div>

          {/* Fridge selection */}
          <div>
            <label htmlFor="fridge" className="block text-sm font-medium text-gray-400 mb-1">
              Fridge
            </label>
            <select
              id="fridge"
              value={selectedFridge?.id || ''}
              onChange={(e) => {
                const selected = fridges.find(f => f.id === e.target.value);
                setSelectedFridge(selected || null);
              }}
              className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors"
              required
            >
              <option value="" disabled>
                {fridges.length === 0 ? 'No fridges available' : 'Select a fridge'}
              </option>
              {fridges
                .filter(fridge => fridge.status === 'available')
                .map(fridge => (
                  <option key={fridge.id} value={fridge.id}>
                    {fridge.name} ({fridge.distance})
                  </option>
                ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedFridge || !formData.name || parseInt(formData.quantity) === 0}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? 'Adding...' : `Add to ${selectedFridge?.name || 'Fridge'}`}
          </button>
        </form>
      </div>
    </div>
  );
} 