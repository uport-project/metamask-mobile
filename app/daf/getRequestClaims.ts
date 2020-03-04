import {dataStore} from './setup'

export const getRequestedClaims = async (message: any, identity: any) => {

    const result: any = [];
    const payload = JSON.parse(message.data)

    const subject = identity.did
    if (payload.claims) {
      for (const credentialRequest of payload.claims) {
        const iss: any =
          credentialRequest.iss !== undefined
            ? credentialRequest.iss.map((iss: any) => iss.did)
            : null
        const credentials = await dataStore.findCredentialsByFields({
          iss,
          sub: subject ? [subject] : [],
          claim_type: credentialRequest.claimType,
        })

        const updatedVcs = await Promise.all(
          credentials.map(async (vc: any) => {
            return {
              ...vc,
              iss: {
                did: vc.iss.did,
                shortId: await dataStore.shortId(vc.iss.did),
              },
              sub: {
                did: vc.sub.did,
                shortId: await dataStore.shortId(vc.sub.did),
              },
              fields: await dataStore.credentialsFieldsForClaimHash(vc.hash),
            }
          }),
        )

        result.push({
          ...credentialRequest,
          iss: credentialRequest.iss?.map((item: any) => ({
            url: item.url,
            did: {did: item.did},
          })),
          vc: updatedVcs,
        })
      }
    }

    return result;
};