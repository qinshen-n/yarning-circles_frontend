import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth"
import { enroll, isEnrolled, isFull, getCount } from "../utils/enrollment";
import { isCompleted as isCompletedUtil } from "../utils/completion";
import "./CourseCard.css";
import categoryImages from "../utils/category-images";
import { categoryDisplay } from "../utils/category-display";


function CourseCard(props) {
    const { courseData } = props;

    // Initialize hooks
    const { auth } = useAuth();
    const navigate = useNavigate();
    
    const likesCount = courseData?.likes_count ?? courseData?.likes ?? 0;
    const courseId = courseData?.id;
    const maxStudents = Number(courseData?.max_students ?? courseData?.capacity ?? 0) || null;
    const enrolledCount = getCount(courseId);
    const youAreEnrolled = isEnrolled(courseId, auth?.username);
    const youCompleted = isCompletedUtil(auth?.username, courseId);
    const isOwner = auth?.username && courseData?.owner && String(auth.username) === String(courseData.owner);
    const courseIsFull = isFull(courseId, maxStudents);
    // Enrollment end: accept ISO strings or date-like strings
    const enrollEndISO = courseData?.enrollment_end ?? courseData?.enrollmentEnd ?? null;
    const enrollEndDate = enrollEndISO ? new Date(enrollEndISO) : null;
    const enrollClosed = enrollEndDate && !Number.isNaN(enrollEndDate.getTime())
        ? (Date.now() > enrollEndDate.getTime())
        : false;

    // Create the click handler
    const handleCardClick = () => {
        if (!auth || !auth.token) {
            alert("Please log in to view course details.");
            navigate("/login");
            return;
        }
        // Owner can always view
        if (isOwner) {
            navigate(`/circles/${courseId}`);
            return;
        }
        // If enrollment closed or full and user not enrolled, block
        if ((courseIsFull || enrollClosed) && !youAreEnrolled) {
            alert(enrollClosed ? "Enrollment is closed." : "Sorry, this course is full.");
            return;
        }
        // If not enrolled, ask to enroll before viewing
        if (!youAreEnrolled) {
            const confirmJoin = window.confirm("You are not enrolled. Enroll now to view this course?");
            if (!confirmJoin) {
                return; // do not navigate to content
            }
            const res = enroll(courseId, auth?.username, maxStudents);
            if (!res.ok) {
                alert(res.reason === "full" ? "Sorry, this course is full." : "Enrollment failed.");
                return;
            }
            alert("Enrolled successfully!");
        }
        navigate(`/circles/${courseId}`);
    };

    const slugify = (text) => {
        if (!text) return "";
        return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    };

    const catClass = (cat) => {
        if (!cat) return "cat-default";
        const s = slugify(cat);
        // map some known categories to explicit classes
        if (s.includes("business")) return "cat-business";
        if (s.includes("art") || s.includes("arts")) return "cat-arts";
        if (s.includes("tech") || s.includes("technology") || s.includes("coding")) return "cat-tech";
        if (s.includes("well") || s.includes("health") || s.includes("wellbeing")) return "cat-wellbeing";
        // fallback to default
        return "cat-default";
    };

    // Derived display helpers
    const durationHours = (() => {
        const durRaw = courseData?.duration_in_hours ?? courseData?.duration;
        const dur = Number(durRaw);
        return Number.isFinite(dur) && dur > 0 ? dur : null;
    })();
    const enrolByText = enrollEndDate && !Number.isNaN(enrollEndDate.getTime())
        ? enrollEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;
    const spotsLeft = (typeof maxStudents === 'number' && maxStudents > 0)
        ? Math.max(0, maxStudents - enrolledCount)
        : null;

    return (
        <div className="course-card">
            {/* TOP ROW — Difficulty + Category */}
            <div className="top-row">
                {courseData?.difficulty_level && (
                    <span className={`chip diff ${courseData.difficulty_level}`}>
                        {courseData.difficulty_level.charAt(0).toUpperCase() + courseData.difficulty_level.slice(1)}
                    </span>
                )}
                <span className={`chip category ${catClass(courseData.category)}`}>
                    {categoryDisplay[courseData.category] || courseData.category}
                </span>
            </div>

            {/* IMAGE */}
            <img
                src={categoryImages[courseData.category]}
                alt={courseData.category}
                className="course-image"
            />

            {/* TITLE + AUTHOR */}
            <h2 className="card-title">{courseData.title}</h2>
            <p className="owner">Facilitated by {courseData.owner}</p>

            {/* METADATA ROW (duration + enrolment end + max students) */}
            <div className="meta-row">
                {/* duration: show placeholder when missing */}
                <span className={`meta-item ${durationHours ? '' : 'placeholder'}`} aria-label="Duration">
                    {durationHours ? `⏱️ ${durationHours}h` : '⏱️ 0h'}
                </span>

                {/* enrol by date: show placeholder when missing */}
                <span className={`meta-item ${enrolByText ? '' : 'placeholder'}`} aria-label="Enrollment closes">
                    {enrolByText ? `📅 Join by ${enrolByText}` : '📅 Enrollment closes —'}
                </span>

                {/* max students: show placeholder when missing */}
                <span className={`meta-item ${typeof maxStudents === 'number' && maxStudents > 0 ? '' : 'placeholder'}`} aria-label="Max participants">
                    {typeof maxStudents === 'number' && maxStudents > 0 ? `👤 Max ${maxStudents}` : '👤 Max —'}
                </span>

                {/* enrolled indicator: keep placeholder so layout is consistent */}
                <span className={`meta-item enrolled ${youAreEnrolled ? '' : 'placeholder'}`} aria-hidden={!youAreEnrolled}>
                    {youAreEnrolled ? '✅ Joined' : '✅ Joined'}
                </span>

                {/* completed indicator: keep placeholder so layout is consistent */}
                <span
                    className={`meta-item completed ${youCompleted ? '' : 'placeholder'}`}
                    aria-hidden={!youCompleted}
                >
                    {youCompleted ? '🏁 Completed' : '🏁 Completed'}
                </span>
            </div>

            {/* BRIEF DESCRIPTION */}
            <p className="brief">{courseData.brief_description ? `${courseData.brief_description.substring(0, 150)}...` : ""}</p>

            {/* SOCIAL PROOF (ratings + likes) */}
            <div className="social-row">
                <span className="rating" aria-label="Rating">
                    {typeof courseData?.average_rating === 'number' ? (
                        <>⭐ {courseData.average_rating.toFixed(1)}</>
                    ) : (
                        <>⭐ —</>
                    )}
                    {typeof courseData?.comments_count === 'number' && (
                        <span>({courseData.comments_count})</span>
                    )}
                </span>
                <span className="likes" aria-label="Likes">❤️ {likesCount}</span>
            </div>

            {/* CTA — Enrol button with optional hint */}
            <div className="cta-row">
                <button
                    className="btn-learn-more"
                    onClick={handleCardClick}
                    disabled={(courseIsFull || enrollClosed) && !youAreEnrolled}
                    title={(courseIsFull || enrollClosed) && !youAreEnrolled ? (enrollClosed ? 'Enrolment closed' : 'Course is full') : 'Enrol now'}
                >
                    Join Circle
                </button>
                {spotsLeft !== null && spotsLeft > 0 && !enrollClosed && (
                    <div className="cta-hint">{spotsLeft} spots left</div>
                )}
                {enrollClosed && !youAreEnrolled && (
                    <div className="cta-hint">Enrolment closed</div>
                )}
            </div>
        </div>
    );
}

export default CourseCard;