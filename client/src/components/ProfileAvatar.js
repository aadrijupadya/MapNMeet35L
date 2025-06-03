import React, { useState } from 'react';

// A reusable avatar component that handles both image and fallback states
// Shows user's initial in a circle if their Google profile pic fails to load
const ProfileAvatar = ({ user, size = 'medium', className = '' }) => {
  // Track if the image failed to load (e.g. 429 Too Many Requests from Google)
  const [imgError, setImgError] = useState(false);
  
  // Different sizes for different contexts (friends list vs profile page)
  const sizeClasses = {
    small: 'w-10 h-10 text-lg',    // For friend cards and comments
    medium: 'w-16 h-16 text-2xl',  // Default size
    large: 'w-24 h-24 text-3xl'    // For profile headers
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  // Show fallback with user's initial if:
  // - Image failed to load
  // - No image URL provided
  // - Invalid image URL format
  if (imgError || !user?.image || !(user.image.startsWith('http://') || user.image.startsWith('https://') || user.image.startsWith('//'))) {
    return (
      <div className={`profile-avatar ${sizeClass} ${className}`}>
        <span>{user?.name ? user.name[0].toUpperCase() : 'U'}</span>
      </div>
    );
  }

  // Try to load the actual profile image
  return (
    <div className={`profile-avatar ${sizeClass} ${className}`}>
      <img
        src={user.image}
        alt={`${user.name || 'User'}'s profile`}
        onError={() => setImgError(true)}  // Switch to fallback if image fails
        className="profile-img"
      />
    </div>
  );
};

export default ProfileAvatar; 