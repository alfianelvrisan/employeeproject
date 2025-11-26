export const fetchPotMember = async (id:number,v_amount:string,v_id_usr:number,v_proses:number,userToken: string) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/potMember`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
            v_heder_id: id,
            v_amount: v_amount,
            v_aplikasi_id:4,
            v_id_usr: v_id_usr,
            v_proses: v_proses,
        }),
    });

    if (!response.ok) {
      const errorText = await response.text();
    }

    const json = await response.json();
    console.log(json)
    if (Array.isArray(json) && json.length > 0) {
      return json[0];
    } else {
    }
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
  }
}