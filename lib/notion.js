import Fetch from "@zeit/fetch";

const API_ENDPOINT = "https://www.notion.so/api/v3";
const fetch = Fetch();

export default async function rpc(fnName, body) {
  const res = await fetch(`${API_ENDPOINT}/${fnName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    return res.json();
  } else {
    throw new Error(await getError(res));
  }
}

function getJSONHeaders(res) {
  return JSON.stringify(res.headers.raw());
}

function getBodyOrNull(res) {
  try {
    return res.text();
  } catch (err) {
    return null;
  }
}

export function getCollectionSchemaNameIndex(collectionSchema) {
  const names = {};
  for (const id in collectionSchema) {
    const nameKey = collectionSchema[id].name;
    if (nameKey in names) {
      console.warn(
        `duplicate key "${nameKey}" in schema index – make sure column names are unique`
      );
    }
    names[nameKey] = id;
  }
  return names;
}

async function getError(res) {
  return `Notion API error (${res.status}) \n${getJSONHeaders(
    res
  )}\n ${await getBodyOrNull(res)}`;
}

export function loadPageChunk(body) {
  return rpc("loadPageChunk", body);
}

export function queryCollection(body) {
  return rpc("queryCollection", body);
}

function toPlainText(val) {
  return val[0]
    .map((v) => {
      if (typeof v === "string") {
        return v;
      } else if (Array.isArray(v)) {
        // if it's bold or something else
        return v[1];
      }
    })
    .join(" ")
    .trim();
}

function getDate(val) {
  return (
    (!!val &&
      !!val[0] &&
      !!val[0][1] &&
      !!val[0][1][0] &&
      !!val[0][1][0][1] &&
      val[0][1][0][1]["start_date"]) ||
    null
  );
}

export async function getAllPosts() {
  const {
    recordMap: { collection, collection_view },
  } = await loadPageChunk({
    pageId: "a43ce7da-2b5b-4c32-9ab4-b70209855e2d",
    chunkNumber: 0,
    limit: 50,
    verticalColumns: false,
    cursor: {
      stack: [
        [
          {
            table: "block",
            id: "a43ce7da-2b5b-4c32-9ab4-b70209855e2d",
            index: 0,
          },
        ],
      ],
    },
  });

  const [collectionId] = Object.keys(collection);
  const [collectionViewId] = Object.keys(collection_view);
  const collectionSchema = getCollectionSchemaNameIndex(
    collection[collectionId].value.schema
  );

  const col = await queryCollection({
    collectionId,
    collectionViewId,
    query: {
      sort: [
        { property: collectionSchema.PublishedAt, direction: "descending" },
      ],
      aggregations: [{ property: "title", aggregator: "count" }],
    },
    loader: {
      type: "table",
      limit: 1000,
      searchQuery: "",
      userTimeZone: "America/New_York",
      userLocale: "en",
      loadContentCover: true,
    },
  });

  console.log("wut", col.recordMap.block);

  return (
    col.result.blockIds
      .map((blockId) => {
        console.log("blockId", blockId);
        const blockData = col.recordMap.block[blockId];

        if (blockData) {
          const props = blockData.value.properties;

          if (!props) {
            // not sure when this happens yet, but it seems
            // to be limited to only one row
            // console.info('missing props for block', blockId);
            return null;
          }

          // the props are named with unique ids, but
          // we want to return them with easily addressable
          // column names
          const indexedData = {};
          for (const key in collectionSchema) {
            indexedData[key] = props[collectionSchema[key]];
          }
          const possibleBlogPostNode = blockData.value.content;
          if (!!possibleBlogPostNode && !!possibleBlogPostNode[0]) {
            console.log("possible block found", possibleBlogPostNode[0]);
            const contentBlock = col.recordMap.block[possibleBlogPostNode[0]];
            console.log({ contentBlock });
            if (!!contentBlock) {
              console.log("content block found");
              const contentProps = contentBlock.value.properties;
              if (!!contentProps.title && !!contentProps.title[0]) {
                console.log("title found");
                indexedData.contentHtml = contentProps.title[0];
              }
            }
          }
          return indexedData;
        } else {
          console.warn(`missing block data for "${blockId}"`);
          return null;
        }
      })
      // sanitize notion data
      .map((post) => {
        if (!post || !post.Slug || !post.PublishedAt || !post.Published)
          return null;

        post.Slug = toPlainText(post.Slug);
        post.PublishedAt = getDate(post.PublishedAt);
        post.Name = toPlainText(post.Name);
        post.Published =
          !!post.Published && toPlainText(post.Published) === "Yes";
        console.log({ post });
        return post;
      })
      .filter((v) => v != null)
  );
}
