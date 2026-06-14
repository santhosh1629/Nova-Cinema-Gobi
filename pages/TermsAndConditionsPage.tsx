import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <section className={`mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-primary border-b-2 border-primary/20 pb-2 mb-3">{title}</h2>
        <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
            {children}
        </div>
    </section>
);

const CustomerTerms = () => (
    <Section title="Customer Terms">
        <ol className="list-decimal list-inside space-y-2">
            <li><strong>Account Creation:</strong> Customers must provide accurate details. Passwords must be secure. Must agree to T&C.</li>
            <li><strong>Ordering & Payments:</strong> Orders via app, payment via UPI/wallet. Demo orders for learning only.</li>
            <li><strong>Order Pickup:</strong> Collect food using QR code.</li>
            <li><strong>Cancellations & Refunds:</strong> Cancel before preparation. Refunds per policy.</li>
            <li><strong>Prohibited Use:</strong> No misuse, fraudulent orders, or spam.</li>
            <li><strong>Ratings & Feedback:</strong> Rate & review foods after order completion.</li>
        </ol>
    </Section>
);

const OwnerTerms = () => (
    <Section title="Owner Terms">
        <ol className="list-decimal list-inside space-y-2">
            <li><strong>Account Creation & Verification:</strong> Provide valid business and bank/UPI details. Verification may be required.</li>
            <li><strong>Menu Management:</strong> Add/edit/delete foods, set availability and pricing.</li>
            <li><strong>Order Fulfillment:</strong> Prepare Paid/Real orders. Demo orders are read-only in Demo Orders page.</li>
            <li><strong>Payments & Payouts:</strong> Real order payments via customer transactions. Owner payout details must be accurate.</li>
            <li><strong>Cancellations & Refunds:</strong> Follow app policy.</li>
            <li><strong>Prohibited Activities:</strong> Do not manipulate orders, tamper with payments, or misuse customer data.</li>
        </ol>
    </Section>
);

const CommonSections = () => (
     <Section title="Common Sections">
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Privacy & Data Usage:</strong> Data used per privacy policy.</li>
            <li><strong>Intellectual Property:</strong> App content/logo owned by Nova Cinema Gobi.</li>
            <li><strong>Termination & Suspension:</strong> Violating accounts may be suspended.</li>
            <li><strong>Disclaimer & Liability:</strong> Not liable for indirect/incidental damages.</li>
            <li><strong>Governing Law & Disputes:</strong> Governed by local laws.</li>
            <li><strong>Contact:</strong> <a href="mailto:support@novacinema.app" className="text-primary hover:underline">support@novacinema.app</a></li>
        </ul>
    </Section>
);

const SignupAcknowledgment = () => (
    <div className="mt-8 pt-4 border-t border-gray-200">
        <h2 className="text-lg font-bold text-secondary">Signup Acknowledgment</h2>
        <div className="mt-3 space-y-2">
            <div className="text-sm p-3 bg-gray-100 rounded border-l-4 border-primary">
                <p className="font-bold">For Customers:</p>
                <em className="text-gray-700">"I have read and agree to the Nova Cinema Gobi Terms & Conditions (Customer)."</em>
            </div>
            <div className="text-sm p-3 bg-gray-100 rounded border-l-4 border-secondary">
                <p className="font-bold">For Cinema Owners:</p>
                <em className="text-gray-700">"I have read and agree to the Nova Cinema Gobi Terms & Conditions (Owner). I confirm all business/bank details are true."</em>
            </div>
        </div>
    </div>
);

const TermsAndConditionsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const userType = searchParams.get('for'); // 'customer' or 'owner'

    return (
        <div className="bg-background min-h-screen font-sans">
             <header className="bg-surface shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary uppercase">Terms & Conditions</h1>
                    <Link to={-1 as any} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors text-sm">
                        &larr; Back
                    </Link>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                 <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
                    <p className="text-xs text-gray-500 mb-4">Version: 1.0 | Date: 24-Sep-2025</p>

                    {userType === 'customer' && <CustomerTerms />}
                    {userType === 'owner' && <OwnerTerms />}
                    
                    {/* If no userType, show all as a fallback */}
                    {!userType && (
                        <>
                            <CustomerTerms />
                            <OwnerTerms />
                        </>
                    )}
                    
                    <CommonSections />
                    
                    <SignupAcknowledgment />
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditionsPage;