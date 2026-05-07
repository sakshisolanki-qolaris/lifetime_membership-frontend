import React from "react";
import PropTypes from "prop-types";

export default function DocumentPreview({
  previewImage,
  isZoomed,
  setIsZoomed,
  setPreviewImage,
}) {
  if (!previewImage) return null;

  return (
    <>
      <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 relative flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800 shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <span className="text-slate-300 font-semibold text-sm tracking-wide">
              Document Preview
            </span>
            <span className="bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-700 hidden xl:block">
              Double-click to Zoom
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title={isZoomed ? "Zoom Out" : "Zoom In"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isZoomed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                )}
              </svg>
            </button>
            <a
              href={previewImage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Open full size in new tab"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <button
              onClick={() => setPreviewImage(null)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Close Preview"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center overflow-auto relative bg-slate-800/30">
          <img
            src={previewImage}
            alt="Document Preview"
            onDoubleClick={() => setIsZoomed(!isZoomed)}
            className={`max-w-full max-h-full object-contain rounded drop-shadow-2xl transition-transform duration-300 origin-center ${isZoomed ? "scale-[2.0] cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
          />
        </div>
      </div>

      <div className="lg:hidden absolute inset-0 z-50 bg-slate-900 flex flex-col">
        <div className="flex justify-end p-4 bg-slate-950">
          <button
            onClick={() => setPreviewImage(null)}
            className="text-white bg-slate-800 p-2 rounded-full"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <img
            src={previewImage}
            alt="Document Preview Full Size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </>
  );
}

DocumentPreview.propTypes = {
  previewImage: PropTypes.string,
  isZoomed: PropTypes.bool.isRequired,
  setIsZoomed: PropTypes.func.isRequired,
  setPreviewImage: PropTypes.func.isRequired,
};
