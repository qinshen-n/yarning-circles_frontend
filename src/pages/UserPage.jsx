import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useUser from "../hooks/use-user";
import getUserByUsername from "../api/get-user-by-username";
import CourseCard from "../components/CourseCard";
import "./UserPage.css";

function UserPage() {
    const { id } = useParams();
    const isNumeric = Number.isFinite(Number(id));

    const { user, isLoading, error } = useUser(isNumeric ? id : undefined);

    const [altUser, setAltUser] = useState(null);
    const [altLoading, setAltLoading] = useState(!isNumeric);
    const [altError, setAltError] = useState(null);

    useEffect(() => {
        if (!isNumeric && id) {
            setAltLoading(true);
            getUserByUsername(id)
                .then((u) => setAltUser(u))
                .catch((e) => setAltError(e))
                .finally(() => setAltLoading(false));
        }
    }, [isNumeric, id]);

    if (isNumeric ? isLoading : altLoading) return <p>Loading member...</p>;
    if (isNumeric ? error : altError) return <p>{(isNumeric ? error : altError)?.message}</p>;

    const resolvedUser = isNumeric ? user : altUser;
    if (!resolvedUser) return <p>Member not found</p>;

    const joinDate = new Date(resolvedUser.date_joined).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const facilitatingCircles = resolvedUser.courses_created || [];
    const joinedCircles = resolvedUser.courses_joined || [];
    const appreciatedCircles = resolvedUser.courses_liked || [];

    const facilitatingCount = facilitatingCircles.length;
    const joinedCount = joinedCircles.length;
    const appreciatedCount = appreciatedCircles.length;

    return (
        <div className="user-page-simple">
            {/* Header */}
            <header className="user-header">
                <div className="user-intro">
                    <h1 className="user-name">{resolvedUser.username}</h1>
                    <p className="user-tagline">
                        Sharing the learning journey in {joinedCount + facilitatingCount} circles
                    </p>
                    <p className="user-since">Community member since {joinDate}</p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="user-stats">
                <div className="stat-card">
                    <span className="stat-number">{facilitatingCount}</span>
                    <span className="stat-label">Circles Facilitating</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{joinedCount}</span>
                    <span className="stat-label">Circles Joined</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{appreciatedCount}</span>
                    <span className="stat-label">Circles Appreciated</span>
                </div>
            </div>

            {/* Circles Facilitating */}
            {facilitatingCount > 0 && (
                <section className="user-circles-section">
                    <div className="section-header">
                        <h2>Circles Facilitated by {resolvedUser.username}</h2>
                        <p className="section-subtitle">
                            Join these circles to learn together with {resolvedUser.username}
                        </p>
                    </div>
                    <div className="circles-grid">
                        {facilitatingCircles.map(circle => (
                            <CourseCard key={circle.id} courseData={circle} />
                        ))}
                    </div>
                </section>
            )}

            {/* Circles Joined */}
            {joinedCount > 0 && (
                <section className="user-circles-section">
                    <div className="section-header">
                        <h2>Learning Together</h2>
                        <p className="section-subtitle">
                            {resolvedUser.username} is also participating in these circles
                        </p>
                    </div>
                    <div className="circles-grid">
                        {joinedCircles.map(circle => (
                            <CourseCard key={circle.id} courseData={circle} />
                        ))}
                    </div>
                </section>
            )}

            {/* Appreciated Circles */}
            {appreciatedCount > 0 && (
                <section className="user-circles-section">
                    <div className="section-header">
                        <h2>Circles Appreciated</h2>
                        <p className="section-subtitle">
                            Circles that {resolvedUser.username} found valuable
                        </p>
                    </div>
                    <div className="circles-grid">
                        {appreciatedCircles.map(circle => (
                            <CourseCard key={circle.id} courseData={circle} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {facilitatingCount === 0 && joinedCount === 0 && appreciatedCount === 0 && (
                <div className="user-empty-state">
                    <p>{resolvedUser.username} hasn't joined any circles yet.</p>
                </div>
            )}
        </div>
    );
}

export default UserPage;