import React, { useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';

const GoogleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GoogleClientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function GoogleLoginButton({ setUserDetails }) {
  const navigate = useNavigate();
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
    console.log('Encoded JWT ID token 123: ' + credential);
    // Send token to backend
    try {
      console.log('Sending token to backend...');
      
      const res = await axios.post(`${API_BASE_URL}/google-verify-token`, {
        token: credential,
      });

      const data = res.data;
      const user_id = data.user_id;
      localStorage.setItem("user_id", user_id);
      const modalEl = document.getElementById('loginModal');
      document.getElementById('modalCloseBtn')?.click();
      if(data.status == 'success') {
        window.Swal.fire({
          toast: true,
          icon: 'success',
          title: 'Welcome back!',
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        axios.post(`${API_BASE_URL}/get-user`, {
          user_id: String(user_id),
        })
        .then((response) => {
          if (response.data.status === 'success') {
            setUserDetails(response.data.user); // ✅ use React state
          } else {
            localStorage.removeItem("user_id");
            console.error("Error fetching user:", response.data.message);
          }
        })
        .catch((error) => {
          console.error("API error:", error);
        });
      } else {
        throw new Error('Login failed: ' + data.message);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return <div id="googleSignInDiv"></div>;
}

export default GoogleLoginButton;
