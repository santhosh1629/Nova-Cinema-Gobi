

import React, { useState, useEffect } from 'react';
import { getFeedbacks } from '../../services/mockApi';
import type { Feedback } from '../../types';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588 1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const FeedbackCard: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
    return (
        <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-200">{feedback.itemName}</p>
                    <p className="text-sm text-gray-400">Reviewed by: <span className="font-medium">{feedback.studentName}</span></p>
                </div>
                <StarDisplay rating={feedback.rating} />
            </div>
            {feedback.comment && (
                <blockquote className="mt-4 p-4 bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-lg">
                    <p className="text-gray-300 italic">"{feedback.comment}"</p>
                </blockquote>
            )}
            <p className="text-right text-xs text-gray-500 mt-3">
                {feedback.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
        </div>
    );
};

const FeedbackCardSkeleton: React.FC = () => (
    <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="w-2/3">
                <div className="h-6 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-5 bg-gray-700 rounded w-24"></div>
        </div>
        <div className="mt-4 p-4 bg-gray-700/50 rounded-r-lg">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 mt-2"></div>
        </div>
    </div>
);


const OwnerFeedbackPage: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                setLoading(true);
                const data = await getFeedbacks();
                setFeedbacks(data);
            } catch (error) {
                console.error("Failed to fetch feedback:", error);
            } finally { setLoading(false); }
        };
        fetchFeedbacks();
    }, []);

    const sortedFeedbacks = [...feedbacks].sort((a, b) => {
        switch (sortBy) {
            case 'highest': return b.rating - a.rating;
            case 'lowest': return a.rating - b.rating;
            default: return b.timestamp.getTime() - a.timestamp.getTime();
        }
    });

    if (loading) {
        return (
            <div>
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeedbackCardSkeleton />
                    <FeedbackCardSkeleton />
                    <FeedbackCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Customer Feedback 🗣️</h1>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <label htmlFor="sort-feedback" className="text-sm font-medium text-gray-300">Sort by:</label>
                    <select
                        id="sort-feedback"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest' | 'lowest')}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                    >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                    </select>
                </div>
            </div>
            {sortedFeedbacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedFeedbacks.map(fb => (
                        <FeedbackCard key={fb.id} feedback={fb} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-md border border-gray-700">
                    <p className="text-xl font-semibold text-gray-200">No Feedback Yet!</p>
                    <p className="text-gray-400 mt-2">When customers submit feedback, it will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default OwnerFeedbackPage;