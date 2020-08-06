import Layout from "../../components/layout";
import Head from "next/head";
import { getAllPostIds, getPostData } from "../../lib/posts";
import Date from "../../components/date";
import utilStyles from "../../styles/utils.module.css";

import { getAllPosts } from "../../lib/notion";

export default function Post({ post }) {
  return (
    <Layout>
      <Head>
        <title>{post.Name}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{post.Name}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={post.PublishedAt} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </article>
    </Layout>
  );
}

export async function getStaticPaths() {
  //   const paths = getAllPostIds();
  return {
    paths: [{ params: { id: "howdy-gangstas" } }],
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const posts = await getAllPosts();
  const post = posts.find((post) => params.id === post.Slug);
  return {
    props: {
      post,
    },
    unstable_revalidate: 60,
  };
}
