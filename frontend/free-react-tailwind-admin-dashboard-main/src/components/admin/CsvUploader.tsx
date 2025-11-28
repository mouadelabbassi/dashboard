import React, { useState } from 'react';
import axios from 'axios';

interface UploadResult {
    categoriesCreated: number;
    productsCreated: number;
    productsUpdated: number;
    productsSkipped: number;
    totalProcessed: number;
    durationSeconds: number;
}

const CsvUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/import/csv',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setResult(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to upload CSV file'
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upload CSV Data</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                </label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-6 py-2 rounded-lg font-semibold text-white
          ${
                    !file || uploading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    <p className="font-semibold mb-2">Upload Successful!</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Categories Created:</div>
                        <div className="font-semibold">{result.categoriesCreated}</div>

                        <div>Products Created:</div>
                        <div className="font-semibold">{result.productsCreated}</div>

                        <div>Products Updated:</div>
                        <div className="font-semibold">{result.productsUpdated}</div>

                        <div>Products Skipped:</div>
                        <div className="font-semibold">{result.productsSkipped}</div>

                        <div>Total Processed:</div>
                        <div className="font-semibold">{result.totalProcessed}</div>

                        <div>Duration:</div>
                        <div className="font-semibold">{result.durationSeconds}s</div>
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">CSV Format Requirements:</h3>
                <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>ASIN, Category, Product Link, No of Sellers, Rank</li>
                    <li>Rating, Reviews Count, Price, Product_Name</li>
                    <li>Description, Image_URL</li>
                </ul>
            </div>
        </div>
    );
};

export default CsvUploader;
