import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";

const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
);

const ProductApprovalsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const ProductsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const PredictiveIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);


const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const NotificationsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const OrdersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const BoxIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
        icon: <DashboardIcon />,
        name: "Dashboard",
        path: "/admin",
    },
    {
        icon: <ProductApprovalsIcon />,
        name: "Product Approvals",
        path: "/admin/product-approvals",
    },
    {
        icon: <ProductsIcon />,
        name: "Products Management",
        path: "/admin/products",
    },
    {
        icon: <UsersIcon />,
        name: "Seller Management",
        path: "/admin/sellers",
    },
    {
        icon: <OrdersIcon  />,  // You can use a shopping cart or box icon
        name: "Orders",
        path: "/admin/orders",
    },
    {
        icon: <BoxIcon />,
        name: "Stock Management",
        path: "/admin/stock",
    },
    {
        icon: <PredictiveIcon />,
        name: "Analyse Prédictive",
        path: "/admin/predictions",
    },


];

const othersItems: NavItem[] = [
    {
        icon: <NotificationsIcon />,
        name: "Notifications",
        path: "/admin/notifications",
    },
    {
        icon: <ProfileIcon />,
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
                if (! token) return;

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
                                ! isExpanded && !isHovered ?  "lg:justify-center" : "lg:justify-start"
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
                                                ? "rotate-180 text-brand-500"
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
                                } ${!isExpanded && !isHovered ?  "lg:justify-center" : "lg:justify-start"}`}
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
            <div className={`py-8 flex ${! isExpanded && ! isHovered ? "lg:justify-center" : "justify-start"}`}>
                <Link to="/admin">
                    {isExpanded || isHovered || isMobileOpen ? (
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
                                !isExpanded && !isHovered ?  "lg:justify-center" : "justify-start"
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