// React & Router Imports
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

// Icons Imports
import { Heart, Clock, Users, CheckCircle, MessageCircle, ArrowDown } from "lucide-react";

// Hook Imports
import { useAuth } from "../hooks/use-auth";
import useCourse from "../hooks/use-course";
import useComments from "../hooks/use-comment";
import useMeetings from "../hooks/use-meetings";

// API Imports
import postLike from "../api/post-likecourse";
import deleteCourse from "../api/delete-course";

// Utils Imports
import { categoryDisplay } from "../utils/category-display";
import { isEnrolled as isEnrolledUtil } from "../utils/enrollment";
import { isCompleted as isCompletedUtil, toggleCompleted as toggleCompletedUtil } from "../utils/completion";
import { enroll as enrollUtil, getCount as getCountUtil, getEnrolledUsers as getEnrolledUsersUtil } from "../utils/enrollment";

// Components Imports
import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";
import MeetingsList from "../components/MeetingsList";
import CreateMeetingForm from "../components/CreateMeetingForm";
import MilestonesList from "../components/MilestonesList";

// Styles Imports
import "./CoursePage.css";

function CoursePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { auth } = useAuth();

    // Appreciation State
    const [appreciations, setAppreciations] = useState(0);
    const [hasAppreciated, setHasAppreciated] = useState(false);
    const [appreciating, setAppreciating] = useState(false);

    // Data Fetching
    const { course, isLoading, error } = useCourse(id);
    const { comments, isLoading: commentsLoading, error: commentsError, addComment } = useComments(id);
    const { meetings, isLoading: meetingsLoading, error: meetingsError, addMeeting } = useMeetings(id);
    
    // Get enrolled participants for community display
    const enrolledUsers = getEnrolledUsersUtil(id);
    const enrolledCount = getCountUtil(id);
    const isEnrolled = isEnrolledUtil(id, auth?.username);
    const isOwner = !!course && auth?.username === (course?.owner ?? "");

    // Appreciation Logic
    useEffect(() => {
        const serverAppreciations = course?.likes_count ?? course?.likes ?? 0;
        if (typeof serverAppreciations === "number") setAppreciations(serverAppreciations);
        
        if (course?.user_has_liked === true) {
            setHasAppreciated(true);
        } else {
            const key = `appreciated_circle_${id}_${auth?.username || 'anonymous'}`;
            setHasAppreciated(localStorage.getItem(key) === "1");
        }
    }, [course, id, auth?.username]);

    const handleAppreciate = async () => {
        if (hasAppreciated || appreciating) return;
        
        setAppreciating(true);
        setAppreciations(count => count + 1);
        
        try {
            const res = await postLike(id, auth?.token);
            const newCount = res?.likes_count ?? res?.likes;
            if (typeof newCount === "number") setAppreciations(newCount);
            setHasAppreciated(true);
            const key = `appreciated_circle_${id}_${auth?.username || 'anonymous'}`;
            localStorage.setItem(key, "1");
        } catch (e) {
            setAppreciations(count => Math.max(0, count - 1));
            alert(e.message || "Could not register appreciation. Please try again.");
        } finally {
            setAppreciating(false);
        }
    };

    // Event Handlers
    const handleUpdateClick = () => navigate(`/circles/update/${id}`);

    const handleDeleteClick = async () => {
        if (!window.confirm("Are you sure you want to delete this circle?")) return;
        try {
            await deleteCourse(id, auth.token);
            alert("Circle deleted successfully!");
            navigate("/circles");
        } catch (err) {
            console.error("Delete failed:", err);
            alert(`Failed to delete circle: ${err.message}`);
        }
    };

    const handleCommentAdded = (newComment) => addComment(newComment);
    const handleMeetingCreated = (newMeeting) => addMeeting(newMeeting);

    const handleJoinCircle = () => {
        if (!auth || !auth.token) {
            alert("Please log in to join this conversation.");
            navigate("/login");
            return;
        }
        const res = enrollUtil(id, auth?.username);
        if (!res.ok) {
            alert("You're already part of this circle!");
            return;
        }
        alert("Welcome to the circle!");
        window.location.reload();
    };

    // Utility Functions
    const decodeHTML = (html) => {
        const el = document.createElement('textarea');
        el.innerHTML = html ?? '';
        return el.value;
    };

    const commentsCount = Array.isArray(comments) ? comments.length : (course?.comments_count ?? null);

    // Completion State
    const [completed, setCompleted] = useState(false);
    useEffect(() => {
        setCompleted(isCompletedUtil(auth?.username, id));
    }, [auth?.username, id]);

    // Early Returns
    if (isLoading) return <p>Loading circle...</p>;
    if (error) return <p>{error.message}</p>;
    if (!course) return <p>Circle not found</p>;

    return (
        <div className="course-page">
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PUBLIC SECTION: Circle Overview (Everyone can see)          */}
            {/* ═══════════════════════════════════════════════════════════ */}
            
            <section className="circle-overview-public">
                {/* Header */}
                <div className="circle-header-community">
                    <div className="circle-category-meta">
                        <span className="category-badge">
                            {categoryDisplay[course.category] || course.category}
                        </span>
                    </div>

                    <h1 className="circle-title">{course.title}</h1>

                    <div className="circle-facilitator">
                        <span className="facilitator-label">Circle facilitator:</span>
                        <strong>{course.owner}</strong>
                        <span className="facilitator-note">— sharing their journey</span>
                    </div>

                    {/* Stats Row */}
                    <div className="circle-stats-inline">
                        <span className="stat-item">
                            <Clock size={16} />
                            {(() => {
                                const dur = Number(course?.duration_in_hours ?? course?.duration);
                                return Number.isFinite(dur) && dur > 0 ? `${dur}h journey` : '—';
                            })()}
                        </span>
                        <span className="stat-item">
                            <Users size={16} />
                            {enrolledCount} {enrolledCount === 1 ? 'participant' : 'participants'}
                        </span>
                        <span className="stat-item">
                            <Heart size={16} />
                            {appreciations} {appreciations === 1 ? 'appreciation' : 'appreciations'}
                        </span>
                        <span className="stat-item">
                            <MessageCircle size={16} />
                            {typeof commentsCount === 'number' ? commentsCount : '—'} conversations
                        </span>
                    </div>

                    {/* Participant Avatars */}
                    {enrolledCount > 0 && (
                        <div className="circle-participants">
                            <h3>Who's in this circle</h3>
                            <div className="participant-avatars">
                                {enrolledUsers.slice(0, 8).map((username, i) => (
                                    <div key={i} className="avatar-bubble" title={username}>
                                        {username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                ))}
                                {enrolledCount > 8 && (
                                    <div className="avatar-bubble more">
                                        +{enrolledCount - 8}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Join/Enrolled Badge */}
                    <div className="circle-join-section">
                        {!isOwner && !isEnrolled && (
                            <button 
                                className="btn-join-conversation" 
                                onClick={handleJoinCircle}
                            >
                                Join the Conversation
                            </button>
                        )}
                        {isEnrolled && !isOwner && (
                            <div className="enrolled-badge-with-hint">
                                <div className="enrolled-badge">
                                    <CheckCircle size={18} />
                                    <span>You're in this circle</span>
                                </div>
                                <p className="dashboard-hint">
                                    <ArrowDown size={16} />
                                    Scroll down for your dashboard
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Owner Controls */}
                    {isOwner && (
                        <div className="circle-owner-actions">
                            <button className="btn-edit" onClick={handleUpdateClick}>
                                Edit Circle
                            </button>
                            <button className="btn-delete" onClick={handleDeleteClick}>
                                Delete Circle
                            </button>
                        </div>
                    )}
                </div>

                {/* What We'll Learn */}
                <section className="circle-learning-section">
                    <h2>What we'll learn together</h2>
                    <p>{course.brief_description}</p>
                </section>

                {/* Recent Conversations Preview (Public teaser) */}
                {comments && comments.length > 0 && (
                    <section className="recent-conversations-teaser">
                        <h3>Recent conversations in this circle</h3>
                        <div className="conversation-preview">
                            {comments.slice(0, 2).map((comment, idx) => (
                                <div key={idx} className="preview-bubble">
                                    <strong>{comment.author}:</strong>
                                    <p>{(comment.content || '').slice(0, 80)}...</p>
                                </div>
                            ))}
                        </div>
                        {!isEnrolled && (
                            <p className="preview-cta">
                                Join the circle to see all conversations and participate →
                            </p>
                        )}
                    </section>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MEMBERS-ONLY SECTION: Circle Dashboard                      */}
            {/* ═══════════════════════════════════════════════════════════ */}
            
            {isEnrolled && (
                <>
                    {/* Dashboard Divider */}
                    <section className="dashboard-divider">
                        <div className="divider-content">
                            <h2>Your Circle Dashboard</h2>
                            <p>Welcome! Here's everything you need to participate and track your progress.</p>
                        </div>
                    </section>

                    {/* ZONE 1: Circle Meetings */}
                    <section className="circle-meetings-section">
                        <h2>🗓️ Circle Meetings</h2>
                        <p className="section-intro">
                            Connect with fellow learners in real-time sessions
                        </p>

                        {isOwner && (
                            <CreateMeetingForm 
                                circleId={id} 
                                onMeetingCreated={handleMeetingCreated}
                            />
                        )}

                        {meetingsLoading ? (
                            <p>Loading meetings...</p>
                        ) : meetingsError ? (
                            <p>Error loading meetings: {meetingsError.message}</p>
                        ) : (
                            <MeetingsList meetings={meetings} isOwner={isOwner} />
                        )}
                    </section>

                    {/* ZONE 2: Learning Modules */}
                    <section className="circle-milestones-section">
                        <MilestonesList circleId={id} />
                    </section>

                    {/* ZONE 3: Circle Details & Resources */}
                    <section className="circle-content-section">
                        <h2>Circle Details</h2>
                        <div
                            className="rendered-content"
                            dangerouslySetInnerHTML={{ __html: decodeHTML(course.course_content) }}
                        />
                    </section>

                    <section className="circle-resources-section">
                        <h2>📎 Learning Resources</h2>
                        <p className="section-intro">
                            Curated by the facilitator to support your learning journey
                        </p>
                        {course.image ? (
                            <a href={course.image} target="_blank" rel="noopener noreferrer" className="resource-link">
                                View Shared Resource
                            </a>
                        ) : (
                            <p className="no-resources">No resources shared yet. Check back soon!</p>
                        )}
                    </section>

                    {/* Reflection & Completion */}
                    <section className="circle-reflection-section">
                        <button
                            type="button"
                            className={completed ? "btn-reflected" : "btn-reflect"}
                            onClick={() => {
                                if (!auth?.username) {
                                    alert("Please log in to track your journey.");
                                    navigate("/login");
                                    return;
                                }
                                toggleCompletedUtil(auth.username, id);
                                setCompleted(isCompletedUtil(auth.username, id));
                            }}
                            aria-pressed={completed}
                        >
                            {completed ? "✓ Reflected on this circle" : "Mark as reflected"}
                        </button>
                        {completed && (
                            <p className="reflection-note">You've completed this learning journey</p>
                        )}
                    </section>

                    {/* ZONE 4: Full Conversations */}
                    <section className="comments-section" id="comments">
                        <h2>💬 Circle Conversations</h2>
                        
                        <CommentList
                            comments={comments}
                            isLoading={commentsLoading}
                            error={commentsError}
                        />
                        
                        <CommentForm
                            courseId={id}
                            onCommentAdded={handleCommentAdded}
                        />
                    </section>
                </>
            )}

            {/* Appreciation Button (Always at bottom) */}
            <section className="circle-appreciation">
                <button
                    className="btn-appreciate"
                    onClick={handleAppreciate}
                    disabled={hasAppreciated || appreciating}
                >
                    <Heart size={20} className={hasAppreciated ? 'filled' : ''} />
                    <span>{hasAppreciated ? 'Appreciated' : 'Appreciate'} ({appreciations})</span>
                </button>
            </section>
        </div>
    );
}

export default CoursePage;