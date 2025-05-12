import React, { useEffect, useState } from "react";
import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLogin from "./GoogleLogin";

export default function Login() {
    const [user, setUser] = useState();

    return (
      <GoogleOAuthProvider clientId="719713928731-vnenq3ekof0fl5gbn3In0kj82637ps.apps.googleusercontent.com">
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

