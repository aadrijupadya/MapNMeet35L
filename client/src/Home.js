import React, { useState } from 'react';
import './Home.css';
import logo from './assets/logo.png';
import uclaBanner from './assets/Banner.png'; // your stitched UCLA image
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from 'axios';

function Home(props) {
  const [showAbout, setShowAbout] = useState(false);
  const navigate = useNavigate();


  const handleLogout = async () => {
    try {
      // 1. Logout from Google (if using GIS or Firebase)
      googleLogout(); // Only if you use Google OAuth
  
      // 2. Call backend to clear the HttpOnly cookie
      await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // important to send cookies
      });
  
      // 3. Clear app state
      props.updateUser(null);
  
      // 4. Optional: navigate to login
      // navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
 
  const responseGoogle = async (authResult) => {
		try {
			if (authResult["code"]) {
        const result = await axios.get(`http://localhost:8000/api/auth/google?code=${authResult.code}`, {
          withCredentials: 'include',
        }); 
				props.updateUser(result.data.data.user);
        navigate('/profile')
			} else {
				console.log(authResult);
				// throw new Error(authResult);
			}
		} catch (e) {
			alert("Make sure you have started the server")
		}
	};

	const googleLogin = useGoogleLogin({
		onSuccess: responseGoogle,
		onError: responseGoogle,
		flow: "auth-code",
		// redirectUri: "http://localhost:3000/login"
	});

  return (
    <div className="home-container">
      {/* Top Navigation Bar (Logo Only) */}
      <header className="header">
        <div className="logo-wrapper">
          <img src={logo} alt="MapNMeet Logo" className="logo-large" />
        </div>
      </header>

      {/* Scrolling Image Banner */}
      <div className="banner-container">
        {/* Mission Statement Overlay */}
        { !props.user && (
          <div className="mission-statement">
            <p>MapNMeet helps UCLA students discover and join spontaneous activities on campus. We connect people in real time for sports, study groups, and more—building community, one meetup at a time.</p>
          </div>
        )}
        <div className="scrolling-banner">
          <img src={uclaBanner} alt="UCLA Scrolling Banner 1" />
          <img src={uclaBanner} alt="UCLA Scrolling Banner 2" />
        </div>
        <div className="banner-overlay">
          <div>
                {props.user && props.user.image && (
                <img
                  src={props.user.image}
                  alt="User Profile"
                  style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  margin: "10px",
                  }}
                />
                )}
                <p>{props.user && props.user.name}</p>
                <p>{props.user && props.user.email}</p>
              </div>
        </div>

        {/* Buttons Below the Mission Statement */}
        <div className="buttons">
          {
            props.user ? (
              <button
                onClick={async () => {
                  await handleLogout();
                  // window.location.reload();
                }}
              >
                Logout
              </button>
            ) : (
              <button onClick={() => googleLogin()}>Login</button>
            )
          }
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-backdrop" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowAbout(false)}>✕</button>
            <h2>About MapNMeet</h2>
            <p>
              HEHEHE silly project
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MapNMeet | Designed by Aadrij Upadya, Aaditya Raj, Antonio Quintero, Akhilesh Basetty, and Daniel Tritasavit</p>
        <p>Contact: aadriju01@ucla.edu</p>
      </footer>
    </div>
  );
}

export default Home;
