export const ListTrxMember = async (
    idUser:number,
    userToken: string
  ) => {
    try {
      const response = await fetch(`https://api.laskarbuah.com/api/ListTrxMember`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            v_id_member: idUser,
        }),
      });
  
      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(errorResponse || "Gagal mengambil transaksi");
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  };

  export const deleteTrxMember = async (
    id:number,
    userToken: string
  )=>{
    const response = await fetch(`https://api.laskarbuah.com/api/DeleteItemTrx`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_id: id,
      }),
    });
    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal menghapus transaksi");
    }
    const result = await response.json();
    return result;
  }


  export const deleteTrxexp = async(
    id:number,
    userToken: string)=>{
    const response = await fetch(`https://api.laskarbuah.com/api/_deleteTrx`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_id: id,
      }),
    });
    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal menghapus transaksi exp");
    }
    const result = await response.json();
    return result;
  }
