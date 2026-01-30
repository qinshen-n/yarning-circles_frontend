import React from "react";
import arsenImg from "../assets/Arsen.jpg";
import emilyImg from "../assets/Emily.jpg";
import jessImg from "../assets/Jessica.jpg";
import qinImg from "../assets/Qin.jpg";
import stephImg from "../assets/Steph.jpg";
import "./AboutPage.css";
import { 
    Github, 
    Linkedin, 
    Calendar,
    Target,
    FileText,
    MessageCircle,
    ExternalLink
} from "lucide-react";

const teamMembers = [
    { name: "Arsen ILHAN", role: "Backend Developer", image: arsenImg, github: "https://github.com/arsenharris", linkedin: "https://www.linkedin.com/in/arsenilhan/" },
    { name: "Emily Sheridan", role: "Full Stack Developer", image: emilyImg, github: "https://github.com/Emily2955", linkedin: "https://www.linkedin.com/" },
    { name: "Jessica Keating", role: "Full Stack Developer", image: jessImg, github: "https://github.com/jess-keating", linkedin: "https://www.linkedin.com/in/jessica-keating/" },
    { name: "Qin Shen 申勤", role: "Full Stack Developer", image: qinImg, github: "https://github.com/qinshen-n", linkedin: "https://www.linkedin.com/in/qin-sharon-shen/" },
    { name: "Steph Chan", role: "Full Stack Developer", image: stephImg, github: "https://github.com/stephanite9", linkedin: "https://www.linkedin.com/in/stephanie-chan-0aa3a1176/" }
];

function About() {
    return (
        <div className="about-page-lean">
            {/* HERO */}
            <header className="about-hero-simple"> 
                <h1>About Yarning Circles</h1>
                <p>Connecting learners, sharing knowledge, and growing together.</p>
            </header>

            <div className="about-content">
                {/* WHAT IS IT */}
                <section className="about-section-simple">
                    <h2>What is Yarning Circles?</h2>
                    <p className="intro-text">
                        Yarning Circles is a platform where learners form collaborative communities 
                        called "circles." Instead of competing individually, members support each 
                        other's growth through shared goals, resources, meetings, and conversations.
                    </p>
                </section>

                {/* ORIGIN STORY - YOUR WORK */}
                <section className="about-section-simple origin-story">
                    <h2>Why I Built This</h2>
                    <p>
                        After completing a 4-week group project that delivered a working course 
                        platform, I recognized a gap in the market: existing platforms focus on 
                        individual achievement and competition. I spent the following weeks 
                        redesigning the experience to support peer-driven learning. The result 
                        is the 4-zone framework below—four interconnected spaces where learners 
                        collaborate, share resources, and support each other's growth.
                    </p>
                    <a 
                        href="https://your-portfolio.com/projects/yarning-circles" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="case-study-link"
                    >
                        Read my full case study <ExternalLink size={16} />
                    </a>
                </section>

                {/* 4 ZONES */}
                <section className="about-section-simple zones-section">
                    <h2>How It Works: The 4-Zone Framework</h2>
                    <p className="section-intro">
                        Every circle is organized around four interconnected spaces
                    </p>
                    
                    <div className="zones-grid-simple">
                        <div className="zone-card-simple zone-1">
                            <Calendar size={48} />
                            <h3>Community Pulse</h3>
                            <p>Who's learning & when we meet</p>
                            <ul>
                                <li>Participant roster</li>
                                <li>Meeting schedule</li>
                                <li>RSVP system</li>
                            </ul>
                        </div>

                        <div className="zone-card-simple zone-2">
                            <Target size={48} />
                            <h3>Shared Goals</h3>
                            <p>What we're learning together</p>
                            <ul>
                                <li>Learning modules</li>
                                <li>Progress tracking</li>
                                <li>Milestones</li>
                            </ul>
                        </div>

                        <div className="zone-card-simple zone-3">
                            <FileText size={48} />
                            <h3>Shared Resources</h3>
                            <p>Knowledge we contribute</p>
                            <ul>
                                <li>Curated materials</li>
                                <li>Peer resources</li>
                                <li>File sharing</li>
                            </ul>
                        </div>

                        <div className="zone-card-simple zone-4">
                            <MessageCircle size={48} />
                            <h3>Async Conversations</h3>
                            <p>Ongoing discussions</p>
                            <ul>
                                <li>Comment threads</li>
                                <li>Q&A support</li>
                                <li>Peer feedback</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* TEAM - ORIGINAL GROUP */}
                <section className="about-section-simple team-section">
                    <h2>Original Development Team</h2>
                    <p className="team-intro">
                        The foundation of this platform was built collaboratively during 
                        a 4-week group project phase.
                    </p>
                    <div className="team-grid-simple">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="team-member-simple">
                                <img src={member.image} alt={member.name} />
                                <h4>{member.name}</h4>
                                <p>{member.role}</p>
                                <div className="social-links-simple">
                                    {member.github && (
                                        <a href={member.github} target="_blank" rel="noreferrer">
                                            <Github size={18} />
                                        </a>
                                    )}
                                    {member.linkedin && (
                                        <a href={member.linkedin} target="_blank" rel="noreferrer">
                                            <Linkedin size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* JOIN US */}
                <section className="about-section-simple join-section">
                    <h2>Join Us</h2>
                    <p className="join-text">
                        Whether you're here to learn, teach, or collaborate, Yarning Circles 
                        welcomes you. Explore our circles and be part of a vibrant learning community.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;