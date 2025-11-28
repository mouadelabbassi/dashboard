import React, { useEffect, useState } from 'react';
import { sellerService } from '../../service/sellerService';
import { SellerProfile as SellerProfileType } from '../../types/seller';

const SellerProfile: React.FC = () => {
    const [profile, setProfile] = useState<SellerProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        bio: '',
        profileImage: '',
        storeName: '',
        storeDescription: '',
        businessAddress: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await sellerService.getProfile();
            setProfile(data);
            setFormData({
                fullName: data.fullName || '',
                phone: data.phone || '',
                bio: data.bio || '',
                profileImage: data.profileImage || '',
                storeName: data.storeName || '',
                storeDescription: data.storeDescription || '',
                businessAddress: data.businessAddress || '',
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            const updated = await sellerService.updateProfile(formData);
            setProfile(updated);
            setEditing(false);
            setSuccess('Profil mis à jour avec succès! ');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (! profile) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{error || 'Profil non trouvé'}</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mon Profil Vendeur</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gérez vos informations personnelles et de boutique
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                    {success}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Produits en Vente</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.totalProducts}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Ventes Totales</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.totalSales}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Revenue Totale</p>
                    <p className="text-2xl font-bold text-green-600">{profile.totalRevenue.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Note Moyenne</p>
                    <p className="text-2xl font-bold text-yellow-500">⭐ {profile.averageRating.toFixed(1)}</p>
                </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Informations du Profil
                        </h2>
                        <p className="text-sm text-gray-500">
                            Membre depuis {new Date(profile.memberSince).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                    {! editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Modifier
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Image */}
                        <div className="md:col-span-2 flex items-center gap-6">
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center overflow-hidden">
                                {formData.profileImage ?  (
                                    <img
                                        src={formData.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl text-blue-600 dark:text-blue-400 font-bold">
                    {formData.fullName?.charAt(0).toUpperCase() || 'S'}
                  </span>
                                )}
                            </div>
                            {editing && (
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        URL de la Photo de Profil
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.profileImage}
                                        onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom Complet
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.fullName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <p className="text-gray-900 dark:text-white">{profile.email}</p>
                            <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Téléphone
                            </label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.phone || 'Non renseigné'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Statut
                            </label>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                profile.isVerifiedSeller
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                {profile.isVerifiedSeller ? '✓ Vendeur Vérifié' : '⏳ En attente de vérification'}
              </span>
                        </div>

                        {/* Bio */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bio
                            </label>
                            {editing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    placeholder="Parlez de vous..."
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.bio || 'Non renseigné'}</p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="md:col-span-2 border-t dark:border-gray-700 pt-6 mt-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Informations de la Boutique
                            </h3>
                        </div>

                        {/* Store Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom de la Boutique
                            </label>
                            {editing ?  (
                                <input
                                    type="text"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.storeName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adresse Professionnelle
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.businessAddress}
                                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.businessAddress || 'Non renseigné'}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description de la Boutique
                            </label>
                            {editing ? (
                                <textarea
                                    value={formData.storeDescription}
                                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    placeholder="Décrivez votre boutique..."
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{profile.storeDescription || 'Non renseigné'}</p>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    {editing && (
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(false);
                                    setFormData({
                                        fullName: profile.fullName || '',
                                        phone: profile.phone || '',
                                        bio: profile.bio || '',
                                        profileImage: profile.profileImage || '',
                                        storeName: profile.storeName || '',
                                        storeDescription: profile.storeDescription || '',
                                        businessAddress: profile.businessAddress || '',
                                    });
                                }}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                Enregistrer
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SellerProfile;
