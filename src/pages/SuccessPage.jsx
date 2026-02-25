import React from 'react';
import { Link } from 'react-router-dom';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center border-t-8 border-green-500">
        
        {/* Green Checkmark Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
          अर्ज यशस्वीरीत्या जमा झाला! <br/>
          <span className="text-xl text-gray-600 font-medium">(Application Submitted)</span>
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          तुमचा अर्ज पडताळणीसाठी तुमच्या अनुमोदकाकडे (Proposer) पाठवण्यात आला आहे. अर्ज मंजूर झाल्यावर तुम्हाला पुढील माहिती ईमेलद्वारे पाठवली जाईल.
          <br/><br/>
          <span className="text-sm">
            (Your application has been sent to your proposer for verification. You will receive an email with further instructions once it is approved.)
          </span>
        </p>

        <Link 
          to="/" 
          className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Go Back to Home (मुख्य पृष्ठावर जा)
        </Link>
      </div>
    </div>
  );
}