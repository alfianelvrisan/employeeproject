

export const fetchProdukDetail = async (idStore: number, idProduk: number,userToken:string) => {

  try {
    const response = await fetch(
      `https://api.laskarbuah.com/api/Produk/detail?id_store=${idStore}&id_produk=${idProduk}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error fetching produk detail: ${errorText}`);
    }

    const json = await response.json();
    const data = Array.isArray(json) ? json : json?.data || [];
    if (Array.isArray(data) && data.length > 0) {
      return data;
    } else {
      throw new Error("Produk detail data is empty or not found.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch produk detail: ${error.message}`);
    } else {
      throw new Error("Failed to fetch produk detail: An unknown error occurred.");
    }
  }
};
