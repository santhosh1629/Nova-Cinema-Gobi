
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center px-4 text-textPrimary">
      <h1 className="text-9xl font-extrabold font-heading text-primary tracking-widest">404</h1>
      <div className="bg-surface text-white px-2 text-sm rounded rotate-12 absolute">
        Page Not Found
      </div>
      <p className="mt-4 text-lg text-textSecondary">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-8 inline-block bg-primary text-background font-semibold px-6 py-3 rounded-md hover:bg-yellow-300 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;