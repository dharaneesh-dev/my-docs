import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { enabledChapters, enabledLessons } from "@/content/registry";

const BASE_URL = "https://docs.dharaneesh.in";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const docPaths = enabledChapters().flatMap((chapter) =>
          enabledLessons(chapter).map((lesson) => `/notes/u/${chapter.id}/${lesson.slug}`),
        );
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          ...docPaths.map((p) => ({ path: p, changefreq: "weekly", priority: "0.8" })),
        ];
        const urls = entries
          .map(
            (e) =>
              `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
