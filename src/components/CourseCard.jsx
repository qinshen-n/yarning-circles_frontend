import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { isEnrolled, isFull, getCount } from "../utils/enrollment";
import "./CourseCard.css";
import categoryImages from "../utils/category-images";
import { categoryDisplay } from "../utils/category-display";
import { Users, Heart, Clock, ArrowRight } from "lucide-react"; 

function CourseCard({ courseData, isFeatured = false }) {
    const { auth } = useAuth();
    const navigate = useNavigate();
    
    // Data processing
    const courseId = courseData?.id;
    const appreciationsCount = courseData?.likes_count ?? courseData?.likes ?? 0;
    const maxStudents = Number(courseData?.max_students ?? courseData?.capacity ?? 0) || null;
    const enrolledCount = getCount(courseId);
    const youAreEnrolled = isEnrolled(courseId, auth?.username);
    const courseIsFull = isFull(courseId, maxStudents);
    
    // Date Logic
    const enrollEndISO = courseData?.enrollment_end ?? courseData?.enrollmentEnd ?? null;
    const enrollEndDate = enrollEndISO ? new Date(enrollEndISO) : null;
    const enrollClosed = enrollEndDate && !Number.isNaN(enrollEndDate.getTime())
        ? (Date.now() > enrollEndDate.getTime())
        : false;

    // Derived Display Logic
    const spotsLeft = (typeof maxStudents === 'number' && maxStudents > 0)
        ? Math.max(0, maxStudents - enrolledCount)
        : null;
    const isUrgent = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0;
    const durationHours = courseData?.duration_in_hours ?? courseData?.duration;

    // Let the user decide to join after seeing the details.
    const handleCardClick = () => {
        navigate(`/circles/${courseId}`);
    };

    // Category styling helper
    const getCatColor = (cat) => {
        const s = String(cat || "").toLowerCase();
        if (s.includes("tech") || s.includes("code")) return "blue";
        if (s.includes("art") || s.includes("design")) return "pink";
        if (s.includes("business")) return "purple";
        if (s.includes("health") || s.includes("well")) return "green";
        return "gray";
    };

    return (
        <div 
            className={`course-card ${isFeatured ? 'featured' : ''}`} 
            onClick={handleCardClick}
        >
            {/* 1. IMAGE AREA */}
            <div className="card-image-wrapper">
                <img
                    src={categoryImages[courseData.category]}
                    alt={courseData.category}
                    className="card-image"
                />
                
                {/* Badge Logic: Featured gets a Star, Standard gets Category */}
                {isFeatured ? (
                    <span className="card-badge featured-badge">⭐ Trending</span>
                ) : (
                    <span className={`card-badge category-${getCatColor(courseData.category)}`}>
                        {categoryDisplay[courseData.category] || courseData.category}
                    </span>
                )}

                {/* Status Overlays */}
                {youAreEnrolled && <span className="card-status-badge joined">✓ Joined</span>}
                {!youAreEnrolled && !isFeatured && isUrgent && <span className="card-status-badge urgent">Only {spotsLeft} spots!</span>}
            </div>

            {/* 2. CONTENT AREA */}
            <div className="card-content">
                <h3 className="card-title">{courseData.title}</h3>
                
                {/* Featured Mode: Show Description */}
                {isFeatured && courseData.brief_description && (
                    <p className="card-description" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        color: '#475569'
                    }}>
                        {courseData.brief_description.substring(0, 150)}
                        {courseData.brief_description.length > 150 && "..."}
                    </p>
                )}
                
                {/* Standard Mode: Show Facilitator */}
                {!isFeatured && <p className="card-facilitator">with {courseData.owner}</p>}

                {/* Meta Row */}
                <div className="card-meta-row">
                    {/* Consistent Stats for both views, but styled differently */}
                    <span className="meta-tag">
                        <Users size={12} /> {enrolledCount}
                    </span>
                    
                    {!isFeatured && (
                        <>
                            <span className="meta-tag">
                                <Heart size={12} /> {appreciationsCount}
                            </span>
                            {courseData.difficulty_level && (
                                <span className="meta-tag">🌱 {courseData.difficulty_level}</span>
                            )}
                        </>
                    )}

                    {isFeatured && durationHours && (
                        <span className="meta-tag"><Clock size={12} /> {durationHours}h</span>
                    )}
                </div>
            </div>

            {/* 3. FOOTER AREA */}
            <div className="card-footer">
                {isFeatured ? (
                    <div className="card-cta">
                        Explore Circle <ArrowRight size={14} />
                    </div>
                ) : (
                    <button 
                        className={`card-btn ${youAreEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={courseIsFull || enrollClosed}
                        onClick={(e) => {
                            // Optional: If you want the button to join immediately, put logic here.
                            // But for consistency, we let it bubble up to handleCardClick
                        }}
                    >
                        {youAreEnrolled ? "Go to Circle" : (enrollClosed ? "Closed" : "Join Circle")}
                    </button>
                )}
            </div>
        </div>
    );
}

export default CourseCard;