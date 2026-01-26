import { useState } from "react";
import { Calendar, Clock, Users, MapPin, Video } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import postRSVP from "../api/post-rsvp";
import deleteMeeting from "../api/delete-meeting";
import "./MeetingsList.css";

function MeetingsList({ meetings, isOwner }) {
    const { auth } = useAuth();
    const [rsvpingMeeting, setRsvpingMeeting] = useState(null);

    // Helper functions
    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleDateString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Event Handlers - RSVP button click
    const handleRSVP = async (meetingId, status) => {
        if (!auth?.token) {
            alert("Please log in to RSVP");
            return;
        }

        setRsvpingMeeting(meetingId);
        try {
            await postRSVP(meetingId, status, auth.token);
            window.location.reload();
        } catch (error) {
            alert(error.message || "Failed to RSVP");
        } finally {
            setRsvpingMeeting(null);
        }
    };

    // Delete Handler - Delete meeting button click
    const handleDelete = async (meetingId) => {
        if (!window.confirm("Delete this meeting?")) return;

        try {
            await deleteMeeting(meetingId, auth.token);
            alert("Meeting deleted!");
            window.location.reload();
        } catch (error) {
            alert("Failed to delete meeting");
        }
    };

    if (!meetings || meetings.length === 0) {
        return (
            <div className="no-meetings">
                <Calendar size={48} />
                <p>No meetings scheduled yet</p>
            </div>
        );
    }

    return (
        <div className="meetings-list">
            {meetings.map((meeting) => {
                const userStatus = meeting.user_rsvp_status;
                const isRsvping = rsvpingMeeting === meeting.id;

                return (
                    <div key={meeting.id} className="meeting-card">
                        {isOwner && (
                            <button 
                                className="delete-meeting-btn"
                                onClick={() => handleDelete(meeting.id)}
                                aria-label="Delete meeting"
                            >
                                ×
                            </button>
                        )}

                        <h3 className="meeting-title">{meeting.title}</h3>
                        
                        <p className="meeting-description">{meeting.description}</p>

                        <div className="meeting-details">
                            <div className="detail-item">
                                <Calendar size={16} />
                                <span>{formatDateTime(meeting.datetime)}</span>
                            </div>

                            <div className="detail-item">
                                <Clock size={16} />
                                <span>{meeting.duration_minutes} minutes</span>
                            </div>

                            {meeting.meeting_type === 'online' && meeting.online_link && (
                                <div className="detail-item">
                                    <Video size={16} />
                                    <a 
                                        href={meeting.online_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="meeting-link"
                                    >
                                        Join Online
                                    </a>
                                </div>
                            )}

                            {(meeting.meeting_type === 'in-person' || meeting.meeting_type === 'hybrid') && 
                            meeting.physical_location && (
                                <div className="detail-item">
                                    <MapPin size={16} />
                                    <span>{meeting.physical_location}</span>
                                </div>
                            )}

                            {meeting.meeting_type === 'hybrid' && meeting.online_link && (
                                <div className="detail-item">
                                    <Video size={16} />
                                    <a 
                                        href={meeting.online_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="meeting-link"
                                    >
                                        Or Join Online
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="rsvp-summary">
                            <div className="rsvp-count">
                                <Users size={16} />
                                <span>
                                    {meeting.rsvp_yes_count} going
                                    {meeting.rsvp_maybe_count > 0 && `, ${meeting.rsvp_maybe_count} maybe`}
                                </span>
                            </div>

                            {meeting.attendees && meeting.attendees.length > 0 && (
                                <div className="attendees-preview">
                                    {meeting.attendees.slice(0, 3).join(", ")}
                                    {meeting.attendees.length > 3 && ` +${meeting.attendees.length - 3} more`}
                                </div>
                            )}
                        </div>

                        {auth && auth.token && !isOwner && (
                            <div className="rsvp-buttons">
                                <button
                                    onClick={() => handleRSVP(meeting.id, 'yes')}
                                    disabled={isRsvping}
                                    className={`rsvp-btn ${userStatus === 'yes' ? 'active' : ''}`}
                                >
                                    {userStatus === 'yes' ? '✓ Going' : 'Going'}
                                </button>
                                <button
                                    onClick={() => handleRSVP(meeting.id, 'maybe')}
                                    disabled={isRsvping}
                                    className={`rsvp-btn ${userStatus === 'maybe' ? 'active' : ''}`}
                                >
                                    {userStatus === 'maybe' ? '✓ Maybe' : 'Maybe'}
                                </button>
                                <button
                                    onClick={() => handleRSVP(meeting.id, 'no')}
                                    disabled={isRsvping}
                                    className={`rsvp-btn ${userStatus === 'no' ? 'active' : ''}`}
                                >
                                    {userStatus === 'no' ? '✓ Can\'t Go' : 'Can\'t Go'}
                                </button>
                            </div>
                        )}

                        {userStatus && (
                            <div className="your-rsvp">
                                Your RSVP: 
                                {userStatus === 'yes' && ' ✅ Going'}
                                {userStatus === 'maybe' && ' 🤔 Maybe'}
                                {userStatus === 'no' && ' ❌ Not Going'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default MeetingsList;