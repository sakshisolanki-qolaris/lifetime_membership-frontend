import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicantsTab from "../components/admin/ApplicantsTab";
import MembersTab from "../components/admin/MembersTab";
import SettingsTab from "../components/admin/SettingsTab";
import DashboardTab from "../components/admin/DashboardTab";
export default function AdminDashboard() {
 const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 sm:p-8 font-sans relative print:bg-white print:p-0">
      {/* 1. FIX: Removed print:hidden from this wrapper so the modal can print */}
      <div className="max-w-7xl mx-auto">
        
        {/* 2. FIX: Added print:hidden here to hide the top header when printing */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-md mb-6 border-t-4 border-orange-500 print:hidden">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">एडमिन डैशबोर्ड</h1>
              <p className="text-indigo-600 font-semibold text-sm">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm border border-red-100">
            लॉग आउट (Logout)
          </button>
        </div>

{/* Tab Navigation Menu */}
      

        {/* 3. FIX: Added print:hidden here to hide the tabs when printing */}
        <div className="flex space-x-2 mb-6 print:hidden">
             <button 
            onClick={() => setActiveTab("dashboard")} 
            className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "dashboard" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            डैशबोर्ड (Overview)
          </button>
          <button onClick={() => setActiveTab("applicants")} className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "applicants" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            आवेदक (Applicants)
          </button>
          <button onClick={() => setActiveTab("members")} className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "members" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            सदस्य (Members)
          </button>
          <button onClick={() => setActiveTab("settings")} className={`px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm ${activeTab === "settings" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            सेटिंग्स (Settings)
          </button>
        </div>

        {/* 4. FIX: Removed shadows and borders during print to keep the paper clean */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 min-h-[400px] print:shadow-none print:border-none print:min-h-0 print:overflow-visible">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "applicants" && <ApplicantsTab />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}