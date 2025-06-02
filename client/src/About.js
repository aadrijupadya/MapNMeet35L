import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="container">
      <h1 className="title">About MapNMeet</h1>
      
      <section className="section">
        <h2 className="sectionTitle">Our Mission</h2>
        <p className="sectionContent">
          MapNMeet is dedicated to bringing people together through shared interests and locations. 
          We believe in creating meaningful connections and memorable experiences in your local community.
        </p>
      </section>

      <section className="section">
        <h2 className="sectionTitle">Key Features</h2>
        <ul className="list">
          <li>
            <strong>Smart Location Matching</strong> - Find events and people near you with our intelligent location-based system
          </li>
          <li>
            <strong>Real-time Updates</strong> - Stay informed with instant notifications about events and connections
          </li>
          <li>
            <strong>Social Integration</strong> - Seamlessly connect with friends and share your experiences
          </li>
          <li>
            <strong>Customizable Profiles</strong> - Express yourself with personalized profiles and preferences
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="sectionTitle">How It Works</h2>
        <ul className="list">
          <li>
            <strong>Create Your Profile</strong> - Set up your account and customize your preferences
          </li>
          <li>
            <strong>Discover Events</strong> - Browse and join events happening in your area
          </li>
          <li>
            <strong>Connect</strong> - Meet new people who share your interests
          </li>
          <li>
            <strong>Stay Updated</strong> - Receive notifications about new events and connections
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="sectionTitle">Why Choose MapNMeet</h2>
        <ul className="list">
          <li>
            <strong>User-Friendly Interface</strong> - Intuitive design for seamless navigation
          </li>
          <li>
            <strong>Privacy Focused</strong> - Your data security is our top priority
          </li>
          <li>
            <strong>Community Driven</strong> - Built by and for the community
          </li>
          <li>
            <strong>Always Evolving</strong> - Regular updates and new features based on user feedback
          </li>
        </ul>
      </section>
    </div>
  );
};

export default About;
