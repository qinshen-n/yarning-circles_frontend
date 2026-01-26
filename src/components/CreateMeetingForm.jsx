import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import postMeeting from "../api/post-meeting";
import "./CreateMeetingForm.css";

function CreateMeetingForm({ circleId, onMeetingCreated }) {
    const { auth } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        datetime: "",
        duration_minutes: 60,
        meeting_type: "online",
        online_link: "",
        physical_location: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.datetime) {
            alert("Please fill in title and date/time");
            return;
        }

        setIsSubmitting(true);
        try {
            const newMeeting = await postMeeting(circleId, formData, auth.token);
            
            if (onMeetingCreated) {
                onMeetingCreated(newMeeting);
            }
            
            setFormData({
                title: "",
                description: "",
                datetime: "",
                duration_minutes: 60,
                meeting_type: "online",
                online_link: "",
                physical_location: ""
            });
            setShowForm(false);
            
            alert("Meeting created successfully!");
            window.location.reload();
        } catch (error) {
            alert(error.message || "Failed to create meeting");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!showForm) {
        return (
            <button 
                className="btn-create-meeting"
                onClick={() => setShowForm(true)}
            >
                + Schedule a Meeting
            </button>
        );
    }

    return (
        <form className="create-meeting-form" onSubmit={handleSubmit}>
            <h3>Schedule a New Meeting</h3>

            <div className="form-group">
                <label htmlFor="title">Meeting Title *</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Week 1: Introduction"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What will we discuss?"
                    rows="3"
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="datetime">Date & Time *</label>
                    <input
                        type="datetime-local"
                        id="datetime"
                        name="datetime"
                        value={formData.datetime}
                        onChange={(e) => {
                            const localDate = new Date(e.target.value);
                            const isoString = localDate.toISOString();
                            setFormData(prev => ({ ...prev, datetime: isoString }));
                        }}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="duration_minutes">Duration (minutes)</label>
                    <input
                        type="number"
                        id="duration_minutes"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleChange}
                        min="15"
                        step="15"
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="meeting_type">Meeting Type</label>
                <select
                    id="meeting_type"
                    name="meeting_type"
                    value={formData.meeting_type}
                    onChange={handleChange}
                >
                    <option value="online">Online</option>
                    <option value="in-person">In-Person</option>
                    <option value="hybrid">Hybrid</option>
                </select>
            </div>

            {(formData.meeting_type === 'online' || formData.meeting_type === 'hybrid') && (
                <div className="form-group">
                    <label htmlFor="online_link">Meeting Link</label>
                    <input
                        type="url"
                        id="online_link"
                        name="online_link"
                        value={formData.online_link}
                        onChange={handleChange}
                        placeholder="https://zoom.us/j/..."
                    />
                </div>
            )}

            {(formData.meeting_type === 'in-person' || formData.meeting_type === 'hybrid') && (
                <div className="form-group">
                    <label htmlFor="physical_location">Location</label>
                    <input
                        type="text"
                        id="physical_location"
                        name="physical_location"
                        value={formData.physical_location}
                        onChange={handleChange}
                        placeholder="e.g., Perth City Library - Room 3A"
                    />
                </div>
            )}

            <div className="form-actions">
                <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Creating..." : "Create Meeting"}
                </button>
                <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowForm(false)}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default CreateMeetingForm;