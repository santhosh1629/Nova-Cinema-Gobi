import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitFeedback, getMenu } from '../../services/mockApi';
import type { MenuItem } from '../../types';

const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} star`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 transition-colors drop-shadow-md ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588 1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const FeedbackPage: React.FC = () => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { user, loading, promptForPhone } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            promptForPhone();
        }
    }, [user, loading, promptForPhone]);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                // Fetch menu without customer ID for a generic list
                const menuItems = await getMenu();
                setMenu(menuItems);
            } catch (error) {
                console.error("Failed to fetch menu items for feedback", error);
            }
        };
        fetchMenuItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            promptForPhone(() => handleSubmit(e));
            return;
        }
        if (!selectedItemId) {
            alert("Please select a food item.");
            return;
        }
        if (rating === 0) {
            alert("Please provide a star rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitFeedback({ 
                studentId: user.id, 
                itemId: selectedItemId,
                rating, 
                comment,
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Failed to submit feedback", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto text-center bg-black/50 backdrop-blur-lg border border-white/20 p-8 rounded-lg shadow-md text-white">
                <h1 className="text-2xl font-bold font-heading text-accent mb-4">Thank you for your feedback!</h1>
                <p>We appreciate you taking the time to help us improve.</p>
            </div>
        );
    }
    
    if (!user) {
        return <div className="text-center py-16 text-textPrimary"><p>Please log in to submit feedback.</p></div>;
    }

    return (
        <div className="max-w-lg mx-auto bg-black/50 backdrop-blur-lg border border-white/20 p-8 rounded-lg shadow-md text-white">
            <h1 className="text-3xl font-bold font-heading mb-2 text-center">Give us your Feedback 📝</h1>
            <p className="text-center text-white/80 mb-6">Rate a specific food item from our menu.</p>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="food-item" className="block text-white/90 font-semibold mb-2">
                        Which food item would you like to rate?
                    </label>
                    <select
                        id="food-item"
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    >
                        <option value="" disabled>Select an item...</option>
                        {menu.map(item => (
                            <option key={item.id} value={item.id} className="bg-gray-800 text-white">{item.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-center text-white/90 font-semibold mb-2">
                        How would you rate it?
                    </label>
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                
                <div className="mb-6">
                    <label htmlFor="comment" className="block text-white/90 font-semibold mb-2">
                        Any comments? (Optional)
                    </label>
                    <textarea
                        id="comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/50"
                        placeholder="e.g., The noodles were perfectly cooked!"
                    ></textarea>
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white font-bold font-heading py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-violet-300"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
};

export default FeedbackPage;
