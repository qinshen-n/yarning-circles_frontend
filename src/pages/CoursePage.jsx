import { useNavigate, useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { ThumbsUp } from "lucide-react";
import { Clock, Calendar, Users, CheckCircle, Star, MessageCircle } from "lucide-react";
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
import { enroll as enrollUtil, isFull as isFullUtil, getCount as getCountUtil } from "../utils/enrollment";

// Css Imports
import "./CoursePage.css"

function CoursePage() {
    const navigate = useNavigate();
    // Here we use a hook that comes for free in react router called `useParams` to get the id from the URL so that we can pass it to our useCourse hook.
    const { id } = useParams();
    const [likes, setLikes] = useState(0); // Stores the number of likes for the course
    const [hasLiked, setHasLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const { auth } = useAuth();

    // Fetch Course Data
    const { course, isLoading, error } = useCourse(id);

    // Fetch comments data
    const {
        comments,
        isLoading: commentsLoading,
        error: commentsError,
        addComment
    } = useComments(id);
    
    /////// Likes /////////
    useEffect(() => {
    // Always sync likes from server - use same fallback as CourseCard
    const serverLikes = course?.likes_count ?? course?.likes ?? 0;
    if (typeof serverLikes === "number") {
        setLikes(serverLikes);
    }
    // Initialize hasLiked from server flag if available, else from localStorage
    if (course?.user_has_liked === true) {
        setHasLiked(true);
    } else {
        // Include username in the key so each user has their own like state
        const key = `liked_course_${id}_${auth?.username || 'anonymous'}`;
        setHasLiked(localStorage.getItem(key) === "1");
    }
}, [course, id, auth?.username]); // added auth?.username to dependencies

    const incrementLikes = async () => {
        if (hasLiked || liking) return; // block repeat
        setLiking(true);

        setLikes(l => l + 1);
        try {
            const res = await postLike(id, auth?.token);
            // Use same fallback for response
            const newLikes = res?.likes_count ?? res?.likes;
            if (typeof newLikes === "number") setLikes(newLikes);
            setHasLiked(true);
            // Store with username-specific key
            const key = `liked_course_${id}_${auth?.username || 'anonymous'}`;
            localStorage.setItem(key, "1");
        } catch (e) {
            setLikes(l => Math.max(0, l - 1));
            alert(e.message || "Could not register like. Please try again.");
        } finally {
            setLiking(false);
        }
        };
//     // likes ended///////
    const handleFileInputChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await handleFileUpload(file, id, auth.token);
                window.location.reload(); // Refresh course data
            } catch (error) {
                alert(error.message);
            }
        }
    };
    // Check if logged-in user is the owner (guard course)
    const isOwner = !!course && auth?.username === (course?.owner ?? "");


    const formatDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }); // en-GB gives DD/MM/YYYY
    };

    // Handler for update button
    const handleUpdateClick = () => {
        navigate(`/circles/update/${id}`)
    };

    // Handler for delete button
    const handleDeleteClick = async () => {
        if (!window.confirm("Are you sure you want to delete this circle?")) {
            return;
        }

        try {
            await deleteCourse(id, auth.token);
            alert("Circle deleted successfully!");
            navigate("/circles")
        } catch (err) {
            console.error("Delete failed:", err);
            alert(`Failed to delete course: ${err.message}`);
        }
    };

    // Handler for when a new comment is added
    const handleCommentAdded = (newComment) => {
        addComment(newComment);
    };

    // Enrollment check (frontend-only): use shared utils/enrollment to ensure consistency
    const isEnrolled = isEnrolledUtil(id, auth?.username);
    const maxStudents = Number(course?.max_students ?? course?.capacity ?? 0) || null;
    const enrolledCount = getCountUtil(id);
    const courseIsFull = isFullUtil(id, maxStudents);
    const enrollEndISO = course?.enrollment_end ?? course?.enrollmentEnd ?? null;
    const enrollEndDate = enrollEndISO ? new Date(enrollEndISO) : null;
    const enrollClosed = enrollEndDate && !Number.isNaN(enrollEndDate.getTime())
        ? (Date.now() > enrollEndDate.getTime())
        : false;

    // User rating state - initialize from backend if available
    const [userRating, setUserRating] = useState(0);
    useEffect(() => {
        const fetchUserRating = async () => {
            try {
                const data = await getRating(id, auth?.token);
                // If backend returns the user's rating object directly
                if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.score === 'number') {
                    setUserRating(data.score);
                    return;
                }
                // If backend returns a list of ratings, try to find current user's
                if (Array.isArray(data)) {
                    const mine = data.find((r) => String(r?.user) === String(auth?.username));
                    if (mine && typeof mine.score === 'number') {
                        setUserRating(mine.score);
                        return;
                    }
                }
                // Fallback to localStorage if not available
                const key = `rating_course_${id}_${auth?.username || 'anonymous'}`;
                const v = localStorage.getItem(key);
                if (v) setUserRating(Number(v));
            } catch {
                // fallback only
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
            const res = await postRating(id, r, auth?.token);
            // Persist locally as a fallback
            const key = `rating_course_${id}_${auth?.username || 'anonymous'}`;
            localStorage.setItem(key, String(r));
        } catch (e) {
            alert(e.message || "Could not submit rating.");
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileTypeIcon = (type) => {
        if (!type || typeof type !== 'string') return '📁'; 
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type === 'application/pdf') return '📄';
        return '📁';
    };

    // Optional: decode if your API returns &lt;...&gt; entities
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

    // Early returns must come after all hooks
    if (isLoading) {
        return (<p>loading...</p>)
    }

    if (error) {
        return (<p>{error.message}</p>)
    }

    if (!course) {
        return (<p>Course not found</p>)
    }

    return (
    <div className="course-page">
        {/* Udemy-style hero */}
        <section className="course-header-section">
            <div className="course-header">
                <img 
                    src={categoryImages[course.category] || categoryImages["other"]} 
                    className="hero-image"
                    alt={course.title}
                />
            </div>
            <div className="hero-overlay">
                <h1 className="hero-title">{course.title}</h1>
                <div className="hero-category-owner">
                    <span className="category-badge">{categoryDisplay[course.category] || course.category}</span>
                    <div className="owner">Facilitated by {course.owner}</div>
                    <div className="hero-meta-line">
                        <span className="meta-item duration">
                            <Clock className="icon" />
                            {(() => {
                                const durRaw = course?.duration_in_hours ?? course?.duration;
                                const dur = Number(durRaw);
                                return Number.isFinite(dur) && dur > 0 ? `${dur}h` : '—';
                            })()}
                        </span>
                        <span className="meta-item rating">
                            <Star className="icon" />
                            {averageRating != null ? averageRating.toFixed(1) : '—'}
                        </span>
                        <span className="meta-item comments">
                            <MessageCircle className="icon" />
                            {typeof commentsCount === 'number' ? commentsCount : '—'}
                        </span>
                        <span className="meta-item like-inline">
                            <button
                                className="like-button-inline"
                                onClick={incrementLikes}
                                aria-label="Like this circle"
                                disabled={hasLiked || liking}
                                title={hasLiked ? "You already liked this course" : "Like this course"}
                            >
                                <ThumbsUp />
                            </button>
                            <span className="likes-count-inline">{likes}</span>
                        </span>
                    </div>
                </div>
                <div className="hero-stats">
                    {/* Duration moved to the meta line below the title */}
                    {completed && <span className="stat completed">🏁 Completed</span>}
                </div>
                {isOwner && (
                    <div className="hero-owner-actions">
                        <button
                            type="button"
                            className="btn-update"
                            onClick={handleUpdateClick}
                        >
                            Edit Circle
                        </button>
                        <button
                            type="button"
                            className="btn-delete"
                            onClick={handleDeleteClick}
                        >
                            Delete Circle
                        </button>
                    </div>
                )}
                <div className="hero-actions">
                    {!isOwner && !isEnrolled && (
                        <button className="btn-primary" onClick={() => {
                            if (!auth || !auth.token) { alert("Please log in to join."); navigate("/login"); return; }
                            if (enrollClosed) { alert("Joining is closed."); return; }
                            if (courseIsFull) { alert("Sorry, this course is full."); return; }
                            const res = enrollUtil(id, auth?.username, maxStudents);
                            if (!res.ok) { alert(res.reason === "full" ? "Sorry, this course is full." : "Already enrolled."); return; }
                            alert("Joined successfully!"); navigate(`/circles/${id}`);
                        }}>Join Circle</button>
                    )}
                </div>
            </div>
        </section>
        {/* likes/rating moved into hero meta line above; removed duplicate control */}
        {/* What You Will Learn heading and content */}
        <div className="brief-description-section">
            <h3><strong>What we'll learn together</strong></h3>
            <p>{course.brief_description}</p>
        </div>
        <div className="course-content">
                
                <div className="meta-row">
                    {/* Duration removed as requested */}
                    {/* Enrollment date removed as requested */}
                    {/* Removed max students display */}
                    {/* Enrolled badge removed per request */}
                    {completed && (
                        <span className="meta-item completed" aria-label="Completed">🏁 Completed</span>
                    )}
                </div>

                {/* Rating summary removed per request */}

                {/* 6 & 8. Group Course Content and Course Materials in one container */}
                <div className="course-resources-section">
                    <div className="course-content-section">
                        <h3><strong>Circle Details</strong></h3>
                        <div
                            className="rendered-content"
                            dangerouslySetInnerHTML={{ __html: decodeHTML(course.course_content) }}
                        />
                    </div>
                    <div className="course-materials-section">
                        <h3><strong>Shared Resources</strong></h3>
                        {course.image ? ( 
                            <a href ={course.image} target="_blank" rel="noopener noreferrer">
                                View Shared Resource
                            </a>

                        ) : (
                            <p>No resources shared yet.</p>
                        )}
                    </div>
                </div>

                {/* Completion toggle moved below Course Content */}
                <div className="completion-row">
                    <button
                        type="button"
                        className={completed ? "btn-completed" : "btn-complete"}
                        onClick={() => {
                            if (!auth?.username) {
                                alert("Please log in to track completion.");
                                navigate("/login");
                                return;
                            }
                            toggleCompletedUtil(auth.username, id);
                            setCompleted(isCompletedUtil(auth.username, id));
                        }}
                        aria-pressed={completed}
                        aria-label={completed ? "Mark as not completed" : "Mark as completed"}
                    >
                        {completed ? "Completed ✓" : "Mark as Completed"}
                    </button>
                </div>

                {/* To display uploaded files ends (owner controls moved to hero) */}

                {/* Enroll action */}
                {!isOwner && !isEnrolled && (
                    <div className="course-actions">
                        <button
                            className="btn-enroll"
                            onClick={() => {
                                if (!auth || !auth.token) {
                                    alert("Please log in to join.");
                                    navigate("/login");
                                    return;
                                }
                                if (enrollClosed) {
                                    alert("Joining is closed.");
                                    return;
                                }
                                if (courseIsFull) {
                                    alert("Sorry, this circle is full.");
                                    return;
                                }
                                const res = enrollUtil(id, auth?.username, maxStudents);
                                if (!res.ok) {
                                    alert(res.reason === "full" ? "Sorry, this circle is full." : "Already enrolled.");
                                    return;
                                }
                                alert("Joined successfully!");
                                navigate(`/circles/${id}`);
                            }}
                        >
                            Join Circle
                        </button>
                        {Number.isFinite(maxStudents) && maxStudents > 0 && (
                            <span className="enroll-hint">{Math.max(0, maxStudents - enrolledCount)} spots left</span>
                        )}
                        {enrollClosed && (
                            <span className="enroll-hint">Enrollment closed</span>
                        )}
                    </div>
                    )}
    
                        {/* Section: Community (Ratings & Comments) */}
                    <div className="course-section interaction-section">                       
                        {/* Rating Area */}
                        <div className="rating-area">
                            <h3>Rate this circle</h3>
                            {!isEnrolled ? (
                                <p className="text-muted">Enroll to rate this circle.</p>
                            ) : (
                                <div className="rate-controls">
                                    {[1,2,3,4,5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => saveUserRating(n)}
                                            className={n <= userRating ? "active-star" : ""}
                                        >★</button>
                                    ))}
                                    {userRating > 0 && <span>{userRating}.0</span>}
                                </div>
                            )}
                        </div>

                        <hr className="divider"/>

               {/* 10. Comments Section  */}
                <div className="comments-section">
                    <hr />
                    {/* Comment List first */}
                    <CommentList
                        comments={comments}
                        isLoading={commentsLoading}
                        error={commentsError}
                    />
                    {/* Comment form after all comments */}
                    <CommentForm
                        courseId={id}
                        onCommentAdded={handleCommentAdded}
                    />
                </div>
        </div>
        
        </div>
    </div>
    );
}

export default CoursePage;