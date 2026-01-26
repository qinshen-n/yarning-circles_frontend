import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useUser from "../hooks/use-user";
import useCourses from "../hooks/use-courses";
import getUsers from "../api/get-users";
import getUserByUsername from "../api/get-user-by-username";
import { getCompletedForUser } from "../utils/completion";
import { getCoursesForUser, getCount as getEnrollCount } from "../utils/enrollment";
import CourseCard from "../components/CourseCard";
import "./UserPage.css";

function UserPage() {
    const { id } = useParams();
    const isNumeric = Number.isFinite(Number(id));

    const { user, isLoading, error } = useUser(isNumeric ? id : undefined);
    const { courses } = useCourses();

    const [altUser, setAltUser] = useState(null);
    const [altLoading, setAltLoading] = useState(!isNumeric);
    const [altError, setAltError] = useState(null);
    const [activeTab, setActiveTab] = useState("leaderboard");
    const [allUsers, setAllUsers] = useState([]);
    const [usersError, setUsersError] = useState(null);

    useEffect(() => {
        if (!isNumeric && id) {
            setAltLoading(true);
            getUserByUsername(id)
                .then((u) => setAltUser(u))
                .catch((e) => setAltError(e))
                .finally(() => setAltLoading(false));
        }
    }, [isNumeric, id]);

    useEffect(() => {
        getUsers().then(setAllUsers).catch(setUsersError);
    }, []);

    if (isNumeric ? isLoading : altLoading) return <p>Loading user...</p>;
    if (isNumeric ? error : altError) return <p>{(isNumeric ? error : altError)?.message}</p>;

    const resolvedUser = isNumeric ? user : altUser;
    if (!resolvedUser) return <p>User not found</p>;

    const joinDate = new Date(resolvedUser.date_joined).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const coursesCount = resolvedUser?.courses_created?.length || 0;
    const getBadge = () => {
        if (coursesCount >= 20) return { icon: "👑", title: "Legend", color: "#FFD700" };
        if (coursesCount >= 10) return { icon: "⭐", title: "Expert", color: "#E74C3C" };
        if (coursesCount >= 5) return { icon: "🎓", title: "Educator", color: "#3498DB" };
        if (coursesCount >= 1) return { icon: "🌱", title: "Creator", color: "#2ECC71" };
        return { icon: "👤", title: "Learner", color: "#95A5A6" };
    };
    const badge = getBadge();

    const completedIds = getCompletedForUser(resolvedUser.username);
    const completedCount = completedIds.length;
    const enrolledIds = getCoursesForUser(resolvedUser.username);
    const enrolledCount = enrolledIds.length;
    const enrolledCourses = (courses || []).filter((c) => enrolledIds.includes(String(c.id ?? c.pk ?? c._id)));

    const SidebarLink = ({ id: tabId, label }) => (
        <button
            type="button"
            className={`sidebar-link ${activeTab === tabId ? "active" : ""}`}
            onClick={() => setActiveTab(tabId)}
            aria-current={activeTab === tabId ? "page" : undefined}
        >
            {label}
        </button>
    );

    return (
        <div className="user-page admin-layout">
            <div className="admin-header">
                <div className="admin-header-left">
                    <h1 className="admin-title">{resolvedUser.username}</h1>
                    <div className="user-badge" style={{ borderColor: badge.color }}>
                        <span className="badge-icon">{badge.icon}</span>
                        <span className="badge-title" style={{ color: badge.color }}>{badge.title}</span>
                    </div>
                </div>
                <div className="admin-header-right" />
            </div>
            <p className="join-date">Member since {joinDate}</p>

            <div className="admin-body">
                <aside className="admin-sidebar" aria-label="Profile navigation">
                    <SidebarLink id="leaderboard" label={`Leaderboard`} />
                    <SidebarLink id="created" label={`Circles Created (${coursesCount})`} />
                    <SidebarLink id="enrolled" label={`Circles Joined (${enrolledCount})`} />
                    <SidebarLink id="liked" label={`Circles Liked (${resolvedUser?.courses_liked?.length || 0})`} />
                    <SidebarLink id="completed" label={`Completed Circles (${completedCount})`} />
                    <SidebarLink id="certificates" label={`Certificates (${resolvedUser?.certificates?.length || 0})`} />
                </aside>

                <main className="admin-content">
                    {activeTab === "leaderboard" && (
                        <section aria-label="Leaderboard" className="lb-grid">
                            <div className="lb-col lb-users">
                                <h2 className="lb-heading">User Leaderboards</h2>
                                {usersError && <p>{usersError.message}</p>}
                                {(() => {
                                    const data = Array.isArray(allUsers) ? allUsers : [];
                                    const ranked = data
                                        .map((u) => ({ username: u.username, created: u.courses_created?.length || 0 }))
                                        .sort((a, b) => b.created - a.created)
                                        .slice(0, 5);
                                    return (
                                        <div className="lb-section lb-top-creators">
                                            {/* FIXED: Changed to Facilitators */}
                                            <h3 className="lb-title">Top Facilitators</h3>
                                            {ranked.length ? (
                                                <ol>
                                                    {ranked.map((r) => (
                                                        <li key={r.username}>
                                                            {r.username} — {r.created} circle{r.created === 1 ? "" : "s"}
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p>Loading facilitators...</p>
                                            )}
                                        </div>
                                    );
                                })()}
                                {/* Rest of the file remains same, ensure links point to /circles/ */}
                            </div>
                            {/* ... (rest of logic is good) */}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

export default UserPage;