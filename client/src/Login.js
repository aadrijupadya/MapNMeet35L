import React, { useEffect, useState } from "react";
import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLogin from "./GoogleLogin";
import { googleAuth } from "./services/api";

export default function Login() {
    const [user, setUser] = useState();

    useEffect(() => {
      async function fetchData() {
        console.log(window.location.href); // Log full URL for debugging

        const urlParams = new URLSearchParams(window.location.search);
        console.log(urlParams);
        const code = urlParams.get('code');

        try {
          if (code) {
            console.log(code);
            const result = await googleAuth(code);
            setUser(result.data.data.user);
            alert("successfuly logged in");
          } else {
            throw new Error("Auth result error occured");
          }
        } catch (e) {
          console.log(e);
        }
      }
      fetchData();
      
    }, []);


    return (
      <GoogleOAuthProvider clientId="719713928731-vnenq3ekof0fl5gbn3ln0kj826ii37ps.apps.googleusercontent.com">
      <div className="App">
        <GoogleLogin setUser={setUser}></GoogleLogin>
        {user && (
        <div>
          {user.image && (
          <img
            src={user.image}
            alt="User Profile"
            style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            margin: "10px",
            }}
          />
          )}
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>
        )}
      </div>
      </GoogleOAuthProvider>
    );
}

