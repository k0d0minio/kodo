import { getPosts } from "@/utils/utils";
import { baseURL, work, person } from "@/resources";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = getPosts(["src", "app", "work", "projects"]);

  // Sort projects by date (newest first)
  const sortedProjects = projects.sort((a, b) => {
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
  });

  // Generate RSS XML
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${work.title}</title>
    <link>${baseURL}/work</link>
    <description>${work.description}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseURL}/api/rss" rel="self" type="application/rss+xml" />
    <managingEditor>${person.email || "noreply@example.com"} (${person.name})</managingEditor>
    <webMaster>${person.email || "noreply@example.com"} (${person.name})</webMaster>
    <image>
      <url>${baseURL}${person.avatar || "/images/avatar.jpg"}</url>
      <title>${work.title}</title>
      <link>${baseURL}/work</link>
    </image>
    ${sortedProjects
      .map(
        (project) => `
    <item>
      <title>${project.metadata.title}</title>
      <link>${baseURL}/work/${project.slug}</link>
      <guid>${baseURL}/work/${project.slug}</guid>
      <pubDate>${new Date(project.metadata.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${project.metadata.summary}]]></description>
      ${project.metadata.images && project.metadata.images[0] ? `<enclosure url="${baseURL}${project.metadata.images[0]}" type="image/jpeg" />` : ""}
      ${project.metadata.tag ? `<category>${project.metadata.tag}</category>` : ""}
      <author>${person.email || "noreply@example.com"} (${person.name})</author>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  // Return the RSS XML with the appropriate content type
  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
