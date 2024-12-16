"use client"; // This must be the first line in the file

import Image from "next/image";
import { useRouter } from "next/navigation"; // Next.js router
import { useEffect, useState } from "react";
import mimir from "@/assets/images/mimir.png";

export const Header = () => {
  const [activeSection, setActiveSection] = useState("");
  const router = useRouter(); // Next.js routing hook

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const options = {
      root: null,
      threshold: 0.3, // Adjusts when the intersection triggers (30% of section in view)
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, options);

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="flex justify-between items-center fixed top-3 w-full z-10 px-4">
      {/* Logo Section */}
      <div className="flex items-center">
        <Image
          src={mimir}
          alt="Logo"
          className="h-20 w-20 object-contain" // Adjust size as needed
        />
        <span className="ml-2 text-white text-2xl font-extrabold tracking-wide bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">
          Mimir AI
        </span>
      </div>

      {/* Navigation Section */}
      <nav className="absolute left-1/2 transform -translate-x-1/2 flex gap-1 p-0.5 border border-white/15 rounded-full bg-white/10 backdrop-blur">
        <a
          href="#home"
          className={`nav-item px-4 py-1 rounded-full ${
            activeSection === "home" ? "bg-white text-gray-900" : "text-white"
          }`}
        >
          Home
        </a>
        <a
          href="#projects"
          className={`nav-item px-4 py-1 rounded-full ${
            activeSection === "projects" ? "bg-white text-gray-900" : "text-white"
          }`}
        >
          Showcase
        </a>
        <a
          href="#about"
          className={`nav-item px-4 py-1 rounded-full ${
            activeSection === "about" ? "bg-white text-gray-900" : "text-white"
          }`}
        >
          About Team
        </a>
        <a
          href="#contact"
          className={`nav-item px-4 py-1 rounded-full ${
            activeSection === "contact" ? "bg-white text-gray-900" : "text-white"
          }`}
        >
          Contact
        </a>
      </nav>
    </div>
  );
};
