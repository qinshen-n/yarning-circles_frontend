import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { isEnrolled, isFull, getCount } from "../utils/enrollment";
import "./CourseCard.css";
import categoryImages from "../utils/category-images";
import { categoryDisplay } from "../utils/category-display";
import { Users, Heart, Clock, ArrowRight, Signal } from "lucide-react"; 

function CourseCard({ courseData, isFeatured = false }) {
    // Safety check
    if (!courseData) return null;

    const { auth } = useAuth();
    const navigate = useNavigate();
    
    // Data processing
    const courseId = courseData?.id;
    const appreciationsCount = courseData?.likes_count ?? courseData?.likes ?? 0;
    const maxStudents = Number(courseData?.max_students ?? courseData?.capacity ?? 0) || null;
    const enrolledCount = getCount(courseId);
    const youAreEnrolled = isEnrolled(courseId, auth?.username);
    const durationHours = courseData?.duration_in_hours ?? courseData?.duration;
    
    // Capacity calculations (for display only, NOT blocking)
    const spotsLeft = (typeof maxStudents === 'number' && maxStudents > 0)
        ? Math.max(0, maxStudents - enrolledCount)
        : null;

    const isNearCapacity = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0;
    
    // Navigation
    const handleCardClick = () => {
        navigate(`/circles/${courseId}`);
    };

    const getCatColor = (cat) => {
        const s = String(cat || "").toLowerCase();
        if (s.includes("tech") || s.includes("code")) return "blue";
        if (s.includes("art") || s.includes("design")) return "pink";
        if (s.includes("business")) return "purple";
        if (s.includes("health")) return "green";
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

                {/* Badge: Category */}
                <span className={`card-badge category-${getCatColor(courseData.category)}`}>
                    {categoryDisplay[courseData.category] || courseData.category}
                </span>

                {/* Status Overlays */}
                {youAreEnrolled && <span className="card-status-badge joined">✓ Joined</span>}
                {!youAreEnrolled && !isFeatured && isNearCapacity && (<span className="card-status-badge urgent">Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'}!</span>)}
            </div>

            {/* 2. CONTENT AREA */}
            <div className="card-content">
                <h3 className="card-title" title={courseData.title}>
                    {courseData.title}
                </h3>
                
                {/* ALWAYS show brief description (1 line for regular, 3 for featured) */}
                {courseData.brief_description && (
                    <p className="card-description">
                        {isFeatured 
                            ? courseData.brief_description.substring(0, 150)
                            : courseData.brief_description.substring(0, 80)
                        }
                        {courseData.brief_description.length > (isFeatured ? 150 : 80) && "..."}
                    </p>
                )}

                {/* Meta Row: Push to bottom of content area */}
                <div className="card-meta-row">
                    <span className="meta-tag">
                        <Users size={14} /> {enrolledCount}
                    </span>
                    
                    {!isFeatured && (
                        <>
                            <span className="meta-tag">
                                <Heart size={14} /> {appreciationsCount}
                            </span>
                            {courseData.difficulty_level && (
                                <span className="meta-tag" title="Difficulty"> 
                                    <Signal size={14} /> {courseData.difficulty_level}
                                </span>
                            )}
                        </>
                    )}

                    {isFeatured && durationHours && (
                        <span className="meta-tag"><Clock size={14} /> {durationHours}h</span>
                    )}
                </div>
            </div>

            {/* 3. FOOTER */}
            <div className="card-footer">
                {isFeatured ? (
                    <div className="card-cta">
                        Explore Circle <ArrowRight size={14} />
                    </div>
                ) : (
                    <button 
                        className={`card-btn ${youAreEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                        // NEVER DISABLED - Always welcome everyone
                    >
                        {youAreEnrolled ? "Go to Circle" : "Join Circle"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default CourseCard;