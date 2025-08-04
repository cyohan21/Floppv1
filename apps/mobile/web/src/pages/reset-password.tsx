import { useEffect } from 'react';

export default function ForgotPassword() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      window.location.href = `myapp://reset-password?token=${encodeURIComponent(token)}`;
    }
  }, []);

  return <p>Redirecting to your app...</p>;
}