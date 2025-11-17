import React, { useState, useEffect } from 'react';
import { adminApiGet, adminApiPut, adminApiDelete } from '../../utils/apiHelper.js';

export default function ContactMessageManager() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // '', 'unread', 'read', 'archived'
    const [selectedMessage, setSelectedMessage] = useState(null); // For viewing full message
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

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'unread': return 'badge badge-warning';
            case 'read': return 'badge badge-success';
            case 'archived': return 'badge badge-secondary';
            default: return 'badge badge-light';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col-12">
                    <h2>Contact Messages</h2>
                    <p className="text-muted">Manage customer inquiries from the contact form</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Filter Buttons */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="btn-group" role="group">
                        <button
                            className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleFilterChange('')}
                        >
                            All ({pagination.totalMessages})
                        </button>
                        <button
                            className={`btn btn-sm ${filterStatus === 'unread' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => handleFilterChange('unread')}
                        >
                            Unread
                        </button>
                        <button
                            className={`btn btn-sm ${filterStatus === 'read' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => handleFilterChange('read')}
                        >
                            Read
                        </button>
                        <button
                            className={`btn btn-sm ${filterStatus === 'archived' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={() => handleFilterChange('archived')}
                        >
                            Archived
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Subject</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    No messages found
                                                </td>
                                            </tr>
                                        ) : (
                                            messages.map((msg) => (
                                                <tr key={msg.message_id} style={{ cursor: 'pointer' }}>
                                                    <td>
                                                        <span className={getStatusBadgeClass(msg.status)}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                    <td>{formatDate(msg.created_at)}</td>
                                                    <td>{msg.name}</td>
                                                    <td>{msg.email}</td>
                                                    <td>{msg.subject}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-info mr-1"
                                                            onClick={() => handleViewMessage(msg)}
                                                            data-toggle="modal"
                                                            data-target="#messageViewModal"
                                                        >
                                                            View
                                                        </button>
                                                        <div className="btn-group btn-group-sm" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-success"
                                                                onClick={() => handleStatusChange(msg.message_id, 'read')}
                                                                disabled={msg.status === 'read'}
                                                                title="Mark as Read"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleStatusChange(msg.message_id, 'archived')}
                                                                disabled={msg.status === 'archived'}
                                                                title="Archive"
                                                            >
                                                                📁
                                                            </button>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-danger ml-1"
                                                            onClick={() => handleDelete(msg.message_id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <nav>
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => fetchMessages(filterStatus, pagination.currentPage - 1)}
                                                disabled={pagination.currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        <li className="page-item disabled">
                                            <span className="page-link">
                                                Page {pagination.currentPage} of {pagination.totalPages}
                                            </span>
                                        </li>
                                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => fetchMessages(filterStatus, pagination.currentPage + 1)}
                                                disabled={pagination.currentPage === pagination.totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message View Modal */}
            {selectedMessage && (
                <div className="modal fade" id="messageViewModal" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedMessage.subject}</h5>
                                <button type="button" className="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})
                                </div>
                                <div className="mb-3">
                                    <strong>Date:</strong> {formatDate(selectedMessage.created_at)}
                                </div>
                                <div className="mb-3">
                                    <strong>Status:</strong>{' '}
                                    <span className={getStatusBadgeClass(selectedMessage.status)}>
                                        {selectedMessage.status}
                                    </span>
                                </div>
                                <hr />
                                <div>
                                    <strong>Message:</strong>
                                    <p className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        handleStatusChange(selectedMessage.message_id, 'read');
                                        setSelectedMessage(null);
                                    }}
                                    data-dismiss="modal"
                                >
                                    Mark as Read
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        handleStatusChange(selectedMessage.message_id, 'archived');
                                        setSelectedMessage(null);
                                    }}
                                    data-dismiss="modal"
                                >
                                    Archive
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        handleDelete(selectedMessage.message_id);
                                        setSelectedMessage(null);
                                    }}
                                    data-dismiss="modal"
                                >
                                    Delete
                                </button>
                                <button type="button" className="btn btn-light" data-dismiss="modal">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
