import { About, Contact, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Logo, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Jamie",
  lastName: "Nisbet",
  name: `Jamie Nisbet`,
  role: "Full Stack Software Engineer",
  avatar: "/images/avatar.jpg",
  email: "contact@jamienisbet.com",
  location: "Europe/Lisbon", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English", "French", "Portuguese", "Italian", "Spanish"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}&rsquo;s Newsletter</>,
  description: <>My weekly newsletter about creativity and engineering</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/k0d0minio",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/jamienisbet/",
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: [
    <>Building AI-driven solutions that transform businesses</>,
    <>Full stack engineering with a focus on intelligent systems</>,
    <>Creating custom software solutions powered by AI</>,
    <>Transforming ideas into scalable, intelligent applications</>,
    <>Engineering solutions that leverage the power of AI</>,
    <>Building the future of software with AI at its core</>,
  ],
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Sustentus</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured work
        </Text>
      </Row>
    ),
    href: "/work/sustentus",
    },
    subline: [
      <>
        I&apos;m Jamie, a full stack software engineer specializing in AI-driven solutions. I consult,
        <br /> project manage, and build custom solutions that solve real-world problems.
      </>,
    <>
      Full stack engineer with expertise in AI and machine learning. I help businesses
      <br /> leverage technology to achieve their goals through custom-built solutions.
    </>,
    <>
      Specializing in AI-driven development, I create intelligent software solutions from
      <br /> concept to deployment. Available for consulting, project management, and custom builds.
    </>,
    <>
      Building intelligent systems that drive business value. I combine full stack engineering
      <br /> with AI expertise to deliver solutions that make a difference.
    </>,
    <>
      From consulting to custom development, I bring AI-powered solutions to life. Full stack
      <br /> engineering with a focus on intelligent, scalable systems.
    </>,
    <>
      Expert in AI-driven software solutions. I consult, manage projects, and build custom
      <br /> applications that transform how businesses operate.
    </>,
  ],
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "/contact",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Jamie is a full stack software engineer based in Lisbon, specializing in AI-driven solutions
        and custom software development. With expertise spanning the entire technology stack, Jamie
          helps businesses transform their ideas into scalable, intelligent applications. Whether it&apos;s
        consulting, project management, or building custom solutions, Jamie brings a comprehensive
        approach to software engineering.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "Sustentus",
        timeframe: "Recent",
        role: "Full Stack Software Engineer",
        achievements: [
          <>
            Developed and maintained full stack applications with a focus on AI-driven features and
            intelligent system integration.
          </>,
          <>
            Built scalable solutions using modern technologies including React, Next.js, TypeScript,
            and various AI/ML frameworks.
          </>,
        ],
        images: [],
      },
      {
        company: "Apoyar",
        timeframe: "Previous",
        role: "Full Stack Software Engineer",
        achievements: [
          <>
            Contributed to the development of custom software solutions, working across the entire
            technology stack from frontend to backend systems.
          </>,
          <>
            Collaborated with cross-functional teams to deliver high-quality applications that met
            business requirements and technical standards.
          </>,
        ],
        images: [],
      },
      {
        company: "Various Clients",
        timeframe: "Ongoing",
        role: "Consultant & Freelance Developer",
        achievements: [
          <>
            Provided consulting services and custom software development for multiple clients across
            various industries.
          </>,
          <>
            Managed projects from conception to deployment, ensuring timely delivery and high-quality
            outcomes.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "BeCode",
        description: <>Studied full stack web development and software engineering in Brussels.</>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical skills",
    skills: [
      {
        title: "Frontend Development",
        description: (
          <>Building modern, responsive user interfaces with React, Next.js, and TypeScript.</>
        ),
        tags: [
          {
            name: "React",
            icon: "react",
          },
          {
            name: "Next.js",
            icon: "nextjs",
          },
          {
            name: "TypeScript",
            icon: "typescript",
          },
        ],
        images: [],
      },
      {
        title: "Backend Development",
        description: (
          <>Developing robust server-side applications and APIs using Node.js, Python, and PHP.</>
        ),
        tags: [
          {
            name: "Node.js",
            icon: "nodejs",
          },
          {
            name: "Python",
            icon: "python",
          },
          {
            name: "PHP",
            icon: "php",
          },
        ],
        images: [],
      },
      {
        title: "DevOps & Infrastructure",
        description: (
          <>Managing deployment pipelines, containerization, and server administration with modern DevOps tools.</>
        ),
        tags: [
          {
            name: "Docker",
            icon: "docker",
          },
          {
            name: "Jenkins",
            icon: "jenkins",
          },
          {
            name: "GitLab",
            icon: "gitlab",
          },
          {
            name: "GitHub",
            icon: "github",
          },
        ],
        images: [],
      },
      {
        title: "Databases & Systems",
        description: (
          <>Working with various database systems and Linux server administration.</>
        ),
        tags: [
          {
            name: "MongoDB",
            icon: "mongodb",
          },
          {
            name: "Linux",
            icon: "linux",
          },
        ],
        images: [],
      },
    ],
  },
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `Design and dev projects by ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/work/projects
  // All projects will be listed on the /home and /work routes
};

const contact: Contact = {
  path: "/contact",
  label: "Contact",
  title: `Contact – ${person.name}`,
  description: `Get in touch with ${person.name}`,
};

export { person, social, newsletter, home, about, work, contact };
