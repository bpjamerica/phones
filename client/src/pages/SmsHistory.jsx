import { useState, useEffect } from 'react';
import { sms } from '../api/client';

function formatDate(dateString) {
  // SQLite stores UTC but without timezone marker, so add 'Z' to indicate UTC
  const utcDate = dateString.includes('Z') ? dateString : dateString.replace(' ', 'T') + 'Z';
  return new Date(utcDate).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function StatusBadge({ status, acknowledged }) {
  if (acknowledged) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Reply Received
      </span>
    );
  }

  const colors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    queued: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status === 'sent' || status === 'delivered' ? 'Sent' : status}
    </span>
  );
}

export default function SmsHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sms.getHistory(100);
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS History</h1>
        <button
          onClick={loadHistory}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No SMS messages sent yet</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reply
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(msg.sent_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{msg.to_rep_name}</div>
                    <div className="text-sm text-gray-500">{msg.to_rep_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {msg.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {msg.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={msg.status} acknowledged={msg.acknowledged_at} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {msg.reply_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
