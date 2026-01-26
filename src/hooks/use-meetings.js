// 1. Imports
import { useState, useEffect } from "react";
import getMeetings from "../api/get-meetings";

// 2. Hook declaration
export default function useMeetings(courseId) {
    // 3. State declarations
    // State 1: store the meetings data
    const [meetings, setMeetings] = useState([]);
    // State 2: track if we're currently loading
    const [isLoading, setIsLoading] = useState(true);
    // State 3: store any errors that occur
    const [error, setError] = useState(null);

    // 4. Side effects
    useEffect(() => {
        // Guard clause: if no courseId, don't fetch
        if (!courseId) {
            setIsLoading(false); // Stop showing spinner
            return;
        }

        // Define the fetch function
        async function fetchMeetings() {
            try {
                // Try Block: attempt to fetch data
                setIsLoading(true); // Start loading

                const data = await getMeetings(courseId); // Fetch from API
    
                setMeetings(data); // Store the data
                setError(null); //Clear any previous errors
            } catch (err) {
                // Catch Block: Handle errors

                console.error("Error fetching meetings:", err); //Log for debugging
                setError(err); // Store error in state
                setMeetings([]); // Clear meetings on error
            } finally {
                // Finally Block: always runs
                setIsLoading(false); // Stop loading (success or failure)
            }
        }
        // Call the fetch function
        fetchMeetings();
    }, [courseId]); // re-run effect when courseId changes

    // 5. Helper functions
    const addMeeting = (newMeeting) => {
        setMeetings(prev => [...prev, newMeeting]);
    };

    const removeMeeting = (meetingId) => {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
    };

    const updateMeeting = (meetingId, updateData) => {
        setMeetings(prev => prev.map(m =>
            m.id === meetingId ? { ...m, ...updateData } : m
        ))
    };

    // 6. Return Statement
    return {
        meetings,
        isLoading,
        error,
        addMeeting,
        removeMeeting,   //
        updateMeeting
    };
}