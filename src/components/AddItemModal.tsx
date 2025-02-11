import { useState, useEffect, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { analyzeImage } from '@/utils/gemini';
import Image from 'next/image';

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
	user: {
		name: string;
		email: string;
		id: string;
	};
}

export default function AddItemModal({ isOpen, onClose, fridges, user }: AddItemModalProps) {
	const [selectedFridge, setSelectedFridge] = useState<FridgeLocation | null>(null);
	const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		quantity: '1',
		category: null as 'medicine' | 'utilities' | 'food' | null
	});
	const [isCameraActive, setIsCameraActive] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const webcamRef = useRef<Webcam | null>(null);

	useEffect(() => {
		if (!isOpen) {
			setIsCameraActive(false);
			setCapturedImage(null);
			setIsAnalyzing(false);
			setFormData({
				name: '',
				description: '',
				quantity: '1',
				category: null
			});
		}
	}, [isOpen]);

	const handleStartCamera = () => {
		setIsCameraActive(true);
		setCapturedImage(null);
	};

	const handleCapture = useCallback(async () => {
		if (webcamRef.current) {
			const imageSrc = webcamRef.current.getScreenshot();
			if (!imageSrc) return;

			setCapturedImage(imageSrc);
			setIsCameraActive(false);
			setIsAnalyzing(true);

			try {
				const analysis = await analyzeImage(imageSrc);
				setFormData({
					name: analysis.name,
					description: analysis.description,
					quantity: analysis.quantity,
					category: analysis.category
				});
			} catch (error) {
				console.error('Error analyzing image:', error);
			} finally {
				setIsAnalyzing(false);
			}
		}
	}, [webcamRef]);

	const handleRetake = () => {
		setCapturedImage(null);
		setIsCameraActive(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFridge || parseInt(formData.quantity) === 0) return;
		setIsSubmitting(true);
		try {
			// First upload the image to ImgBB
			const imageUploadResponse = await fetch('/api/upload-image', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					image: capturedImage?.split(',')[1] // Remove data URL prefix
				}),
			});

			const imageData = await imageUploadResponse.json();
			
			if (!imageData.success) {
				throw new Error('Failed to upload image');
			}

			// Then submit the item with the image URL
			const response = await fetch('/api/add-item', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: formData.name,
					fridgeId: selectedFridge.id,
					quantity: parseInt(formData.quantity),
					userId: user.id,
					photo: imageData.url,
					description: formData.description,
					category: formData.category
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to add item');
			}

			const data = await response.json();
			
			if (data.success) {
				onClose();
			} else {
				throw new Error(data.error || 'Failed to add item');
			}
		} catch (error) {
			console.error('Error adding item:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value === '' || /^\d+$/.test(value)) {
			setFormData({ ...formData, quantity: value });
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-[#111111] rounded-2xl w-full max-w-[500px] overflow-hidden border border-gray-800 shadow-xl">
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

				{selectedFridge && (
					<div className="px-6 py-4 border-b border-gray-800 bg-[#e6e6e6]/5">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-[#e6e6e6] font-medium">{selectedFridge.name}</h3>
								<p className="text-sm text-gray-400 mt-1">{selectedFridge.address}</p>
							</div>
							<span className="text-sm text-[#e6e6e6]">{selectedFridge.distance}</span>
						</div>
					</div>
				)}

				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					<div className="space-y-4 mb-6">
						<div>
							<label htmlFor="fridge" className="block text-sm font-medium text-gray-400 mb-1">
								Select Fridge
							</label>
							<select
								id="fridge"
								value={selectedFridge?.id || ''}
								onChange={(e) => {
									const fridge = fridges.find(f => f.id === e.target.value);
									setSelectedFridge(fridge || null);
								}}
								className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-[#e6e6e6]/50 focus:ring-1 focus:ring-[#e6e6e6]/50 focus:outline-none transition-colors"
								required
							>
								<option value="">Select a fridge</option>
								{fridges.map(fridge => (
									<option key={fridge.id} value={fridge.id}>
										{fridge.name} ({fridge.distance})
									</option>
								))}
							</select>
						</div>
					</div>

					{isCameraActive ? (
						<div className="relative w-full aspect-video rounded-xl overflow-hidden">
							<Webcam
								ref={webcamRef}
								audio={false}
								screenshotFormat="image/jpeg"
								videoConstraints={{ facingMode: 'environment' }}
								className="w-full h-full object-cover"
							/>
							<button
								type="button"
								onClick={handleCapture}
								className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#111111] hover:bg-[#e6e6e6] text-white rounded-full"
							>
								Capture Photo
							</button>
						</div>
					) : capturedImage ? (
						<div className="relative w-full aspect-video rounded-xl overflow-hidden">
							{capturedImage && typeof capturedImage === 'string' && (
								<Image
									src={capturedImage}
									alt="Captured item"
									width={500}
									height={300}
									className="w-full h-full object-cover rounded-lg"
									unoptimized
								/>
							)}
							{isAnalyzing ? (
								<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
									<div className="text-white text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e6e6e6] mx-auto mb-2"></div>
										<p>Analyzing image...</p>
									</div>
								</div>
							) : (
								<button
									type="button"
									onClick={handleRetake}
									className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#111111] hover:bg-[#e6e6e6] text-white rounded-full"
								>
									Retake Photo
								</button>
							)}
						</div>
					) : (
						<button
							type="button"
							onClick={handleStartCamera}
							className="relative p-6 w-full rounded-xl border-2 border-dashed border-gray-700 hover:border-[#e6e6e6]/50 transition-colors group"
						>
							<div className="flex flex-col items-center gap-2">
								<div className="p-3 rounded-full bg-[#e6e6e6]/10 text-[#e6e6e6] group-hover:bg-[#e6e6e6]/20 transition-colors">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-6 h-6"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
										/>
									</svg>
								</div>
								<span className="text-gray-400 group-hover:text-gray-300">Take a photo</span>
							</div>
						</button>
					)}

					<div className="space-y-4">
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
								Item Name
							</label>
							<input
								type="text"
								id="name"
								value={formData.name}
								onChange={e => setFormData({ ...formData, name: e.target.value })}
								className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-[#e6e6e6]/50 focus:ring-1 focus:ring-[#e6e6e6]/50 focus:outline-none transition-colors"
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
								onChange={e => setFormData({ ...formData, description: e.target.value })}
								rows={3}
								className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-[#e6e6e6]/50 focus:ring-1 focus:ring-[#e6e6e6]/50 focus:outline-none transition-colors"
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
								className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 placeholder-gray-500 border border-gray-800 focus:border-[#e6e6e6]/50 focus:ring-1 focus:ring-[#e6e6e6]/50 focus:outline-none transition-colors"
								required
							/>
						</div>

						<div>
							<label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">
								Category
							</label>
							<select
								id="category"
								value={formData.category || ''}
								onChange={e => setFormData({ ...formData, category: e.target.value as 'medicine' | 'utilities' | 'food' })}
								className="w-full px-4 py-2 bg-[#1D1D1D] rounded-xl text-gray-100 border border-gray-800 focus:border-[#e6e6e6]/50 focus:ring-1 focus:ring-[#e6e6e6]/50 focus:outline-none transition-colors"
								required
							>
								<option value="">Select a category</option>
								<option value="food">Food</option>
								<option value="medicine">Medicine</option>
								<option value="utilities">Utilities</option>
							</select>
						</div>
					</div>

					<button
						type="submit"
						disabled={!selectedFridge || !formData.name || parseInt(formData.quantity) === 0}
						className="w-full py-3 px-4 bg-[#111111] hover:bg-[#e6e6e6] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
					>
						{isSubmitting ? 'Adding...' : `Add to ${selectedFridge?.name || 'Fridge'}`}
					</button>
				</form>
			</div>
		</div>
	);
}
