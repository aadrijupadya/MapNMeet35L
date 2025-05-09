import React from 'react';
import styles from './About.module.css';

const Section = ({ title, children }) => (
  <div className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <p className={styles.sectionContent}>{children}</p>
  </div>
);

export default function About() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About MapNMeet</h1>

      <Section title="Introduction">
        MapNMeet is a campus-based social networking app designed for UCLA students.
        It helps students discover and join spontaneous activities like pickup sports or study groups
        through a real-time campus map.
      </Section>

      <Section title="Problem Statement">
        Finding spontaneous and casual activities at UCLA can be difficult.
        Existing platforms are outdated or disorganized for this use-case. MapNMeet provides
        a centralized and simplified way for students to connect and engage with others around campus.
      </Section>

      <Section title="Why MapNMeet">
        <ul className={styles.list}>
          <li><strong>Community Building:</strong> Meet new people through shared interests.</li>
          <li><strong>Real-Time Discovery:</strong> Instantly find events near you.</li>
          <li><strong>Convenience:</strong> No more group chats or coordination headaches.</li>
          <li><strong>Safety and Exclusivity:</strong> Only verified UCLA students can join.</li>
        </ul>
      </Section>

      <Section title="Tech Stack">
        MapNMeet is built using the MERN stack (MongoDB, Express.js, React Native, Node.js), with real-time map integration.
      </Section>

      <Section title="Features">
        <ul className={styles.list}>
          <li><strong>User Authentication:</strong> Login with a UCLA email (.edu).</li>
          <li><strong>Post & Discover Activities:</strong> Add a title, description, location, time, and more.</li>
          <li><strong>Filter by Time & Location:</strong> Find events that match your schedule and proximity.</li>
          <li><strong>Join Requests:</strong> Request to join, get approved, and view the participant list live.</li>
        </ul>
      </Section>
    </div>
  );
}
