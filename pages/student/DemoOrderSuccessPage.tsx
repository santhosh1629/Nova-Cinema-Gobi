
import React from 'react';
import { Link } from 'react-router-dom';

const DemoOrderSuccessPage: React.FC = () => {
    return (
        <div className="max-w-md mx-auto bg-black/50 backdrop-blur-lg border border-white/20 p-6 sm:p-8 rounded-2xl shadow-xl text-white text-center animate-scale-in">
            <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold">Demo Order Collected ✅</h1>
            <p className="text-white/80 mt-2 mb-6">
                This demo order has been automatically marked as collected. You are now ready to place real orders!
            </p>
            <Link
                to="/student/menu"
                className="w-full mt-8 block bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors"
            >
                Go to Menu
            </Link>
        </div>
    );
};

export default DemoOrderSuccessPage;
