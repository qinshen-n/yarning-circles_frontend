import useCourses from "../hooks/use-courses";
import CourseCard from "../components/CourseCard";
import { useState, useMemo, useRef } from "react";
import { getCount as getCountUtil } from "../utils/enrollment";
import { Search, X, Filter, Activity, Users } from "lucide-react"; 
import "./HomePage.css";

function HomePage() {
    const { courses, isLoading, error } = useCourses();
    
    // UI State
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("active");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ categories: [], levels: [] });
    
    const featuredTrackRef = useRef(null);

    // --- LOGIC ---
    const getId = (item) => String(item.id ?? item.pk ?? item._id);
    const getParticipants = (course) => {
        const id = getId(course);
        return id ? getCountUtil(id) : 0;
    };

    const trendingCircles = useMemo(() => {
        if (!courses) return [];
        return [...courses]
            .sort((a, b) => getParticipants(b) - getParticipants(a))
            .slice(0, 5);
    }, [courses]);

    const exploreCircles = useMemo(() => {
        const term = query.toLowerCase().trim();
        return (courses || []).filter((c) => {
            // Search
            if (term) {
                const textMatch = [c.title, c.category, c.owner]
                    .some(field => String(field || "").toLowerCase().includes(term));
                if (!textMatch) return false;
            }
            // Category Filter
            if (filters.categories.length > 0 && !filters.categories.includes(c.category)) return false;
            
            return true;
        }).sort((a, b) => {
            if (sortBy === "active") return getParticipants(b) - getParticipants(a);
            if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === "likes") return (b.likes_count || 0) - (a.likes_count || 0);
            return 0;
        });
    }, [courses, query, filters, sortBy]);

    const allCategories = useMemo(() => {
        return [...new Set((courses || []).map(c => c.category))].sort();
    }, [courses]);

    const scrollFeatured = (dir) => {
        if (featuredTrackRef.current) {
            featuredTrackRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
        }
    };

    const handleClearFilters = (e) => {
        e.preventDefault(); // Prevent form submission or scroll jumps
        setFilters({ categories: [], levels: [] });
    };

    if (isLoading) return <div className="loading-state">Loading community...</div>;
    if (error) return <div className="error-state">Error: {error.message}</div>;

    const totalParticipants = courses?.reduce((acc, c) => acc + getCountUtil(c.id || c.pk), 0) || 0;

    return (
        <div className="landing-root">            
            {/* 1. HERO WITH SEARCH */}
            <section className="hero-compact">
                <div className="hero-content">
                    <span className="hero-eyebrow">The Community</span>
                    <h1>Find Your <span className="h1-accent">Circle</span></h1>
                    <p>Join peer learning groups where everyone shares, everyone grows.</p>
                    
                    <div className="hero-search-wrapper">
                        <Search size={22} className="search-icon"/>
                        <input 
                            type="text" 
                            placeholder="What do you want to learn today?" 
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query && <X size={20} className="clear-icon" onClick={() => setQuery("")}/>}
                    </div>

                    <div className="header-stats-pill">
                        <span><Activity size={16} /> {courses?.length || 0} Circles</span>
                        <span className="divider">•</span>
                        <span><Users size={16} /> {totalParticipants} Learners</span>
                    </div>
                </div>
                <div className="hero-shape circle-1"></div>
                <div className="hero-shape circle-2"></div>
            </section>

            <div className="home-content-wrapper">
                
                {/* 2. TRENDING SECTION */}
                {!query && trendingCircles.length > 0 && (
                    <section className="featured-section">
                        <div className="section-header-clean">
                            <span className="section-eyebrow">Trending</span>
                            <h2>Happening Now</h2>
                        </div>
                        
                        <div className="carousel-wrapper">
                            <button className="cat-arrow prev" onClick={() => scrollFeatured(-1)}>‹</button>
                            <div className="carousel-track" ref={featuredTrackRef}>
                                {trendingCircles.map(course => (
                                    <CourseCard key={course.id} courseData={course} isFeatured={true} />
                                ))}
                            </div>
                            <button className="cat-arrow next" onClick={() => scrollFeatured(1)}>›</button>
                        </div>
                    </section>
                )}

                {/* 3. EXPLORE SECTION */}
                <section className="explore-section">
                    <div className="section-header-row">
                        <div className="title-group">
                            <span className="section-eyebrow">Discover</span>
                            <h2>Explore All Circles</h2>
                        </div>

                        {/* 🔧 FIX 3: Buttons Aligned */}
                        <div className="tools-right">
                            <button 
                                className={`btn outline ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={18} /> Filter
                            </button>
                            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="active">Most Active</option>
                                <option value="newest">Newest</option>
                                <option value="likes">Top Rated</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Drawer */}
                    {showFilters && (
                        <div className="filter-drawer">
                            <div className="filter-header">
                                <span className="filter-label">Category:</span>
                                <button className="tag clear" onClick={handleClearFilters}>Clear Selection</button>
                            </div>
                            <div className="filter-tags">
                                {allCategories.map(cat => (
                                    <button 
                                        key={cat}
                                        className={`tag ${filters.categories.includes(cat) ? 'selected' : ''}`}
                                        onClick={() => {
                                            const newCats = filters.categories.includes(cat)
                                                ? filters.categories.filter(c => c !== cat)
                                                : [...filters.categories, cat];
                                            setFilters({ ...filters, categories: newCats });
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* The Grid */}
                    <div className="circle-grid">
                        {exploreCircles.length > 0 ? (
                            exploreCircles.map(course => (
                                <CourseCard key={course.id} courseData={course} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <h3>No circles found</h3>
                                <p>We couldn't find any circles matching "{query}".</p>
                                <button className="btn outline" onClick={() => {setQuery(""); setFilters({categories:[], levels:[]})}}>
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default HomePage;