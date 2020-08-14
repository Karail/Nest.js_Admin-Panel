import * as config from 'config';

class Config {

    get(path: 'admins'): { userId: number }[];
    get(path: 'currency.default'): string;
    get(path: 'currency.enabled'): string[];

    get<T>(path: string): T;
    get<T=any>(path: string) {
        return config.get<T>(path);
    }

}

export default new Config;