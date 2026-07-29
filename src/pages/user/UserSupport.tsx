import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, Paperclip, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ISupportTicket, ITicketMessage } from '../../types';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { ImageUploader } from '../../components/ImageUploader';

export const UserSupport: React.FC = () => {
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ISupportTicket | null>(null);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Support');
  const [orderNumber, setOrderNumber] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chat Reply State
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyTickets();

    const socket = getSocket();

    const handleNewMessage = (data: { ticketId: string; ticketDbId: string; message: ITicketMessage; status?: string }) => {
      fetchMyTickets();
      setActiveTicket((prev) => {
        if (prev && (prev.ticketId === data.ticketId || prev._id === data.ticketDbId)) {
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
      fetchMyTickets();
      setActiveTicket((prev) => {
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
  }, []);

  useEffect(() => {
    if (activeTicket) {
      const socket = getSocket();
      socket.emit('join_ticket', activeTicket._id);
      socket.emit('join_ticket', activeTicket.ticketId);
      scrollToBottom();
    }
  }, [activeTicket?._id, activeTicket?.messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/my-tickets');
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch user tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || submitting) return;

    try {
      setSubmitting(true);
      const attachments = attachmentUrl.trim() ? [attachmentUrl.trim()] : [];

      const res = await api.post('/tickets', {
        subject: subject.trim(),
        category,
        orderNumber: orderNumber.trim(),
        priority,
        description: description.trim(),
        attachments,
      });

      if (res.data.success) {
        setSubject('');
        setDescription('');
        setOrderNumber('');
        setAttachmentUrl('');
        setShowCreateModal(false);
        toast.success('Support ticket created successfully!');
        fetchMyTickets();
        if (res.data.ticket) {
          setActiveTicket(res.data.ticket);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      const attachments = replyAttachment.trim() ? [replyAttachment.trim()] : [];

      const res = await api.post(`/tickets/${activeTicket._id}/reply`, {
        message: replyText.trim(),
        attachments,
      });

      if (res.data.success) {
        setReplyText('');
        setReplyAttachment('');
        toast.success('Reply sent');
        if (res.data.ticket) {
          setActiveTicket(res.data.ticket);
        }
        fetchMyTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleCloseTicket = async () => {
    if (!activeTicket) return;
    const newStatus = activeTicket.status === 'closed' ? 'reopened' : 'closed';
    try {
      const res = await api.patch(`/tickets/${activeTicket._id}/status`, { status: newStatus });
      if (res.data.success) {
        setActiveTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        toast.success(`Ticket ${newStatus === 'closed' ? 'closed' : 'reopened'}`);
        fetchMyTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-sky-400" /> Customer Support Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Need assistance with account login, payment verification or renewal? Submit a support ticket.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Open New Support Ticket
        </button>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
          Loading support tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No Support Tickets Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            If you encounter any issues with order credentials or subscription access, our support team is here 24/7.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl"
          >
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => setActiveTicket(t)}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition space-y-3 shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-sky-400">#{t.ticketId}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                    t.status === 'open' || t.status === 'waiting_user' || t.status === 'waiting_admin'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : t.status === 'waiting_customer'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-sky-400 transition line-clamp-1">{t.subject}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span>Updated: {formatDate(t.updatedAt)}</span>
                <span className="text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition">
                  Chat <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" /> Submit Support Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Subject / Brief Summary *</label>
                <input
                  type="text"
                  placeholder="e.g. Cannot log in to Netflix account"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Order Issue">Order Credentials Issue</option>
                    <option value="Payment Verification">Payment Verification</option>
                    <option value="Account Renewal">Account Renewal</option>
                    <option value="Refund Request">Refund Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Related Order # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SUB-20260728-1234"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Issue Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue in detail so our support staff can resolve it quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <ImageUploader
                  label="Screenshot / Attachment (Optional)"
                  helperText="Upload issue screenshot directly to ImgBB (JPG, PNG, WEBP max 10MB)"
                  value={attachmentUrl}
                  compact
                  onChange={(url) => setAttachmentUrl(typeof url === 'string' ? url : url[0] || '')}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Ticket Live Chat Modal / Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-0 sm:border border-slate-800 sm:rounded-2xl max-w-2xl w-full h-full sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-sky-400 shrink-0">#{activeTicket.ticketId}</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate">• {activeTicket.subject}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                  Category: {activeTicket.category} {activeTicket.orderNumber && `| Order #${activeTicket.orderNumber}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleToggleCloseTicket}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition ${
                    activeTicket.status === 'closed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {activeTicket.status === 'closed' ? 'Reopen' : 'Close'}
                </button>

                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 bg-slate-950/40">
              {/* First message / initial issue description */}
              {activeTicket.description && (
                <div className="p-3 sm:p-4 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-1.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5" /> Issue Description
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDate(activeTicket.createdAt)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{activeTicket.description}</p>
                </div>
              )}

              {/* Messages Array */}
              {activeTicket.messages && activeTicket.messages.length > 0 ? (
                activeTicket.messages.map((msg, idx) => {
                  const isUserMsg = msg.senderRole === 'user';
                  const textContent = msg.message || msg.text || '';
                  const msgDate = msg.timestamp || msg.createdAt;

                  return (
                    <div key={idx} className={`flex flex-col ${isUserMsg ? 'items-end' : 'items-start'} space-y-1`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                        <span className="font-bold text-slate-300">{msg.senderName} ({msg.senderRole})</span>
                        <span>•</span>
                        <span>{formatDate(msgDate)}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                          isUserMsg
                            ? 'bg-sky-600 text-white rounded-tr-none'
                            : 'bg-purple-900/60 text-purple-100 border border-purple-500/30 rounded-tl-none'
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
                                className="text-[11px] text-sky-200 underline block font-mono"
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
                <div className="text-center py-6 text-xs text-slate-500">No message history yet.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Reply Bar */}
            <form onSubmit={handleSendReply} className="p-2.5 sm:p-3 border-t border-slate-800 bg-slate-900 shrink-0 space-y-2">
              <div className="flex gap-2 items-end">
                <textarea
                  rows={1}
                  placeholder="Type message to support team..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (replyText.trim() && !sendingReply) {
                        handleSendReply(e);
                      }
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm rounded-xl p-2.5 sm:p-3 focus:outline-none focus:border-sky-500 resize-none max-h-24"
                />
                <button
                  type="button"
                  onClick={() => setShowAttachInput(!showAttachInput)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs transition ${
                    replyAttachment || showAttachInput
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Attach screenshot"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{sendingReply ? 'Sending...' : 'Send'}</span>
                </button>
              </div>

              {(showAttachInput || replyAttachment) && (
                <div className="pt-1.5 border-t border-slate-800/60">
                  <ImageUploader
                    label="Attach Screenshot (Optional)"
                    value={replyAttachment}
                    compact
                    onChange={(url) => setReplyAttachment(typeof url === 'string' ? url : url[0] || '')}
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};