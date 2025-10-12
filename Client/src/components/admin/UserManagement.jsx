import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

const UserManagement = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, message: '', userId: null });

  // Authentication check
  useEffect(() => {
    if (!user) {
      setError('Please log in to access this page.');
      navigate('/login', { state: { message: 'Access required' } });
    } else if (!user.isAdmin) {
      setError('Access denied. Admins only.');
      navigate('/', { state: { message: 'Access denied' } });
    } else {
      fetchUsers();
    }
  }, [user, navigate]);

  // Error timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Success timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE_URL}/users/all`);
      console.log('Fetched users:', response.data);
      setUsers(response.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch users: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id) => {
    console.log('Delete clicked for user:', id);
    setConfirmModal({
      open: true,
      action: () => executeDeleteUser(id),
      message: `Are you sure you want to delete user ID ${id}?`,
      userId: id,
    });
  };

  const executeDeleteUser = async (id) => {
    try {
      console.log('Executing delete for user:', id);
      await api.delete(`${API_BASE_URL}/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      setSuccess('User deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmModal({ open: false, action: null, message: '', userId: null });
    }
  };

  const handleToggleAdmin = (id, currentStatus) => {
    console.log('Toggle admin clicked for user:', id, 'current status:', currentStatus);
    setConfirmModal({
      open: true,
      action: () => executeToggleAdmin(id, currentStatus),
      message: `Are you sure you want to ${currentStatus ? 'demote' : 'promote'} user ID ${id} ${currentStatus ? 'from' : 'to'} admin?`,
      userId: id,
    });
  };
  const executeToggleAdmin = async (id, currentStatus) => {
    try {
      console.log('Executing toggle admin for user:', id);
      const response = await api.put(`${API_BASE_URL}/users/${id}/toggle-admin`, {
        isAdmin: !currentStatus
      });
      setUsers(users.map(u => u._id === id ? { ...u, isAdmin: response.data.user.isAdmin } : u));
      setSuccess(response.data.message);
    } catch (err) {
      console.error('Toggle admin error:', err);
      setError(`Failed to toggle admin status: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmModal({ open: false, action: null, message: '', userId: null });
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, action: null, message: '', userId: null });
  };

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-xl text-[#34495e]">{error || 'Loading users...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#34495e]">User Management</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-lg">{success}</div>}

        {/* User List */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#34495e]">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-2xl shadow-lg">
              <thead>
                <tr className="bg-gray-100 text-[#34495e]">
                  <th className="py-3 px-6 text-left font-semibold">Name</th>
                  <th className="py-3 px-6 text-left font-semibold">Email</th>
                  <th className="py-3 px-6 text-left font-semibold">Role</th>
                  <th className="py-3 px-6 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(u => (
                    <tr key={u._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6">{u.name}</td>
                      <td className="py-3 px-6">{u.email}</td>
                      <td className="py-3 px-6">{u.isAdmin ? 'Admin' : 'Not Admin'}</td>
                      <td className="py-3 px-6 flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.isAdmin}
                            onChange={() => handleToggleAdmin(u._id, u.isAdmin)}
                            className="sr-only"
                            disabled={u._id === user?._id || confirmModal.userId === u._id}
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${u.isAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${u.isAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <span className="ml-2 text-gray-600">{u.isAdmin ? 'Demote' : 'Promote'}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-xl font-semibold transition-all"
                          disabled={u._id === user?._id || confirmModal.userId === u._id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-6 text-center text-gray-600">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
              <h3 className="text-xl font-semibold text-[#34495e] mb-4">Confirm Action</h3>
              <p className="text-gray-600 mb-6">{confirmModal.message}</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeConfirmModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold"
                >
                  <button class="Cancel">
Cancel</button>
                </button>
                <button
                  onClick={confirmModal.action}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
                >
                  <button class="Confirm">Confirm</button>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

