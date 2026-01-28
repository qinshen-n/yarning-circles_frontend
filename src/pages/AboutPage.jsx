import React from "react";
import arsenImg from "../assets/Arsen.jpg";
import emilyImg from "../assets/Emily.jpg";
import jessImg from "../assets/Jessica.jpg";
import qinImg from "../assets/Qin.jpg";
import stephImg from "../assets/Steph.jpg";
import "./AboutPage.css";
import { Github, Linkedin } from "lucide-react";

const teamMembers = [
    {
        name: "Arsen ILHAN",
        role: "Backend Wizard & Adventurous Learner",
        image: arsenImg,
        bio: "Arsen brings backend mastery and a fearless love of learning, eagerly jumping into new challenges and supporting her team at every turn.",
        github: "https://github.com/arsenharris",
        linkedin: "https://www.linkedin.com/in/arsenilhan/",
    },
    {
        name: "Emily Sheridan",
        role: "Full Stack Developer & Customer Experience Specialist",
        image: emilyImg,
        bio: "Emily blends full-stack development with strong customer-focused product thinking, turning user stories and journey maps into intuitive digital solutions.",
        github: "https://github.com/Emily2955",
        linkedin: "https://www.linkedin.com/",
    },
    {
        name: "Jessica Keating",
        role: "Full Stack Developer & Digital Project Manager",
        image: jessImg,
        bio: "Jessica brings together technical development and project management experience to create smooth, user-centred digital experiences.",
        github: "https://github.com/jess-keating",
        linkedin: "https://www.linkedin.com/in/jessica-keating/",
    },
    {
        name: "Qin Shen 申勤",
        role: "Full Stack Developer & User Flow Architect",
        image: qinImg,
        bio: "Qin blends full-stack engineering with user-flow architecture, using her systems mindset and sharp problem-solving skills to turn complex interactions into smooth, intuitive product journeys.",
        github: "https://github.com/qinshen-n",
        linkedin: "https://www.linkedin.com/in/qin-sharon-shen/",
    },
    {   
        name: "Steph Chan",
        role: "Full Stack Developer & Pebble Enthusiast",
        image: stephImg,
        bio: "Steph is a collaborative full-stack developer who builds with care, clarity, and a well-curated rock collection.",
        github: "https://github.com/stephanite9",
        linkedin: "https://www.linkedin.com/in/stephanie-chan-0aa3a1176/",
    }
];

function About() {
    return (
        <>
        <header className="about-hero"> 
            <div className="about-hero-content">
                <h1>About Yarning Circles</h1>
                <p>Connecting learners, sharing knowledge, and growing together.</p>
            </div>
        </header>
            <section className="about-section">
                <h2>Our Mission</h2>
                <p>
                    At Yarning Circles, we believe learning is most effective when it’s collaborative. 
                    Our mission is to provide a platform where learners can explore courses, share insights, 
                    and support each other in a community-focused environment.
                </p>
            </section>

            <section className="about-section">
                <h2>Our Approach</h2>
                <p>
                    Each course is designed to encourage discussion, practical application, and peer feedback. 
                    Learners can participate in group activities, ask questions, and develop skills at their own pace.
                </p>
            </section>

            <section className="about-section">
                <h2>Our Team</h2>
                <div className="team-container">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="team-card">
                            <img src={member.image} alt={member.name} />
                            <h3>{member.name}</h3>
                            <h3>{member.role}</h3>
                            <p>{member.bio}</p>
                            {(member.github || member.linkedin) && (
                                <div className="social-links">
                                    {member.github && (
                                        <a
                                            className="icon-link github"
                                            href={member.github}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`View ${member.name}'s GitHub profile`}
                                        >
                                            <Github size={18} />
                                        </a>
                                    )}
                                    {member.linkedin && (
                                        <a
                                            className="icon-link linkedin"
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`View ${member.name}'s LinkedIn profile`}
                                        >
                                            <Linkedin size={18} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-section journey">
                <h2>Our Journey</h2>
                <div className="timeline-container">
                    <div className="timeline-item">
                        <div className="timeline-circle">1</div>
                        <div className="timeline-content">
                            <h3>Week 1</h3>
                            <p>MVP development completed</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-circle">2</div>
                        <div className="timeline-content">
                            <h3>Week 2</h3>
                            <p>Wireframe and UI design finalized</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-circle">3</div>
                        <div className="timeline-content">
                            <h3>Week 3</h3>
                            <p>Backend Development</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-circle">4</div>
                        <div className="timeline-content">
                            <h3>Week 4</h3>
                            <p>Frontend development</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-circle">5</div>
                        <div className="timeline-content">
                            <h3>Week 2</h3>
                            <p>Self-iterate Stage: add four zones: </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-section">
                <h2>Join Us</h2>
                <p>
                    Whether you are here to learn, teach, or collaborate, Yarning Circles welcomes you. 
                    Explore our courses and be part of a vibrant learning community.
                </p>
            </section>

</>
    );
}

export default About;