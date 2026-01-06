import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";

const ADMIN_PROFILE = {
    email: "elabbassimouaad0@gmail.com",
    fullName: "Mouad El Abbassi",
    title: "Data Engineer Student",
    location: "Casablanca, Morocco",
    avatar: "/images/user/owner.jpg",
    social: {
        facebook: "https://www.facebook.com/",
        twitter: "https://x.com/MouadElAbbassi2",
        linkedin: "https://www.linkedin.com/in/mouad-el-abbassi-57580b251",
        instagram: "https://instagram.com/mouadelabbassi_"
    }
};

export default function UserMetaCard() {
    const { isOpen, openModal, closeModal } = useModal();
    const { user, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isAdmin = user?.email === ADMIN_PROFILE.email;

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

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrator';
            case 'ANALYST': return 'Data Analyst';
            case 'BUYER': return 'Buyer';
            default: return role;
        }
    };

    const displayData = isAdmin ? {
        fullName: ADMIN_PROFILE.fullName,
        title: ADMIN_PROFILE.title,
        location: ADMIN_PROFILE.location,
        avatar: ADMIN_PROFILE.avatar
    } : {
        fullName: user?.fullName || 'User',
        title: user?.bio || getRoleDisplay(user?.role || 'BUYER'),
        location: '',
        avatar: '/images/user/default-avatar.png'
    };

    return (
        <>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                            <img
                                src={displayData.avatar}
                                alt="user"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/user/default-avatar.png';
                                }}
                            />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                {displayData.fullName}
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {displayData.title}
                                </p>
                                {displayData.location && (
                                    <>
                                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {displayData.location}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                                <a
                                    href={ADMIN_PROFILE.social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                                >
                                    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58366V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z" fill="" />
                                    </svg>
                                </a>

                                <a
                                    href={ADMIN_PROFILE.social.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                                >
                                    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23078L14.2033 16.475Z" fill="" />
                                    </svg>
                                </a>

                                <a
                                    href={ADMIN_PROFILE.social.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                                >
                                    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48517 2.47366 4.16381 2.48978C5.06989 2.51113 5.78432 3.26024 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0671V12.0248C11.0671 8.97478 15.0421 8.69145 15.0421 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0671 8.46645L11.1005 7.06645Z" fill="" />
                                    </svg>
                                </a>

                                <a
                                    href={ADMIN_PROFILE.social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                                >
                                    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3981 3.52822 17.6842 3.99213 17.896 4.54129C18.1023 5.07268 18.2426 5.67762 18.2835 6.56427C18.294 6.78656 18.3023 6.97087 18.3089 7.15775L18.3135 7.31949C18.326 7.73017 18.3309 8.20538 18.3325 9.14325L18.3332 9.76562V10.857C18.3348 11.5549 18.3289 12.2528 18.3151 12.9505L18.3106 13.1122C18.304 13.2991 18.2956 13.4834 18.2852 13.7057C18.2443 14.5924 18.1015 15.1965 17.896 15.7287C17.6842 16.2779 17.3981 16.7418 16.9349 17.205C16.4717 17.6682 16.0078 17.9543 15.4586 18.1661C14.9273 18.3724 14.3224 18.5126 13.4357 18.5536C13.2134 18.564 13.0291 18.5724 12.8422 18.579L12.6805 18.5835C12.2698 18.5958 11.7946 18.6008 10.8567 18.6026L10.2343 18.6033H9.14324C8.44529 18.6049 7.74735 18.5989 7.04965 18.5852L6.88791 18.5806C6.68949 18.5735 6.49118 18.5648 6.29299 18.5544C5.40632 18.5135 4.80215 18.3715 4.26982 18.1661C3.72065 17.9543 3.25673 17.6682 2.79353 17.205C2.33034 16.7418 2.0451 16.2779 1.8324 15.7287C1.62615 15.1973 1.48587 14.5924 1.44491 13.7057L1.43962 13.544L1.43514 13.3822C1.42108 12.6846 1.4148 11.9867 1.41629 11.2887V9.14325C1.41449 8.44534 1.42056 7.74743 1.43432 7.04978L1.43879 6.88802C1.44544 6.70114 1.45379 6.51685 1.46408 6.29456C1.50505 5.4079 1.64615 4.80378 1.85241 4.27157C2.06421 3.72227 2.35034 3.25835 2.81354 2.79503C3.27673 2.3317 3.74065 2.04558 4.28982 1.8337C4.82121 1.62745 5.42615 1.48718 6.31279 1.44621C6.53508 1.43591 6.71938 1.42755 6.90627 1.42091L7.06799 1.41643C7.76555 1.40237 8.46343 1.39609 9.16129 1.39757L10.8567 1.66699ZM9.99962 5.83366C8.89456 5.83366 7.83475 6.27258 7.05335 7.05398C6.27195 7.83538 5.83304 8.89519 5.83304 10.0003C5.83304 11.1053 6.27195 12.1651 7.05335 12.9465C7.83475 13.7279 8.89456 14.1668 9.99962 14.1668C11.1047 14.1668 12.1645 13.7279 12.9459 12.9465C13.7273 12.1651 14.1662 11.1053 14.1662 10.0003C14.1662 8.89519 13.7273 7.83538 12.9459 7.05398C12.1645 6.27258 11.1047 5.83366 9.99962 5.83366ZM9.99962 7.50033C10.6628 7.50033 11.2988 7.76372 11.7676 8.23257C12.2365 8.70141 12.4999 9.33749 12.4999 10.0007C12.4999 10.6638 12.2365 11.2999 11.7676 11.7687C11.2988 12.2376 10.6628 12.501 9.99962 12.501C9.33652 12.501 8.70044 12.2376 8.23159 11.7687C7.76275 11.2999 7.49936 10.6638 7.49936 10.0007C7.49936 9.33749 7.76275 8.70141 8.23159 8.23257C8.70044 7.76372 9.33652 7.50033 9.99962 7.50033ZM14.3746 4.58366C14.0408 4.58366 13.7207 4.71641 13.4847 4.95239C13.2487 5.18838 13.1159 5.50853 13.1159 5.8423C13.1159 6.17608 13.2487 6.49622 13.4847 6.73221C13.7207 6.9682 14.0408 7.10094 14.3746 7.10094C14.7084 7.10094 15.0285 6.9682 15.2645 6.73221C15.5005 6.49622 15.6332 6.17608 15.6332 5.8423C15.6332 5.50853 15.5005 5.18838 15.2645 4.95239C15.0285 4.71641 14.7084 4.58366 14.3746 4.58366Z" fill="" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* Role badge for non-admin users */}
                        {!isAdmin && (
                            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                        user?.role === 'ANALYST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                    {getRoleDisplay(user?.role || 'BUYER')}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isAdmin && (
                        <button
                            onClick={openModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:w-auto"
                        >
                            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6328 5.74827 16.6328 4.32359 15.7541 3.44491L15.0911 2.78206Z" fill="" />
                            </svg>
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit Profile
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

                                <div className="col-span-2">
                                    <Label>Bio</Label>
                                    <Input
                                        type="text"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself"
                                    />
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
        </>
    );
}
