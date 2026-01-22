import type { RouterData, ListContext, Options, RouterResType } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";

const typeMap: Record<string, string> = {
  realtime: "热搜",
  novel: "小说",
  movie: "电影",
  teleplay: "电视剧",
  car: "汽车",
  game: "游戏",
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = c.req.query("type") || "realtime";
  const listData = await getList({ type }, noCache);
  const routeData: RouterData = {
    name: "baidu",
    title: "百度",
    type: typeMap[type],
    params: {
      type: {
        name: "热搜类别",
        type: typeMap,
      },
    },
    link: "https://top.baidu.com/board",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (options: Options, noCache: boolean): Promise<RouterResType> => {
  const { type } = options;
  const url = `https://top.baidu.com/board?tab=${type}`;
  
  const result = await get({
    url,
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/605.1.15",
    },
  });
  
  // 正则查找 - 匹配从 <!--s-data: 到 --> 之间的完整JSON
  const pattern = /<!--s-data:([\s\S]*?)-->/;
  const matchResult = result.data.match(pattern);
  
  if (!matchResult || !matchResult[1]) {
    throw new Error("Failed to extract JSON data from HTML");
  }
  
  let parsedData;
  try {
    parsedData = JSON.parse(matchResult[1]);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  
  // 检查数据结构 - 根据实际数据，cards可能在顶层，也可能在data.cards中
  let cards;
  if (parsedData.cards && Array.isArray(parsedData.cards)) {
    // 数据结构：{"cards":[...]}
    cards = parsedData.cards;
  } else if (parsedData.data && parsedData.data.cards && Array.isArray(parsedData.data.cards)) {
    // 数据结构：{"data":{"cards":[...]}}
    cards = parsedData.data.cards;
  } else {
    throw new Error("Invalid data structure: cards not found in parsed data");
  }
  
  // 查找包含content的card（不同类型可能有不同的component）
  const cardWithContent = cards.find((card: any) => card.content && Array.isArray(card.content));
  
  if (!cardWithContent) {
    throw new Error("Failed to find card with content array");
  }
  
  // 检查 content 数组的第一个项目是否包含嵌套的 content
  let jsonObject = cardWithContent.content;
  
  if (jsonObject.length > 0 && jsonObject[0] && jsonObject[0].content && Array.isArray(jsonObject[0].content)) {
    // 如果第一个项目包含 content 数组，说明数据结构是嵌套的
    jsonObject = jsonObject[0].content;
  }
  
  const mappedData = jsonObject.map((v: any) => {
    // 处理不同的数据结构：某些类型（如 tabTextList）可能没有 query 字段，使用 word 代替
    const searchKeyword = v.query || v.word || "";
    return {
      id: v.index ?? 0,
      title: v.word || "",
      desc: v.desc || "",
      cover: v.img || "",
      author: Array.isArray(v.show) && v.show.length ? v.show.join(" | ") : "",
      timestamp: 0,
      hot: Number(v.hotScore || 0),
      url: searchKeyword ? `https://www.baidu.com/s?wd=${encodeURIComponent(searchKeyword)}` : (v.url || ""),
      mobileUrl: v.rawUrl || v.url || "",
    };
  });
  
  return {
    ...result,
    data: mappedData,
  };
};
