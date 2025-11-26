export const listTrxDetail = async (id: number, userToken: string) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/trxMemDetail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ v_id: id }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
}