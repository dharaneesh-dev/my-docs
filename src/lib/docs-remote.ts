import { queryOptions } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* GitHub source — edit these to point at a different repo / branch.   */
/* ------------------------------------------------------------------ */
export const DOCS_REPO = {
  owner: "Dharaneesh0745",
  repo: "docs",
  branch: "master",
  basePath: "", // folder inside the repo that contains config.json ("" = repo root)
};

const rawUrl = (path: string) => {
  const base = DOCS_REPO.basePath ? `${DOCS_REPO.basePath}/` : "";
  return `https://raw.githubusercontent.com/${DOCS_REPO.owner}/${DOCS_REPO.repo}/${DOCS_REPO.branch}/${base}${path}`;
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Raw node shape inside each folder's doc.json */
type RawNode =
  | {
      kind: "doc";
      slug: string;
      title?: string;
      file: string;
      icon?: string;
      description?: string;
    }
  | {
      kind: "section";
      label: string;
      icon?: string;
      defaultOpen?: boolean;
      children: RawNode[];
    };

type DocJson = {
  label?: string;
  icon?: string;
  defaultOpen?: boolean;
  children: RawNode[];
};

type RootConfig = {
  site?: { title?: string; description?: string };
  docs: Array<{
    id: string;
    folder: string;
    label: string;
    icon?: string;
    description?: string;
    defaultOpen?: boolean;
  }>;
};

/** Resolved node used by the sidebar (doc nodes carry their folder). */
export type DocNode =
  | {
      kind: "doc";
      slug: string;
      folder: string;
      title: string;
      file: string;
      icon?: string;
      description?: string;
    }
  | {
      kind: "section";
      label: string;
      icon?: string;
      defaultOpen?: boolean;
      children: DocNode[];
    };

/** Flat list — used by search + home cards. */
export type FlatDoc = {
  key: string; // `${folder}/${slug}` — unique
  folder: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  file: string;
};

/** Config-level doc entry — used by the home page cards. */
export type ConfigDoc = {
  id: string;
  folder: string;
  label: string;
  icon: string;
  description?: string;
  defaultOpen?: boolean;
  /** slug of the first child doc — used for the card link */
  firstSlug: string;
};

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

async function fetchJson<T>(path: string): Promise<T> {
  const r = await fetch(rawUrl(path), { cache: "no-cache" });
  if (!r.ok) throw new Error(`Failed to load ${path} (${r.status})`);
  return r.json() as Promise<T>;
}

function attach(
  nodes: RawNode[],
  folder: string,
  category: string,
  flat: FlatDoc[],
): DocNode[] {
  return nodes.map((n) => {
    if (n.kind === "section") {
      return {
        kind: "section",
        label: n.label,
        icon: n.icon,
        defaultOpen: n.defaultOpen,
        children: attach(n.children, folder, category, flat),
      };
    }
    const title = n.title ?? n.slug;
    flat.push({
      key: `${folder}/${n.slug}`,
      folder,
      slug: n.slug,
      title,
      description: n.description ?? "",
      category,
      icon: n.icon ?? "FileText",
      file: n.file,
    });
    return {
      kind: "doc",
      slug: n.slug,
      folder,
      title,
      file: n.file,
      icon: n.icon,
      description: n.description,
    };
  });
}

export async function fetchManifest(): Promise<{
  config: RootConfig;
  tree: DocNode[];
  flat: FlatDoc[];
  configDocs: ConfigDoc[];
}> {
  const config = await fetchJson<RootConfig>("config.json");
  const flat: FlatDoc[] = [];
  const tree: DocNode[] = new Array(config.docs.length);
  const configDocs: ConfigDoc[] = [];
  
  await Promise.all(
    config.docs.map(async (entry, i) => {
      try {
        const dj = await fetchJson<DocJson>(`${entry.folder}/doc.json`);
        tree[i] = {
          kind: "section",
          label: dj.label ?? entry.label,
          icon: dj.icon ?? entry.icon,
          defaultOpen: dj.defaultOpen ?? entry.defaultOpen,
          children: attach(dj.children, entry.folder, entry.label, flat),
        };
        // Find the first doc-kind child for the redirect slug
        const firstChild = findFirstDoc(dj.children);
        configDocs.push({
          id: entry.id,
          folder: entry.folder,
          label: entry.label,
          icon: entry.icon ?? "FileText",
          description: entry.description,
          defaultOpen: entry.defaultOpen,
          firstSlug: firstChild?.slug ?? "",
        });
      } catch (err) {
        tree[i] = {
          kind: "section",
          label: `${entry.label} (failed)`,
          children: [],
        };
        console.error(err);
      }
    }),
  );
  
  return { config, tree, flat, configDocs };
}

/** Recursively find the first doc-kind node in a RawNode tree. */
function findFirstDoc(nodes: RawNode[]): (RawNode & { kind: "doc" }) | undefined {
  for (const n of nodes) {
    if (n.kind === "doc") return n;
    if (n.kind === "section") {
      const found = findFirstDoc(n.children);
      if (found) return found;
    }
  }
  return undefined;
}

export async function fetchMarkdown(folder: string, file: string): Promise<string> {
  const r = await fetch(rawUrl(`${folder}/${file}`), { cache: "no-cache" });
  if (!r.ok) throw new Error(`Failed to load ${folder}/${file} (${r.status})`);
  let md = await r.text();
  // Rewrite relative image paths to absolute raw URLs so images in /docs/<folder>/images/foo.png work.
  const fileDir = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
  const base = rawUrl(`${folder}/${fileDir}`);
  md = md.replace(
    /!\[([^\]]*)\]\((?!https?:|\/|data:)([^)\s]+)(\s+"[^"]*")?\)/g,
    (_m, alt, p, title = "") => `![${alt}](${base}${p}${title})`,
  );
  return md;
}

/* ------------------------------------------------------------------ */
/* React Query options                                                 */
/* ------------------------------------------------------------------ */

export const manifestQueryOptions = queryOptions({
  queryKey: ["docs-manifest"],
  queryFn: fetchManifest,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

export const docQueryOptions = (folder: string, file: string) =>
  queryOptions({
    queryKey: ["doc", folder, file],
    queryFn: () => fetchMarkdown(folder, file),
    staleTime: 5 * 60 * 1000,
  });

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function findDoc(flat: FlatDoc[], folder: string, slug: string): FlatDoc | undefined {
  return flat.find((d) => d.folder === folder && d.slug === slug);
}
