import React, { useState, useEffect } from "react";
import { TitleBar } from "./components/navigation/TitleBar";
import { NavBar, NavTab } from "./components/navigation/NavBar";
import { Home } from "./pages/Home";
import { AgentCenter } from "./pages/AgentCenter";
import { GmailCenter } from "./pages/GmailCenter";
import { FinanceCenter } from "./pages/FinanceCenter";
import { CodingCenter } from "./pages/CodingCenter";
import { ProductivityCenter } from "./pages/ProductivityCenter";
import { SettingsCenter } from "./pages/SettingsCenter";
import { initApiClient } from "./api/client";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  useEffect(() => {
    initApiClient();
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "agents":
        return <AgentCenter />;
      case "gmail":
        return <GmailCenter />;
      case "finance":
        return <FinanceCenter />;
      case "coding":
        return <CodingCenter />;
      case "productivity":
        return <ProductivityCenter />;
      case "settings":
        return <SettingsCenter />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020813] text-[#e0f7ff] overflow-hidden select-none">
      {/* 1. Custom Frameless Window TitleBar */}
      <TitleBar />

      {/* 2. Top Futuristic Navigation Orbit */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Center Workspace Screen */}
      <main className="flex-1 flex overflow-hidden relative">
        {renderActiveTab()}
      </main>
    </div>
  );
};

export default App;
