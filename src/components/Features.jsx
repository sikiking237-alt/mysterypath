﻿﻿﻿import React from "react";
import { useNavigate } from "react-router-dom";

const Features = ({ darkMode, onFeatureClick }) => {
  const navigate = useNavigate();
  
  // Navigation handler
  const handleFeatureClick = (featureTitle, featurePath) => {
    if (onFeatureClick) {
      onFeatureClick(featureTitle);
    } else {
      // Default navigation based on feature
      navigate(featurePath);
    }
  };

  const features = [
    {
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of real-world experience",
      color: "#6366f1",
      path: "/courses",
      tooltip: "Browse courses from expert instructors"
    },
    {
      title: "Learn at Your Pace",
      description: "Lifetime access with flexible learning schedules that fit your lifestyle",
      color: "#10b981",
      path: "/my-learning",
      tooltip: "Access your learning dashboard"
    },
    {
      title: "Get Certified",
      description: "Earn recognized certificates to showcase your achievements",
      color: "#f59e0b",
      path: "/my-certificates",
      tooltip: "View your earned certificates"
    },
    {
      title: "Community Support",
      description: "Join a vibrant community of learners and get help when you need it",
      color: "#8b5cf6",
      path: "/chat",
      tooltip: "Join our learning community"
    },
    {
      title: "Mobile Friendly",
      description: "Learn anywhere, anytime with our fully responsive platform",
      color: "#ec4899",
      path: "/courses",
      tooltip: "Start learning on any device"
    },
    {
      title: "Career Focused",
      description: "Skills that matter for your career growth and job readiness",
      color: "#06b6d4",
      path: "/dashboard",
      tooltip: "Track your career progress"
    }
  ];

  return (
    <div style={{
      padding: "80px 20px",
      background: darkMode ? "#0f172a" : "#f8fafc"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ marginBottom: "50px" }}>
          <h2 style={{
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Why Choose MysteryPath?
          </h2>
          <p style={{
            fontSize: "18px",
            color: darkMode ? "#94a3b8" : "#64748b",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            The best learning experience designed for your success
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "30px"
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => handleFeatureClick(feature.title, feature.path)}
              data-tooltip={feature.tooltip}
              style={{
                background: darkMode ? "#1e293b" : "white",
                borderRadius: "20px",
                padding: "30px",
                textAlign: "center",
                transition: "all 0.3s",
                cursor: "pointer",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.05)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 20px 30px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.05)";
              }}
            >
              {/* Decorative gradient background */}
              <div style={{
                position: "absolute",
                top: "-50%",
                right: "-50%",
                width: "200%",
                height: "200%",
                background: `radial-gradient(circle, ${feature.color}10, transparent)`,
                opacity: 0,
                transition: "opacity 0.3s",
                pointerEvents: "none"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
              />
              
              <h3 style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "12px",
                color: darkMode ? "white" : "#1e293b"
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                color: darkMode ? "#94a3b8" : "#64748b",
                lineHeight: "1.6",
                marginBottom: "16px"
              }}>
                {feature.description}
              </p>
              
              {/* Learn more link */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: feature.color,
                fontSize: "14px",
                fontWeight: "600",
                transition: "gap 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.gap = "12px"}
              onMouseLeave={(e) => e.currentTarget.style.gap = "8px"}
              >
                <span>Learn More</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Call to Action Section */}
        <div style={{
          marginTop: "60px",
          padding: "40px",
          background: darkMode ? "#1e293b" : "white",
          borderRadius: "20px",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`
        }}>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "16px",
            color: darkMode ? "white" : "#1e293b"
          }}>
            Ready to Start Your Learning Journey?
          </h3>
          <p style={{
            color: darkMode ? "#94a3b8" : "#64748b",
            marginBottom: "24px",
            fontSize: "16px"
          }}>
            Join thousands of students already learning on MysteryPath
          </p>
          <button
            onClick={() => handleFeatureClick("Browse Courses", "/courses")}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: "40px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
              boxShadow: "0 4px 15px rgba(102,126,234,0.4)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(102,126,234,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(102,126,234,0.4)";
            }}
          >
            Browse All Courses
          </button>
        </div>
      </div>
      
      {/* Add tooltip styles */}
      <style>{`
        [data-tooltip] {
          position: relative;
        }
        [data-tooltip]:before {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 12px;
          background: #1e293b;
          color: white;
          font-size: 12px;
          border-radius: 8px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          z-index: 10;
          margin-bottom: 8px;
        }
        [data-tooltip]:hover:before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Features;