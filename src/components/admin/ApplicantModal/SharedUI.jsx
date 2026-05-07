import React from "react";
import PropTypes from "prop-types";

export const DetailItem = ({ label, value }) => (
  <div className="bg-transparent">
    <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wide print:text-gray-600">
      {label}
    </p>
    <p className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1 print:border-black print:text-base">
      {value || "N/A"}
    </p>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
};

export const EditInput = ({ label, name, value, onChange, type = "text" }) => {
  const id = `edit_${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-orange-800 mb-1 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-orange-500 font-semibold text-gray-900"
      />
    </div>
  );
};

EditInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
};

export const EditSelect = ({ label, name, value, onChange, children }) => {
  const id = `edit_${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-orange-800 mb-1 uppercase"
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-orange-500 font-semibold text-gray-900 bg-white"
      >
        <option value="">Select...</option>
        {children}
      </select>
    </div>
  );
};

EditSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
