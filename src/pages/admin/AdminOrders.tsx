import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, XCircle, Key, Search, Plus, Trash2, ChevronLeft, ChevronRight, RotateCcw, UserCheck, FileText, Clock, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { IOrder, IDeliveredCredential } from '../../types';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [actionType, setActionType] = useState<'fulfill' | 'reject' | 'refund' | 'assign' | 'notes' | 'delete' | 'details' | null>(null);
  const [credentials, setCredentials] = useState<IDeliveredCredential[]>([
    { label: 'Login Email / Account', value: '' },
    { label: 'Password / Profile PIN', value: '' },
  ]);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [staffName, setStaffName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Socket.IO Real-time Synchronization
    const socket = getSocket();
    socket.emit('join_admin');

    const handleOrderEvent = () => {
      fetchOrders();
    };

    socket.on('order:created', handleOrderEvent);
    socket.on('order:updated', handleOrderEvent);
    socket.on('payment:updated', handleOrderEvent);

    return () => {
      socket.off('order:created', handleOrderEvent);
      socket.off('order:updated', handleOrderEvent);
      socket.off('payment:updated', handleOrderEvent);
    };
  }, [statusFilter, paymentFilter, sortBy, sortOrder, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/orders?page=${page}&limit=20&sortBy=${sortBy}&sortOrder=${sortOrder}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (paymentFilter) url += `paymentStatus=${paymentFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.orders || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.totalCount || 0);
        }
      }
    } catch (err) {
      console.error('Fetch admin orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenFulfill = (ord: IOrder) => {
    setSelectedOrder(ord);
    setActionType('fulfill');
    if (ord.deliveredCredentials && ord.deliveredCredentials.length > 0) {
      setCredentials(ord.deliveredCredentials);
    } else {
      setCredentials([
        { label: 'Login Email / Username', value: '' },
        { label: 'Password / PIN Code', value: '' },
      ]);
    }
    setDeliveryInstructions(ord.deliveryInstructions || 'Please log in using the credentials above.');
    setAdminNotes(ord.adminNotes || '');
  };

  const handleOpenReject = (ord: IOrder) => {
    setSelectedOrder(ord);
    setActionType('reject');
    setRejectionReason(ord.adminNotes || 'Invalid Transaction ID or payment not received in merchant wallet.');
  };

  const handleOpenRefund = (ord: IOrder) => {
    setSelectedOrder(ord);
    setActionType('refund');
    setAdminNotes('Refund issued to customer account.');
  };

  const handleOpenNotes = (ord: IOrder) => {
    setSelectedOrder(ord);
    setActionType('notes');
    setAdminNotes(ord.adminNotes || '');
  };

  const handleOpenDelete = (ord: IOrder) => {
    setSelectedOrder(ord);
    setActionType('delete');
  };

  const handleAddCredRow = () => {
    setCredentials([...credentials, { label: 'Key / Invite Link', value: '' }]);
  };

  const handleRemoveCredRow = (index: number) => {
    setCredentials(credentials.filter((_, idx) => idx !== index));
  };

  const handleCredChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...credentials];
    updated[index][field] = val;
    setCredentials(updated);
  };

  const handleApproveAndFulfill = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/orders/${selectedOrder._id}/approve`, {
        deliveredCredentials: credentials,
        deliveryInstructions,
        adminNotes,
      });

      if (res.data.success) {
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? res.data.order : o)));
        setSelectedOrder(null);
        setActionType(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/orders/${selectedOrder._id}/reject`, {
        rejectionReason,
      });

      if (res.data.success) {
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? res.data.order : o)));
        setSelectedOrder(null);
        setActionType(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await api.patch(`/orders/${selectedOrder._id}/status`, {
        orderStatus: 'cancelled',
        paymentStatus: 'refunded',
        deliveryStatus: 'cancelled',
        adminNotes,
      });

      if (res.data.success) {
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? res.data.order : o)));
        setSelectedOrder(null);
        setActionType(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to refund order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await api.patch(`/orders/${selectedOrder._id}/notes`, { adminNotes });
      if (res.data.success) {
        setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? res.data.order : o)));
        setSelectedOrder(null);
        setActionType(null);
      }
    } catch (err: any) {
      alert('Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/orders/${selectedOrder._id}`);
      if (res.data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== selectedOrder._id));
        setSelectedOrder(null);
        setActionType(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert('Failed to delete order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatusQuick = async (orderId: string, status: string) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { orderStatus: status });
      if (res.data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.order : o)));
      }
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-400" /> Order Management (MongoDB Central)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total Orders: <strong className="text-sky-400 font-bold">{totalCount}</strong> | Verified, Pending, Processing & Fulfillments
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sync MongoDB Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <span className="text-[10px] uppercase font-black text-slate-500 px-2">Order Status:</span>
        {[
          { id: '', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'processing', label: 'Processing' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => {
              setStatusFilter(st.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              statusFilter === st.id
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st.label}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

        <span className="text-[10px] uppercase font-black text-slate-500 px-2 hidden sm:inline">Payment:</span>
        {[
          { id: '', label: 'All Payments' },
          { id: 'pending', label: 'Pending Pay' },
          { id: 'verified', label: 'Verified' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'refunded', label: 'Refunded' },
        ].map((pm) => (
          <button
            key={pm.id}
            onClick={() => {
              setPaymentFilter(pm.id);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition ${
              paymentFilter === pm.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      {/* Search Bar & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search Order #, Customer Name, Phone, Email, TrxID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-24 py-2.5 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs text-slate-400 font-semibold">Sort By:</label>
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_') as ['createdAt' | 'totalAmount', 'desc' | 'asc'];
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="totalAmount_desc">Highest BDT</option>
            <option value="totalAmount_asc">Lowest BDT</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
          Fetching central MongoDB orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-300">No orders found in MongoDB matching criteria.</p>
          <p className="text-slate-500 text-[11px]">Placed customer checkout orders will automatically populate here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord._id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl hover:border-slate-700 transition">
              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-black text-sky-400">#{ord.orderNumber}</span>
                  <div>
                    <span className="text-xs font-bold text-white block">{ord.customerName}</span>
                    <span className="text-[10px] text-slate-400">{ord.customerEmail} | {ord.customerPhone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      ord.orderStatus === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ord.orderStatus === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : ord.orderStatus === 'processing'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    Order: {ord.orderStatus}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ord.paymentStatus === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ord.paymentStatus === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : ord.paymentStatus === 'refunded'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Payment: {ord.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items & Payment Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Purchased Subscriptions:</span>
                  <div className="space-y-1.5">
                    {ord.items.map((i, idx) => (
                      <div key={idx} className="font-bold text-white flex justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span>• {i.title} ({i.duration})</span>
                        <span className="text-sky-400">৳{i.price} x {i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-slate-400">
                    Payment Method: <strong className="text-white font-bold">{ord.paymentMethod}</strong>
                  </p>
                  <p className="text-slate-400">
                    Transaction ID: <strong className="text-sky-400 font-mono text-sm">{ord.transactionId}</strong>
                  </p>
                  <p className="text-slate-400">
                    Sender Mobile: <strong className="text-white font-mono">{ord.senderPhone}</strong>
                  </p>
                  <p className="text-slate-400">
                    Total BDT Amount: <strong className="text-emerald-400 font-extrabold text-sm">৳{ord.totalAmount}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Placed Date: {new Date(ord.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Delivered Credentials Box */}
              {ord.deliveredCredentials && ord.deliveredCredentials.length > 0 && (
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Delivered Login Credentials:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ord.deliveredCredentials.map((cred, cIdx) => (
                      <div key={cIdx} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400">{cred.label}: </span>
                        <span className="font-mono font-bold text-white">{cred.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes Preview */}
              {ord.adminNotes && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                  <span><strong>Internal Notes:</strong> {ord.adminNotes}</span>
                  <button onClick={() => handleOpenNotes(ord)} className="text-[10px] text-sky-400 font-bold hover:underline">
                    Edit Note
                  </button>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-2 flex flex-wrap gap-2 justify-end items-center border-t border-slate-800/60">
                {/* Status Quick Dropdown */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-bold">Set Status:</span>
                  <select
                    value={ord.orderStatus}
                    onChange={(e) => handleUpdateStatusQuick(ord._id, e.target.value)}
                    className="bg-transparent text-white text-xs font-bold focus:outline-none"
                  >
                    <option value="pending" className="bg-slate-900">Pending</option>
                    <option value="processing" className="bg-slate-900">Processing</option>
                    <option value="completed" className="bg-slate-900">Completed</option>
                    <option value="cancelled" className="bg-slate-900">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => handleOpenNotes(ord)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Notes
                </button>

                {ord.orderStatus !== 'cancelled' && (
                  <button
                    onClick={() => handleOpenReject(ord)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Payment
                  </button>
                )}

                {ord.paymentStatus === 'verified' && (
                  <button
                    onClick={() => handleOpenRefund(ord)}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Refund
                  </button>
                )}

                <button
                  onClick={() => handleOpenFulfill(ord)}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                >
                  <Key className="w-3.5 h-3.5" /> {ord.orderStatus === 'completed' ? 'Edit Credentials' : 'Approve & Fulfill'}
                </button>

                <button
                  onClick={() => handleOpenDelete(ord)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Delete Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Page {page} of {totalPages} ({totalCount} total orders)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 text-white font-bold rounded-lg flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 text-white font-bold rounded-lg flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fulfillment Modal */}
      {selectedOrder && actionType === 'fulfill' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-lg text-white">Fulfill Order #{selectedOrder.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              Inject account login credentials, PINs, or license keys for <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail}).
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Credentials to Deliver:</label>
              {credentials.map((cred, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g. Email / PIN)"
                    value={cred.label}
                    onChange={(e) => handleCredChange(idx, 'label', e.target.value)}
                    className="w-1/3 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. user@pass or key)"
                    value={cred.value}
                    onChange={(e) => handleCredChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCredRow(idx)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCredRow}
                className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Setup Instructions:</label>
              <textarea
                rows={3}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Internal Admin Notes:</label>
              <input
                type="text"
                placeholder="e.g. Verified on bKash merchant portal"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveAndFulfill}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {submitting ? 'Saving...' : 'Approve & Deliver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedOrder && actionType === 'reject' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Reject Payment & Cancel Order #{selectedOrder.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              Provide rejection reason for TrxID <strong>{selectedOrder.transactionId}</strong>. Customer will be notified.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rejection Reason *</label>
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
                  setSelectedOrder(null);
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
                {submitting ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {selectedOrder && actionType === 'refund' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Issue Refund for Order #{selectedOrder.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              This will mark Order #{selectedOrder.orderNumber} (৳{selectedOrder.totalAmount}) as Refunded in MongoDB.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Refund Notes</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={submitting}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
              >
                {submitting ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {selectedOrder && actionType === 'notes' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Internal Admin Notes - Order #{selectedOrder.orderNumber}</h3>

            <div>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Write private admin note..."
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={submitting}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedOrder && actionType === 'delete' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Delete Order #{selectedOrder.orderNumber}?
            </h3>
            <p className="text-xs text-slate-300">
              This action permanently removes Order #{selectedOrder.orderNumber} and its payment verification records from MongoDB. This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                {submitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
