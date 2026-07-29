import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Check, X, ShieldCheck, RefreshCw, Image as ImageIcon, ExternalLink, Calendar, User, Phone, Mail, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { IPayment, IOrder, IDeliveredCredential } from '../../types';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTrx, setSearchTrx] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Verification modal state
  const [selectedPayment, setSelectedPayment] = useState<IPayment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'image' | null>(null);
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string>('');
  const [credentials, setCredentials] = useState<IDeliveredCredential[]>([
    { label: 'Login Email / Account', value: '' },
    { label: 'Password / Profile PIN', value: '' },
  ]);
  const [deliveryInstructions, setDeliveryInstructions] = useState('Please log in using the credentials provided above.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();

    const socket = getSocket();
    socket.emit('join_admin');

    const handleRealtimeUpdate = () => {
      fetchPayments();
    };

    socket.on('new-order', handleRealtimeUpdate);
    socket.on('payment-approved', handleRealtimeUpdate);
    socket.on('payment-rejected', handleRealtimeUpdate);
    socket.on('pending-order-count', handleRealtimeUpdate);

    return () => {
      socket.off('new-order', handleRealtimeUpdate);
      socket.off('payment-approved', handleRealtimeUpdate);
      socket.off('payment-rejected', handleRealtimeUpdate);
      socket.off('pending-order-count', handleRealtimeUpdate);
    };
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = `/payments?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (searchTrx.trim()) url += `search=${encodeURIComponent(searchTrx.trim())}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleOpenApproveModal = (pay: IPayment) => {
    setSelectedPayment(pay);
    setActionType('approve');
    setCredentials([
      { label: 'Login Email / Account', value: '' },
      { label: 'Password / Profile PIN', value: '' },
    ]);
    setDeliveryInstructions('Please log in using the credentials provided above.');
  };

  const handleOpenRejectModal = (pay: IPayment) => {
    setSelectedPayment(pay);
    setActionType('reject');
    setRejectionReason('TrxID not found in merchant wallet portal or amount mismatch.');
  };

  const handleViewScreenshot = (url: string) => {
    setViewScreenshotUrl(url);
    setActionType('image');
  };

  const handleExecuteApprove = async () => {
    if (!selectedPayment) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/payments/${selectedPayment._id}/approve`, {
        deliveredCredentials: credentials,
        deliveryInstructions,
      });

      if (res.data.success) {
        setSelectedPayment(null);
        setActionType(null);
        toast.success(res.data.message || 'Payment approved & credentials delivered!');
        fetchPayments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedPayment) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/payments/${selectedPayment._id}/reject`, {
        rejectionReason,
      });

      if (res.data.success) {
        setSelectedPayment(null);
        setActionType(null);
        toast.success(res.data.message || 'Payment rejected');
        fetchPayments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-pink-400" /> Payment Verification Queue (MongoDB)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete customer mobile banking payment verification details fetched directly from MongoDB
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'verified', label: 'Verified' },
            { id: 'rejected', label: 'Rejected' },
            { id: '', label: 'All Payments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                statusFilter === tab.id
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search Transaction ID, Sender Phone, Order #..."
            value={searchTrx}
            onChange={(e) => setSearchTrx(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-20 py-2.5 focus:outline-none focus:border-pink-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg"
          >
            Search
          </button>
        </form>

        <button
          onClick={fetchPayments}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Payment Queue List */}
      {loading ? (
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
          Loading MongoDB payment records...
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="font-bold text-slate-300">No payment records found matching criteria.</p>
          <p className="text-slate-500 text-[11px]">All submitted customer mobile wallet payments are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {payments.map((pay) => {
            const ord = typeof pay.order === 'object' && pay.order ? (pay.order as IOrder) : null;
            const usr = typeof pay.user === 'object' && pay.user ? (pay.user as any) : null;

            const custName = ord?.customerName || usr?.name || 'N/A';
            const custEmail = ord?.customerEmail || usr?.email || 'N/A';
            const custPhone = ord?.customerPhone || usr?.phone || pay.senderPhone || 'N/A';

            const prodNames = ord?.items && ord.items.length > 0 ? ord.items.map((i) => i.title).join(', ') : 'Subscription Product';
            const subPlan =
              ord?.items && ord.items.length > 0
                ? ord.items.map((i) => `${i.duration || '1 Month'} (${i.accessType || 'Shared'})`).join(', ')
                : '1 Month Standard';

            const screenshotUrl = pay.paymentScreenshot || ord?.paymentScreenshot || '';

            return (
              <div
                key={pay._id}
                className="bg-[#09090b] border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition space-y-4"
              >
                {/* Header Row: TrxID, Status, Payment Method, Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-pink-400 tracking-wider">
                      TrxID: {pay.transactionId}
                    </span>
                    <span
                      className={`px-3 py-1 font-extrabold text-xs rounded-lg ${
                        pay.paymentMethod === 'bKash'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : pay.paymentMethod === 'Nagad'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {pay.paymentMethod}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-black uppercase rounded-lg border ${
                        pay.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : pay.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {pay.status === 'pending' ? '🟡 Pending Review' : pay.status === 'verified' ? '🟢 Verified' : '🔴 Rejected'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Submitted: {new Date(pay.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Complete Payment & Customer Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Customer Info Card */}
                  <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-400" /> Customer Info
                    </p>
                    <div>
                      <p className="text-white font-bold text-sm">{custName}</p>
                      <p className="text-slate-400 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3 text-slate-500" /> {custEmail}
                      </p>
                      <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" /> {custPhone}
                      </p>
                    </div>
                  </div>

                  {/* Order & Product Info Card */}
                  <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-400" /> Order & Product Info
                    </p>
                    <p className="text-slate-300">
                      Order ID: <strong className="font-mono text-sky-400 font-bold">#{ord?.orderNumber || 'N/A'}</strong>
                    </p>
                    <p className="text-white font-bold truncate">{prodNames}</p>
                    <p className="text-slate-400">
                      Subscription Plan: <strong className="text-indigo-300 font-semibold">{subPlan}</strong>
                    </p>
                  </div>

                  {/* Payment Wallet Info Card */}
                  <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Mobile Wallet Info
                    </p>
                    <p className="text-slate-300">
                      Sender Number: <strong className="font-mono text-white text-sm font-bold">{pay.senderPhone}</strong>
                    </p>
                    <p className="text-slate-300">
                      Amount Paid: <strong className="text-emerald-400 text-base font-black">৳{pay.amount}</strong>
                    </p>
                    {screenshotUrl ? (
                      <button
                        onClick={() => handleViewScreenshot(screenshotUrl)}
                        className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold text-xs underline mt-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Payment Screenshot
                      </button>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No screenshot attached</p>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  {pay.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleOpenRejectModal(pay)}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Reject Payment
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(pay)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" /> Approve & Verify
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 italic font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Processed & Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {selectedPayment && actionType === 'approve' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Approve Payment TrxID: {selectedPayment.transactionId}</h3>
            <p className="text-xs text-slate-400">
              Confirming this payment will mark it as <strong>Verified</strong> and deliver access credentials to the customer.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <p className="text-slate-400">
                Wallet: <span className="text-white font-bold">{selectedPayment.paymentMethod}</span> | Amount: <span className="text-emerald-400 font-bold">৳{selectedPayment.amount}</span>
              </p>
              <p className="text-slate-400">Sender Phone: <span className="text-white font-mono">{selectedPayment.senderPhone}</span></p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Deliver Credentials (Account Email, Password, PIN):</label>
              {credentials.map((cred, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Profile PIN)"
                    value={cred.label}
                    onChange={(e) => {
                      const updated = [...credentials];
                      updated[idx].label = e.target.value;
                      setCredentials(updated);
                    }}
                    className="w-1/3 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 1234)"
                    value={cred.value}
                    onChange={(e) => {
                      const updated = [...credentials];
                      updated[idx].value = e.target.value;
                      setCredentials(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteApprove}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {submitting ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedPayment && actionType === 'reject' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Reject Payment TrxID: {selectedPayment.transactionId}</h3>
            <p className="text-xs text-slate-400">
              Provide a rejection reason. The order will be cancelled and user notified immediately.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Rejection *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
                required
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReject}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {actionType === 'image' && viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payment Proof Screenshot</h4>
              <button
                onClick={() => {
                  setActionType(null);
                  setViewScreenshotUrl('');
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center bg-slate-950 p-2 rounded-xl border border-slate-800 overflow-hidden">
              <img
                src={viewScreenshotUrl}
                alt="Payment Screenshot"
                className="max-h-96 w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
