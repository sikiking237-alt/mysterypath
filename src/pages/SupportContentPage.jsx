import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Clock, HelpCircle, Building2, Target, Eye, Shield, FileText, MessageSquare } from "lucide-react";
import { apiCall, apiEndpoints } from "../config/apiConfig";

const defaultContent = {
  siteName: "MysteryPath",
  siteDescription: "Your smooth path to knowledge mastery",
  contactEmail: "support@mysterypath.com", // Keeping existing email
  contactPhone: "0545041209", // Added WhatsApp number
  contactAddress: "",
  supportHours: "",
  aboutHeadline: "Empowering learners to grow with confidence",
  aboutBody:
    "MysteryPath helps students build practical skills through expert-led courses, guided learning paths, and modern digital tools.",
  aboutMission:
    "To deliver practical, high-quality digital learning experiences that help every student move forward.",
  aboutVision:
    "To become a trusted learning platform where students, instructors, and communities grow together.",
  helpCenterTitle: "Help Center",
  helpCenterIntro:
    "Find quick answers, support channels, and guidance for getting the most out of MysteryPath.",
  helpCenterFaqs: [
    {
      question: "How do I reset my password?",
      answer:
        "You can reset your password by clicking the 'Forgot Password' link on the login page. You will receive an email with instructions on how to set a new password.",
    },
    {
      question: "How can I view my course progress?",
      answer:
        "Navigate to the 'My Learning' page from the main dashboard. Each enrolled course will display a progress bar indicating your completion percentage.",
    },
    {
      question: "Where can I find my certificates?",
      answer:
        "Once you complete a course, your certificate will be available on the 'My Certificates' page. You can view, download, or share it from there.",
    },
  ],
  privacyPolicy: "Your privacy is important to us. It is MysteryPath's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.",
  termsOfService: "By accessing the website at MysteryPath, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.",
  logoUrl: "/static/logo.png",
};

const pageMeta = {
  about: {
    badge: "About Us",
    title: "About our learning platform",
    description: "Learn who we are, what we stand for, and how we help learners succeed.",
    icon: Building2,
  },
  contact: {
    badge: "Contact",
    title: "Talk to our support team",
    description: "Reach out for account help, platform questions, or general assistance.",
    icon: Mail,
  },
  support: {
    badge: "Help Center",
    title: "Get answers and support fast",
    description: "Browse frequently asked questions and find the right support channel.",
    icon: HelpCircle,
  },
  privacy: {
    badge: "Privacy Policy",
    title: "Your Privacy Matters",
    description: "Understand how we collect, use, and protect your personal information.",
    icon: Shield,
  },
  terms: {
    badge: "Terms of Service",
    title: "Our Terms of Service",
    description: "Read the terms and conditions for using our platform.",
    icon: FileText,
  },
};

const SupportContentPage = ({ darkMode, type = "about" }) => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const response = await apiCall(apiEndpoints.settings.publicContent);
      if (!response?.error && response?.content) {
        setContent({ ...defaultContent, ...response.content });
      }
      setLoading(false);
    };

    loadContent();
  }, []);

  const meta = useMemo(() => pageMeta[type] || pageMeta.about, [type]);
  const PageIcon = meta.icon;

  const pageShellClass = darkMode
    ? "min-h-screen bg-gray-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-900";

  const cardClass = darkMode
    ? "rounded-3xl border border-white/10 bg-white/5 shadow-xl"
    : "rounded-3xl border border-slate-200 bg-white shadow-sm";

  const mutedText = darkMode ? "text-gray-300" : "text-slate-600";
  const subText = darkMode ? "text-gray-400" : "text-slate-500";

  const renderAbout = () => (
    <div className="space-y-8">
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-500">
              <PageIcon className="h-4 w-4" />
              {meta.badge}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
              {content.aboutHeadline || meta.title}
            </h1>
            <p className={`mt-4 text-lg leading-8 ${mutedText}`}>
              {content.aboutBody || content.siteDescription}
            </p>
          </div>
          <div className={darkMode ? "rounded-2xl bg-slate-900/60 p-6" : "rounded-2xl bg-slate-50 p-6"}>
            <div className="flex items-center gap-3">
              <img
                src={content.logoUrl || "/static/logo.png"}
                alt={content.siteName}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <p className="text-lg font-semibold">{content.siteName}</p>
                <p className={subText}>{content.siteDescription}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-semibold">Mission</p>
                  <p className={mutedText}>{content.aboutMission}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="mt-0.5 h-4 w-4 text-cyan-500" />
                <div>
                  <p className="font-semibold">Vision</p>
                  <p className={mutedText}>{content.aboutVision}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-500">
          <PageIcon className="h-4 w-4" />
          {meta.badge}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">{meta.title}</h1>
        <p className={`mt-4 text-lg ${mutedText}`}>{meta.description}</p>

        <div className="mt-8 grid gap-4">
          <a href={`mailto:${content.contactEmail}`} className={cardClass + " flex items-start gap-4 p-5"}>
            <Mail className="mt-1 h-5 w-5 text-purple-500" />
            <div>
              <p className="font-semibold">Email</p>
              <p className={mutedText}>{content.contactEmail}</p>
            </div>
          </a>

          {content.contactPhone ? (
            <a href={`tel:${content.contactPhone}`} className={cardClass + " flex items-start gap-4 p-5"}>
              <Phone className="mt-1 h-5 w-5 text-cyan-500" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className={mutedText}>{content.contactPhone}</p>
              </div>
            </a>
          ) : null}

          {content.contactAddress ? (
            <div className={cardClass + " flex items-start gap-4 p-5"}>
              <MapPin className="mt-1 h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-semibold">Address</p>
                <p className={mutedText}>{content.contactAddress}</p>
              </div>
            </div>
          ) : null}

          {content.supportHours ? (
            <div className={cardClass + " flex items-start gap-4 p-5"}>
              <Clock className="mt-1 h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold">Support Hours</p>
                <p className={mutedText}>{content.supportHours}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={cardClass + " p-8"}>
        <h2 className="text-2xl font-semibold">Need quick help?</h2>
        <p className={`mt-3 ${mutedText}`}>
          For faster answers, visit the Help Center for common questions and support guidance.
        </p>
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Support</p>
          <p className="mt-2 text-2xl font-bold">We’re here to help</p>
          <p className="mt-3 text-sm text-white/90">
            Questions about enrollment, account access, payments, or learning tools can be directed to our support team.
          </p>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-lg font-bold text-white shadow-lg hover:shadow-xl transition"
        >
          <MessageSquare />
          Live Chat
        </button>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-8">
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-500">
          <PageIcon className="h-4 w-4" />
          {content.helpCenterTitle || meta.badge}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">{content.helpCenterTitle || meta.title}</h1>
        <p className={`mt-4 text-lg ${mutedText}`}>{content.helpCenterIntro || meta.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {(content.helpCenterFaqs || []).length > 0 ? (
            content.helpCenterFaqs.map((faq, index) => (
              <div key={`${faq.question}-${index}`} className={cardClass + " p-6"}>
                <p className="text-lg font-semibold">{faq.question}</p>
                <p className={`mt-2 leading-7 ${mutedText}`}>{faq.answer}</p>
              </div>
            ))
          ) : (
            <div className={cardClass + " p-6"}>
              <p className="font-semibold">No FAQs published yet</p>
              <p className={`mt-2 ${mutedText}`}>
                An admin can add help center questions and answers from system settings.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className={cardClass + " p-6"}>
            <p className="text-lg font-semibold">Contact support</p>
            <p className={`mt-2 ${mutedText}`}>Need human help? Reach out directly.</p>
            <div className="mt-4 space-y-3 text-sm">
              <a href={`mailto:${content.contactEmail}`} className="flex items-center gap-3 text-purple-500 hover:underline">
                <Mail className="h-4 w-4" />
                {content.contactEmail}
              </a>
              {content.contactPhone ? (
                <a href={`tel:${content.contactPhone}`} className="flex items-center gap-3 text-cyan-500 hover:underline">
                  <Phone className="h-4 w-4" />
                  {content.contactPhone}
                </a>
              ) : null}
            </div>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 p-3 text-sm font-semibold text-white shadow-md hover:bg-green-600 transition"
            >
              <MessageSquare size={16} />
              Live Chat
            </button>
          </div>
          {content.supportHours ? (
            <div className={cardClass + " p-6"}>
              <p className="text-lg font-semibold">Support hours</p>
              <p className={`mt-2 ${mutedText}`}>{content.supportHours}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-8">
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-500">
          <PageIcon className="h-4 w-4" />
          {meta.badge}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
          {meta.title}
        </h1>
        <p className={`mt-4 text-lg leading-8 ${mutedText}`}>
          {meta.description}
        </p>
      </div>
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Our Commitment</h2>
          <p>{content.privacyPolicy}</p>
          <h2>Information We Collect</h2>
          <p>
            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
            <li>Send you emails</li>
            <li>Find and prevent fraud</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-8">
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-2 text-sm font-semibold text-purple-500">
          <PageIcon className="h-4 w-4" />
          {meta.badge}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
          {meta.title}
        </h1>
        <p className={`mt-4 text-lg leading-8 ${mutedText}`}>
          {meta.description}
        </p>
      </div>
      <div className={cardClass + " p-8 md:p-10"}>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>1. Terms</h2>
          <p>{content.termsOfService}</p>
          <h2>2. Use License</h2>
          <ol type="a">
            <li>
              Permission is granted to temporarily download one copy of the materials
              (information or software) on MysteryPath's website for personal,
              non-commercial transitory viewing only. This is the grant of a license,
              not a transfer of title, and under this license you may not:
              <ol>
                  <li>modify or copy the materials;</li>
                  <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                  <li>attempt to decompile or reverse engineer any software contained on MysteryPath's website;</li>
                  <li>remove any copyright or other proprietary notations from the materials; or</li>
                  <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ol>
            </li>
            <li>
              This license shall automatically terminate if you violate any of these
              restrictions and may be terminated by MysteryPath at any time.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className={pageShellClass}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className={cardClass + " p-10 text-center"}>
            <p className={mutedText}>Loading content...</p>
          </div>
        ) : type === "contact" ? (
          renderContact()
        ) : type === "support" ? (
          renderSupport()
        ) : type === "privacy" ? (
          renderPrivacy()
        ) : type === "terms" ? (
          renderTerms()
        ) : (
          renderAbout()
        )}
      </div>
    </div>
  );
};

export default SupportContentPage;
