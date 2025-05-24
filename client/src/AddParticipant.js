import mongoose from 'mongoose';
import User from './models/User'; // Adjust the path as necessary
import Activity from './models/Activity'; // Adjust the path as necessary

// Assuming you have User and Activity schemas defined

export default async function addParticipant(userId, activityId, remove) {
    try {
        // Fetch the activity to check joinees and participant count
        const activity = await Activity.findById(activityId);

        if (!activity) {
            throw new Error('ACTIVITY_NOT_FOUND');
        }

        if (!remove) {
            // Check if the joinees field length is equal to the participant count
            if (activity.joinees.length >= activity.participantCount) {
            throw new Error('ACTIVITY_FULL');
            }

            // Add the userId to the activity's joinees array
            activity.joinees.addToSet(userId);

            // Save the updated activity
            await activity.save();

            // Update the user's activities field with the activity ID
            const userUpdate = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { activities: activityId } }, // $addToSet ensures no duplicates
            { new: true } // Return the updated document
            );

            if (!userUpdate) {
            throw new Error('USER_NOT_FOUND');
            }
        } else {
            // Remove the userId from the activity's joinees array
            activity.joinees.pull(userId);

            // Save the updated activity
            await activity.save();

            // Remove the activityId from the user's activities field
            const userUpdate = await User.findByIdAndUpdate(
            userId,
            { $pull: { activities: activityId } }, // $pull removes the activityId
            { new: true } // Return the updated document
            );

            if (!userUpdate) {
            throw new Error('USER_NOT_FOUND');
            }
        }

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
    }
}