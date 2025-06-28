import React, { useEffect } from 'react';

const GoogleClientId = "915570691665-ckl8ckr5e5hvqu2ir7br51j1sl9rqfdk.apps.googleusercontent.com";
const GoogleClientSecret = "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";

function GoogleLoginButton() {
  useEffect(() => {
    /* global google */
    window.google.accounts.id.initialize({
      client_id: GoogleClientId,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large' }
    );
  }, []);

  const handleCredentialResponse = async (response) => {
    const { credential } = response;
    console.log('Encoded JWT ID token: ' + credential);
    // Send token to backend
    // try {
    //   const res = await fetch('http://localhost:8000/api/auth/google', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ token: credential }),
    //   });

    //   const data = await res.json();
    //   console.log('Login success:', data);
    // } catch (err) {
    //   console.error('Login error:', err);
    // }
  };

  return <div id="googleSignInDiv"></div>;
}

export default GoogleLoginButton;
