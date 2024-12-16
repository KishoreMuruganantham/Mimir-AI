import hexawareLogo from "@/assets/images/Hexaware_logo (2).png";
import freshworkslogo from "@/assets/images/Freshworks.png";
import searchbloxlogo from "@/assets/images/searchblox.png";
import { SectionHeader } from "@/components/SectionHeader";
import Image from "next/image";
import { Card } from "@/components/Card";
import { Fragment } from "react";

const workExperience = [
  {
    name: "Mugundhan Y",
    company: "Hexaware Technologies",
    position: "Unreal Engine Developer Intern",
    duration: "July 2024 – September 2024",
    description:
      "Developed and integrated advanced features for the MetaHuman project, including lip-syncing using Rhubarb, RAG backend integration, and custom Unreal Engine blueprint node creation for seamless functionality.",
    avatar: hexawareLogo,
    width: "2.5rem",
    height: "2.5rem",
  },
  {
    name: "Kishore M",
    company: "Hexaware Technologies",
    position: "LLM Developer Intern",
    duration: "July 2024 – September 2024",
    description:
      "Worked on developing and integrating cutting-edge language model capabilities using fine-tuning techniques. Contributed to building RAG pipelines for improved conversational AI and assisted in implementing scalable NLP solutions for enterprise-level deployments.",
    avatar: hexawareLogo,
    width: "2.5rem",
    height: "2.5rem",
  },
  {
    name: "Mukundh A P",
    company: "Freshworks",
    position: "Data Analysis and Frontend Intern",
    duration: "July 2024 – August 2024",
    description:
      "Collaborated with the data team to create insightful dashboards using tools like Power BI and Tableau. Optimized frontend designs for seamless user experience and ensured data visualization accuracy to aid decision-making processes.",
    avatar: freshworkslogo,
    width: "2.5rem",
    height: "2.5rem",
  },
  {
    name: "Praveen Kumar R",
    company: "SearchBlox",
    position: "Backend and Database Intern",
    duration: "July 2024 – September 2024",
    description:
      "Engineered robust backend solutions by optimizing database performance and implementing efficient data storage mechanisms. Developed RESTful APIs and integrated backend services to streamline data retrieval and processing for enterprise search solutions.",
    avatar: searchbloxlogo,
    width: "2.5rem",
    height: "2.5rem",
  },
];

export const WorkExperienceSection = () => {
  return (
    <section id="about">
      <div className="py-16 lg:py-24">
        <div className="container">
          <SectionHeader
            eyebrow="About Us"
            title="Technical Experience"
            description="Here’s a glimpse of our work experience and contributions."
          />
          <div className="mt-12 lg:mt-24 flex overflow-x-clip py-4 -my-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div
              className="flex gap-8 pr-8 flex-none animate-move-left [animation-duration:30s] hover:[animation-play-state:paused]"
            >
              {[...new Array(2)].fill(0).map((_, index) => (
                <Fragment key={index}>
                  {workExperience.map((experience, i) => (
                    <Card
                      key={`${experience.name}-${experience.company}-${i}`}
                      className="p-6 max-w-xs md:p-8 md:max-w-md hover:-rotate-3 transition duration-300"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="size-14 bg-gray-700 inline-flex items-center justify-center rounded-full flex-shrink-0">
                          <Image
                            src={experience.avatar}
                            alt={experience.name}
                            className="max-h-full"
                            style={{
                              width: `${experience.width}`,
                              height: `${experience.height}`,
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold">{experience.name}</div>
                          <div className="font-semibold">
                            {experience.position}
                          </div>
                          <div className="text-sm text-white/40">
                            {experience.company}
                          </div>
                          <div className="text-xs text-white/30">
                            {experience.duration}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 md:mt-6 text-sm md:text-base">
                        {experience.description}
                      </p>
                    </Card>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
