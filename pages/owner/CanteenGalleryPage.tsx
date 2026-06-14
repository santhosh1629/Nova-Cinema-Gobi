
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCanteenPhotos, addCanteenPhoto, deleteCanteenPhoto, updateCanteenPhoto } from '../../services/mockApi';
import type { CanteenPhoto } from '../../types';

const ReplaceIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>);
const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

const CanteenGalleryPage: React.FC = () => {
    const [photos, setPhotos] = useState<CanteenPhoto[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // State for confirmation modal and replace functionality
    const [photoToDelete, setPhotoToDelete] = useState<CanteenPhoto | null>(null);
    const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);
    const replaceFileInputRef = useRef<HTMLInputElement>(null);


    const fetchPhotos = useCallback(async () => {
        try {
            // No need to set loading true here if it's just for refresh
            const data = await getCanteenPhotos();
            setPhotos(data);
        } catch (err) {
            console.error("Failed to fetch canteen photos", err);
            setError("Could not load photo gallery.");
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPhotos().finally(() => setLoading(false));
    }, [fetchPhotos]);
    
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File is too large. Please select an image under 10MB.');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleAddPhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select an image file to upload.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const newPhoto = await addCanteenPhoto(selectedFile);
            setPhotos(prev => [newPhoto, ...prev]);
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (err) {
            console.error("Failed to add photo", err);
            setError('Failed to add the photo. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const confirmDelete = async () => {
        if (!photoToDelete) return;
        try {
            await deleteCanteenPhoto(photoToDelete.id);
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoToDelete.id));
        } catch(err) {
            console.error("Failed to delete photo", err);
            setError('Failed to delete the photo.');
        } finally {
            setPhotoToDelete(null);
        }
    };
    
    const handleReplaceClick = (id: string) => {
        setReplacingPhotoId(id);
        replaceFileInputRef.current?.click();
    };

    const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && replacingPhotoId) {
            try {
                const updatedPhoto = await updateCanteenPhoto(replacingPhotoId, file);
                setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
            } catch (err) {
                console.error("Failed to replace photo", err);
                setError("Failed to replace the photo.");
            } finally {
                setReplacingPhotoId(null);
                if(e.target) e.target.value = ''; // Reset file input
            }
        }
    };


    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-200 mb-6">Manage Canteen Gallery 🖼️</h1>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-white">Add New Photo</h2>
                <form onSubmit={handleAddPhoto} className="space-y-4">
                     <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload from File Manager</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div className="flex text-sm text-gray-500">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                            </div>
                        </div>
                    </div>

                    {previewUrl && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium text-white">Preview:</h3>
                            <img src={previewUrl} alt="Preview" className="mt-2 rounded-lg max-h-48" />
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    
                    <button type="submit" disabled={isSubmitting || !selectedFile} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-500/50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Uploading...' : 'Add Photo'}
                    </button>
                </form>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Current Photos</h2>
                {loading ? (
                    <p>Loading photos...</p>
                ) : photos.length === 0 ? (
                    <p className="text-gray-400">No photos have been uploaded yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative group">
                                <img src={photo.data} alt="Canteen" className="w-full h-48 object-cover rounded-lg shadow-lg"/>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => handleReplaceClick(photo.id)} title="Replace" className="text-white p-2 bg-white/20 rounded-full hover:bg-white/40"><ReplaceIcon /></button>
                                    <button onClick={() => setPhotoToDelete(photo)} title="Delete" className="text-white p-2 bg-white/20 rounded-full hover:bg-white/40"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <input type="file" ref={replaceFileInputRef} className="hidden" onChange={handleReplaceFileChange} accept="image/png, image/jpeg, image/webp" />
            </div>

            {/* Delete Confirmation Modal */}
            {photoToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-sm animate-fade-in-down">
                        <h2 className="text-xl font-bold mb-4 text-center text-white">Confirm Deletion</h2>
                        <p className="text-center text-gray-300 mb-6">Are you sure you want to delete this photo?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setPhotoToDelete(null)} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default CanteenGalleryPage;