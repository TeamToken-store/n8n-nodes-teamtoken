import type { INodeProperties } from 'n8n-workflow';

export const imageOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['image'] } },
	options: [
		{
			name: 'Edit',
			value: 'edit',
			action: 'Edit an image with reference inputs',
			description: 'Generate an image guided by one or more reference images',
		},
		{
			name: 'Generate',
			value: 'generate',
			action: 'Generate an image',
			description: 'Create an image from a text prompt',
		},
		{
			name: 'Get Job',
			value: 'getJob',
			action: 'Get an image job',
			description: 'Fetch the status and result of an asynchronous image job',
		},
	],
	default: 'generate',
};

export const imageModel: INodeProperties = {
	displayName: 'Model Name or ID',
	name: 'model',
	type: 'options',
	// The dynamic-options linter (node-param-description-wrong-for-dynamic-options)
	// requires the description to END WITH the canonical "Choose from the list…"
	// phrase — so the catalog hint is a prefix and the canonical phrase appears
	// exactly once.
	description: 'Loaded live from the public catalog. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	typeOptions: { loadOptionsMethod: 'getImageModels' },
	displayOptions: { show: { resource: ['image'], operation: ['generate', 'edit'] } },
	default: '',
	required: true,
};

export const imageOptions: INodeProperties = {
	displayName: 'Options',
	name: 'imageOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: { show: { resource: ['image'], operation: ['generate', 'edit'] } },
	options: [
		{
			displayName: 'Aspect Ratio',
			name: 'aspect_ratio',
			type: 'options',
			options: [
				{ name: '1:1', value: '1:1' },
				{ name: '16:9', value: '16:9' },
				{ name: '3:4', value: '3:4' },
				{ name: '4:3', value: '4:3' },
				{ name: '9:16', value: '9:16' },
			],
			default: '1:1',
			description: 'Aspect ratio of the generated image',
		},
		{
			displayName: 'Binary Property',
			name: 'binaryProperty',
			type: 'string',
			default: 'data',
			description: 'Name of the binary property to write each returned image to',
		},
		{
			displayName: 'Number of Images',
			name: 'n',
			type: 'number',
			typeOptions: { minValue: 1, maxValue: 10 },
			default: 1,
			description: 'How many images to generate (1–10)',
		},
		{
			displayName: 'Resolution',
			name: 'resolution',
			type: 'options',
			options: [
				{ name: '1K', value: '1K' },
				{ name: '2K', value: '2K' },
				{ name: '4K', value: '4K' },
			],
			default: '1K',
			description: 'Output resolution',
		},
		{
			displayName: 'Return Images as Binary',
			name: 'returnBinary',
			type: 'boolean',
			default: true,
			description: 'Whether to decode each returned base64 image into a binary attachment. If disabled, the raw base64 JSON is returned.',
		},
	],
};
