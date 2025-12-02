import { useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
import NotificationDropdown from "../components/header/NotificationDropdown";
import SmartSearchBar from "../components/SmartSearch/SmartSearchBar";

const AppHeader: React.FC = () => {
    const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

    const handleToggle = () => {
        if (window.innerWidth >= 1024) {
            toggleSidebar();
        } else {
            toggleMobileSidebar();
        }
    };

    const toggleApplicationMenu = () => {
        setApplicationMenuOpen(!isApplicationMenuOpen);
    };

    return (
        <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
                <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
                    <button
                        className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
                        onClick={handleToggle}
                        aria-label="Toggle Sidebar"
                    >
                        {isMobileOpen ?  (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L12 10.9403L16.7197 6.22065C17.0126 5.92775 17.4874 5.92775 17.7803 6.22065C18.0732 6.51354 18.0732 6.98841 17.7803 7.28131L13.0607 12L17.7803 16.7187C18.0732 17.0116 18.0732 17.4865 17.7803 17.7794C17.4874 18.0723 17.0126 18.0723 16.7197 17.7794L12 13.0597L7.28033 17.7794C6.98744 18.0723 6.51256 18.0723 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9393 12L6.21967 7.28131Z" fill="currentColor"/>
                            </svg>
                        ) : (
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75H1.33325C0.919038 1.75 0.583252 1.41421 0.583252 1ZM0.583252 6C0.583252 5.58579 0.919038 5.25 1.33325 5.25H14.6666C15.0808 5.25 15.4166 5.58579 15.4166 6C15.4166 6.41422 15.0808 6.75 14.6666 6.75H1.33325C0.919038 6.75 0.583252 6.41422 0.583252 6ZM1.33325 10.25C0.919038 10.25 0.583252 10.5858 0.583252 11C0.583252 11.4142 0.919038 11.75 1.33325 11.75H14.6666C15.0808 11.75 15.4166 11.4142 15.4166 11C15.4166 10.5858 15.0808 10.25 14.6666 10.25H1.33325Z" fill="currentColor"/>
                            </svg>
                        )}
                    </button>

                    <Link to="/admin" className="lg:hidden">
                        <img className="dark:hidden" src="./images/logo/MouadVision.png" alt="Logo" />
                        <img className="hidden dark:block" src="./images/logo/MouadVision.png" alt="Logo" />
                    </Link>

                    <button
                        onClick={toggleApplicationMenu}
                        className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951Z" fill="currentColor"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 10.4951C12.8284 10.4951 13.5 11.1667 13.5 11.9951V12.0051C13.5 12.8335 12.8284 13.5051 12 13.5051C11.1716 13.5051 10.5 12.8335 10.5 12.0051V11.9951C10.5 11.1667 11.1716 10.4951 12 10.4951Z" fill="currentColor"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M18.001 10.4951C18.8294 10.4951 19.501 11.1667 19.501 11.9951V12.0051C19.501 12.8335 18.8294 13.5051 18.001 13.5051C17.1726 13.5051 16.501 12.8335 16.501 12.0051V11.9951C16.501 11.1667 17.1726 10.4951 18.001 10.4951Z" fill="currentColor"/>
                        </svg>
                    </button>

                    {/* Smart Search Bar - Desktop */}
                    <div className="hidden lg:block flex-1 max-w-xl">
                        <SmartSearchBar
                            placeholder="Recherche intelligente... (ex: 'produits sous $50')"
                            className="w-full"
                        />
                    </div>
                </div>
                <div
                    className={`${
                        isApplicationMenuOpen ? "flex" : "hidden"
                    } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
                >
                    <div className="flex items-center gap-2 2xsm:gap-3">
                        <NotificationDropdown />
                        <ThemeToggleButton />
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
};

export default AppHeader;