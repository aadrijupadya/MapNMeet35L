import mongoose from 'mongoose';
import User from '../models/UserModel';
import Activity from './models/Activity';


export default async function addParticipant(userId, activityId, remove) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const activity = await Activity.findById(activityId).session(session);

        if (!activity) {
            await session.abortTransaction();
            session.endSession();
            throw new Error('ACTIVITY_NOT_FOUND');
        }

        // Verify user exists before proceeding
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            throw new Error('USER_NOT_FOUND');
        }

        if (!remove) {
            // Check if the joinees field length is equal to the participant count
            if (activity.joinees.length >= activity.participantCount) {
                await session.abortTransaction();
                session.endSession();
                throw new Error('ACTIVITY_FULL');
            }

            // Check if user is already a joinee
            if (activity.joinees.includes(userId)) {
                await session.abortTransaction();
                session.endSession();
                throw new Error('USER_ALREADY_JOINED');
            }

            // Add the userId to the activity's joinees array
            activity.joinees.addToSet(userId);
            await activity.save({ session });

            // Update the user's activities field with the activity ID
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { activities: activityId } },
                { session, new: true }
            );
        } else {
            // Check if user is actually a joinee before removing
            if (!activity.joinees.includes(userId)) {
                await session.abortTransaction();
                session.endSession();
                throw new Error('USER_NOT_JOINED');
            }

            // Remove the userId from the activity's joinees array
            activity.joinees.pull(userId);
            await activity.save({ session });

            // Remove the activityId from the user's activities field
            await User.findByIdAndUpdate(
                userId,
                { $pull: { activities: activityId } },
                { session, new: true }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return { success: true };

    } catch (error) {
        // abort if failure
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction failed:', error);
        return { success: false, error: error.message };
    }
}