export class Config {
    dataPath: string[];

    static fromJSON(json: ConfigJSON) {
        return Object.assign({}, json, {
            dataPath: Array.isArray(json.dataPath) ? json.dataPath : [ json.dataPath ],
        });
    }
}

export interface ConfigJSON {
    dataPath: string | string[];
}