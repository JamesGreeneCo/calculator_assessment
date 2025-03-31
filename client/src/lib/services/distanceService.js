export async function calculateDistance(address1, address2) {
  try {
    const response = await fetch(
      `/distance?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate distance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
}

export async function getHistory(limit = 10) {
  try {
    const response = await fetch(`/history?limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}
