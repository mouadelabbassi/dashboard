import React, { useState } from 'react';
import { generateAdminPDF, generateAnalystPDF } from '../service/pdfExportService';
import { reportService } from '../service/reportService';

interface ExportPDFButtonProps {
    type: 'admin' | 'analyst';
    className?: string;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({ type, className = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setLoading(true);
        setError(null);

        try {
            if (type === 'admin') {
                const data = await reportService.getAdminReportData();
                console.log('📊 Admin Report Data:', data);
                await generateAdminPDF(data);
            } else {
                const data = await reportService.getAnalystReportData();
                console.log('📊 Analyst Report Data:', data);
                await generateAnalystPDF(data);
            }
        } catch (err:  any) {
            console.error('Export error:', err);
            setError('Failed to generate PDF.Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    loading
                        ?  'bg-gray-400 cursor-not-allowed'
                        : type === 'admin'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                } ${className}`}
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
                        <span>Generating PDF...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span>
                            {type === 'admin' ? 'Export Report (PDF)' : 'Export Detailed Report (PDF)'}
                        </span>
                    </>
                )}
            </button>

            {error && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ExportPDFButton;