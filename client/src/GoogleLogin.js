/* eslint-disable import/no-anonymous-default-export */
import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { googleAuth } from "./services/api";
                              

export default (props) => {
	const responseGoogle = async (authResult) => {
		try {
			if (authResult["code"]) {
				const result = await googleAuth(authResult.code);
				props.setUser(result.data.data.user);
			} else {
				throw new Error(authResult);
			}
		} catch (e) {
			console.log(e);
		}
	};

	const googleLogin = useGoogleLogin({
		onSuccess: responseGoogle,
		onError: responseGoogle,
		flow: "auth-code",
		// redirectUri: "http://localhost:3000/login"
	});

	return (
		<button
			style={{
				padding: "10px 20px",
			}}
			onClick={googleLogin}
		>
			Sign in with Google
		</button>
	);
};