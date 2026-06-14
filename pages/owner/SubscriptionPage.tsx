import React from 'react';

const SubscriptionPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-200 mb-6">My Subscription</h1>
            <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-2xl font-bold text-center text-white mb-4">Feature Not Available</h2>
                <p className="text-center text-gray-400">
                    The subscription feature is currently not available. Please check back later.
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
