export const cekOrderId = async (
  id: number,
  userToken: string,
) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/_CekOrderId`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_id_usr: id,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal mengambil order ID");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
    console.error("Error creating Midtrans transaction:", error);
  }
}
