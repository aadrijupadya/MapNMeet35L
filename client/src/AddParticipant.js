const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path as necessary
const Activity = require('./models/Activity'); // Adjust the path as necessary

// Assuming you have User and Activity schemas defined

async function addParticipant(userId, activityId) {
    try {
        // Update the activity's joinees field with the email
        const activityUpdate = await Activity.findByIdAndUpdate(
            activityId,
            { $addToSet: { joinees: userId } }, // $addToSet ensures no duplicates
            { new: true } // Return the updated document
        );

        if (!activityUpdate) {
            throw new Error('Activity not found');
        }

        // Update the user's activities field with the activity ID
        const userUpdate = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { activities: activityId } }, // $addToSet ensures no duplicates
            { new: true } // Return the updated document
        );

        if (!userUpdate) {
            throw new Error('User not found');
        }

        return { success: true, activity: activityUpdate, user: userUpdate };
    } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

module.exports = addParticipant;