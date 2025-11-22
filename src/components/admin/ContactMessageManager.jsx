import React, { useState, useEffect } from 'react';
import { adminApiGet, adminApiPut, adminApiDelete } from '../../utils/apiHelper.js';

export default function ContactMessageManager() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalMessages: 0
    });

    const fetchMessages = async (status = filterStatus, page = 1) => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams();
            if (status) queryParams.append('status', status);
            queryParams.append('page', page);
            queryParams.append('limit', 20);

            const data = await adminApiGet(`http://localhost:3001/api/admin/contact-messages?${queryParams}`);

            if (data.success) {
                setMessages(data.messages);
                setPagination(data.pagination);
            } else {
                setError(data.error || 'Failed to fetch messages.');
            }
        } catch (err) {
            setError(err.message || 'Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setSelectedMessage(null);
        fetchMessages(status, 1);
    };

    const handleStatusChange = async (messageId, newStatus) => {
        try {
            const data = await adminApiPut(
                `http://localhost:3001/api/admin/contact-messages/${messageId}/status`,
                { status: newStatus }
            );

            if (data.success) {
                fetchMessages(filterStatus, pagination.currentPage);
                if (selectedMessage && selectedMessage.message_id === messageId) {
                    setSelectedMessage({ ...selectedMessage, status: newStatus });
                }
            } else {
                alert(data.error || 'Failed to update status.');
            }
        } catch (err) {
            alert(err.message || 'Failed to update status.');
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
            try {
                const data = await adminApiDelete(`http://localhost:3001/api/admin/contact-messages/${messageId}`);

                if (data.success) {
                    if (selectedMessage && selectedMessage.message_id === messageId) {
                        setSelectedMessage(null);
                    }
                    fetchMessages(filterStatus, pagination.currentPage);
                } else {
                    alert(data.error || 'Failed to delete message.');
                }
            } catch (err) {
                alert(err.message || 'Failed to delete message.');
            }
        }
    };

    const handleViewMessage = (message) => {
        setSelectedMessage(message);
        if (message.status === 'unread') {
            handleStatusChange(message.message_id, 'read');
        }
    };

    const getStatusStyles = (status) => {
        switch(status) {
            case 'unread':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'read':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'archived':
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
    };

    const formatFullDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Count messages by status
    const unreadCount = messages.filter(m => m.status === 'unread').length;

    if (loading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Inbox
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Customer messages from the contact form
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    {unreadCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                                {unreadCount} unread
                            </span>
                        </div>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {pagination.totalMessages}
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: '', label: 'All', icon: '📬' },
                    { key: 'unread', label: 'Unread', icon: '🔔' },
                    { key: 'read', label: 'Read', icon: '✓' },
                    { key: 'archived', label: 'Archived', icon: '📁' }
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => handleFilterChange(key)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filterStatus === key
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <span>{icon}</span>
                        {label}
                    </button>
                ))}
            </div>

            {/* Main Content - Email Client Style */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">

                    {/* Message List - Left Panel */}
                    <div className="lg:col-span-2 border-r border-gray-200 dark:border-gray-700">
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-center">
                                        No messages found in this category
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.message_id}
                                        onClick={() => handleViewMessage(msg)}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            selectedMessage?.message_id === msg.message_id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                                                : msg.status === 'unread'
                                                    ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {msg.status === 'unread' && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    )}
                                                    <span className={`font-medium truncate ${
                                                        msg.status === 'unread'
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {msg.name}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate mb-1 ${
                                                    msg.status === 'unread'
                                                        ? 'font-semibold text-gray-800 dark:text-gray-200'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {msg.subject}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                                    {msg.message.substring(0, 60)}...
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(msg.created_at)}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusStyles(msg.status)}`}>
                                                    {msg.status === 'unread' ? 'New' : msg.status === 'read' ? 'Read' : 'Archived'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    onClick={() => fetchMessages(filterStatus, pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1.5 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {pagination.currentPage} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchMessages(filterStatus, pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="px-3 py-1.5 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Message Detail - Right Panel */}
                    <div className="lg:col-span-3 flex flex-col">
                        {selectedMessage ? (
                            <>
                                {/* Message Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                {selectedMessage.subject}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                            {selectedMessage.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {selectedMessage.name}
                                                        </p>
                                                        <a
                                                            href={`mailto:${selectedMessage.email}`}
                                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            {selectedMessage.email}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(selectedMessage.status)}`}>
                                                {selectedMessage.status === 'unread' ? 'Unread' : selectedMessage.status === 'read' ? 'Read' : 'Archived'}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                {formatFullDate(selectedMessage.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <div className="prose prose-gray dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {selectedMessage.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Message Actions */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex flex-wrap gap-2">
                                        <a
                                            href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                            </svg>
                                            Reply
                                        </a>

                                        {selectedMessage.status !== 'read' && (
                                            <button
                                                onClick={() => handleStatusChange(selectedMessage.message_id, 'read')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Mark as Read
                                            </button>
                                        )}

                                        {selectedMessage.status !== 'archived' && (
                                            <button
                                                onClick={() => handleStatusChange(selectedMessage.message_id, 'archived')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                </svg>
                                                Archive
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(selectedMessage.message_id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors ml-auto"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State - No message selected */
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                    No Message Selected
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                                    Select a message from the list to view its details
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
