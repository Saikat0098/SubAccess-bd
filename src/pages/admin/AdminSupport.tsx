import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Filter, User, Send, Paperclip, CheckCircle2, Clock, ShieldAlert, AlertCircle, FileText, UserPlus, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ISupportTicket, ITicketMessage } from '../../types';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { ImageUploader } from '../../components/ImageUploader';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(null);

  // Chat reply state
  const [replyText, setReplyText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [sending, setSending] = useState(false);

  // Admin Quick Edits
  const [internalNotes, setInternalNotes] = useState('');
  const [staffName, setStaffName] = useState('');
  const [updatingMeta, setUpdatingMeta] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();

    const socket = getSocket();
    socket.emit('join_admin');

    const handleNewMessage = (data: { ticketId: string; ticketDbId: string; message: ITicketMessage; status?: string }) => {
      // Refresh tickets list
      fetchTickets();

      // If currently viewing this ticket, append message locally
      setSelectedTicket((prev) => {
        if (prev && (prev.ticketId === data.ticketId || prev._id === data.ticketDbId)) {
          // Avoid duplicate messages
          const exists = prev.messages.some((m) => m._id && data.message._id && m._id === data.message._id);
          if (exists) return prev;
          return {
            ...prev,
            status: (data.status as any) || prev.status,
            messages: [...prev.messages, data.message],
          };
        }
        return prev;
      });
    };

    const handleStatusChange = (data: { ticketId: string; ticketDbId: string; status: string }) => {
      fetchTickets();
      setSelectedTicket((prev) => {
        if (prev && (prev.ticketId === data.ticketId || prev._id === data.ticketDbId)) {
          return { ...prev, status: data.status as any };
        }
        return prev;
      });
    };

    socket.on('ticket:message', handleNewMessage);
    socket.on('ticket:status_change', handleStatusChange);

    return () => {
      socket.off('ticket:message', handleNewMessage);
      socket.off('ticket:status_change', handleStatusChange);
    };
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket) {
      const socket = getSocket();
      socket.emit('join_ticket', selectedTicket._id);
      socket.emit('join_ticket', selectedTicket.ticketId);

      setInternalNotes(selectedTicket.internalNotes || '');
      setStaffName(selectedTicket.assignedStaff || '');
      scrollToBottom();
    }
  }, [selectedTicket?._id, selectedTicket?.messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let url = `/tickets/all?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (priorityFilter) url += `priority=${priorityFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sending) return;

    try {
      setSending(true);
      const attachments = attachmentUrl.trim() ? [attachmentUrl.trim()] : [];

      const res = await api.post(`/tickets/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
        attachments,
      });

      if (res.data.success) {
        setReplyText('');
        setAttachmentUrl('');
        toast.success('Reply sent');
        if (res.data.ticket) {
          setSelectedTicket(res.data.ticket);
        }
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/tickets/${selectedTicket._id}/status`, { status: newStatus });
      if (res.data.success) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/tickets/${selectedTicket._id}/priority`, { priority: newPriority });
      if (res.data.success) {
        setSelectedTicket((prev) => (prev ? { ...prev, priority: newPriority as any } : null));
        toast.success(`Priority updated to ${newPriority}`);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update priority');
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedTicket) return;
    try {
      setUpdatingMeta(true);
      const res = await api.patch(`/tickets/${selectedTicket._id}/notes`, { internalNotes });
      if (res.data.success) {
        setSelectedTicket((prev) => (prev ? { ...prev, internalNotes } : null));
        toast.success('Internal notes saved');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setUpdatingMeta(false);
    }
  };

  const handleSaveStaffAssignment = async () => {
    if (!selectedTicket) return;
    try {
      setUpdatingMeta(true);
      const res = await api.patch(`/tickets/${selectedTicket._id}/assign`, { staffName });
      if (res.data.success) {
        setSelectedTicket((prev) => (prev ? { ...prev, assignedStaff: staffName } : null));
        toast.success('Staff assigned successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setUpdatingMeta(false);
    }
  };

  // Safe Date Formatting function
  const formatDate = (dateVal: any): string => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-400" /> Support Ticket Center (MongoDB + Socket.IO)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time customer inbox, live ticket conversations, priority routing & staff assignment
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Refresh Inbox
        </button>
      </div>

      {/* Main Support Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left Column: Ticket List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Search & Filters Header */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950/50">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search Ticket #, Subject, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-purple-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </form>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="waiting_admin">Waiting Admin</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="in_progress">In Progress</option>

                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-1/2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading support inbox...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold">No tickets found</p>
                <p className="text-slate-500 text-[11px]">User support requests will appear here in real-time.</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const isSelected = selectedTicket?._id === ticket._id;
                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 hover:bg-slate-800/50 ${
                      isSelected ? 'bg-purple-950/30 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-black text-purple-400">#{ticket.ticketId}</span>
                      <span className="text-[10px] text-slate-500">{formatDate(ticket.updatedAt)}</span>
                    </div>

                    <p className="text-xs font-bold text-white line-clamp-1">{ticket.subject}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{ticket.customerName}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                            ticket.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : ticket.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ticket.priority}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                            ticket.status === 'open' || ticket.status === 'waiting_admin'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ticket.status === 'waiting_customer'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window & Details Panel (8 cols) */}
        {selectedTicket ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Top Bar - Ticket Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-purple-400">#{selectedTicket.ticketId}</span>
                  <span className="text-xs font-bold text-white">• {selectedTicket.subject}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Customer: <strong className="text-white">{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail}) | Category:{' '}
                  <span className="text-sky-400">{selectedTicket.category}</span> {selectedTicket.orderNumber && `| Order #${selectedTicket.orderNumber}`}
                </p>
              </div>

              {/* Status & Priority Quick Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="open">Status: Open</option>
                  <option value="waiting_admin">Waiting Admin</option>
                  <option value="waiting_customer">Waiting Customer</option>
                  <option value="in_progress">In Progress</option>

                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="reopened">Reopened</option>
                </select>

                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handleUpdatePriority(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-amber-400 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="urgent">Urgent Priority</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Conversation Messages View */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
              {/* Initial Issue Description Box */}
              {selectedTicket.description && (
                <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Original Customer Issue Description
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>
              )}

              {/* Message History */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg, idx) => {
                  const isAdminMsg = msg.senderRole === 'admin';
                  const msgDate = msg.timestamp || msg.createdAt;
                  const textContent = msg.message || msg.text || '';

                  return (
                    <div key={idx} className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} space-y-1`}>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                        <span className="font-bold text-slate-300">{msg.senderName} ({msg.senderRole})</span>
                        <span>•</span>
                        <span>{formatDate(msgDate)}</span>
                      </div>

                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl text-xs whitespace-pre-wrap shadow-md ${
                          isAdminMsg
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        {textContent}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                            {msg.attachments.map((att, aIdx) => (
                              <a
                                key={aIdx}
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-sky-300 underline block font-mono"
                              >
                                📎 Attachment {aIdx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">No additional message history.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Staff & Internal Notes Accordion */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex gap-2 items-center">
                <UserPlus className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Assign Staff Name..."
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 flex-1"
                />
                <button
                  onClick={handleSaveStaffAssignment}
                  disabled={updatingMeta}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Assign
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <FileText className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Internal notes (hidden from user)..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 flex-1"
                />
                <button
                  onClick={handleSaveInternalNotes}
                  disabled={updatingMeta}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Reply Bar */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-900 space-y-2">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Type official admin response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className="pt-1">
                <ImageUploader
                  label="Attach Image / Proof (Optional)"
                  value={attachmentUrl}
                  compact
                  onChange={(url) => setAttachmentUrl(typeof url === 'string' ? url : url[0] || '')}
                />
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-12 text-center text-slate-500 text-xs">
            Select a support ticket from the inbox on the left to start live conversation.
          </div>
        )}
      </div>
    </div>
  );
};
