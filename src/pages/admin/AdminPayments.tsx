import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Check, X, ShieldCheck, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { IPayment, IOrder, IDeliveredCredential } from '../../types';
import api from '../../lib/api';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTrx, setSearchTrx] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Verification modal state
  const [selectedPayment, setSelectedPayment] = useState<IPayment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [credentials, setCredentials] = useState<IDeliveredCredential[]>([
    { label: 'Login Email / Account', value: '' },
    { label: 'Password / Profile PIN', value: '' },
  ]);
  const [deliveryInstructions, setDeliveryInstructions] = useState('Please log in using the credentials above.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
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
    setRejectionReason('TrxID not found in mobile banking portal or amount mismatched.');
  };

  const handleExecuteApprove = async () => {
    if (!selectedPayment) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/payments/${selectedPayment._id}/approve`, {
        deliveredCredentials: credentials,
        deliveryInstructions,
      });

      if (res.data.success) {
        setSelectedPayment(null);
        setActionType(null);
        fetchPayments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedPayment) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/payments/${selectedPayment._id}/reject`, {
        rejectionReason,
      });

      if (res.data.success) {
        setSelectedPayment(null);
        setActionType(null);
        fetchPayments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject payment');
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
            Audit bKash, Nagad & Rocket mobile wallet submissions against backend records
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
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
          className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
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
        <div className="space-y-4">
          {payments.map((pay) => {
            const ord = typeof pay.order === 'object' ? pay.order : null;
            return (
              <div
                key={pay._id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition shadow-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-pink-400">TrxID: {pay.transactionId}</span>
                    <span
                      className={`px-2.5 py-0.5 font-bold text-[10px] rounded ${
                        pay.paymentMethod === 'bKash'
                          ? 'bg-pink-500/20 text-pink-300'
                          : pay.paymentMethod === 'Nagad'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {pay.paymentMethod}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                        pay.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : pay.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Sender Phone: <strong className="font-mono text-white">{pay.senderPhone}</strong> | Payable Amount: <strong className="text-emerald-400 font-extrabold">৳{pay.amount}</strong>
                  </p>

                  {ord && (
                    <p className="text-xs text-slate-400">
                      Order #: <strong className="text-sky-400 font-mono">#{ord.orderNumber}</strong> | Customer: <strong className="text-white">{ord.customerName}</strong> ({ord.customerPhone})
                    </p>
                  )}

                  <p className="text-[10px] text-slate-500">Submitted: {new Date(pay.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  {pay.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleOpenRejectModal(pay)}
                        className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Reject Payment
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(pay)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" /> Approve & Deliver
                      </button>
                    </>
                  )}

                  {pay.status !== 'pending' && (
                    <div className="text-xs text-slate-400 font-medium italic">
                      Verified / Processed
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
              Confirming this payment will mark the payment as <strong>Verified</strong> and deliver account credentials to the customer.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <p className="text-slate-400">
                Wallet: <span className="text-white font-bold">{selectedPayment.paymentMethod}</span> | Amount: <span className="text-emerald-400 font-bold">৳{selectedPayment.amount}</span>
              </p>
              <p className="text-slate-400">Sender Number: <span className="text-white font-mono">{selectedPayment.senderPhone}</span></p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Deliver Credentials (Email, Password, Key):</label>
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
              Provide a rejection reason. The order will be cancelled and user notified.
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
    </div>
  );
};
