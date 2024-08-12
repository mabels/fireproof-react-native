

import { CryptoRuntime, Logger } from '@adviser/cement';
import { ensureLogger } from 'use-fireproof';

export class ReactNativeCrypto implements CryptoRuntime {
  readonly logger: Logger
  constructor() {
    this.logger = ensureLogger({}, "ReactNativeCrypto")
  }

  async importKey(
    format: KeyFormat,
    keyData: JsonWebKey,
    algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>
  ): Promise<CryptoKey> {
    this.logger.Debug().Msg("importKey")
    const ckey = await crypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages)
    this.logger.Debug().Bool("ckey", ckey).Msg("importKey")
    return ckey
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decrypt(
    algo: {
      name: string;
      iv: Uint8Array;
      tagLength: number;
    },
    key: CryptoKey,
    data: Uint8Array
  ): Promise<ArrayBuffer> {
    this.logger.Debug().Msg("decrypt")
    return Promise.resolve(new ArrayBuffer(0));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  encrypt(
    algo: {
      name: string;
      iv: Uint8Array;
      tagLength: number;
    },
    key: CryptoKey,
    data: Uint8Array
  ): Promise<ArrayBuffer> {
    this.logger.Debug().Msg("encrypt")
    return Promise.resolve(new ArrayBuffer(0));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  digestSHA256(data: Uint8Array): Promise<ArrayBuffer> {
    this.logger.Debug().Msg("digestSHA256")
    return Promise.resolve(new ArrayBuffer(0));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  randomBytes(size: number): Uint8Array {
    this.logger.Debug().Msg("randomBytes")
    return new Uint8Array(size);
  }
}
