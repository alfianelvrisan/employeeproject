export const IncreDecre = async (
  id: number,
  option: number,
  userToken: string
) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/IncreDecre`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        v_id: id,
        v_option: option,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}