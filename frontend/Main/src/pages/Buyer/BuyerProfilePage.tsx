import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const BuyerProfilePage: React.FC = () => {
    const { user, updateUserProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        bio: user?.bio || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateUserProfile(formData.fullName, formData.phone, formData.bio);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    My Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account settings
                </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gray-800 dark:bg-gray-800 px-8 py-12">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-gray-800 shadow-lg">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="text-white">
                            <h2 className="text-2xl font-bold">{user?.fullName}</h2>
                            <p className="opacity-90">{user?.email}</p>
                            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                                Buyer Account
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            message.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white py-3">{user?.fullName}</p>
                            )}
                        </div>

                        {/* Email (Read-only) */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <p className="text-gray-900 dark:text-white py-3">{user?.email}</p>
                        </div>

                        {/* Phone */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter your phone number"
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white py-3">
                                    {user?.phone || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bio
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white py-3">
                                    {user?.bio || 'No bio added'}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                            {isEditing ? (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                fullName: user?.fullName || '',
                                                phone: user?.phone || '',
                                                bio: user?.bio || ''
                                            });
                                        }}
                                        className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={logout}
                                className="px-6 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BuyerProfilePage;
