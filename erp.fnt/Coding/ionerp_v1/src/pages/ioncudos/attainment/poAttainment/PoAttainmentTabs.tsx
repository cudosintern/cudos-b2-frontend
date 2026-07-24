import React from "react";
import { TabKey } from "./poAttainmentTypes";

interface PoAttainmentTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "direct", label: "Direct Attainment" },
  { id: "extracurricular", label: "Extracurricular / Co-curricular Activity" },
  { id: "indirect", label: "Indirect Attainment" },
  { id: "directIndirect", label: "Direct and Indirect Attainment" },
];

const PoAttainmentTabs: React.FC<PoAttainmentTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-t-md border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "-mb-px border-gray-200 border-b-white bg-white text-gray-700"
                : "border-transparent bg-transparent text-[#1c8adb] hover:text-[#156fb0]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default PoAttainmentTabs;
