
import React, { useState, useEffect } from 'react';
import { getFoodPopularityStats } from '../../services/mockApi';
import type { MenuItem } from '../../types';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
        <span className="text-sm text-gray-400 ml-2 font-semibold">{rating.toFixed(2)}</span>
    </div>
);


const FoodPopularityPage: React.FC = () => {
    const [stats, setStats] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getFoodPopularityStats();
                data.sort((a, b) => {
                    if (b.favoriteCount !== a.favoriteCount) {
                        return (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0);
                    }
                    return (b.averageRating ?? 0) - (a.averageRating ?? 0);
                });
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch food popularity stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="h-5 bg-gray-700 rounded w-full mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-200 mb-6">Food Popularity ❤️</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <p className="mb-6 text-gray-400">Here's how customers are rating and favoriting your menu items. Use this data to fine-tune your offerings!</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Average Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Favorites</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {stats.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        <StarDisplay rating={item.averageRating ?? 0} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className="font-bold text-pink-400">❤️ {item.favoriteCount ?? 0}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FoodPopularityPage;
