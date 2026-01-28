import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import putCourse from "../api/put-course";
import postMilestone from "../api/post-milestone";
import useMilestones from "../hooks/use-milestones";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MilestoneBuilder from "./MilestoneBuilder";
import "./UpdateCourseForm.css";

function UpdateCourseForm({ existingData, setUpdateMessage }) {
    const navigate = useNavigate();
    const { auth } = useAuth();

    // Simplified state matching create form
    const [courseForm, setCourseForm] = useState({
        title: existingData.title || "",
        brief_description: existingData.brief_description || "",
        course_content: existingData.course_content || "",
        category: existingData.category || "",
        difficulty_level: existingData.difficulty_level || "beginner",
        duration_in_hours: String(existingData.duration_in_hours || ""),
        max_students: String(existingData.max_students || ""),
    });

    // Fetch existing milestones
    const { milestones: existingMilestones, isLoading: milestonesLoading } = useMilestones(existingData.id);
    const [milestones, setMilestones] = useState([]);

    // Load existing milestones into state
    useEffect(() => {
        if (existingMilestones && existingMilestones.length > 0) {
            // Convert backend milestones to frontend format
            const formattedMilestones = existingMilestones.map(m => ({
                id: m.id, // Keep backend ID if it exists
                title: m.title,
                description: m.description || "",
                order: m.order,
                isExisting: true // Flag to track if this is from backend
            }));
            setMilestones(formattedMilestones);
        }
    }, [existingMilestones]);

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [StarterKit],
        content: existingData.course_content || '<p>Start writing...</p>',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setCourseForm(prev => ({ ...prev, course_content: html }));
        },
    });

    useEffect(() => {
        if (editor && existingData?.course_content && editor.isEmpty) {
            editor.commands.setContent(existingData.course_content);
        }
    }, [editor, existingData]);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleClickChange = (event) => {
        const { id, value } = event.target;
        setCourseForm((prev) => ({ ...prev, [id]: value }));
    };

    const handleClickSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setUpdateMessage(null);
        setLoading(true);

        // Validation
        if (!courseForm.title || !courseForm.brief_description || !courseForm.category) {
            setError("Title, description, and category are required.");
            setLoading(false);
            return;
        }

        // Validate milestones if any exist
        if (milestones.length > 0) {
            const hasEmptyTitle = milestones.some(m => !m.title.trim());
            if (hasEmptyTitle) {
                setError("All modules must have a title. Please fill in or remove empty modules.");
                setLoading(false);
                return;
            }
        }

        try {
            // Step 1: Update circle basic info
            const updatePayload = {
                title: courseForm.title,
                brief_description: courseForm.brief_description,
                course_content: courseForm.course_content,
                category: courseForm.category,
                difficulty_level: courseForm.difficulty_level,
                duration_in_hours: Number(courseForm.duration_in_hours),
                max_students: Number(courseForm.max_students),
                
                // Preserve existing fields
                owner: existingData.owner,
                is_open: existingData.is_open,
                status: existingData.status || "published",
            };

            const courseId = existingData.id;
            const updatedCourse = await putCourse(courseId, updatePayload, auth.token);

            // Step 2: Handle milestones
            const newMilestones = milestones.filter(m => !m.isExisting);
            
            if (newMilestones.length > 0) {
                try {
                    for (const milestone of newMilestones) {
                        await postMilestone(courseId, {
                            title: milestone.title,
                            description: milestone.description || "",
                            order: milestone.order
                        }, auth?.token);
                    }
                } catch (milestoneError) {
                    console.error("Failed to create new milestones:", milestoneError);
                    // Continue anyway - main update succeeded
                }
            }

            setUpdateMessage(`Circle "${updatedCourse.title}" updated successfully!`);
            navigate(`/circles/${updatedCourse.id}`);

        } catch (err) {
            console.error("Update failed", err);
            setError(err.message || "Failed to update circle.");
        } finally {
            setLoading(false);
        }
    };

    return (
            <form onSubmit={handleClickSubmit}>           
                {error && <div className="error-message">{error}</div>}
                
                {/* ═══ SECTION 1: CIRCLE BASICS ═══ */}
                <section className="form-section">
                    <div className="form-field">
                        <label htmlFor="title">Circle Name *</label>
                        <input 
                            type="text" 
                            id="title" 
                            value={courseForm.title} 
                            onChange={handleClickChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-field">
                        <label htmlFor="brief_description">Brief Description *</label>
                        <textarea 
                            id="brief_description" 
                            value={courseForm.brief_description}
                            placeholder="A short overview (max 250 characters)" 
                            onChange={handleClickChange} 
                            rows="3"
                            maxLength={250}
                            required 
                        />
                        <span className="char-count">{courseForm.brief_description.length}/250</span>
                    </div>

                    <div className="form-field">
                        <label htmlFor="category">Category *</label>
                        <select id="category" value={courseForm.category} onChange={handleClickChange} required>
                            <option value="">--Select Category--</option>
                            <option value="science and technology">Science and Technology</option>
                            <option value="arts and crafts">Arts and Crafts</option>
                            <option value="reading and writing">Reading and Writing</option>
                            <option value="music and musical instruments">Music and Musical Instruments</option>
                            <option value="languages">Languages</option>
                            <option value="health and wellness">Health and Wellness</option>
                            <option value="business and finance">Business and Finance</option>
                            <option value="personal development">Personal Development</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </section>

                {/* ═══ SECTION 2: WHAT WE'LL LEARN ═══ */}
                <section className="form-section">
                    <h2 className="section-title">What We'll Learn Together</h2>
                    <p className="section-hint">
                        Update the curriculum, goals, or expectations.
                    </p>

                    <div className="form-field">
                        <EditorContent editor={editor} className="tiptap" />
                    </div>
                </section>

                {/* ═══ SECTION 3: LEARNING MODULES ═══ */}
                <section className="form-section">
                    <h2 className="section-title">📚 Learning Modules</h2>
                    <p className="section-hint">
                        {milestonesLoading 
                            ? "Loading existing modules..." 
                            : "Add new modules below. Note: Currently you can only add new modules. To edit or remove existing modules, please contact support."
                        }
                    </p>

                    {!milestonesLoading && (
                        <>
                            {/* Show existing milestones (read-only for now) */}
                            {existingMilestones && existingMilestones.length > 0 && (
                                <div className="existing-milestones-info">
                                    <h4>Existing Modules:</h4>
                                    <ul className="existing-modules-list">
                                        {existingMilestones.map(m => (
                                            <li key={m.id}>
                                                <strong>Module {m.order}:</strong> {m.title}
                                                {m.description && <span> - {m.description}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="hint-text">These modules are already saved. Add new ones below:</p>
                                </div>
                            )}

                            {/* MilestoneBuilder for new milestones */}
                            <MilestoneBuilder 
                                milestones={milestones.filter(m => !m.isExisting)} 
                                setMilestones={(newMilestones) => {
                                    // Combine existing + new
                                    const existing = milestones.filter(m => m.isExisting);
                                    setMilestones([...existing, ...newMilestones]);
                                }}
                            />
                        </>
                    )}
                </section>

                {/* ═══ SECTION 4: CIRCLE SETTINGS ═══ */}
                <section className="form-section">
                    <h2 className="section-title">Circle Settings</h2>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="difficulty_level">Difficulty Level</label>
                            <select 
                                id="difficulty_level" 
                                value={courseForm.difficulty_level} 
                                onChange={handleClickChange}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="duration_in_hours">Estimated Duration (hours)</label>
                            <input 
                                type="number" 
                                id="duration_in_hours" 
                                value={courseForm.duration_in_hours} 
                                onChange={handleClickChange} 
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="max_students">Maximum Participants *</label>
                        <input 
                            type="number" 
                            id="max_students" 
                            value={courseForm.max_students} 
                            onChange={handleClickChange} 
                            min="1"
                            required 
                        />
                    </div>
                </section>

                {/* ═══ SUBMIT BUTTON ═══ */}
                <div className="form-actions">
                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
    );
}

export default UpdateCourseForm;