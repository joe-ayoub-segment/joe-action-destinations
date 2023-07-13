import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'
import { defaultValues } from '@segment/actions-core'
import { CONSTANTS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Launchdarkly Audiences',
  slug: 'actions-launchdarkly-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key provided by the LaunchDarkly integration',
        description:
          'API Key used for [LaunchDarkly API authorization](https://app.launchdarkly.com/settings/authorization) before sending custom audiences data.',
        type: 'password',
        required: true
      },
      client_id: {
        label: 'LaunchDarkly client-side ID',
        description:
          'Find and copy the [client-side ID](https://ld-stg.launchdarkly.com/settings/projects) in the LaunchDarkly account settings page.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // The sdk/goals/{clientID} endpoint returns a 200 if the client ID is valid and a 404 otherwise.
      return Promise.all([
        request(`${CONSTANTS.LD_CLIENT_SDK_BASE_URL}/sdk/goals/${settings.client_id}`, { method: 'head' }),
        request(`${CONSTANTS.LD_API_BASE_URL}/api/v2/versions`, {
          method: 'GET',
          headers: {
            Authorization: `${settings.apiKey}`
          }
        })
      ])
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'User-Agent': 'SegmentSyncAudiences/1.0.0',
        'Content-Type': 'application/json',
        Authorization: `${settings.apiKey}`
      }
    }
  },
  actions: {
    syncAudience
  },
  presets: [
    {
      name: 'Sync Engage Audience to LaunchDarkly',
      subscribe: 'type = "identify" or type = "track"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields)
    }
  ]
}

export default destination
