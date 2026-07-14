import React from "react";
import { useNavigate } from "react-router-dom";

const Footer = ({ darkMode, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  // Navigation handler
  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  // Social media links
  const socialLinks = [
    {
      icon: "📘",
      name: "Facebook",
      url: "https://facebook.com",
      action: () => window.open("https://facebook.com", "_blank"),
    },
    {
      icon: "🐦",
      name: "Twitter",
      url: "https://twitter.com",
      action: () => window.open("https://twitter.com", "_blank"),
    },
    {
      icon: "💼",
      name: "LinkedIn",
      url: "https://linkedin.com",
      action: () => window.open("https://linkedin.com", "_blank"),
    },
    {
      icon: "📷",
      name: "Instagram",
      url: "https://instagram.com",
      action: () => window.open("https://instagram.com", "_blank"),
    },
  ];

  // Newsletter subscription handler
  const handleNewsletterSubscribe = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (email) {
      alert(`📧 Thanks for subscribing! Updates will be sent to ${email}`);
      e.target.reset();
    } else {
      alert("Please enter a valid email address");
    }
  };

  return (
    <footer
      style={{
        background: darkMode ? "#0f172a" : "#1e293b",
        color: "white",
        padding: "60px 20px 30px",
        marginTop: "40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                cursor: "pointer",
              }}
              onClick={() => handleNavigation("/")}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>📚</span>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
                MysteryPath
              </h3>
            </div>
            <p
              style={{
                color: "#94a3b8",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              Empowering learners worldwide with quality education and
              expert-led courses.
            </p>
            <div style={{ display: "flex", gap: "15px" }}>
              {socialLinks.map((social, i) => (
                <div
                  key={i}
                  onClick={social.action}
                  data-tooltip={social.name}
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(102,126,234,0.5)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  <span style={{ fontSize: "18px" }}>{social.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Quick Links
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[
                { name: "About Us", path: "/about" },
                { name: "Courses", path: "/courses" },
                { name: "Pricing", path: "/pricing" },
                { name: "Blog", path: "/blog" },
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "12px" }}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      transition: "color 0.3s",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#667eea")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#94a3b8")
                    }
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Support
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {[
                { name: "Help Center", path: "/support" },
                { name: "Contact Us", path: "/contact" },
                { name: "About Us", path: "/about" },
                { name: "Privacy Policy", path: "/privacy" },
                { name: "Terms of Service", path: "/terms" },
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "12px" }}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      transition: "color 0.3s",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#667eea")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#94a3b8")
                    }
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Newsletter
            </h4>
            <p
              style={{
                color: "#94a3b8",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              Get updates on new courses and offers
            </p>
            <form
              onSubmit={handleNewsletterSubscribe}
              style={{ display: "flex", gap: "10px" }}
            >
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                Subscribe
              </button>
            </form>

            {/* Trust Badge */}
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span>⭐</span>
                <span>⭐</span>
                <span>⭐</span>
                <span>⭐</span>
                <span>⭐</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                Rated 4.9/5 by 10,000+ students
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with additional links */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "20px",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            <p>
              &copy; {currentYear} MysteryPath. All rights reserved. Made with
              ❤️ for learners worldwide.
            </p>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <button
              onClick={() => handleNavigation("/sitemap")}
              style={{
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#667eea")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              Sitemap
            </button>
            <button
              onClick={() => handleNavigation("/accessibility")}
              style={{
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#667eea")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              Accessibility
            </button>
            <button
              onClick={() => handleNavigation("/cookies")}
              style={{
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#667eea")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              Cookie Policy
            </button>
          </div>
        </div>

        {/* Payment Methods / Partners */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            Secure Payment:
          </span>
          {["💳 Visa", "💳 Mastercard", "💳 PayPal", "💳 Amex"].map(
            (method, i) => (
              <span key={i} style={{ color: "#64748b", fontSize: "12px" }}>
                {method}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Tooltip styles */}
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
          padding: 4px 8px;
          background: #1e293b;
          color: white;
          font-size: 11px;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          margin-bottom: 5px;
          z-index: 10;
        }
        [data-tooltip]:hover:before {
          opacity: 1;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
