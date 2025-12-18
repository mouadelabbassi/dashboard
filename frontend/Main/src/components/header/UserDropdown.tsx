import { useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    const handleLogout = () => {
        logout();
        navigate("/signin");
    };

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
            >
                <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
                    <img src="/images/user/owner.jpg" alt="User" />
                </span>
                <span className="block mr-1 font-medium text-theme-sm">
                    {user?.fullName?.split(' ')[0] || 'User'}
                </span>
                <svg
                    className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    width="18"
                    height="20"
                    viewBox="0 0 18 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
            >
                <div>
                    <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                        {user?.fullName || 'User'}
                    </span>
                    <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                        {user?.email || ''}
                    </span>
                    <span className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        {user?.role || 'ADMIN'}
                    </span>
                </div>

                <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                    <li>
                        <DropdownItem
                            onItemClick={closeDropdown}
                            tag="a"
                            to="/admin/profile"
                            className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <svg
                                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.3798 17.617C19.6996 16.1192 20.5 14.1531 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3456 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.4812 7.25 9.24914 8.48206 9.24914 10C9.24914 11.5179 10.4812 12.75 11.9991 12.75C13.5171 12.75 14.7491 11.5179 14.7491 10C14.7491 8.48206 13.5171 7.25 11.9991 7.25ZM7.74914 10C7.74914 7.65364 9.65278 5.75 11.9991 5.75C14.3455 5.75 16.2491 7.65364 16.2491 10C16.2491 12.3464 14.3455 14.25 11.9991 14.25C9.65278 14.25 7.74914 12.3464 7.74914 10Z"
                                    fill=""
                                />
                            </svg>
                            Edit profile
                        </DropdownItem>
                    </li>
                </ul>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                    <svg
                        className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497V5.49609C20.7507 4.25345 19.7434 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74805H14.3507L14.3507 5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.915 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.915 19.247 18.5007 19.247H15.1007ZM10.7114 7.75264C10.4185 7.45975 9.94366 7.45975 9.65077 7.75264C9.35788 8.04554 9.35788 8.52041 9.65077 8.8133L11.8385 11.0011L3.25073 11.0011C2.83652 11.0011 2.50073 11.3369 2.50073 11.7511C2.50073 12.1653 2.83652 12.5011 3.25073 12.5011L11.8385 12.5011L9.65077 14.6888C9.35788 14.9817 9.35788 15.4566 9.65077 15.7495C9.94366 16.0424 10.4185 16.0424 10.7114 15.7495L14.2114 12.2495C14.5043 11.9566 14.5043 11.4817 14.2114 11.1888L10.7114 7.75264Z"
                            fill=""
                        />
                    </svg>
                    Sign out
                </button>
            </Dropdown>
        </div>
    );
}