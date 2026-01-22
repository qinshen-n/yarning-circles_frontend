import useCourses from "../hooks/use-courses";
import CourseCard from "../components/CourseCard";
import useFeaturedCourses from "../hooks/use-featured-courses";
import { useState, useMemo, useRef, useEffect } from "react";
import "./HomePage.css";

function HomePage() {
    const { courses, isLoading, error } = useCourses();
    const { featured, isLoading: featuredLoading } = useFeaturedCourses(); //Custom hook fetches featured fundraisers from the API. Returns featured array and loading state
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ categories: [], levels: [], durationMin: "", durationMax: "" });
    const featuredTrackRef = useRef(null);

    // Dynamically sync card height to the tallest rendered card (e.g., first one)
    // Moved below sortedCourses declaration to avoid TDZ errors.

    // Helper function to get course ID
    const getId = (item) => {
        if (!item) return null;
        if (item.id != null) return String(item.id);
        if (item.pk != null) return String(item.pk);
        if (item._id != null) return String(item._id);
        return null;
    };

    // Compute filter option sources
    const allCategories = useMemo(() => {
        const s = new Set();
        (courses || []).forEach((c) => { if (c?.category) s.add(String(c.category)); });
        return Array.from(s).sort();
    }, [courses]);
    const levelOptions = ["Beginner", "Intermediate", "Advanced"];

    // Filter out featured courses from main list and apply search + filters
    const filteredCourses = useMemo(() => {
        const featuredIds = new Set((featured || []).map(getId).filter(Boolean));

        const term = query.toLowerCase().trim();
        const hasTerm = !!term;

        const catSet = new Set(filters.categories);
        const lvlSet = new Set(filters.levels);
        const minDur = filters.durationMin === "" ? null : Number(filters.durationMin);
        const maxDur = filters.durationMax === "" ? null : Number(filters.durationMax);

        return (courses || []).filter((c) => {
            const cid = getId(c);
            if (cid && featuredIds.has(cid)) return false; // Hide featured from main list

            if (hasTerm) {
                const q = term;
                const matchesBase = (
                    (c.title && c.title.toLowerCase().includes(q)) ||
                    (c.description && c.description.toLowerCase().includes(q)) ||
                    (c.category && String(c.category).toLowerCase().includes(q)) ||
                    (c.owner && String(c.owner).toLowerCase().includes(q))
                );
                const diff = String(c.difficulty_level ?? c.difficulty ?? "").toLowerCase();
                const durRaw = c.duration_in_hours ?? c.duration;
                const durStr = durRaw != null ? String(durRaw).toLowerCase() : "";
                const matchesExtras = ((diff && diff.includes(q)) || (durStr && durStr.includes(q)));
                if (!(matchesBase || matchesExtras)) return false;
            }

            // Category filter
            if (catSet.size > 0) {
                const courseCat = String(c?.category || "");
                if (!catSet.has(courseCat)) return false;
            }
            // Level filter
            if (lvlSet.size > 0) {
                const courseLvl = String(c?.difficulty_level ?? c?.difficulty ?? "");
                if (!lvlSet.has(courseLvl)) return false;
            }
            // Duration filter
            const durNum = Number(c?.duration_in_hours ?? c?.duration ?? NaN);
            if (!Number.isNaN(durNum)) {
                if (minDur !== null && durNum < minDur) return false;
                if (maxDur !== null && durNum > maxDur) return false;
            } else {
                if (minDur !== null || maxDur !== null) return false;
            }

            return true;
        });
    }, [courses, query, featured, filters]);

    // Sort the filtered courses based on selected sort option
    const sortedCourses = useMemo(() => {
        const list = [...(filteredCourses || [])];
        const collator = new Intl.Collator(undefined, { sensitivity: "base" });

        const likesOf = (x) => (x?.likes_count ?? x?.likes ?? 0);
        const durOf = (x) => {
            const raw = x?.duration_in_hours ?? x?.duration;
            const n = Number(raw);
            return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
        };
        const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        const diffOf = (x) => {
            const d = String(x?.difficulty_level ?? x?.difficulty ?? "").toLowerCase();
            return d in diffOrder ? diffOrder[d] : 99;
        };
        const timeOf = (x) => {
            const raw = x?.created_at ?? x?.createdAt ?? x?.date ?? null;
            const parsed = raw ? Date.parse(raw) : NaN;
            if (!Number.isNaN(parsed)) return parsed;
            // Fallback: use numeric ID as a proxy for recency if available
            const idNum = Number(getId(x) ?? 0);
            return idNum;
        };

        switch (sortBy) {
            case "title":
                list.sort((a, b) => collator.compare(a?.title ?? "", b?.title ?? ""));
                break;
            case "likes":
                list.sort((a, b) => likesOf(b) - likesOf(a));
                break;
            case "newest":
                list.sort((a, b) => timeOf(b) - timeOf(a));
                break;
            case "durationAsc":
                list.sort((a, b) => durOf(a) - durOf(b));
                break;
            case "durationDesc":
                list.sort((a, b) => durOf(b) - durOf(a));
                break;
            case "difficulty":
                list.sort((a, b) => diffOf(a) - diffOf(b));
                break;
            case "relevance":
            default:
                // Keep API/default order
                break;
        }

        return list;
    }, [filteredCourses, sortBy]);

    // Dynamically sync card height to the tallest rendered card
    useEffect(() => {
        const measureAndSetHeight = () => {
            const featuredCards = document.querySelectorAll('.featured-list .course-card');
            const allCards = document.querySelectorAll('#course-list .course-card');
            let maxH = 0;
            [...featuredCards, ...allCards].forEach((el) => {
                if (el) {
                    const h = el.getBoundingClientRect().height;
                    if (h > maxH) maxH = h;
                }
            });
            if (maxH > 0) {
                document.documentElement.style.setProperty('--card-height', `${Math.ceil(maxH)}px`);
            }
        };

        const t = setTimeout(measureAndSetHeight, 50);
        window.addEventListener('resize', measureAndSetHeight);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', measureAndSetHeight);
        };
    }, [featured, sortedCourses]);

    const scrollFeatured = (dir) => {
        const el = featuredTrackRef.current;
        if (!el) return;
        const amount = Math.max(240, Math.floor(el.clientWidth * 0.9));
        el.scrollBy({ left: dir * amount, behavior: "smooth" });
    };

        if (isLoading) {
            return (<p>loading circles...</p>)
        }
    
        if (error) {
            return (<p>{error.message}</p>)
        }
    
    return (
        <div className="home-container">
            {/* Featured Section */}
            {featured && featured.length > 0 && (
                <section id="featured-courses" className="featured-section">
                    <h2>Featured Circles</h2>
                    <div className="carousel">
                        <button
                            className="carousel-btn prev"
                            aria-label="Previous featured"
                            onClick={() => scrollFeatured(-1)}
                        >
                            ‹
                        </button>
                        <div className="featured-list carousel-track" ref={featuredTrackRef}>
                            {featured.map((course) => (
                                <CourseCard key={course.id} courseData={course} />
                            ))}
                        </div>
                        <button
                            className="carousel-btn next"
                            aria-label="Next featured"
                            onClick={() => scrollFeatured(1)}
                        >
                            ›
                        </button>
                    </div>
                </section>
            )}

            {/* All Courses Section */}
            <section className="all-courses-section">
                <h2>All Circles</h2>
                <div className="search-row">
                    <input
                        type="text"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search circles by title, category, owner…"
                        aria-label="Search circles"
                    />
                    {query && (
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        type="button"
                        className="filter-toggle-btn"
                        aria-expanded={showFilters}
                        aria-controls="filter-panel"
                        onClick={() => setShowFilters((v) => !v)}
                    >
                        {showFilters ? "Hide Filters" : "Filter"}
                    </button>
                    <label htmlFor="sort" className="visually-hidden">Sort by</label>
                    <select
                        id="sort"
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Sort circles"
                    >
                        <option value="relevance">Sort: Relevance</option>
                        <option value="title">Sort: Title (A–Z)</option>
                        <option value="likes">Sort: Likes (High→Low)</option>
                        <option value="newest">Sort: Newest</option>
                        <option value="durationAsc">Sort: Duration (Short→Long)</option>
                        <option value="durationDesc">Sort: Duration (Long→Short)</option>
                        <option value="difficulty">Sort: Difficulty (Beginner→Advanced)</option>
                    </select>
                </div>
                {showFilters && (
                    <div id="filter-panel" className="filter-panel" role="region" aria-label="Filters">
                        <div className="filter-section">
                            <div className="filter-label">Category</div>
                            <div className="filter-options">
                                {allCategories.length === 0 && (
                                    <div className="filter-empty">No categories</div>
                                )}
                                {allCategories.map((cat) => (
                                    <label key={cat} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes(cat)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFilters((f) => {
                                                    const next = new Set(f.categories);
                                                    if (checked) next.add(cat); else next.delete(cat);
                                                    return { ...f, categories: Array.from(next) };
                                                });
                                            }}
                                        />
                                        <span>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <div className="filter-label">Level</div>
                            <div className="filter-options">
                                {levelOptions.map((lvl) => (
                                    <label key={lvl} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.levels.includes(lvl)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFilters((f) => {
                                                    const next = new Set(f.levels);
                                                    if (checked) next.add(lvl); else next.delete(lvl);
                                                    return { ...f, levels: Array.from(next) };
                                                });
                                            }}
                                        />
                                        <span>{lvl}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <div className="filter-label">Duration (hours)</div>
                            <div className="filter-duration">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={filters.durationMin}
                                    onChange={(e) => setFilters((f) => ({ ...f, durationMin: e.target.value }))}
                                />
                                <span className="duration-sep">–</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={filters.durationMax}
                                    onChange={(e) => setFilters((f) => ({ ...f, durationMax: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button type="button" className="btn btn-apply" onClick={() => setShowFilters(false)}>Apply</button>
                            <button
                                type="button"
                                className="btn btn-clear"
                                onClick={() => setFilters({ categories: [], levels: [], durationMin: "", durationMax: "" })}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                <div id="course-list">
                    {sortedCourses.map((courseData, key) => {
                        return <CourseCard key={key} courseData={courseData} />;
                    })}
                </div>
            </section>
        </div>
    );
}

export default HomePage;