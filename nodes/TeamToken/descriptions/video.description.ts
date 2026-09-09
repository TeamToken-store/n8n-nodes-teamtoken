import type { INodeProperties } from 'n8n-workflow';

export const videoOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['video'] } },
	options: [
		{
			name: 'Extend',
			value: 'extend',
			action: 'Extend a video',
			description:
				'Continue an existing video job into a longer clip',
		},
		{
			name: 'Generate',
			value: 'generate',
			action: 'Generate a video',
			description: 'Create a video from a text prompt (and optional image/video inputs)',
		},
		{
			name: 'Get Job',
			value: 'getJob',
			action: 'Get a video job',
			description: 'Fetch the status and result of an asynchronous video job',
		},
	],
	default: 'generate',
};

export const videoModel: INodeProperties = {
	displayName: 'Model Name or ID',
	name: 'model',
	type: 'options',
	// See image.description.ts — the canonical dynamic-options phrase must end the
	// description and appear exactly once.
	description: 'Loaded live from the public catalog. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	typeOptions: { loadOptionsMethod: 'getVideoModels' },
	displayOptions: { show: { resource: ['video'], operation: ['generate', 'extend'] } },
	default: '',
	required: true,
};

export const videoRefVideoJobId: INodeProperties = {
	displayName: 'Source Video Job ID',
	name: 'refVideoJobId',
	type: 'string',
	displayOptions: { show: { resource: ['video'], operation: ['extend'] } },
	default: '',
	required: true,
	description:
		'ID of a previous video job to extend — the job ID returned by a previous Video Generate (must belong to the same account)',
};

export const videoReferenceVideo: INodeProperties = {
	displayName: 'Reference Video',
	name: 'referenceVideo',
	type: 'string',
	displayOptions: {
		show: { resource: ['video'], operation: ['generate', 'extend'] },
	},
	default: '',
	description: 'Optional input video for video-to-video / motion control. A URL, a data-URL or bare base64.',
};

export const videoOptions: INodeProperties = {
	displayName: 'Options',
	name: 'videoOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: { show: { resource: ['video'], operation: ['generate', 'extend'] } },
	options: [
		{
			displayName: 'Aspect Ratio',
			name: 'aspect_ratio',
			type: 'options',
			options: [
				{ name: '1:1', value: '1:1' },
				{ name: '16:9', value: '16:9' },
				{ name: '9:16', value: '9:16' },
			],
			default: '16:9',
			description: 'Aspect ratio of the generated video',
		},
		{
			displayName: 'Binary Property',
			name: 'binaryProperty',
			type: 'string',
			default: 'data',
			description: 'Name of the binary property to write each downloaded video to',
		},
		{
			displayName: 'Download Video',
			name: 'downloadVideo',
			type: 'boolean',
			default: false,
			description: 'Whether to download the finished video through the gateway and attach the MP4 bytes as binary. If disabled, a streaming URL is returned.',
		},
		{
			displayName: 'Duration (Seconds)',
			name: 'duration',
			type: 'number',
			default: 5,
			description: 'Length of the clip in seconds. Allowed values depend on the model; ignored by edit/motion models.',
		},
	],
};
