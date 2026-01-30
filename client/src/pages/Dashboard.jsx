import { useState, useEffect } from 'react';
import { calls } from '../api/client';

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function SmsStatusBadge({ status }) {
  const colors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  if (!status) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      SMS: {status}
    </span>
  );
}

export default function Dashboard() {
  const [groupedCalls, setGroupedCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadCalls();
  }, [startDate, endDate]);

  const loadCalls = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await calls.getAll({
        startDate: startDate ? `${startDate}T00:00:00` : undefined,
        endDate: endDate ? `${endDate}T23:59:59` : undefined,
        grouped: 'true',
      });
      setGroupedCalls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalCalls = groupedCalls.reduce((sum, group) => sum + group.calls.length, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm text-gray-600">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <p className="text-gray-600">
          Total calls: <span className="font-semibold text-gray-900">{totalCalls}</span>
          {' | '}
          Reps with calls: <span className="font-semibold text-gray-900">{groupedCalls.length}</span>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : groupedCalls.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No calls found for this period</div>
      ) : (
        <div className="space-y-6">
          {groupedCalls.map((group) => (
            <div key={group.repId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <h2 className="text-lg font-semibold text-indigo-900">
                  {group.repName}
                  <span className="ml-2 text-sm font-normal text-indigo-600">
                    ({group.calls.length} call{group.calls.length !== 1 ? 's' : ''})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {group.calls.map((call) => (
                  <div key={call.id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{call.customer_name}</h3>
                        {call.customer_phone && (
                          <p className="text-sm text-gray-500">{call.customer_phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(call.created_at)}</p>
                        <p className="text-xs text-gray-400">Logged by {call.logged_by_name}</p>
                        <SmsStatusBadge status={call.sms_status} />
                      </div>
                    </div>
                    {call.notes && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {call.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
