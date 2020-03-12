export class MapLayerConfig {
    url: string;
}

export class MapLayerConfigJSON {
    url: string;
}

export class Config {
    dataPath: string[];
    mapLayers: MapLayerConfig[];

    static fromJSON(json: ConfigJSON) {
        return Object.assign({}, json, {
            dataPath: Array.isArray(json.dataPath) ? json.dataPath : [ json.dataPath ],
        });
    }
}

export interface ConfigJSON {
    dataPath: string | string[];
    mapLayers: MapLayerConfigJSON[];
}