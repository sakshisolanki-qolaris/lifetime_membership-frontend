import React, { useState } from "react";
import { updateMembershipFee } from "../../services/api";
import toast from "react-hot-toast";

export default function SettingsTab() {
  const [newFee, setNewFee] = useState("");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  const handleUpdateFee = async () => {
    if (!newFee || isNaN(newFee)) {
      toast.error("कृपया सही राशि दर्ज करें (Please enter a valid amount)");
      return;
    }
    setIsUpdatingFee(true);
    try {
      await updateMembershipFee(Number(newFee));
      toast.success("शुल्क सफलतापूर्वक अपडेट किया गया");
      setNewFee("");
    } catch (err) {
      toast.error("शुल्क अपडेट करने में विफल");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  return (
    <div className="p-8 sm:p-12">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">सिस्टम सेटिंग्स (System Settings)</h2>
      <p className="text-gray-500 mb-8">आजीवन सदस्यता के लिए सिस्टम-वाइड शुल्क बदलें।</p>
      <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 max-w-lg">
        <h3 className="text-lg font-bold text-orange-900 mb-4">सदस्यता शुल्क अद्यतन (Update Fee)</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-orange-800 mb-1">नया शुल्क (New Fee Amount ₹)</label>
            <input type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} className="w-full px-4 py-3 border border-orange-300 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm font-semibold text-gray-900" placeholder="e.g. 1500" />
          </div>
          <button onClick={handleUpdateFee} disabled={isUpdatingFee} className="w-full sm:w-auto bg-orange-600 text-white px-8 py-3 rounded-md font-bold hover:bg-orange-700 transition shadow-md disabled:opacity-50">
            {isUpdatingFee ? "Saving..." : "अपडेट करें"}
          </button>
        </div>
      </div>
    </div>
  );
}