import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/posts'
import { getAllWork } from '@/lib/work'
import { getAllStories } from '@/lib/stories'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const work = getAllWork()
  const stories = getAllStories()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/work`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const workRoutes: MetadataRoute.Sitemap = work.map((project) => ({
    url: `${SITE_URL}/work/${project.slug}`,
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  // The Brooks Range story also serves as the homepage — skip its /stories
  // URL here since the homepage entry above already covers it (avoids
  // listing duplicate-content URLs in the sitemap).
  const storyRoutes: MetadataRoute.Sitemap = stories
    .filter((story) => story.slug !== 'brooks-range')
    .map((story) => ({
      url: `${SITE_URL}/stories/${story.slug}`,
      lastModified: story.date,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...postRoutes, ...workRoutes, ...storyRoutes]
}
