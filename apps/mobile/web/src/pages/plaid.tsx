import { useEffect } from 'react';

export default function PlaidRedirect() {
  useEffect(() => {
    window.location.href = 'myapp://oauth-redirect';
  }, []);
  return <p>Redirecting to your app...</p>;
}