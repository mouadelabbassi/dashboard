import React, { useState } from 'react';
import { generateAdvancedPDF } from '../service/advancedPdfExportService';

interface ExportAdvancedPDFButtonProps {
    className?: string;
    variant?: 'primary' | 'gradient' | 'outline';
}

const ExportAdvancedPDFButton: React.FC<ExportAdvancedPDFButtonProps> = ({
                                                                             className = '',
                                                                             variant = 'gradient'
                                                                         }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await generateAdvancedPDF();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err:  any) {
            console.error('Export error:', err);
            setError('Failed to generate PDF.Please try again.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const getButtonStyles = () => {
        const baseStyles = 'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg';

        switch (variant) {
            case 'primary':
                return `${baseStyles} bg-gray-600 hover:bg-gray-700 text-white hover:shadow-gray-500/25`;
            case 'outline':
                return `${baseStyles} border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white`;
            case 'gradient':
            default:
                return `${baseStyles} bg-gradient-to-r from-gray-600 via-gray-600 to-gray-600 hover:from-gray-700 hover:via-gray-700 hover:to-gray-700 text-white hover:shadow-gray-500/25`;
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleExport}
                disabled={loading}
                className={`${getButtonStyles()} ${loading ? 'opacity-70 cursor-not-allowed' :  'hover:scale-105'} ${className}`}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Generating Report...</span>
                    </>
                ) : success ? (
                    <>
                        <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Report Downloaded!</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span>Export Executive Report</span>
                    </>
                )}
            </button>

            {error && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            {success && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Report generated successfully!
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportAdvancedPDFButton;