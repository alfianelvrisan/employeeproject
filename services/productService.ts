const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;
const productCache = new Map<string, { data: any[]; ts: number }>();

export const fetchProducts = async (
  idStore: string,
  page: number,
  userToken: string,
  existingProductIds: Set<number>,
  row: number = 20,
  useCache: boolean = true,
  vWhere: string = ""
) => {
  const cacheKey = `${idStore}:${page}:${row}:${vWhere}`;
  const cached = productCache.get(cacheKey);
  if (useCache && cached && Date.now() - cached.ts < PRODUCT_CACHE_TTL_MS) {
    const uniqueProducts = cached.data.filter(
      (newProduct: any) => !existingProductIds.has(newProduct.id)
    );
    return uniqueProducts;
  }

  const res = await fetch(
    `https://api.laskarbuah.com/api/Produk?v_where=${encodeURIComponent(
      vWhere
    )}&v_page=${page}&v_row=${row}&id_store=${idStore}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const json = await res.json();
  const data = Array.isArray(json) ? json : json?.data || [];
  productCache.set(cacheKey, { data, ts: Date.now() });

  const uniqueProducts = data.filter(
    (newProduct: any) => !existingProductIds.has(newProduct.id)
  );

  return uniqueProducts;
};

export const fetchCategories = async (idStore: string, userToken?: string) => {
  const res = await fetch(
    `https://api.laskarbuah.com/api/Master/kategory?id_store=${idStore}`,
    {
      method: "GET",
      headers: userToken
        ? {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          }
        : undefined,
    }
  );
  const text = await res.text();
  if (!text) return [];
  const json = JSON.parse(text);
  const dataRoot = json?.data ?? json;
  const data =
    Array.isArray(dataRoot?.Table) ? dataRoot.Table : Array.isArray(dataRoot) ? dataRoot : [];
  return data;
};


export const sendLike = async (
  userToken: string,
  productId: number,
  idStore: number
) => {
  try {
    if (!Number.isFinite(productId) || !Number.isFinite(idStore)) {
      throw new Error("Parameter tidak valid.");
    }
    const response = await fetch(`https://api.laskarbuah.com/api/Master/like-produk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_id_produk: Number(productId),
        v_store: Number(idStore),
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Response Error:", errorResponse);
      throw new Error(
        `Failed to send like (status ${response.status}): ${errorResponse || "empty response"}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending like:", error);
    throw error;
  }
};
