import { useNavigate, useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { ThumbsUp, Clock, Users, CheckCircle, Star, MessageCircle } from "lucide-react";
import { categoryDisplay } from "../utils/category-display";

// API Imports
import postLike from "../api/post-likecourse";
import deleteCourse from "../api/delete-course";

// Hook Imports
import useCourse from "../hooks/use-course";
import useComments from "../hooks/use-comment";

// Components Imports
import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";
import categoryImages from "../utils/category-images";
import { handleFileUpload } from "../api/post-uploadandregister";
import postRating from "../api/post-rating";
import getRating from "../api/get-rating";
import { isEnrolled as isEnrolledUtil } from "../utils/enrollment";
import { isCompleted as isCompletedUtil, toggleCompleted as toggleCompletedUtil } from "../utils/completion";
import "./CoursePage.css";
import { enroll as enrollUtil, getCount as getCountUtil, getEnrolledUsers as getEnrolledUsersUtil } from "../utils/enrollment";

function CoursePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [likes, setLikes] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const { auth } = useAuth();

    // Fetch Course Data
    const { course, isLoading, error } = useCourse(id);

    // Fetch comments data
    const { comments, isLoading: commentsLoading, error: commentsError, addComment } = useComments(id);
    
    // Get enrolled participants for community display
    const enrolledUsers = getEnrolledUsersUtil(id);
    const enrolledCount = getCountUtil(id);

    /////// Likes /////////
    useEffect(() => {
        const serverLikes = course?.likes_count ?? course?.likes ?? 0;
        if (typeof serverLikes === "number") setLikes(serverLikes);
        
        if (course?.user_has_liked === true) {
            setHasLiked(true);
        } else {
            const key = `liked_course_${id}_${auth?.username || 'anonymous'}`;
            setHasLiked(localStorage.getItem(key) === "1");
        }
    }, [course, id, auth?.username]);

    const incrementLikes = async () => {
        if (hasLiked || liking) return;
        setLiking(true);
        setLikes(l => l + 1);
        try {
            const res = await postLike(id, auth?.token);
            const newLikes = res?.likes_count ?? res?.likes;
            if (typeof newLikes === "number") setLikes(newLikes);
            setHasLiked(true);
            const key = `liked_course_${id}_${auth?.username || 'anonymous'}`;
            localStorage.setItem(key, "1");
        } catch (e) {
            setLikes(l => Math.max(0, l - 1));
            alert(e.message || "Could not register like. Please try again.");
        } finally {
            setLiking(false);
        }
    };

    const handleFileInputChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await handleFileUpload(file, id, auth.token);
                window.location.reload(); 
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const isOwner = !!course && auth?.username === (course?.owner ?? "");

    // Handler for update button
    const handleUpdateClick = () => navigate(`/circles/update/${id}`);

    // Handler for delete button
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

    // Handler for when a new comment is added
    const handleCommentAdded = (newComment) => addComment(newComment);

    // Enrollment check
    const isEnrolled = isEnrolledUtil(id, auth?.username);

    // User rating state
    const [userRating, setUserRating] = useState(0);
    useEffect(() => {
        const fetchUserRating = async () => {
            try {
                const data = await getRating(id, auth?.token);
                if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.score === 'number') {
                    setUserRating(data.score);
                    return;
                }
                if (Array.isArray(data)) {
                    const mine = data.find((r) => String(r?.user) === String(auth?.username));
                    if (mine && typeof mine.score === 'number') {
                        setUserRating(mine.score);
                        return;
                    }
                }
                const key = `rating_course_${id}_${auth?.username || 'anonymous'}`;
                const v = localStorage.getItem(key);
                if (v) setUserRating(Number(v));
            } catch {
                const key = `rating_course_${id}_${auth?.username || 'anonymous'}`;
                const v = localStorage.getItem(key);
                if (v) setUserRating(Number(v));
            }
        };
        if (id) fetchUserRating();
    }, [id, auth?.token, auth?.username]);

    const saveUserRating = async (r) => {
        setUserRating(r);
        try {
            await postRating(id, r, auth?.token);
            const key = `rating_course_${id}_${auth?.username || 'anonymous'}`;
            localStorage.setItem(key, String(r));
        } catch (e) {
            alert(e.message || "Could not submit rating.");
        }
    };

    const decodeHTML = (html) => {
        const el = document.createElement('textarea');
        el.innerHTML = html ?? '';
        return el.value;
    };

    const averageRating = (() => {
        const v = course?.average_rating ?? course?.rating;
        return typeof v === 'number' ? v : null;
    })();
    const commentsCount = Array.isArray(comments) ? comments.length : (course?.comments_count ?? null);

    // Completion state for current user (local)
    const [completed, setCompleted] = useState(false);
    useEffect(() => {
        setCompleted(isCompletedUtil(auth?.username, id));
    }, [auth?.username, id]);

    // Early returns
    if (isLoading) return <p>loading...</p>;
    if (error) return <p>{error.message}</p>;
    if (!course) return <p>Circle not found</p>;

    return (
        <div className="course-page">
            <section className="circle-header-community">
                <div className="circle-category-meta">
                    <span className="category-badge">{categoryDisplay[course.category] || course.category}</span>
                </div>

                <h1 className="circle-title">{course.title}</h1>

                <div className="circle-facilitator">
                    <span className="facilitator-label">Circle facilitator:</span>
                    <strong>{course.owner}</strong>
                    <span className="facilitator-note">— sharing their journey</span>
                </div>

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
                        <Star size={16} />
                        {averageRating != null ? averageRating.toFixed(1) : '—'}
                    </span>
                    <span className="stat-item">
                        <MessageCircle size={16} />
                        {typeof commentsCount === 'number' ? commentsCount : '—'} conversations
                    </span>
                </div>

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

                <div className="circle-join-section">
                    {!isOwner && !isEnrolled && (
                        <button 
                            className="btn-join-conversation" 
                            onClick={() => {
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
                                window.location.reload(); // Refresh to show updated state
                            }}
                        >
                            Join the Conversation
                        </button>
                    )}
                    {isEnrolled && !isOwner && (
                        <div className="enrolled-badge">
                            <CheckCircle size={18} />
                            <span>You're in this circle</span>
                        </div>
                    )}
                </div>

                {/* Owner controls */}
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
            </section>

            {comments && comments.length > 0 && (
                <section className="recent-discussions-preview">
                    <h3>Recent conversations</h3>
                    <div className="discussion-snippets">
                        {comments.slice(0, 3).map((comment, idx) => (
                            <div key={idx} className="discussion-snippet">
                                <strong>{comment.author || 'Anonymous'}:</strong>
                                <p>{(comment.content || '').slice(0, 120)}...</p>
                            </div>
                        ))}
                    </div>
                    <a href="#comments" className="view-all-link">
                        Join the discussion →
                    </a>
                </section>
            )}

            {/* What we'll learn together */}
            <section className="circle-learning-section">
                <h2>What we'll learn together</h2>
                <p>{course.brief_description}</p>
            </section>

            {/* Circle Details & Resources */}
            <section className="circle-content-section">
                <h2>Circle Details</h2>
                <div
                    className="rendered-content"
                    dangerouslySetInnerHTML={{ __html: decodeHTML(course.course_content) }}
                />
            </section>

            <section className="circle-resources-section">
                <h2>Shared Resources</h2>
                {course.image ? (
                    <a href={course.image} target="_blank" rel="noopener noreferrer" className="resource-link">
                        View Shared Resource
                    </a>
                ) : (
                    <p className="no-resources">No resources shared yet. Be the first to contribute!</p>
                )}
            </section>

            {isEnrolled && (
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
            )}

            {isEnrolled && (
                <section className="circle-value-section">
                    <h3>How valuable was this circle to your learning?</h3>
                    <p className="rating-context">Your rating helps others find meaningful conversations</p>
                    <div className="rate-controls">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => saveUserRating(n)}
                                className={n <= userRating ? "active-star" : ""}
                                aria-label={`Rate ${n} stars`}
                            >
                                ★
                            </button>
                        ))}
                        {userRating > 0 && <span className="rating-display">{userRating}.0</span>}
                    </div>
                </section>
            )}

            {/* Comments Section */}
            <section className="comments-section" id="comments">
                <h2>Circle Conversations</h2>
                <CommentList
                    comments={comments}
                    isLoading={commentsLoading}
                    error={commentsError}
                />
                {isEnrolled && (
                    <CommentForm
                        courseId={id}
                        onCommentAdded={handleCommentAdded}
                    />
                )}
                {!isEnrolled && (
                    <p className="join-to-comment">
                        <a href="#" onClick={(e) => { e.preventDefault(); alert("Join the circle to participate in conversations!"); }}>
                            Join this circle
                        </a> to add your voice to the conversation.
                    </p>
                )}
            </section>

            {/* Like button at bottom */}
            <section className="circle-appreciation">
                <button
                    className="btn-appreciate"
                    onClick={incrementLikes}
                    disabled={hasLiked || liking}
                    aria-label="Appreciate this circle"
                >
                    <ThumbsUp size={20} />
                    <span>{hasLiked ? 'Appreciated' : 'Appreciate'} ({likes})</span>
                </button>
            </section>
        </div>
    );
}

export default CoursePage;