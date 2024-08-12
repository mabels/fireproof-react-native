import {
  type ConfigOpts,
  type Database,
  ensureLogger,
  FireproofCtx,
  useDocument,
  useFireproof as useFireproofReact,
  useLiveQuery,
} from 'use-fireproof';

// import { ReactNativeCrypto } from "./rn-crypto"
import { registerMMKVStore } from './store-mmkv';

ensureLogger({}, "jojo").SetDebug( "useFireproof", "Index");
registerMMKVStore();

// const rnCrypto = new ReactNativeCrypto()

// override with a new 'useFireproof' for React Native
const useFireproof = (name?: string | Database | undefined, config?: ConfigOpts | undefined) => {
  return useFireproofReact(name, {
    ...config,
    crypto: config?.crypto, // || rnCrypto,
    store: {
      ...config?.store,
      stores: {
        ...config?.store?.stores,
      },
    },
  });
};

// TODO: do 'fireproof' in addition to 'useFireproof'?

export { FireproofCtx, useDocument, useFireproof, useLiveQuery };
