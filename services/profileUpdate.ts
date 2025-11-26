export const updateProfile = async (
    v_provinsi: string,
    v_kabupaten: string,
    ktp:string,
    v_nama:string,
    v_ttl:string,
    v_gender: string,
    v_gol:string,
    v_alamat:string,
    v_desa:string,
    v_rt_rw:string,
    v_kecamatan:string,
    v_agama:string,
    v_status:string,
    v_pekerjaan:string,
    v_warga_negara:string,
    v_berlaku:string,
    v_id:string
) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/updateProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
            v_provinsi:v_provinsi,
            v_kabupaten:v_kabupaten,
            ktp:ktp,
            v_nama:v_nama,
            v_ttl:v_ttl,
            v_gender:v_gender,
            v_gol:v_gol,
            v_alamat:v_alamat,
            v_desa:v_desa,
            v_rt_rw:v_rt_rw,
            v_kecamatan:v_kecamatan,
            v_agama:v_agama,
            v_status:v_status,
            v_pekerjaan:v_pekerjaan,
            v_warga_negara:v_warga_negara,
            v_berlaku:v_berlaku,
            v_id:v_id
        }
      ),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}