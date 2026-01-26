import { useState, useEffect } from "react";
import getMilestones from "../api/get-milestones";

export default function useMilestones(courseId) {
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!courseId) {
            setIsLoading(false);
            return;
        }

        async function fetchMilestones() {
            try {
                setIsLoading(true);
                const data = await getMilestones(courseId);
                setMilestones(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching milestones:", err);
                setError(err);
                setMilestones([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchMilestones();
    }, [courseId]);

    const addMilestone = (newMilestone) => {
        setMilestones(prev => [...prev, newMilestone].sort((a, b) => a.order - b.order));
    };

    const toggleCompletion = (milestoneId, userCompleted) => {
        setMilestones(prev => prev.map(m => 
            m.id === milestoneId 
                ? { ...m, user_completed: userCompleted }
                : m
        ));
    };

    return { 
        milestones, 
        isLoading, 
        error, 
        addMilestone,
        toggleCompletion
    };
}