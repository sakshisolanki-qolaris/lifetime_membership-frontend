import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { createPaymentOrder, verifyPayment, checkPaymentStatus, fetchCurrentFee, fetchApplicantById } from '../services/api';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const { applicant_id: paramId } = useParams();
  const applicant_id = paramId || searchParams.get('applicant_id');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // --- FEE STATES ---
  const [baseFee, setBaseFee] = useState(1500); // Default base membership fee
  const REGISTRATION_FEE = 10; // Fixed registration fee
  const totalAmount = baseFee + REGISTRATION_FEE; // Calculated total
  
  // --- NEW STATES FOR THE 2-STEP FLOW ---
  const [step, setStep] = useState('review'); // 'review' or 'payment'
  const [applicantDetails, setApplicantDetails] = useState(null);

  useEffect(() => {
    if (!applicant_id) {
      setPageLoading(false);
      return;
    }
    
    const initializePage = async () => {
      try {
        // 1. Fetch Applicant Details for the Review Step
        const appRes = await fetchApplicantById(applicant_id);
        setApplicantDetails(appRes.data || appRes);

        // 2. Fetch Dynamic Base Fee (This is what the admin changes, e.g., 1500 or 1600)
        const feeRes = await fetchCurrentFee();
        if (feeRes?.data?.fee) setBaseFee(feeRes.data.fee); 
        else if (feeRes?.fee) setBaseFee(feeRes.fee);      

        // 3. Check if already paid
        const statusRes = await checkPaymentStatus(applicant_id);
        if (statusRes.isPaid) setIsPaid(true);

      } catch (err) {
        console.error("Could not load data", err);
        toast.error("Failed to load application details.");
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [applicant_id]);

  const handlePayment = async () => {
    if (isPaid) return; 

    setLoading(true);
    try {
      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const orderRes = await createPaymentOrder(applicant_id);
      
      // FIX: Destructure the exact keys coming from your backend (camelCase)
      const { orderId, amountInPaise, currency, keyId } = orderRes.data;

      const options = {
        key: keyId, // Use keyId from backend
        amount: amountInPaise, // Use amountInPaise from backend
        currency: currency,
        name: "Maharashtra Mandal",
        description: "Lifetime Membership + Registration Fee",
        order_id: orderId, // Razorpay SDK *requires* snake_case 'order_id' here, but we pass our camelCase 'orderId' variable into it
        theme: { color: "#ea580c" }, 
        
        handler: async function (response) {
          setVerifying(true);
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success("Payment Verified Successfully! (भुगतान सफलतापूर्वक सत्यापित!)");
            setIsPaid(true); 

          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed.");
          } finally {
            setVerifying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
      if (error.response?.status === 400 && error.response?.data?.message?.toLowerCase().includes("paid")) {
        setIsPaid(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!applicant_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center border-t-8 border-red-500 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">अमान्य लिंक <br/>(Invalid Link)</h2>
          <p className="text-gray-600">यह भुगतान लिंक टूटा हुआ है या इसमें आवेदक आईडी गायब है।</p>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <h3 className="text-xl font-bold text-gray-700">जानकारी लोड की जा रही है...</h3>
        <p className="text-gray-500 text-sm mt-1">(Loading information...)</p>
      </div>
    );
  }

  // A tiny helper component just for rendering the read-only boxes
  const DetailBox = ({ label, value }) => (
    <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
      <p className="text-xs font-bold text-orange-600 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-start justify-center font-sans">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-xl overflow-hidden border-t-8 border-orange-600 relative">
        
        {verifying && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 text-center">भुगतान सत्यापित किया जा रहा है... <br/>(Verifying Payment...)</h3>
            <p className="text-gray-600 text-sm mt-2 font-medium">कृपया इस विंडो को बंद न करें। <br/>(Please do not close this window.)</p>
          </div>
        )}

        {isPaid ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">भुगतान सफल!<br/><span className="text-2xl">(Payment Successful!)</span></h2>
            <p className="text-gray-600 mb-6 mt-4">
              धन्यवाद! आपका आजीवन सदस्यता शुल्क प्राप्त हो गया है। अब आप आधिकारिक तौर पर महाराष्ट्र मंडल के सदस्य हैं।
            </p>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-8 text-left">
              <p className="text-sm text-gray-500">लेनदेन की स्थिति (Status): <span className="font-bold text-green-600 float-right">सत्यापित (Verified)</span></p>
              <div className="border-t border-gray-200 my-2"></div>
              <p className="text-sm text-gray-500">भुगतान की गई राशि (Total Amount): <span className="font-bold text-gray-900 float-right">₹{totalAmount}.00</span></p>
            </div>
            <Link to="/" className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors">
              मुख्य पृष्ठ पर लौटें (Return to Home)
            </Link>
          </div>
        ) : (
          <>
            {/* --- STEP 1: REVIEW FORM --- */}
            {step === 'review' && (
              <div className="p-6 sm:p-8 animate-in fade-in">
                <div className="text-center mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-extrabold text-gray-900">अपने विवरण की जाँच करें</h2>
                  <p className="text-gray-500 mt-1 text-sm font-semibold uppercase tracking-wider">Step 1: Review Your Application</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* FIX: Use applicantDetails.fullName instead of full_name */}
                  <div className="sm:col-span-2"><DetailBox label="पूर्ण नाम (Full Name)" value={applicantDetails?.fullName} /></div>
                  <DetailBox label="पिता/पति का नाम (Father/Husband)" value={applicantDetails?.fatherOrHusbandName} />
                  <DetailBox label="लिंग (Gender)" value={applicantDetails?.gender} />
                  <DetailBox label="मोबाईल (Mobile Number)" value={applicantDetails?.mobileNumber} />
                  <DetailBox label="ई-मेल (Email)" value={applicantDetails?.email} />
                  <DetailBox label="जन्म तिथि (DOB)" value={applicantDetails?.dateOfBirth} />
                  <DetailBox label="विवाह तिथि (Marriage Date)" value={applicantDetails?.marriageDate || "N/A"} />
                  <DetailBox label="रक्त गट (Blood Group)" value={applicantDetails?.bloodGroup || "N/A"} />
                  <DetailBox label="शैक्षणिक योग्यता (Education)" value={applicantDetails?.education} />

                  <DetailBox label="From Raipur?" value={applicantDetails?.isFromRaipur ? 'Yes' : 'No'} />
                  {applicantDetails?.isFromRaipur && (
                    <DetailBox label="Region" value={applicantDetails?.region} />
                  )}

                  <DetailBox label="वर्तमान पता (Current Address)" value={applicantDetails?.currentAddress} /> 
                  <DetailBox label="स्थाई पता (Permanent Address)" value={applicantDetails?.permanentAddress} />      
                     
                  {/* FIX: Use applicantDetails.officeAddress instead of office_address */}
                  {applicantDetails?.officeAddress && (
                    <DetailBox label="कार्यालय का पता (Office Address)" value={applicantDetails?.officeAddress} />
                  )}
                </div>
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-lg text-lg font-extrabold text-white bg-orange-600 hover:bg-orange-700 transition-all"
                >
                  विवरण सही हैं - भुगतान के लिए आगे बढ़ें (Proceed to Pay)
                </button>
                <p className="text-center text-xs text-red-500 mt-4 font-medium">
                  यदि ऊपर दिए गए विवरण में कोई गलती है, तो भुगतान न करें और कार्यालय से संपर्क करें। <br/>
                  (If there is any mistake above, do not pay and contact the office.)
                </p>
              </div>
            )}

            {/* --- STEP 2: PAYMENT SCREEN --- */}
            {step === 'payment' && (
              <div className="p-6 sm:p-8 animate-in slide-in-from-right-8 fade-in">
                
                {/* Back Button */}
                <button onClick={() => setStep('review')} className="text-sm font-bold text-gray-500 hover:text-orange-600 mb-6 flex items-center gap-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  वापस जाएँ (Back to Review)
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-gray-900">सदस्यता पक्की करें</h2>
                  <p className="text-gray-500 mt-1 text-sm font-semibold uppercase tracking-wider">Step 2: Finalize Membership Payment</p>
                </div>

                <div className="bg-orange-50/50 rounded-lg p-6 border border-orange-100 mb-8">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-orange-200 pb-2">
                    ऑर्डर सारांश (Order Summary)
                  </h3>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600 text-sm font-medium">Applicant Name</span>
                     {/* FIX: Use applicantDetails.fullName instead of full_name */}
                     <span className="text-gray-900 font-bold">{applicantDetails?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-orange-200 border-dashed">
                     <span className="text-gray-600 text-sm font-medium">Membership Type</span>
                     <span className="text-gray-900 font-bold">Lifetime (आजीवन)</span>
                  </div>

                  {/* FEE BREAKDOWN */}
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600 text-sm font-medium">सदस्यता शुल्क (Membership Fee)</span>
                     <span className="text-gray-900 font-bold">₹{baseFee}.00</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-orange-200 border-dashed">
                     <span className="text-gray-600 text-sm font-medium">पंजीकरण शुल्क (Registration Fee)</span>
                     <span className="text-gray-900 font-bold">₹{REGISTRATION_FEE}.00</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-gray-900">कुल राशि<br/><span className="text-sm">(Total Amount)</span></span>
                    <span className="text-3xl font-black text-orange-600">₹{totalAmount}.00</span>
                  </div>
                </div>

                <button 
                  onClick={handlePayment} 
                  disabled={loading}
                  className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-lg text-lg font-extrabold text-white transition-all 
                    ${loading ? "bg-orange-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-xl"}
                  `}
                >
                  {loading ? "Connecting to Bank..." : `₹${totalAmount} का भुगतान करें (Pay Now)`}
                </button>
                
                <p className="text-center text-xs text-gray-500 mt-4 flex flex-col items-center justify-center gap-1">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    Secure Payment via Razorpay
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}