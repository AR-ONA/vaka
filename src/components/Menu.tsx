import { PiDatabase, PiListBullets, PiTable, PiTrophy, PiUpload } from 'react-icons/pi';

const menuItems = [
    { icon: <PiUpload size={20} />, label: '업로드' },
    { icon: <PiTrophy size={20} />, label: '계산기' },
    { icon: <PiListBullets size={20} />, label: '성과표' },
    { icon: <PiTable size={20} />, label: '서열표' },
    { icon: <PiDatabase size={20} />, label: '데이터베이스' },
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