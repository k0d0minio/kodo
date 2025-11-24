# Portfolio Features Documentation

This document consolidates all the features documented in the original blog posts. For detailed reference, see the individual blog post files in this directory.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Content Management](#content-management)
3. [Styling](#styling)
4. [Components](#components)
5. [Mailchimp Newsletter](#mailchimp-newsletter)
6. [Password Protection](#password-protection)
7. [Work/Projects](#workprojects)
8. [SEO](#seo)
9. [Page Management](#page-management)

## Quick Start

Magic Portfolio is a comprehensive, MDX-based, SEO-friendly, responsive portfolio template built with Once UI and Next.js.

### Setup

```bash
git clone https://github.com/once-ui-system/magic-portfolio.git
npm install
npm run dev
```

### License

Magic Portfolio is licensed under the [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). You can only use it for personal purposes, and you must attribute the original work.

## Content Management

### Avatar

Replace the `public/images/avatar.jpg` file with your own avatar image. It is used on the `/about` page as well as on the dynamically generated `open-graph` images.

### Favicon

Replace the `src/app/favicon.ico` file with your own favicon.

### Personal Details

Your personal details are used across the whole app to render personalized headings, labels and images. Languages are displayed on the `/about` page, and location and time in the header.

Configure in `src/resources/content.tsx`:

```tsx
const person = {
    firstName: "Jamie",
    lastName: "Nisbet",
    get name() {
      return "...";
    },
    role: "Full Stack Software Engineer",
    avatar: "/images/avatar.jpg",
    location: "Europe/Lisbon", // IANA time zone identifier
    languages: ["English", "French", "Portuguese", "Italian", "Spanish"], // optional
};
```

### Social Links

Social links are rendered on the `/about` page and in the footer based on the array configured in the `social` object. You can set custom icons to each, but don't forget to import them in `src/resources/icons.ts`.

```tsx
const social = [
    {
      name: "GitHub",
      icon: "github",
      link: "https://github.com/username",
    },
    {
      name: "Email",
      icon: "email",
      link: "mailto:email@example.com",
    },
];
```

### Page Content

Each page has its own object that manages the personalized content, such as headings, subheadings, images and dynamic data.

```tsx
const home = {
    label: "Home",
    title: "Portfolio Title",
    description: "Portfolio description",
    headline: <>Your headline</>,
    subline: <>Your subline</>,
};
```

The `label` property is used in the header navigation. The `title` property is used for the page title and the `description` property is used for the page description. They are also used in meta- and open graph tags.

## Styling

### Global Style

Magic Portfolio's styling is based on Once UI's customization through data-attributes. You can generate a custom color palette for brand, accent and neutral colors on [Once UI](https://once-ui.com/customize).

Configure in `src/resources/once-ui.config.ts`:

```tsx
theme:       'dark',         // dark | light
neutral:     'gray',         // sand | gray | slate
brand:       'blue',         // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
accent:      'indigo',       // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
solid:       'contrast',     // color | contrast
solidStyle:  'flat',         // flat | plastic
border:      'playful',      // rounded | playful | conservative
surface:     'translucent',  // filled | translucent
transition:  'all',          // all | micro | macro
scaling:     '100',          // 90 | 95 | 100 | 105 | 110
```

### Background Effects

There's a pre-configured background in `layout.tsx` that you can modify in the config file. Set graphic elements such as gradient, dots, lines, and grid and configure their appearance.

```tsx
const effects = {
    mask: {
      cursor: false,
      x: 50,
      y: 0,
      radius: 100
    },
    gradient: {
      display: true,
      x: 50,
      y: -25,
      width: 100,
      height: 100,
      tilt: 0,
      colorStart: 'accent-background-strong',
      colorEnd: 'static-transparent',
      opacity: 50
    },
    dots: {
      display: true,
      size: 2,
      color: 'brand-on-background-weak',
      opacity: 20
    },
    lines: {
      display: false,
      color: 'neutral-alpha-weak',
      opacity: 100
    },
    grid: {
      display: false,
      color: 'neutral-alpha-weak',
      opacity: 100,
      width: 'var(--static-space-32)',
      height: 'var(--static-space-32)'
    }
}
```

## Components

Magic Portfolio will replace some default HTML elements to Once UI components to integrate better in the design and add additional functionality. Many common Once UI components are already imported and available for use.

### Available Components

- **Feedback** - Display critical information to visitors
- **Table** - Display data in a structured format
- **CodeBlock** - Display code snippets with highlighting, preview, and copy to clipboard
- **InlineCode** - Inline code snippets
- **Accordion** - Toggle between hiding and showing content
- **Button** - Trigger actions or navigate to other pages
- **Card** - Group related content and actions
- **Icon** - Visually represent actions, objects, or concepts
- **Layout** - Column, Row, Grid, Flex components for structuring content
- **Media** - Optimized way to display images and embed YouTube videos
- **SmartLink** - Enhanced way to link to internal and external resources

### Custom Components

Since Magic Portfolio is based on Once UI, you can use all the components provided by Once UI in the `.mdx` files, but you need to import them first in the `src/components/mdx.tsx` file and pass it to the `components` object.

```tsx
const components = {
    // Add new components
    p: createParagraph as any,
    h1: createHeading("h1") as any,
    ...
    Media,
    SmartLink,
};
```

## Mailchimp Newsletter

### Setup

1. Sign up for a [Mailchimp account](https://mailchimp.com) and create a new list if you don't have one.
2. Create a new [embed form](https://mailchimp.com/help/add-a-signup-form-to-your-website/) and copy the form URL to your Magic Portfolio config.

### Configuration

Configure in `src/resources/once-ui.config.ts`:

```tsx
const mailchimp = {
    action: 'https://url/subscribe/post?parameters',
    effects: {
      // Background effects configuration
    }
};
```

### Newsletter Content

Modify the headline and description in `src/resources/content.tsx`:

```tsx
const newsletter = {
    display: true,
    title: <>Subscribe to {person.firstName}'s Newsletter</>,
    description: (
      <>
        Newsletter description text.
      </>
    ),
};
```

## Password Protection

### Add Protected Pages

To enable password protection for specific pages, add the page paths you want to protect to the `protectedRoutes` object in the `src/resources/once-ui.config.ts` file.

The `RouteGuard` component will automatically handle access control for these pages, requiring password authentication before allowing access.

```tsx
const protectedRoutes = {
  '/work/once-ui': true
};
```

### Set Password

The password can be set in the `.env.local` file for local development and as an [environment variable](https://vercel.com/docs/environment-variables) for production.

## Work/Projects

### Manage Projects

You can create, edit and delete projects by adding, modifying or removing `*.mdx` files in the `src/app/work/projects` directory.

### Project Frontmatter

The frontmatter is used to set the project's metadata: title, description, image, and tags. It's used in the project's page and in meta- and open graph tags.

```yaml
---
title: "Project Title"
publishedAt: "2025-03-17"
summary: "Project summary"
images:
  - "/images/projects/project-01/cover-02.jpg"
  - "/images/projects/project-01/image-03.jpg"
team:
  - name: "Team Member"
    role: "Role"
    avatar: "/images/avatar.jpg"
    linkedIn: "https://linkedin.com/..."
link: "https://project-url.com/"
---
```

### MDX Syntax

You can use MDX to write the content of your projects. It helps you write rich and dynamic content with minimal code. Some MDX elements will be automatically transformed to Once UI components to integrate better in the design and add additional functionality.

### Custom Components

You can use custom components in MDX files, but you need to import them first in the `src/components/mdx.tsx` file.

## SEO

### Meta Tags

Magic Portfolio automatically generates meta- and open graph tags for your pages based on the `content.tsx` file.

### Schema

Magic Portfolio automatically generates schema tags for your pages based on the `content.tsx` file.

### Open Graph Image

Social sharing images (open-graph and twitter) are automatically generated with `next/og`.

```tsx
export async function generateMetadata() {
  const title = home.title;
  const description = home.description;
  const ogImage = `https://api/og/generate?title=${encodeURIComponent(title)}`;
   ...
};
```

The above declaration generates the social image with the title of the page. You can use a static image by replacing the `ogImage` value with a path to an image in the `public` directory.

**Note:** Make sure you have updated the `content.tsx` file with your own information and the `baseURL` variable in the `once-ui.config.ts` file.

## Page Management

### Enable or Disable Pages

Magic Portfolio's `RouteGuard` component takes care of conditionally rendering pages based on the `routes` object in the `src/resources/once-ui.config.ts` file.

```tsx
const routes = {
    '/':        true,
    '/about':   true,
    '/work':    true,
    '/gallery': false,
};
```

The code above will ensure that the `/gallery` page is not accessible and is not displayed in the navigation.

### Add New Pages

When creating a new page, it needs to be added to the `routes` object in the `src/resources/once-ui.config.ts` file.

```tsx
const routes = {
    '/':        true,
    '/about':   true,
    '/work':    true,
    '/gallery': false,
    '/music': true,
};
```

The code above will ensure that the `/music` page is accessible. Users will be able to navigate to it after adding it to the navigation menu in the `src/components/Header.tsx` file.

## Reference Documentation

For detailed examples and code snippets, refer to the original blog post files in this directory:

- `quick-start.mdx` - Quick start guide
- `content.mdx` - Content management
- `styling.mdx` - Styling and theming
- `localization.mdx` - Localization (no longer supported)
- `components.mdx` - Component usage examples
- `mailchimp.mdx` - Newsletter setup
- `password.mdx` - Password protection
- `work.mdx` - Project management
- `seo.mdx` - SEO configuration
- `pages.mdx` - Page management
- `blog.mdx` - Blog management (deprecated)






