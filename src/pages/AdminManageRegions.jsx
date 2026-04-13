import React, { useState, useEffect } from "react";
import {
  fetchAllRegionsForAdmin,
  createRegionByAdmin,
  toggleRegionByAdmin,
} from "../services/api";
import toast from "react-hot-toast";

export default function ManageRegions() {
  const [regions, setRegions] = useState([]);
  const [newRegionName, setNewRegionName] = useState("");
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
        loadRegions(); // Refresh list
      }
    } catch (error) {
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
        // Update local state without full reload for snappy UI
        setRegions(
          regions.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r,
          ),
        );
      }
    } catch (error) {
      toast.error("स्थिति बदलने में विफल (Failed to toggle status)");
    }
  };

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500 animate-pulse">
        Loading regions...
      </div>
    );

  return (
    <div className="flex justify-center">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          क्षेत्र प्रबंधन (Manage Regions)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          फॉर्म में दिखाई देने वाले क्षेत्रों को जोड़ें या प्रबंधित करें।
        </p>
      </div>

      {/* Add New Region Form */}
      <form onSubmit={handleAddRegion} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newRegionName}
          onChange={(e) => setNewRegionName(e.target.value)}
          placeholder="नए क्षेत्र का नाम (e.g., Tatibandh)"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
          required
        />
        <button
          type="submit"
          disabled={actionLoading || !newRegionName.trim()}
          className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
        >
          {actionLoading ? "..." : "जोड़ें (Add)"}
        </button>
      </form>

      {/* Regions List */}
      <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
        {regions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            कोई क्षेत्र नहीं मिला (No regions found)
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {regions.map((region) => (
              <li
                key={region.id}
                className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-gray-800 block">
                    {region.name}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                      region.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {region.isActive ? "सक्रिय (Active)" : "निष्क्रिय (Hidden)"}
                  </span>
                </div>

                <button
                  onClick={() => handleToggle(region.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors border ${
                    region.isActive
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {region.isActive ? "छुपाएं (Hide)" : "दिखाएं (Show)"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </div>
  );
}
