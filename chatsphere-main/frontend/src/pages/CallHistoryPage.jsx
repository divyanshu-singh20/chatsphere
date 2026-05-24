import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import CallHistoryScreen from '../components/calls/CallHistoryScreen';

export default function CallHistoryPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/calls');
      setCalls(data.calls || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  if (loading && !calls.length) {
    return <div className="p-4 lg:p-6"><LoadingScreen label="Loading call history" /></div>;
  }

  return <CallHistoryScreen calls={calls} loading={loading} onRefresh={loadCalls} />;
}