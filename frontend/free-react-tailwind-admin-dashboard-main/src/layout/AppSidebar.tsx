import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, GridIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);


type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    badge?: number;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/admin",
    },
    {
        icon: <CheckCircleIcon />,
        name: "Product Approvals",
        path: "/admin/product-approvals",
    },
    {
        icon: <GridIcon />,
        name: "Products Management",
        path: "/admin/products",
    },
    {
        icon: <UsersIcon />,
        name: "Seller Management",
        path: "/admin/sellers",
    },
];

const othersItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Notifications",
        path: "/admin/notifications",
    },
    {
        icon: <GridIcon />,
        name: "Profile",
        path: "/admin/profile",
    },
];

const AppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "others";
        index: number;
    } | null>(null);
    const [, setSubMenuHeight] = useState<Record<string, number>>({});
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const isActive = useCallback(
        (path: string) => location.pathname === path,
        [location.pathname]
    );

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://localhost:8080/api/admin/product-approvals/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPendingCount(data.data?.pendingApprovals || 0);
                }
            } catch (error) {
                console.error('Error fetching pending count:', error);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
        <ul className="flex flex-col gap-4">
            {items.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ?  (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`menu-item group ${
                                openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-active"
                                    : "menu-item-inactive"
                            } cursor-pointer ${
                                ! isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                            }`}
                        >
                            <span className={`menu-item-icon-size ${
                                openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ?  "menu-item-icon-active"
                                    : "menu-item-icon-inactive"
                            }`}>
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <>
                                    <span className="menu-item-text">{nav.name}</span>
                                    <ChevronDownIcon
                                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                            openSubmenu?.type === menuType && openSubmenu?.index === index
                                                ?  "rotate-180 text-brand-500"
                                                : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                to={nav.path}
                                className={`menu-item group ${
                                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                } ${! isExpanded && ! isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                            >
                                <span className={`menu-item-icon-size ${
                                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                                }`}>
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                                {nav.name === "Product Approvals" && pendingCount > 0 && (isExpanded || isHovered || isMobileOpen) && (
                                    <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        )
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200 
            ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0`}
            onMouseEnter={() => ! isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`py-8 flex ${! isExpanded && ! isHovered ?  "lg:justify-center" : "justify-start"}`}>
                <Link to="/admin">
                    {isExpanded || isHovered || isMobileOpen ?  (
                        <>
                            <img className="dark:hidden" src="/images/logo/MouadVision.png" alt="Logo" width={150} height={40} />
                            <img className="hidden dark:block" src="/images/logo/MouadVision.png" alt="Logo" width={150} height={40} />
                        </>
                    ) : (
                        <img src="/images/logo/logo.png" alt="Logo" width={300} height={300} />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                                ! isExpanded && ! isHovered ? "lg:justify-center" : "justify-start"
                            }`}>
                                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
                            </h2>
                            {renderMenuItems(navItems, "main")}
                        </div>
                        <div>
                            <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                            }`}>
                                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots className="size-6" />}
                            </h2>
                            {renderMenuItems(othersItems, "others")}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;