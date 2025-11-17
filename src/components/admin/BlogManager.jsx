// BlogManager component for managing blog posts
// Features:
// 1. View all blog posts (published & drafts)
// 2. Create new posts with rich text editor
// 3. Edit existing posts
// 4. Upload images
// 5. Assign categories
// 6. Publish/unpublish posts
// 7. Delete posts

import React, { useState, useEffect, useCallback } from 'react';
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from '../../utils/apiHelper';

// --- Helper & UI Components --------------------------------------------------

const Icon = ({ path, className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const ICONS = {
    plus: "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z",
    edit: "M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 14H3a1 1 0 01-1-1V5a1 1 0 011-1h2v2H4v6h2v2z",
    trash: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    eye: "M10 12a2 2 0 100-4 2 2 0 000 4zM2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
    upload: "M8 4a.5.5 0 01.5.5V6h3V4.5a.5.5 0 011 0V6h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h1V4.5A.5.5 0 018 4z"
};

const Button = ({ onClick, children, variant = 'primary', className = '', type = 'button' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const variants = {
        primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
        success: "text-white bg-green-600 hover:bg-green-700 focus:ring-green-500",
    };
    return <button type={type} onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;
};

const Modal = ({ children, onClose, title, size = 'max-w-4xl' }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity font-inter" aria-modal="true" role="dialog">
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${size} max-h-[90vh] flex flex-col`}>
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Icon path={ICONS.close} />
                </button>
            </header>
            <main className="p-6 overflow-y-auto">{children}</main>
        </div>
    </div>
);

// --- Page-Specific Components ------------------------------------------------

const BlogTable = ({ posts, onEdit, onDelete, onTogglePublish }) => {
    const StatusBadge = ({ status }) => {
        const styles = {
            published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[status] || ''}`}>{status}</span>;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        {["Title", "Status", "Published", "Views", "Categories", ""].map((header) => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {posts.map((post) => (
                        <tr key={post.post_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{post.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">by {post.first_name} {post.last_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={post.status} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Not published'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{post.views || 0}</td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{post.categories || 'None'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                <Button onClick={() => onTogglePublish(post)} variant="ghost" title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                                    <Icon path={ICONS.eye} className={post.status === 'published' ? 'text-green-500' : 'text-gray-400'} />
                                </Button>
                                <Button onClick={() => onEdit(post)} variant="ghost"><Icon path={ICONS.edit} /></Button>
                                <Button onClick={() => onDelete(post.post_id)} variant="ghost"><Icon path={ICONS.trash} className="h-5 w-5 text-red-500" /></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BlogFormModal = ({ post, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: post?.title || "",
        slug: post?.slug || "",
        excerpt: post?.excerpt || "",
        content: post?.content || "",
        featured_image: post?.featured_image || "",
        status: post?.status || "draft",
        category_ids: post?.category_ids || [],
    });
    const [uploading, setUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Auto-generate slug from title
        if (name === 'title' && !post) {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleCategoryToggle = (categoryId) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('http://localhost:3001/api/admin/blog/upload-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, featured_image: data.imageUrl }));
                alert('Image uploaded successfully!');
            } else {
                alert(data.error || 'Failed to upload image');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let result;
            if (post) {
                result = await adminApiPut(`http://localhost:3001/api/admin/blog/${post.post_id}`, formData);
            } else {
                result = await adminApiPost('http://localhost:3001/api/admin/blog', formData);
            }

            if (result.success) {
                onSave();
            } else {
                alert(result.error || 'An error occurred');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving blog post');
        }
    };

    const inputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <Modal onClose={onClose} title={post ? "Edit Blog Post" : "Create New Blog Post"} size="max-w-6xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Title *</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Slug *</label>
                        <input name="slug" value={formData.slug} onChange={handleChange} required className={inputClass} />
                        <p className="text-xs text-gray-500 mt-1">URL-friendly version (auto-generated from title)</p>
                    </div>

                    <div>
                        <label className={labelClass}>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Excerpt</label>
                        <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows="2" className={inputClass} placeholder="Short summary (optional)"></textarea>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Content * (HTML supported)</label>
                        <textarea name="content" value={formData.content} onChange={handleChange} required rows="12" className={inputClass} placeholder="Write your blog post content here. You can use HTML tags like <h2>, <p>, <ul>, <li>, <strong>, etc."></textarea>
                        <p className="text-xs text-gray-500 mt-1">Tip: Use HTML tags for formatting. Example: &lt;h2&gt;Heading&lt;/h2&gt; &lt;p&gt;Paragraph&lt;/p&gt;</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Featured Image</label>
                        <div className="flex gap-2 items-center">
                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm" />
                            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                        </div>
                        {formData.featured_image && (
                            <div className="mt-2">
                                <img src={formData.featured_image} alt="Preview" className="h-32 w-auto rounded border" />
                                <input name="featured_image" value={formData.featured_image} onChange={handleChange} className={`${inputClass} mt-2`} placeholder="Or enter image URL manually" />
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Categories</label>
                        <div className="flex flex-wrap gap-2 p-4 border dark:border-gray-600 rounded-lg">
                            {categories.map(cat => (
                                <label key={cat.category_id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.category_ids.includes(cat.category_id)}
                                        onChange={() => handleCategoryToggle(cat.category_id)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
                    <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                    <Button type="submit" variant="primary">Save Blog Post</Button>
                </footer>
            </form>
        </Modal>
    );
};

// --- Main Page Component ----------------------------------------------------

export default function BlogManagerPage() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalState, setModalState] = useState({ type: null, post: null });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [postsData, categoriesData] = await Promise.all([
                adminApiGet("http://localhost:3001/api/admin/blog"),
                adminApiGet("http://localhost:3001/api/admin/blog-categories"),
            ]);

            if (postsData.success) {
                setPosts(postsData.posts);
            } else {
                throw new Error(postsData.error || "Failed to fetch blog posts");
            }

            if (categoriesData.success) {
                setCategories(categoriesData.categories);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to fetch blog data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (type, post = null) => setModalState({ type, post });
    const handleCloseModal = () => setModalState({ type: null, post: null });

    const handleDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return;

        try {
            const data = await adminApiDelete(`http://localhost:3001/api/admin/blog/${postId}`);
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || "Failed to delete blog post");
            }
        } catch (err) {
            alert(err.message || "Failed to delete blog post");
        }
    };

    const handleTogglePublish = async (post) => {
        const newStatus = post.status === 'published' ? 'draft' : 'published';
        const confirmMessage = newStatus === 'published'
            ? 'Publish this blog post?'
            : 'Unpublish this blog post? It will no longer be visible to the public.';

        if (!window.confirm(confirmMessage)) return;

        try {
            const data = await adminApiPut(`http://localhost:3001/api/admin/blog/${post.post_id}/publish`, { status: newStatus });
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || "Failed to update blog status");
            }
        } catch (err) {
            alert(err.message || "Failed to update blog status");
        }
    };

    const handleSave = () => {
        handleCloseModal();
        fetchData();
    };

    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Blog Management</h1>
                <Button onClick={() => handleOpenModal('form')}>
                    <Icon path={ICONS.plus} className="h-5 w-5 mr-2" />
                    Create New Post
                </Button>
            </header>

            {loading ? (
                <p className="text-center p-8">Loading blog posts...</p>
            ) : (
                <BlogTable
                    posts={posts}
                    onEdit={(post) => handleOpenModal('form', post)}
                    onDelete={handleDelete}
                    onTogglePublish={handleTogglePublish}
                />
            )}

            {modalState.type === 'form' && (
                <BlogFormModal
                    post={modalState.post}
                    categories={categories}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
