import React, { useState, useEffect } from 'react'
import axios from 'axios'

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/customers.php')
      setCustomers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put('/api/admin/customers.php', { id, status })
      alert('Customer status updated successfully!')
      fetchCustomers()
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Error updating customer status')
    }
  }

  const handleDeleteCustomer = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await axios.delete(`/api/admin/customers.php?id=${id}`)
      alert('Customer deleted successfully!')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Customers Management</h2>
        <button
          onClick={fetchCustomers}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Registered</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{customer.id}</td>
                <td className="px-6 py-4 text-sm font-semibold">
                  {customer.first_name} {customer.last_name}
                </td>
                <td className="px-6 py-4 text-sm">{customer.email}</td>
                <td className="px-6 py-4 text-sm">{customer.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status === 'active' ? 'Active (Approved)' :
                     customer.status === 'pending' ? 'Pending (Awaiting Approval)' :
                     customer.status === 'inactive' ? 'Inactive' : customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {customer.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(customer.id, 'active')}
                        className="text-green-600 hover:text-green-800 font-semibold"
                      >
                        Approve
                      </button>
                    )}
                    {customer.status === 'active' && (
                      <button
                        onClick={() => handleUpdateStatus(customer.id, 'inactive')}
                        className="text-orange-600 hover:text-orange-800 font-semibold"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No customers found.
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomersManagement

