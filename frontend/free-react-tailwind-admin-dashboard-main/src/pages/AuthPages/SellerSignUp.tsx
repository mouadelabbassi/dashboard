import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../service/authService';
import { SellerRegisterData } from '../../types/seller';

const SellerSignUp: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<SellerRegisterData>({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        storeName: '',
        storeDescription: '',
        businessAddress: '',
        securityQuestion: '',
        securityAnswer: '',
    });

    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChange = (e: React. ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target. value });
    };

    const validateStep1 = () => {
        if (!formData.email || ! formData.password || !formData.fullName) {
            setError('Veuillez remplir tous les champs obligatoires');
            return false;
        }
        if (formData.password. length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        if (formData.password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep2 = () => {
        if (!formData.storeName) {
            setError('Le nom de la boutique est obligatoire');
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep3 = () => {
        if (!formData.securityQuestion || !formData.securityAnswer) {
            setError('La question et réponse de sécurité sont obligatoires');
            return false;
        }
        setError(null);
        return true;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const prevStep = () => {
        setError(null);
        setStep((s) => Math.max(1, s - 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;

        try {
            setLoading(true);
            setError(null);
            const response = await authService.registerSeller(formData);

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.id,
                email: response.email,
                fullName: response.fullName,
                role: response.role,
                storeName: response. storeName,
            }));

            navigate('/seller/dashboard');
        } catch (err: any) {
            setError(err. response?.data?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const securityQuestions = [
        'Quel est le nom de votre premier animal de compagnie? ',
        'Quel est le nom de votre école primaire?',
        'Quel est le prénom de votre meilleur ami d\'enfance?',
        'Quelle est votre ville de naissance?',
        'Quel est le nom de jeune fille de votre mère?',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Devenir Vendeur
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Créez votre boutique et commencez à vendre sur MouadVision
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3]. map((s) => (
                        <React.Fragment key={s}>
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                                    step >= s
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}
                            >
                                {step > s ? '✓' : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-16 sm:w-24 h-1 transition ${
                                        step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Account Info */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Informations du Compte
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom Complet *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Votre nom complet"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="votre@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="+212 6XX XXX XXX"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Mot de passe *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData. password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Min.  6 caractères"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirmer *
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e. target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Confirmez le mot de passe"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Store Info */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Informations de la Boutique
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom de la Boutique *
                                    </label>
                                    <input
                                        type="text"
                                        name="storeName"
                                        value={formData.storeName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Ex: TechStore Maroc"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description de la Boutique
                                    </label>
                                    <textarea
                                        name="storeDescription"
                                        value={formData.storeDescription}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Décrivez votre boutique et ce que vous vendez..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Adresse Professionnelle
                                    </label>
                                    <input
                                        type="text"
                                        name="businessAddress"
                                        value={formData.businessAddress}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Votre adresse professionnelle"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Security */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Sécurité du Compte
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Question de Sécurité *
                                    </label>
                                    <select
                                        name="securityQuestion"
                                        value={formData.securityQuestion}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Sélectionnez une question</option>
                                        {securityQuestions.map((q) => (
                                            <option key={q} value={q}>{q}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Réponse de Sécurité *
                                    </label>
                                    <input
                                        type="text"
                                        name="securityAnswer"
                                        value={formData.securityAnswer}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Votre réponse"
                                    />
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                        <strong>Note:</strong> Cette question sera utilisée pour récupérer votre mot de passe en cas d'oubli.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex justify-between">
                            {step > 1 ?  (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Précédent
                                </button>
                            ) : (
                                <Link
                                    to="/signin"
                                    className="px-6 py-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                                    Déjà inscrit?
                                </Link>
                            )}

                            {step < 3 ?  (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Suivant
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && (
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    Créer mon Compte
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="text-center mt-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Vous êtes un acheteur? {' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                            Inscrivez-vous ici
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SellerSignUp;