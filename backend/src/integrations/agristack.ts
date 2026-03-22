// AgriStack / Bhuvan Integration Stub
export class AgriStackService {
  async linkFarmerID(mobile: string, state: string) {
    console.log('[agristack]: Stub - linking farmer ID');
    return { farmerRegistryId: `AGRI-${state}-${Date.now()}`, linked: true, source: 'MOCK' };
  }

  async getBasemapTiles(lat: number, lon: number, zoom: number) {
    return { tileUrl: `https://bhuvan.nrsc.gov.in/tiles/${zoom}/${lat}/${lon}.png`, source: 'BHUVAN_MOCK' };
  }
}

export const agriStackService = new AgriStackService();
