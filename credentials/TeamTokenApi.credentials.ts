import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TeamTokenApi implements ICredentialType {
	name = 'teamTokenApi';

	displayName = 'TeamToken API';

	// Required for the credential to render in the editor. Same artwork as the
	// node; a separate copy lives next to this file because `file:` icons resolve
	// relative to the compiled credential, not the node.
	icon = 'file:teamToken.svg' as const;

	documentationUrl = 'https://github.com/TeamToken-store/n8n-nodes-teamtoken';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your teamToken API key — the same key used for text, image and video',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.teamtoken.store',
			description: 'Host of the TeamToken API gateway that serves the /v1 media routes',
		},
		{
			// The catalog is public and lives on a DIFFERENT host than the API
			// (app.* vs api.*), so it is its own field rather than being derived from
			// Base URL — deriving one URL from another silently breaks when the naming
			// pattern shifts.
			displayName: 'Model Catalog URL',
			name: 'catalogUrl',
			type: 'string',
			default: 'https://app.teamtoken.store/cabinet/api/public/media-models',
			description:
				'Public, unauthenticated catalog used to populate the model dropdowns in the node',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// A bad key returns 401 here; a valid key returns 200. /v1/models is cheap and
	// authenticated, so it validates the key without spending anything.
	test: ICredentialTestRequest = {
		request: {
			// Same /v1 normalization as the node: tolerate a Base URL entered with a
			// trailing slash or /v1 so the test does not hit /v1/v1/models.
			baseURL: "={{$credentials.baseUrl.replace(/\\/+$/, '').replace(/\\/v1$/, '')}}",
			url: '/v1/models',
		},
	};
}
