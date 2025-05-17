import './Signup.css';
import uclaLogo from './assets/ucla-logo.png';

export default function Signup() {
  return (
    <div className="signup-container">
      <h1>Welcome to Map N Meet</h1>
      <button className="ucla-signin-btn">
        <img src={uclaLogo} alt="UCLA logo" />
        Sign in with UCLA
      </button>
    </div>
  );
}
