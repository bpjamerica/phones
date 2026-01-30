import { useState, useEffect } from 'react';
import { reps, calls } from '../api/client';

export default function LogCall({ user }) {
  const [repsList, setRepsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_rep_id: '',
    notes: '',
    send_sms: true,
  });

  useEffect(() => {
    loadReps();
  }, []);

  const loadReps = async () => {
    try {
      const data = await reps.getAll();
      // Sort to put "Unassigned / New Customer" at the top
      const sorted = data.sort((a, b) => {
        if (a.name === 'Unassigned / New Customer') return -1;
        if (b.name === 'Unassigned / New Customer') return 1;
        return a.name.localeCompare(b.name);
      });
      setRepsList(sorted);

      // Pre-select "Unassigned / New Customer" and uncheck SMS
      const unassigned = sorted.find(r => r.name === 'Unassigned / New Customer');
      if (unassigned) {
        setForm(prev => ({
          ...prev,
          customer_rep_id: unassigned.id.toString(),
          send_sms: false,
        }));
      }
    } catch (err) {
      setError('Failed to load reps');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-toggle SMS based on rep selection
    if (name === 'customer_rep_id') {
      const selectedRep = repsList.find(r => r.id === parseInt(value));
      const isUnassigned = selectedRep?.name === 'Unassigned / New Customer';
      setForm((prev) => ({
        ...prev,
        [name]: value,
        send_sms: !isUnassigned, // Check SMS for real reps, uncheck for Unassigned
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await calls.create({
        customer_rep_id: parseInt(form.customer_rep_id),
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        notes: form.notes,
        send_sms: form.send_sms,
      });

      let successMsg = 'Call logged successfully!';
      if (form.send_sms) {
        if (result.smsResult?.success) {
          successMsg += ' SMS sent.';
        } else if (result.smsResult?.error) {
          successMsg += ` SMS: ${result.smsResult.error}`;
        }
      }
      setSuccess(successMsg);

      // Reset form - keep Unassigned selected
      const unassigned = repsList.find(r => r.name === 'Unassigned / New Customer');
      setForm({
        customer_name: '',
        customer_phone: '',
        customer_rep_id: unassigned ? unassigned.id.toString() : '',
        notes: '',
        send_sms: false,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log a Call</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
            Customer Name *
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            required
            value={form.customer_name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer name"
          />
        </div>

        <div>
          <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700">
            Customer Phone
          </label>
          <input
            type="tel"
            id="customer_phone"
            name="customer_phone"
            value={form.customer_phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter callback number"
          />
        </div>

        <div>
          <label htmlFor="customer_rep_id" className="block text-sm font-medium text-gray-700">
            Customer's Rep *
          </label>
          <select
            id="customer_rep_id"
            name="customer_rep_id"
            required
            value={form.customer_rep_id}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select rep who owns this customer</option>
            {repsList.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter call details..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="send_sms"
            name="send_sms"
            checked={form.send_sms}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="send_sms" className="ml-2 block text-sm text-gray-700">
            Send SMS notification to rep
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Call'}
        </button>
      </form>
    </div>
  );
}
