import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import useMilestones from "../hooks/use-milestones";
import postMilestoneComplete from "../api/post-milestone-complete";
import "./MilestonesList.css";

function MilestonesList({ circleId }) {
    const { auth } = useAuth();
    const { milestones, isLoading, error, toggleCompletion } = useMilestones(circleId);
    const [completedIds, setCompletedIds] = useState(new Set());

    // Load completed milestones from localStorage on mount
    useEffect(() => {
        const key = `completed_milestones_${circleId}_${auth?.username || 'anonymous'}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setCompletedIds(new Set(JSON.parse(stored)));
            } catch (e) {
                console.error("Failed to load completed milestones:", e);
            }
        }
    }, [circleId, auth?.username]);

    const handleToggleComplete = async (milestoneId) => {
        const newCompleted = new Set(completedIds);
        const isNowCompleted = !completedIds.has(milestoneId);

        if (isNowCompleted) {
            newCompleted.add(milestoneId);
            // Try to save to backend
            try {
                await postMilestoneComplete(milestoneId, auth?.token);
                toggleCompletion(milestoneId, true);
            } catch (error) {
                console.error("Failed to save completion:", error);
                // Continue anyway - localStorage is fallback
            }
        } else {
            newCompleted.delete(milestoneId);
            toggleCompletion(milestoneId, false);
        }

        // Update state and localStorage
        setCompletedIds(newCompleted);
        const key = `completed_milestones_${circleId}_${auth?.username || 'anonymous'}`;
        localStorage.setItem(key, JSON.stringify([...newCompleted]));
    };

    if (isLoading) {
        return <p className="milestones-loading">Loading learning modules...</p>;
    }

    if (error) {
        return <p className="milestones-error">Error loading modules: {error.message}</p>;
    }

    if (!milestones || milestones.length === 0) {
        return (
            <div className="milestones-empty">
                <p>No learning modules yet.</p>
                <p className="empty-hint">The facilitator will add modules soon!</p>
            </div>
        );
    }

    // Calculate progress
    const completedCount = milestones.filter(m => 
        completedIds.has(m.id) || m.user_completed
    ).length;
    const totalCount = milestones.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="milestones-container">
            <div className="milestones-header">
                <h2>📚 Learning Modules</h2>
                <p className="milestones-intro">
                    Track your progress through the learning journey
                </p>
            </div>

            {/* Progress Bar */}
            <div className="milestones-progress">
                <div className="progress-stats">
                    <span className="progress-label">Your Progress</span>
                    <span className="progress-percentage">{progressPercent}%</span>
                </div>
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className="progress-text">
                    {completedCount} of {totalCount} modules completed
                </p>
            </div>

            {/* Milestones Grid */}
            <div className="milestones-grid">
                {milestones.map((milestone) => {
                    const isCompleted = completedIds.has(milestone.id) || milestone.user_completed;
                    
                    return (
                        <div 
                            key={milestone.id} 
                            className={`milestone-card ${isCompleted ? 'completed' : ''}`}
                        >
                            <div className="milestone-header">
                                <span className="milestone-number">
                                    Module {milestone.order}
                                </span>
                                <button
                                    className={`milestone-check ${isCompleted ? 'checked' : ''}`}
                                    onClick={() => handleToggleComplete(milestone.id)}
                                    aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                    title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                >
                                    {isCompleted ? '✓' : '○'}
                                </button>
                            </div>
                            
                            <h4 className="milestone-title">{milestone.title}</h4>
                            
                            {milestone.description && (
                                <p className="milestone-description">{milestone.description}</p>
                            )}
                            
                            {isCompleted && (
                                <span className="completion-badge">
                                    🌱 Completed
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MilestonesList;