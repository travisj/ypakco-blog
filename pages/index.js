import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";
import Link from "next/link";
import Date from "../components/date";

import { getAllPosts } from "../lib/notion";

export default function Home({ posts }) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>
          Dad: 👦🏼👦🏼👧🏼, 💍: @rljart, CTO: Jumprope, 🏃🏻‍♂️ and aspiring 🏊🏻‍♂🚴🏻‍♂️🏃🏻‍♂️.
        </p>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Blog</h2>
        <ul className={utilStyles.list}>
          {posts.map(({ Slug, PublishedAt, Name }) => (
            <li className={utilStyles.listItem} key={Slug}>
              <Link href="/posts/[id]" as={`/posts/${Slug}`}>
                <a>{Name}</a>
              </Link>
              <br />
              <small className={utilStyles.lightText}>
                <Date dateString={PublishedAt} />
              </small>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      posts: await getAllPosts(),
    },
    unstable_revalidate: 60,
  };
}
