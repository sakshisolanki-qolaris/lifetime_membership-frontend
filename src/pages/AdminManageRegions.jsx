import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllRegionsForAdmin,
  createRegionByAdmin,
  toggleRegionByAdmin,
} from "../services/api";
import toast from "react-hot-toast";

export default function ManageRegions() {
  const [regions, setRegions] = useState([]);
  const [newRegionName, setNewRegionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const res = await fetchAllRegionsForAdmin();
      if (res.success) {
        setRegions(res.data);
      }
    } catch (error) {
      console.error("Error loading regions:", error);
      toast.error("क्षेत्र लोड करने में विफल (Failed to load regions)");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegion = async (e) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    setActionLoading(true);
    try {
      const res = await createRegionByAdmin(newRegionName.trim());
      if (res.success) {
        toast.success("नया क्षेत्र जोड़ा गया (Region added successfully)");
        setNewRegionName("");
        setSearchTerm("");
        loadRegions();
      }
    } catch (error) {
      console.error("Error adding region:", error);
      toast.error(
        error.response?.data?.message ||
          "क्षेत्र जोड़ने में विफल (Failed to add region)",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleRegionByAdmin(id);
      if (res.success) {
        toast.success(res.message);
        setRegions(
          regions.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r,
          ),
        );
      }
    } catch (error) {
      console.error("Error toggling region status:", error);
      toast.error("स्थिति बदलने में विफल (Failed to toggle status)");
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Fixed: Extracted nested ternary into a clean, independent statement
  const renderRegionsList = () => {
    if (regions.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-gray-500 font-medium">
          कोई क्षेत्र नहीं मिला (No regions found)
        </div>
      );
    }

    if (filteredRegions.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-gray-500 font-medium">
          "{searchTerm}" से मेल खाने वाला कोई क्षेत्र नहीं मिला।
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200">
        {filteredRegions.map((region) => (
          <li
            key={region.id}
            className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50/50 transition-colors"
          >
            <div>
              <span className="font-bold text-gray-900 block">
                {region.name}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-wider border ${
                  region.isActive
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {region.isActive ? "सक्रिय (Active)" : "निष्क्रिय (Hidden)"}
              </span>
            </div>

            <button
              onClick={() => handleToggle(region.id)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors border shadow-sm ${
                region.isActive
                  ? "border-red-200 text-red-600 bg-white hover:bg-red-50"
                  : "border-green-200 text-green-700 bg-white hover:bg-green-50"
              }`}
            >
              {region.isActive ? "छुपाएं (Hide)" : "दिखाएं (Show)"}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center text-gray-500 animate-pulse">
        Loading regions...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 p-4 font-sans">
      {/* Back Button */}
      <div className="max-w-2xl w-full mb-4">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          डैशबोर्ड पर वापस जाएं (Back to Dashboard)
        </Link>
      </div>

      <div className="bg-white w-full rounded-2xl shadow-xl overflow-hidden border-t-4 border-emerald-500 max-w-2xl">
        <div className="p-6 sm:p-8 border-b border-gray-100 bg-emerald-50/30">
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            क्षेत्र प्रबंधन (Manage Regions)
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            फॉर्म में दिखाई देने वाले क्षेत्रों को जोड़ें या प्रबंधित करें।
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Add New Region Form */}
          <form
            onSubmit={handleAddRegion}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="flex-1">
              <label htmlFor="newRegion" className="sr-only">
                Add New Region
              </label>
              <input
                id="newRegion"
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="नए क्षेत्र का नाम (e.g., Tatibandh)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !newRegionName.trim()}
              className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap shadow-md"
            >
              {actionLoading ? "..." : "जोड़ें (Add)"}
            </button>
          </form>

          {/* Search Bar */}
          <div className="mb-4 relative">
            <label htmlFor="searchRegions" className="sr-only">
              Search Regions
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="searchRegions"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="क्षेत्र खोजें (Search regions...)"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Scrollable Regions List Container */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="max-h-[400px] overflow-y-auto">
              {renderRegionsList()}
            </div>
          </div>

          <div className="mt-3 text-right text-xs text-gray-400 font-medium">
            Total Regions: {filteredRegions.length}
          </div>
        </div>
      </div>
    </div>
  );
}
