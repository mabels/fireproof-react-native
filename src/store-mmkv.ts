import { ResolveOnce } from '@adviser/cement';
import { MMKV } from 'react-native-mmkv';
import {
  bs,
  ensureLogger,
  exception2Result,
  exceptionWrapper,
  getKey,
  Logger,
  NotFoundError,
  Result, rt,
  URI
} from 'use-fireproof';

import { MMKVDB_VERSION } from './store-mmkv-version';

class MMKVKeyBagProvider implements rt.kb.KeyBagProvider {
  readonly _mmkv = new ResolveOnce<MMKV>();
  readonly logger: Logger;
  constructor(readonly url: URI, logger: Logger) {
    this.logger = ensureLogger(logger, "MMKVKeyBagProvider");
  }

  async mmkv() {
    this.logger.Debug().Msg("getting mmkv");
    return this._mmkv.once(() => {
      this.logger.Debug().Msg("making mmkv");
      const mmkv = new MMKV({
        id: this.url.pathname || "keybag",
      });
      const keys = mmkv.getAllKeys()
      this.logger.Debug().Any("keys", keys.map(i => ({
        key: i,
        val: JSON.parse(mmkv.getString(i)??"")
      }))).Msg("getAllKeys");
      return mmkv
    })
  }
  get(id: string): Promise<rt.kb.KeyItem | undefined> {
    // this.logger.Debug().Str("id", id).Msg("get");
    return this.mmkv().then((mmkv) => {
      // this.logger.Debug().Str("id", id).Msg("get-mmkv-pre");
      const jsStr = mmkv.getString(id);
      this.logger.Debug().Str("id", id).Any("got", jsStr).Msg("get");
      if (!jsStr) {
        return undefined;
      }
      return JSON.parse(jsStr);
    })
  }
  set(id: string, item: rt.kb.KeyItem): Promise<void> {
    // this.logger.Debug().Str("id", id).Any("keyItem", item).Msg("set");
    return this.mmkv().then((mmkv) => {
      const jsStr = JSON.stringify(item);
      // this.logger.Debug().Str("id", id).Any("keyItem", item).Msg("set-mmkv-pre");
      mmkv.set(id, jsStr);
      this.logger.Debug().Str("id", id).Any("set", jsStr).Msg("set");
    })
  }

}

export function registerMMKVStore() {
  console.log("registerMMKVStore");
  rt.kb.registerKeyBagProviderFactory({
    protocol: "mmkv",
    override: true,
    factory: async (_: URI, logger: Logger) => {
      ensureLogger(logger, "MMKVKeyBagProviderFactory").Debug().Msg("making");
      return new MMKVKeyBagProvider(_, logger);
    }
  })
  bs.registerStoreProtocol({
    protocol: 'mmkv',
    overrideBaseURL: "mmkv://fireproof",
    gateway: async (logger: Logger) => {
      return new MMKVGateway(logger);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test: async (_: Logger) => {
      return {} as unknown as bs.TestGateway;
    },
  })
}

export function getMMKVDBName(url: URI): string {
  const out: string[] = [ url.getParam("name")! ]
  const idx = url.getParam("index")
  if (idx) {
    out.push(idx)
  }
  out.push(url.getParam("store")!)
  return out.join("-")
}

export class MMKVGateway implements bs.Gateway {
  store?: MMKV;

  readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = ensureLogger(logger, "MMKVGateway")
  }

  async buildUrl(baseUrl: URI, key: string): Promise<Result<URI>> {
    return Result.Ok(baseUrl.build().setParam("key", key).URI());
  }

  async start(baseUrl: URI): Promise<Result<URI>> {
    return exception2Result(async () => {
      if (!this.store) {
        const dbName = getMMKVDBName(baseUrl)
        this.store = new MMKV({
          id: dbName
        });
        this.logger.Debug().Str("dbName", dbName).Url(baseUrl).Msg("starting");
      }
      return baseUrl.build().setParam("version", MMKVDB_VERSION).URI();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async close(_: URI): Promise<bs.VoidResult> {
    return Result.Ok(undefined);
  }

  async destroy(baseUrl: URI): Promise<bs.VoidResult> {
    this.store?.clearAll();
    this.logger.Debug().Url(baseUrl).Msg("destroying");
    return Result.Ok(undefined);
  }

  put(url: URI, body: Uint8Array): Promise<bs.VoidResult> {
    return exception2Result(async () => {
      const cid = getKey(url, this.logger);
      this.logger.Debug().Url(url).Str("cid", cid).Msg("getting");
      this.store?.set(cid, body);
      return Result.Ok(undefined);
    });
  }

  get(url: URI): Promise<Result<Uint8Array, Error | NotFoundError>> {
    return exceptionWrapper(async () => {
      const cid = getKey(url, this.logger);
      this.logger.Debug().Url(url).Str("cid", cid).Msg("putting");
      const bytes = this.store?.getBuffer(cid);
      if (!bytes) {
        return Result.Err(new NotFoundError(`missing db block ${cid}`));
      }
      return Result.Ok(bytes);
    });
  }

  delete(url: URI): Promise<bs.VoidResult> {
    return exception2Result(async () => {
      const cid = getKey(url, this.logger);
      this.logger.Debug().Url(url).Str("cid", cid).Msg("deleting");
      this.store?.delete(cid);
      return Result.Ok(undefined);
    });
  }

}

// export class MMKVDataGateway extends MMKVGateway {
//   constructor(logger: Logger) {
//     super(ensureLogger(logger, "MMKVDataStore"));
//   }

//   async buildUrl(baseUrl: URL, key: string): Promise<Result<URL>> {
//     const url = new URL(baseUrl.toString());
//     url.searchParams.set("key", key);
//     return Result.Ok(url);
//   }
// }

// export class MMKVMetaGateway extends MMKVGateway {
//   constructor(logger: Logger) {
//     super(ensureLogger(logger, "MMKVMetaStore"));
//   }

//   async buildUrl(baseUrl: URL, key: string): Promise<Result<URL>> {
//     const url = new URL(baseUrl.toString());
//     url.searchParams.set("key", key);
//     return Result.Ok(url);
//   }
// }

// export class MMKVWalGateway extends MMKVGateway {
//   readonly branches = new Set<string>();

//   constructor(logger: Logger) {
//     super(ensureLogger(logger, "MMKVRemoteWAL"));
//   }

//   async buildUrl(baseUrl: URL, key: string): Promise<Result<URL>> {
//     const url = new URL(baseUrl.toString());
//     this.branches.add(key);
//     url.searchParams.set("key", key);
//     return Result.Ok(url);
//   }
// }
