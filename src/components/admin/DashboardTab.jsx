import React, { useState, useEffect } from 'react';
import { fetchDashboardStats, exportMembersReport } from '../../services/api';
import toast from 'react-hot-toast';

export default function DashboardTab() {
  const [stats, setStats] = useState({
    newMembersCount: 0,
    totalRevenue: 0,
    pendingAdminReviewCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboardStats(dateRange.startDate, dateRange.endDate);
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      toast.error('डैशबोर्ड डेटा लोड करने में विफल (Failed to load dashboard stats)');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    if (dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate) {
      toast.error('प्रारंभ तिथि अंतिम तिथि से पहले होनी चाहिए (Start date must be before end date)');
      return;
    }
    loadStats();
  };

  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    // setTimeout ensures state is cleared before fetching
    setTimeout(() => {
      loadStats();
    }, 0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportMembersReport(dateRange.startDate, dateRange.endDate);
      
      // Create a link element, hide it, direct it toward the blob, and then 'click' it
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `members_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('रिपोर्ट सफलतापूर्वक डाउनलोड हो गई! (Report downloaded!)');
    } catch (error) {
      toast.error('रिपोर्ट डाउनलोड करने में विफल (Failed to download report)');
    } finally {
      setExporting(false);
    }
  };

  const commonButtonClass = "px-6 py-2.5 text-white font-bold rounded-xl transition-all duration-300 shadow-lg active:scale-95 text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";

  return (
    <div className="min-h-full  from-indigo-50 via-fuchsia-50 to-orange-50 p-4 sm:p-8 lg:p-10 rounded-3xl font-sans">
      
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        {/* Header & Export Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500 tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-base text-gray-600 mt-2 font-medium">
              Track membership growth, revenue, and pending approvals.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`${commonButtonClass} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Downloading...' : 'Export CSV Report'}
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-indigo-100/50 border border-white">
          <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-gray-700 font-medium"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-gray-700 font-medium"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className={`${commonButtonClass} bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/30 flex-1 sm:flex-none`}
              >
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all shadow-sm active:scale-95 text-sm"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white shadow-xl shadow-teal-500/30 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-emerald-100 font-bold uppercase tracking-wider text-sm mb-2">Total Revenue</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black">₹</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {loading ? '...' : stats.totalRevenue?.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>
          </div>

          {/* New Members Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-blue-100 font-bold uppercase tracking-wider text-sm mb-2">Total Members</h3>
              <div className="text-4xl sm:text-5xl font-black tracking-tight">
                {loading ? '...' : stats.newMembersCount}
              </div>
            </div>
          </div>

          {/* Pending Reviews Card */}
          <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-500/30 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-orange-100 font-bold uppercase tracking-wider text-sm mb-2">Pending Reviews</h3>
              <div className="text-4xl sm:text-5xl font-black tracking-tight">
                {loading ? '...' : stats.pendingAdminReviewCount}
              </div>
              <p className="text-orange-100 text-sm mt-3 font-medium">Awaiting admin action</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}