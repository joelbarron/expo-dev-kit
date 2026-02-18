import { customAxios } from '../../http/client';

export class ConfigsService {
  static async retrieveMobileConfig() {
    const response = await customAxios.get('/core/configs/mobile/');
    return response.data;
  }
}
