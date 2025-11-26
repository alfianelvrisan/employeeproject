export const fetchDeliveryServices = async (id:number,idStore:number,idUser:number,userToken:string) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/DeliveryProduk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
            v_id_produk: id,
            v_lokasi: idStore,
            v_id_member: idUser,
        }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error fetching delivery services: ${errorText}`);
    }

    const json = await response.json();
    if (Array.isArray(json) && json.length > 0) {
      return json;
    } else {
      throw new Error('Delivery services data is empty or not found.');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch delivery services: ${error.message}`);
    } else {
      throw new Error('Failed to fetch delivery services: An unknown error occurred.');
    }
  }
}