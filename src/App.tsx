import "./App.css";
import AppHeader from "./components/Header";
import Menu from "./components/Menu";

function App() {
  return (
    <div className="window-border w-full h-full flex flex-col overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden pr-2 pb-2">
        <Menu />
        <main className="flex-1 bg-white overflow-auto rounded-lg">
          {/* Main content goes here */}
        </main>
      </div>
    </div>
  );
}

export default App;