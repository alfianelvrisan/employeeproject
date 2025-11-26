export const _cekStatusPayment = async (
  orderIds: string[],  // ganti jadi array string
  userToken: string,
) => {
  try {
    if (!orderIds || orderIds.length === 0) {
      // Kalau kosong, langsung return array kosong supaya gak error
      return [];
    }

    const response = await fetch(`https://api.laskarbuah.com/api/MidtransChecker/status-multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify( orderIds ),  // kirim object dengan key orderIds
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal membuat transaksi Midtrans");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    throw error;
  }
}


export const _cekStrukByproduk = async(
    id:number,
    userToken:string,
)=>{
    try {
        const response = await fetch(`https://api.laskarbuah.com/api/_trxStatusPayment`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${userToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {v_id_usr:id,}
            ),
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            throw new Error(errorResponse || "Gagal membuat transaksi Midtrans");
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
        console.error("Error creating Midtrans transaction:", error);
    }
}