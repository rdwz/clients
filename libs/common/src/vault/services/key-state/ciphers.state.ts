import { Jsonify } from "type-fest";

import {
  CIPHERS_DISK,
  CIPHERS_DISK_LOCAL,
  CIPHER_SERVICE_MEMORY,
  DeriveDefinition,
  KeyDefinition,
} from "../../../platform/state";
import { CipherId } from "../../../types/guid";
import { CipherService } from "../../abstractions/cipher.service";
import { CipherData } from "../../models/data/cipher.data";
import { LocalData } from "../../models/data/local.data";
import { Cipher } from "../../models/domain/cipher";
import { CipherView } from "../../models/view/cipher.view";
import { AddEditCipherInfo } from "../../types/add-edit-cipher-info";

export const ENCRYPTED_CIPHERS = KeyDefinition.record<CipherData>(CIPHERS_DISK, "ciphers", {
  deserializer: (obj: Jsonify<CipherData>) => CipherData.fromJSON(obj),
});

export const DECRYPTED_CIPHERS = DeriveDefinition.from<
  Record<string, CipherData>,
  CipherView[],
  { cipherService: CipherService }
>(ENCRYPTED_CIPHERS, {
  deserializer: (obj) => obj.map((c) => CipherView.fromJSON(c)),
  derive: async (from, { cipherService }) => {
    const ciphers = Object.values(from || {}).map((c) => new Cipher(c));
    return await cipherService.decryptCiphers(ciphers);
  },
});

export const LOCAL_DATA_KEY = new KeyDefinition<Record<CipherId, LocalData>>(
  CIPHERS_DISK_LOCAL,
  "localData",
  {
    deserializer: (localData) => localData,
  },
);

export const ADD_EDIT_CIPHER_INFO_KEY = new KeyDefinition<AddEditCipherInfo>(
  CIPHER_SERVICE_MEMORY,
  "addEditCipherInfo",
  {
    deserializer: (addEditCipherInfo: AddEditCipherInfo) => {
      return addEditCipherInfo == null
        ? null
        : {
            cipher:
              addEditCipherInfo?.cipher.toJSON != null
                ? addEditCipherInfo.cipher
                : CipherView.fromJSON(addEditCipherInfo?.cipher as Jsonify<CipherView>),
            collectionIds: addEditCipherInfo?.collectionIds,
          };
    },
  },
);
