import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllMembers, toggleMemberStatus, fetchMemberById } from "../../services/api";
import toast from "react-hot-toast";
import MemberDetailModal from "./MemberDetailModal";

export default function MembersTab() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 🚀 TanStack Query for Fetching Members
  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const result = await fetchAllMembers();
      return result.data || result || [];
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "डेटा लोड करने में विफल (Failed to load).");
    }
  });

  // 🚀 TanStack Query for Updating Status
  const toggleMutation = useMutation({
    mutationFn: (id) => toggleMemberStatus(id),
    onSuccess: (response) => {
      toast.success(response?.message || "स्थिति अपडेट की गई (Status Updated)");
      // Automatically refresh the members list in the background!
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "स्थिति अपडेट करने में विफल");
    }
  });

  const handleToggleMemberStatus = (id, e) => {
    e.stopPropagation(); // Prevents the row click event when toggling status
    toggleMutation.mutate(id);
  };

  // Fetch full details when a row is clicked
  const handleRowClick = async (memberSummary) => {
    setLoadingDetails(true);
    try {
      const result = await fetchMemberById(memberSummary.id);
      setSelectedMember(result.data || result);
    } catch (error) {
      toast.error("सदस्य का विवरण लोड नहीं हो सका।");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return (
    <div className="p-16 text-center text-indigo-600 font-bold flex flex-col items-center">
      <svg className="animate-spin mb-4 h-8 w-8 text-orange-500" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      डेटा लोड हो रहा है...
    </div>
  );

  if (members.length === 0) return <div className="p-16 text-center text-gray-500 font-medium">कोई सदस्य नहीं मिला।</div>;

  return (
    <>
      <div className="overflow-x-auto relative">
        {/* Shows a loading spinner over the table while fetching details */}
        {loadingDetails && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">सदस्य (Member)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">भूमिका (Role)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">सक्रिय (Active Toggle)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {members.map((member) => (
              <tr 
                key={member.id} 
                onClick={() => handleRowClick(member)} 
                className="hover:bg-indigo-50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-gray-900 group-hover:text-indigo-700">{member.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{member.mobileNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${member.role === "PRESIDENT" ? "bg-purple-100 text-purple-800" : "bg-indigo-50 text-indigo-700"}`}>
                    {member.role === "PRESIDENT" ? "अध्यक्ष (President)" : "सदस्य (Member)"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleToggleMemberStatus(member.id, e)}
                      disabled={member.role === "PRESIDENT" || toggleMutation.isPending}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${member.isActive ? "bg-green-500" : "bg-gray-300"}`}
                      role="switch"
                      aria-checked={member.isActive}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${member.isActive ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                    <span className={`text-sm font-semibold ${member.isActive ? "text-green-700" : "text-gray-500"}`}>{member.isActive ? "सक्रिय" : "निष्क्रिय"}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render the Modal if a member is selected */}
      {selectedMember && (
        <MemberDetailModal 
          selectedMember={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}
    </>
  );
}