import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useHomeContent() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_URL}/home-content`);
      const data = await res.json();
      if (data.success) setContent(data.data || {});
    } catch (err) {
      console.error('Fout bij ophalen home content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return { content, loading, refetch: fetchContent };
}
