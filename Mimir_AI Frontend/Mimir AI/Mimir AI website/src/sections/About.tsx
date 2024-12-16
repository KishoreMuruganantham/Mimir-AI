"use client";
import { Card } from "@/components/Card";
import { SectionHeader } from "@/components/SectionHeader";
import StarIcon from "@/assets/icons/star.svg";
import bookImage from "@/assets/images/book-cover.png";
import Image from "next/image";
import JavaScriptIcon from "@/assets/icons/square-js.svg";
import HTMLIcon from "@/assets/icons/html5.svg";
import CssIcon from "@/assets/icons/css3.svg";
import ReactIcon from "@/assets/icons/react.svg";
import ChromeIcon from "@/assets/icons/chrome.svg";
import GithubIcon from "@/assets/icons/github.svg";
import { TechIcon } from "@/components/TechIcon";
import mapImage from "@/assets/images/image.png";
import smileMemoji from "@/assets/images/memoji-smile.png"
import { CardHeader } from "@/components/CardHeader";
import { ToolboxItems } from "@/components/ToolboxItems";
import { motion } from 'framer-motion';
import { useRef } from "react";

const toolboxItems = [
  {
    title: 'JavaScript',
    iconType: JavaScriptIcon,
  },
  {
    title: 'HTML5',
    iconType: HTMLIcon,
  },
  {
    title: 'CSS',
    iconType: CssIcon,
  },
  {
    title: 'React',
    iconType: ReactIcon,
  },
  {
    title: 'Chrome',
    iconType: ChromeIcon,
  },
  {
    title: 'Github',
    iconType: GithubIcon,
  },
];

const hobbies = [
  {
    title: 'Painting',
    emoji: '🎨',
    left: '5%',
    top: '5%',
  },
  {
    title: 'Photography',
    emoji: '📷',
    left: '50%',
    top: '5%',
  },
  {
    title: 'Gaming',
    emoji: '🎮',
    left: '10%',
    top: '35%',
  },
  {
    title: 'Hiking',
    emoji: '🥾',
    left: '35%',
    top: '40%',
  },
  {
    title: 'Music',
    emoji: '🎵',
    left: '70%',
    top: '45%',
  },
  {
    title: 'Fitness',
    emoji: '🏋️',
    left: '5%',
    top: '65%',
  },
  {
    title: 'Reading',
    emoji: '📚',
    left: '45%',
    top: '70%',
  },
] 

export const AboutSection = () => {
  const constraintRef = useRef(null);
  return <section id="about"><div className="py-20 lg:py-28">
    <div className="container">
    <SectionHeader eyebrow="Project Development" title="A Glimpse Into Mimir AI" description="Great projects are built with the right tech stack — where the tools and code come together to bring ideas to life."/>
    <div className="mt-20 flex flex-col gap-8">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:grid-cols-3">
            {/* Personal Info Section */}
            <Card className="h-[400px] p-0 flex flex-col md:col-span-2 lg:col-span-1">
              <CardHeader title="Creators" description="Just a couple of Students with passion" className="px-6 py-6" />
              <div className="p-6">
                <h3 className="text-xl font-semibold">[Team Maverick]</h3>
                <p className="mt-4">
                "A skilled team combining expertise in Unreal Engine, NLP, backend development, and data visualization to deliver innovative and efficient solutions with creativity and precision."
                </p>
              </div>
          </Card>
          <Card className="h-[400px] p-0 flex flex-col md:col-span-3 lg:col-span-2">
  <CardHeader title="Methodology" description="Overall Architecture." className="px-6 py-6"/>
  <div className="px-6">
  <ul className="list-none pl-2 pr-6">
  <li className="flex pb-2">
    <span className="mr-2 mt-1 bg-gradient-to-r from-emerald-300 to-sky-400 text-center bg-clip-text text-transparent">🏆</span>
    <span>AI-Powered Lip Syncing: Used Rhubarb for realistic lip-syncing and natural facial movements.</span>
  </li>
  <li className="flex pb-2">
    <span className="mr-2 mt-1 bg-gradient-to-r from-emerald-300 to-sky-400 text-center bg-clip-text text-transparent">🏆</span>
    <span>RAG Backend: Integrated RAG for context-aware AI responses.</span>
  </li>
  <li className="flex pb-2">
    <span className="mr-2 mt-1 bg-gradient-to-r from-emerald-300 to-sky-400 text-center bg-clip-text text-transparent">🏆</span>
    <span>Custom Unreal Engine Blueprints: Developed blueprint nodes to optimize workflows.</span>
  </li>
  <li className="flex pb-2">
    <span className="mr-2 mt-1 bg-gradient-to-r from-emerald-300 to-sky-400 text-center bg-clip-text text-transparent">🏆</span>
    <span>Realistic Character Modeling: Applied AI for lifelike character creation and expressions.</span>
  </li>
  <li className="flex pb-2">
    <span className="mr-2 mt-1 bg-gradient-to-r from-emerald-300 to-sky-400 text-center bg-clip-text text-transparent">🏆</span>
    <span>Scalable AI Pipeline: Built a scalable pipeline for smooth multi-Character interactions.</span>
  </li>
</ul>

</div>
</Card>

      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-5 lg:grid-cols-3">
      <Card className="h-[320px] md:col-span-3 lg:col-span-2">
      <CardHeader title="TechStack" description="Explore the technologies and tools we used to craft Mimir AI." className=""/>
          <ToolboxItems items={toolboxItems} className="" itemsWrapperClassName="animate-move-left [animation-duration:30s]"/>
          <ToolboxItems items={toolboxItems} className="mt-6" itemsWrapperClassName="animate-move-right [animation-duration:15s]"/>
      </Card>
      <Card className="h-[320px] p-0 relative md:col-span-2 lg:col-span-1">
        <Image src={mapImage} alt="map" className="h-full w-full object-cover object-left-top"/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full after:content-[''] after:absolute after:inset-0 after:outline after:outline-2 after:-outline-offset-2 after:rounded-full after:outline-gray-950/30">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-300 to-sky-400 -z-20 animate-ping [animation-duration:2s]"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-300 to-sky-400 -z-10"></div>
          <Image src={smileMemoji} alt="smiling memoji" className="size-20"/>
        </div>
      </Card>
      </div>
    </div>
    </div>
  </div>
  </section>;
};
