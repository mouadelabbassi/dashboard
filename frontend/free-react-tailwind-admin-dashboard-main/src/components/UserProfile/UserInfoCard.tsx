import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";

// Admin profile data (static for Mouad El Abbassi)
const ADMIN_PROFILE = {
    email: "elabbassimouaad0@gmail.com",
    firstName: "Mouad",
    lastName: "El Abbassi",
    phone: "+212 635 - 737656",
    bio: "Data Engineer Student"
};

export default function UserInfoCard() {
    const { isOpen, openModal, closeModal } = useModal();
    const { user, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if current user is admin (Mouad)
    const isAdmin = user?.email === ADMIN_PROFILE.email;

    // Parse fullName into firstName and lastName
    const nameParts = user?.fullName?.split(' ') || ['', ''];
    const [firstName, setFirstName] = useState(nameParts[0] || '');
    const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [bio, setBio] = useState(user?.bio || '');

    useEffect(() => {
        if (user) {
            const parts = user.fullName?.split(' ') || ['', ''];
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
            setPhone(user.phone || '');
            setBio(user.bio || '');
        }
    }, [user]);

    const handleSave = async () => {
        setError("");
        setIsLoading(true);

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await updateUserProfile(fullName, phone, bio);
            closeModal();
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    // Display data based on user type
    const displayData = isAdmin ? {
        firstName: ADMIN_PROFILE.firstName,
        lastName: ADMIN_PROFILE.lastName,
        email: ADMIN_PROFILE.email,
        phone: ADMIN_PROFILE.phone,
        bio: ADMIN_PROFILE.bio
    } : {
        firstName: firstName,
        lastName: lastName,
        email: user?.email || '',
        phone: phone || 'Not provided',
        bio: bio || `${user?.role || 'User'}`
    };

    return (
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                        Personal Information
                    </h4>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                First Name
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {displayData.firstName}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                Last Name
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {displayData.lastName}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                Email address
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {displayData.email}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                Phone
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {displayData.phone}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                Bio / Role
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {displayData.bio}
                            </p>
                        </div>
                    </div>
                </div>

                {!isAdmin && (
                    <button
                        onClick={openModal}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:w-auto"
                    >
                        <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6328 5.74827 16.6328 4.32359 15.7541 3.44491L15.0911 2.78206Z"
                                fill=""
                            />
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Personal Information
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your details to keep your profile up-to-date.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 mx-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form className="flex flex-col">
                        <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div className="col-span-2 lg:col-span-1">
                                    <Label>First Name</Label>
                                    <Input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Last Name</Label>
                                    <Input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="text"
                                        value={user?.email || ''}
                                        disabled={true}
                                        hint="Email cannot be changed"
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Phone</Label>
                                    <Input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label>Bio</Label>
                                    <Input
                                        type="text"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label>Password</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="password"
                                            value="••••••••"
                                            disabled={true}
                                        />
                                        <Link
                                            to="/forgot-password"
                                            className="whitespace-nowrap text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                        >
                                            Change Password
                                        </Link>
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        To change your password, use the forgot password feature
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
