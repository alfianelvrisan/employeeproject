export const fetchProducts = async (
  idStore: string,
  page: number,
  userToken: string,
  existingProductIds: Set<number>
) => {
  const res = await fetch(
    `https://api.laskarbuah.com/api/produk?v_where=''&v_page=0&v_row=0&id_store=${idStore}&v_token=${userToken}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const json = await res.json();

const uniqueProducts = json.filter(
    (newProduct: any) => !existingProductIds.has(newProduct.id)
  );

  return uniqueProducts;
};

export const fetchCategories = async (idStore: string) => {
  const res = await fetch(
    `https://api.laskarbuah.com/api/kategory?id_store=${idStore}`
  );
  const json = await res.json();
  return json;
};


export const sendLike = async (
  userToken: string,
  productId: number,
  idStore: number
) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/likeProduk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_token: userToken,
        v_id_produk: productId,
        v_store: idStore,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Response Error:", errorResponse);
      throw new Error("Failed to send like");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending like:", error);
    throw error;
  }
};
