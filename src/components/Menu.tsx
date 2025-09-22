import { FaRegFile, FaSearch, FaCodeBranch, FaBug, FaCog } from 'react-icons/fa';

const menuItems = [
    { icon: <FaRegFile size={20} />, label: 'Explorer' },
    { icon: <FaSearch size={20} />, label: 'Search' },
    { icon: <FaCodeBranch size={20} />, label: 'Source Control' },
    { icon: <FaBug size={20} />, label: 'Run & Debug' },
    { icon: <FaCog size={20} />, label: 'Settings' },
];

const Menu = () => (
    <nav className="h-screen w-12 bg-[#F4F7FF] flex flex-col items-center py-2 space-y-2">
        {menuItems.map((item, idx) => (
            <button
                key={item.label}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 flex items-center justify-center w-8 h-8 rounded transition-colors focus:outline-none"
                title={item.label}
            >
                {item.icon}
            </button>
        ))}
    </nav>
);

export default Menu;