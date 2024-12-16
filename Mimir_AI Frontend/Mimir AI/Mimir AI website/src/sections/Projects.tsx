import darkSaasLandingPage from "@/assets/images/nodesconnections.jpg";
import lightSaasLandingPage from "@/assets/images/fullmetahuman.png";
import aiStartupLandingPage from "@/assets/images/MaleHuman.png";
import Image from "next/image";
import CheckCircleIcon from "@/assets/icons/check-circle.svg";
import ArrowUpRighticon from "@/assets/icons/arrow-up-right.svg";
import grainImage from "@/assets/images/grain.jpg";
import { SectionHeader } from "@/components/SectionHeader";
import { Card } from "@/components/Card";
import GithubIcon from "@/assets/icons/github.svg"

const portfolioProjects = [
  {
    company: "Team Maverick",
    year: "September 2024",
    title: "Ideation & Research",
    results: [
      { title: "Streamlining Objectives" },
      { title: "Technology Stack Analysis" },
      { title: "Market Analysis" },
    ],
    link: "https://youtu.be/bJ3KUkjVMXw",
    sourceCode: "https://github.com/praveen647/mimirai-rag",
    image: darkSaasLandingPage,
  },
  {
    company: "Team Maverick",
    year: "October 2024",
    title: "Development & Integration",
    results: [
      { title: "Chatbot Core Functionalities" },
      { title: "Avatar Creation" },
      { title: "Integration of Chatbot with Digital Human" },
    ],
    link: "https://youtu.be/bJ3KUkjVMXw",
    sourceCode: "https://github.com/praveen647/mimirai-rag",
    image: lightSaasLandingPage,
  },
  {
    company: "Quantum Dynamics",
    year: "November 2024",
    title: "Testing & Deployment",
    results: [
      { title: "Rigorous Testing" },
      { title: "Fine-Tuning" },
      { title: "Launching the Project" },
    ],
    link: "https://youtu.be/bJ3KUkjVMXw",
    sourceCode: "https://github.com/praveen647/mimirai-rag",
    image: aiStartupLandingPage,
  },
];

export const ProjectsSection = () => {
  return (
    <section className="pb-16 lg:py-24" id="projects">
      <div className="container">
        <SectionHeader
          eyebrow="Timeline"
          title="Features Showcase"
          description="The timeline of our project development."
        />
        <div className="flex flex-col mt-10 gap-20 md:mt-20">
          {portfolioProjects.map((project, projectIndex) => (
            <Card
              key={project.title}
              className="px-8 pt-8 pb-0 md:pt-12 md:px-10 lg:pt-16 lg:px-20 sticky"
              style={{ top: `calc(64px + ${projectIndex * 40}px)` }}
            >
              <div className="lg:grid lg:grid-cols-2 lg:gap-16">
                <div className="lg:pb-16">
                  <div className="bg-gradient-to-r from-emerald-300 to-sky-400 inline-flex gap-2 font-bold uppercase tracking-widest text-sm text-transparent bg-clip-text">
                    <span>{project.company}</span>
                    <span>&bull;</span>
                    <span>{project.year}</span>
                  </div>
                  <h3 className="font-serif text-2xl mt-2 md:text-4xl md:mt-5">{project.title}</h3>
                  <hr className="border-t-2 border-white/5 mt-4 md:mt-5" />
                  <ul className="flex flex-col gap-4 mt-4">
                    {project.results.map((result) => (
                      <li className="flex gap-2 text-sm text-white/50 md:text-base" key={result.title}>
                        <CheckCircleIcon className="size-5 md:size-6" />
                        <span>{result.title}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col md:flex-row md:gap-4 mt-8">
                    <a href={project.link}>
                      <button className="bg-white text-gray-950 h-12 w-full rounded-xl font-semibold inline-flex items-center justify-center gap-2 md:w-auto px-6">
                        <span className="whitespace-nowrap">Demo Video</span>
                        <ArrowUpRighticon className="size-4" />
                      </button>
                    </a>
                    <a href={project.sourceCode} target="_blank" rel="noopener noreferrer">
                      <button className="bg-gray-950 text-white h-12 w-full rounded-xl font-semibold inline-flex items-center justify-center gap-2 md:w-auto px-6 mt-2 md:mt-0">
                        <span className="whitespace-nowrap">Documentation</span>
                        <GithubIcon className="size-5" />
                      </button>
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <Image
                    src={project.image}
                    alt={project.title}
                    className="mt-8 -mb-4 md:-mb-0 lg:mt-0 lg:absolute lg:h-full lg:w-auto lg:max-w-none"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
