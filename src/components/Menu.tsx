import { PiDatabase, PiGear, PiListBullets, PiTable, PiTrophy, PiUpload, PiUser } from 'react-icons/pi';

const menuItems = [
    { icon: <PiUpload size={20} />, label: '업로드' },
    { icon: <PiTrophy size={20} />, label: '베스트' },
    { icon: <PiListBullets size={20} />, label: '성과표' },
    { icon: <PiTable size={20} />, label: '서열표' },
    { icon: <PiDatabase size={20} />, label: '데이터베이스' },
];

const bottomMenuItems = [
    { icon: <PiUser size={20} />, label: '프로필' },
    { icon: <PiGear size={20} />, label: '설정' },
];

interface MenuProps {
    setSelectedPage: (pageName: string) => void;
}

const Menu: React.FC<MenuProps> = ({ setSelectedPage }) => (
    <nav className="flex flex-col h-full w-12 bg-[#F4F7FF]">
        <div className="flex flex-col items-center py-2 space-y-2">
            {menuItems.map((item, _) => (
                <button
                    onClick={() => setSelectedPage(item.label)}
                    key={item.label}
                    className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 flex items-center justify-center w-8 h-8 rounded transition-colors focus:outline-none"
                    title={item.label}
                >
                    {item.icon}
                </button>
            ))}
        </div>
        <div className="flex flex-col items-center py-2 space-y-2 mt-auto">
            {bottomMenuItems.map((item, _) => (
                <button
                    onClick={() => setSelectedPage(item.label)}
                    key={item.label}
                    className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 flex items-center justify-center w-8 h-8 rounded transition-colors focus:outline-none"
                    title={item.label}
                >
                    {item.icon}
                </button>
            ))}
        </div>
    </nav>
);

export default Menu;