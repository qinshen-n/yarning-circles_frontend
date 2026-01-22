import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Circle, Users, PenLine, Award, PlusCircle } from "lucide-react";
import categoryImages from "../utils/category-images";
import "./LandingPage.css";

function LandingPage() {
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    const scrollCarousel = (direction) => {
        const el = carouselRef.current;
        if (!el) return;
        const amount = 300;
        el.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" });
    };

    return (
        <div className="landing-root">
            {/* Hero Section*/}
            <section className="hero">
                {/* Abstract Background Shapes */}
                <div className="hero-shape circle-1"></div>
                <div className="hero-shape circle-2"></div>

                <div className="hero-content">
                    <div className="hero-text centered">
                        <div className="hero-eyebrow">Welcome to Yarning Circles</div>
                        
                        <h1>
                            Sharing, Learning <br />
                            <span className="h1-accent">& Respectful Conversations</span>
                        </h1>
                        
                        <p>
                            A peer-led platform for collaborative learning where everyone can
                            contribute, connect, and grow.
                        </p>
                        
                        <div className="hero-actions centered-actions">
                            <button className="btn primary" onClick={() => navigate("/circles")}>
                                Explore Circles
                            </button>
                            <button className="btn outline" onClick={() => navigate("/start-circle")}>
                                Start a Circle
                            </button>
                        </div>
                    </div>
                </div>
            </section>

        {/* Categories Section*/}
        <section className="categories">
            <h2>Explore Categories</h2>
            <div className="cat-wrap">
                <button className="cat-arrow prev" aria-label="Previous" onClick={() => scrollCarousel("prev")}>‹</button>
                
                <div className="cat-carousel" role="region" aria-label="Course categories" ref={carouselRef}>
                {Object.entries(categoryImages).slice(0, 9).map(([key, src]) => (
                    <div key={key} className="cat-item" aria-label={key}>
                        <img src={src} alt={key} />
                        <div className="cat-label">{key}</div>
                    </div>
                ))}
                </div>

                <button className="cat-arrow next" aria-label="Next" onClick={() => scrollCarousel("next")}>›</button>
            </div>
        </section>

        {/* Features Section*/}
        <section className="features">
                <div className="feature-card">
                    <Users className="icon"/> 
                    <h3>Community-led</h3>
                    <p>
                        Learning is richer together. Share lived experience, perspectives, 
                        and support in respectful peer-to-peer circles.
                    </p>
                </div>
                <div className="feature-card">
                    <PenLine className="icon"/>
                    <h3>Written-first</h3>
                    <p>
                        Clear, accessible content with plain language. 
                        Learn at your own pace, revisit anytime.
                    </p>
                </div>
                <div className="feature-card">
                    <Circle className="icon"/>
                    <h3>Culturally Grounded</h3>
                    <p>
                        Inspired by Aboriginal yarning—listening, connection, and 
                        shared responsibility guide everything we build.
                    </p>
                </div>
                <div className="feature-card">
                    <Award className="icon"/>
                    <h3>Growth-focused</h3>
                    <p>
                        Celebrate progress with milestones and badges—no pressure, 
                        no competition, just personal growth.
                    </p>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="cta">
                <div className="cta-text">
                    <div className="cta-eyebrow">Yarning Circles</div>
                    <h2>Ready to share your knowledge?</h2> {/* Changed from "Start a circle today" */}
                    <p>
                        Create a welcoming space for learning. Set up your circle in minutes and invite others to join the conversation.
                    </p>
                </div>
                <div className="cta-actions">
                    <button className="cta-primary" onClick={() => navigate("/start-circle")}>
                        <PlusCircle size={18}/> Start a Circle
                    </button>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
