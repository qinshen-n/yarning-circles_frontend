import { useState } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import "./MilestoneBuilder.css";

function MilestoneBuilder({ milestones, setMilestones }) {
    const addMilestone = () => {
        const newMilestone = {
            id: Date.now(), // Temporary ID for frontend
            title: "",
            description: "",
            order: milestones.length + 1,
        };
        setMilestones([...milestones, newMilestone]);
    };

    const removeMilestone = (id) => {
        const filtered = milestones.filter(m => m.id !== id);
        // Reorder remaining milestones
        const reordered = filtered.map((m, index) => ({
            ...m,
            order: index + 1
        }));
        setMilestones(reordered);
    };

    const updateMilestone = (id, field, value) => {
        setMilestones(milestones.map(m => 
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newMilestones = [...milestones];
        [newMilestones[index - 1], newMilestones[index]] = 
        [newMilestones[index], newMilestones[index - 1]];
        
        // Update order numbers
        const reordered = newMilestones.map((m, i) => ({
            ...m,
            order: i + 1
        }));
        setMilestones(reordered);
    };

    const moveDown = (index) => {
        if (index === milestones.length - 1) return;
        const newMilestones = [...milestones];
        [newMilestones[index], newMilestones[index + 1]] = 
        [newMilestones[index + 1], newMilestones[index]];
        
        // Update order numbers
        const reordered = newMilestones.map((m, i) => ({
            ...m,
            order: i + 1
        }));
        setMilestones(reordered);
    };

    return (
        <div className="milestone-builder">
            <div className="builder-header">
                <h4>Learning Modules</h4>
                <p className="builder-hint">
                    Define the learning path for this circle. Members will track their progress through these modules.
                </p>
            </div>

            {milestones.length === 0 && (
                <div className="empty-state">
                    <p>No modules yet. Click "Add Module" to create your first learning module.</p>
                </div>
            )}

            <div className="milestones-list">
                {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="milestone-item">
                        <div className="milestone-header-row">
                            <div className="milestone-order">
                                <GripVertical size={18} className="grip-icon" />
                                <span className="order-badge">Module {milestone.order}</span>
                            </div>
                            
                            <div className="milestone-actions">
                                <button
                                    type="button"
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="btn-move"
                                    title="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveDown(index)}
                                    disabled={index === milestones.length - 1}
                                    className="btn-move"
                                    title="Move down"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeMilestone(milestone.id)}
                                    className="btn-remove"
                                    title="Remove module"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="milestone-fields">
                            <div className="field-group">
                                <label htmlFor={`milestone-title-${milestone.id}`}>
                                    Module Title *
                                </label>
                                <input
                                    type="text"
                                    id={`milestone-title-${milestone.id}`}
                                    value={milestone.title}
                                    onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                    placeholder="e.g., Python Basics"
                                    required={milestones.length > 0}
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor={`milestone-desc-${milestone.id}`}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    id={`milestone-desc-${milestone.id}`}
                                    value={milestone.description}
                                    onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                    placeholder="What will learners gain from this module?"
                                    rows="2"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addMilestone}
                className="btn-add-milestone"
            >
                <Plus size={18} />
                Add Module
            </button>
        </div>
    );
}

export default MilestoneBuilder;